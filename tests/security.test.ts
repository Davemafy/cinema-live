import test from 'node:test';
import assert from 'node:assert/strict';
import { sign, verify, trustedMediaUrl, sameOrigin } from '../src/server/security';
import { GET as health } from '../src/app/api/health/route';
import { POST as submit } from '../src/app/api/jobs/route';

process.env.JOB_SIGNING_SECRET = 'test-secret-32-characters-minimum-only';
test('job capabilities survive verification but reject tampering and expiry', () => {
  const token = sign({ id: 'real-job', kind: 'job' });
  assert.equal(verify<{ id: string; expires: number }>(token).id, 'real-job');
  assert.throws(() => verify(token.slice(0, -6) + 'AAAAAA'));
  const originalNow = Date.now;
  try { Date.now = () => originalNow() + 25 * 3600_000; assert.throws(() => verify(token), /expired/); }
  finally { Date.now = originalNow; }
});
test('media downloads only permit exact provider storage hosts', () => {
  assert.equal(trustedMediaUrl('https://v3.fal.media/video.mp4'), 'https://v3.fal.media/video.mp4');
  for (const url of ['http://v3.fal.media/x', 'https://fal.media.evil.example/x', 'https://localhost/x', 'https://user:pass@fal.media/x', 'https://fal.media:8443/x']) assert.throws(() => trustedMediaUrl(url));
});
test('cross-origin mutation is rejected', () => {
  assert.throws(() => sameOrigin(new Request('https://cinema.test/api/jobs', { headers: { Origin: 'https://evil.test' } })));
  assert.doesNotThrow(() => sameOrigin(new Request('https://cinema.test/api/jobs', { headers: { Origin: 'https://cinema.test' } })));
  assert.doesNotThrow(() => sameOrigin(new Request('http://0.0.0.0:3000/api/jobs', { headers: { Origin: 'http://localhost:3000', Host: 'localhost:3000' } })));
});
test('missing inference credentials never creates a fake job', async () => {
  delete process.env.FAL_KEY; delete process.env.INFERENCE_ENABLED;
  const status = await (await health()).json();
  assert.equal(status.inferenceAvailable, false);
  const response = await submit(new Request('https://cinema.test/api/jobs?treatment=noir', { method: 'POST' }));
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.ok(body.error); assert.equal(body.id, undefined); assert.equal(body.videoUrl, undefined);
});
