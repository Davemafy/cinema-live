import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { submitVideo, readiness, requireInference } from '../src/server/inference';
import { normalize } from '../src/server/video';
import { cinematographyConnection, submitCinematography, getCinematographyJob } from '../src/server/cinematography';
import { trustedMediaUrl } from '../src/server/security';

test('source-preserving mode never falls back to a configured LTX worker', async () => {
  const previous = { subject: process.env.CINEMA_CINEMATOGRAPHY_URL, ltx: process.env.CINEMA_KAGGLE_URL };
  const fetchOriginal = globalThis.fetch;
  let called = false;
  try {
    process.env.CINEMA_KAGGLE_URL = 'https://unit-test-secret-with-at-least-32-characters@ltx-test.trycloudflare.com';
    delete process.env.CINEMA_CINEMATOGRAPHY_URL;
    globalThis.fetch = async () => { called = true; throw new Error('A fallback call is forbidden'); };
    assert.equal(readiness().treatments['subject-aware'].available, false);
    assert.throws(() => requireInference(undefined, 'subject-aware'), /LTX cannot substitute/);
    await assert.rejects(submitVideo({ bytes: Buffer.from('unit fixture'), width: 10, height: 10,
      duration: 1, inputDuration: 1, fps: 24 }, 'subject-aware'), /cannot use the LTX fallback/);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = fetchOriginal;
    if (previous.subject === undefined) delete process.env.CINEMA_CINEMATOGRAPHY_URL; else process.env.CINEMA_CINEMATOGRAPHY_URL = previous.subject;
    if (previous.ltx === undefined) delete process.env.CINEMA_KAGGLE_URL; else process.env.CINEMA_KAGGLE_URL = previous.ltx;
  }
});

test('subject-aware worker rejects credential-bearing media and mismatched signed paths', () => {
  const previous = process.env.CINEMA_CINEMATOGRAPHY_URL;
  try {
    process.env.CINEMA_CINEMATOGRAPHY_URL = 'https://unit-test-secret-with-at-least-32-characters@subject-test.trycloudflare.com';
    assert.equal(cinematographyConnection().origin, 'https://subject-test.trycloudflare.com');
    const path = '/v1/jobs/' + 'a'.repeat(24) + '/video?e=1791760000&s=' + 'b'.repeat(64);
    assert.equal(trustedMediaUrl('https://subject-test.trycloudflare.com' + path), 'https://subject-test.trycloudflare.com' + path);
    assert.throws(() => trustedMediaUrl('https://user:secret@subject-test.trycloudflare.com' + path));
    assert.throws(() => trustedMediaUrl('https://subject-test.trycloudflare.com/other.mp4'));
  } finally {
    if (previous === undefined) delete process.env.CINEMA_CINEMATOGRAPHY_URL; else process.env.CINEMA_CINEMATOGRAPHY_URL = previous;
  }
});

test('subject-aware normalization preserves native source dimensions', async () => {
  const source = await readFile('public/demo-performance.mp4');
  const video = await normalize(new File([source], 'performance.mp4', { type: 'video/mp4' }), true);
  assert.equal(video.width, 854);
  assert.equal(video.height, 480);
  assert.ok(Math.abs(video.fps - 24000 / 1001) < 0.001);
});


test('wrong engine is rejected before submission and wrong input cannot be accepted', async () => {
  const previous = process.env.CINEMA_CINEMATOGRAPHY_URL;
  const fetchOriginal = globalThis.fetch;
  const paths: string[] = [];
  try {
    process.env.CINEMA_CINEMATOGRAPHY_URL = 'https://unit-test-secret-with-at-least-32-characters@subject-test.trycloudflare.com';
    globalThis.fetch = async (url) => { paths.push(String(url)); return Response.json({model:'kaggle/ltx',mode:'legacy',ltxFallback:true}); };
    await assert.rejects(submitCinematography({bytes:Buffer.from('test'),width:10,height:10,duration:1,inputDuration:1,fps:24}), /not the subject-aware engine/);
    assert.deepEqual(paths, ['https://subject-test.trycloudflare.com/health']);
    globalThis.fetch = async () => Response.json({state:'succeeded',videoUrl:'https://subject-test.trycloudflare.com/v1/jobs/'+ 'a'.repeat(24)+'/video?e=1791760000&s='+'b'.repeat(64),config:{mode:'subject-aware',ltxFallbackUsed:false,imageAi:{imageAiExecuted:true},sourceSha256:'wrong-input'}});
    await assert.rejects(getCinematographyJob({id:'a'.repeat(24),state:'queued',createdAt:Date.now(),treatment:'subject-aware',model:'cinema/ic-light-person-aware-v1',sourceUrl:'',token:'fixture',config:{sourceSha256:'actual-input'}},'fixture'), /does not verify/);
  } finally {
    globalThis.fetch = fetchOriginal;
    if (previous === undefined) delete process.env.CINEMA_CINEMATOGRAPHY_URL; else process.env.CINEMA_CINEMATOGRAPHY_URL = previous;
  }
});

test('two-variable HTTPS backend uses bearer auth, not URL credentials', async () => {
  const old = { url: process.env.CINEMA_BACKEND_URL, token: process.env.CINEMA_BACKEND_TOKEN };
  const secret = 'temporary-test-worker-token-at-least-32-characters';
  try {
    process.env.CINEMA_BACKEND_URL = 'https://ephemeral-host.trycloudflare.com';
    process.env.CINEMA_BACKEND_TOKEN = secret;
    assert.deepEqual(cinematographyConnection(), { origin: 'https://ephemeral-host.trycloudflare.com', token: secret });
    const signed = 'https://ephemeral-host.trycloudflare.com/v1/jobs/'+'a'.repeat(24)+'/video?e=1791760000&s='+'b'.repeat(64);
    assert.equal(trustedMediaUrl(signed), signed);
    assert.throws(() => trustedMediaUrl('https://ephemeral-host.trycloudflare.com/unapproved-video.mp4'));
    process.env.CINEMA_BACKEND_URL = 'https://backend.example.com';
    assert.equal(cinematographyConnection().origin, 'https://backend.example.com');
    assert.throws(() => trustedMediaUrl(signed), /unsupported media/);
    process.env.CINEMA_BACKEND_URL = 'https://user:token@backend.example.com';
    assert.throws(() => cinematographyConnection(), /clean HTTPS origin/);
    process.env.CINEMA_BACKEND_URL = 'http://backend.example.com';
    assert.throws(() => cinematographyConnection(), /clean HTTPS origin/);
  } finally {
    if (old.url === undefined) delete process.env.CINEMA_BACKEND_URL; else process.env.CINEMA_BACKEND_URL = old.url;
    if (old.token === undefined) delete process.env.CINEMA_BACKEND_TOKEN; else process.env.CINEMA_BACKEND_TOKEN = old.token;
  }
});

test('public studio health checks real worker before enabling Directed light', async () => {
  const { GET } = await import('../src/app/api/health/route');
  const old = { url: process.env.CINEMA_BACKEND_URL, token: process.env.CINEMA_BACKEND_TOKEN };
  const fetchOriginal = globalThis.fetch;
  try {
    process.env.CINEMA_BACKEND_URL = 'https://subject-demo.example.com';
    process.env.CINEMA_BACKEND_TOKEN = 'temporary-test-worker-token-at-least-32-characters';
    let seenAuth = '';
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), 'https://subject-demo.example.com/health');
      seenAuth = new Headers(init?.headers).get('authorization') || '';
      return Response.json({ ok: true, model: 'cinema/ic-light-person-aware-v1', mode: 'subject-aware', ltxFallback: false });
    };
    let response = await (await GET()).json();
    assert.equal(response.treatments['subject-aware'].available, true);
    assert.equal(seenAuth, 'Bearer temporary-test-worker-token-at-least-32-characters');
    globalThis.fetch = async () => { throw new Error('Notebook stopped'); };
    response = await (await GET()).json();
    assert.equal(response.treatments['subject-aware'].available, false);
    assert.match(response.treatments['subject-aware'].reason, /offline/);
  } finally {
    globalThis.fetch = fetchOriginal;
    if (old.url === undefined) delete process.env.CINEMA_BACKEND_URL; else process.env.CINEMA_BACKEND_URL = old.url;
    if (old.token === undefined) delete process.env.CINEMA_BACKEND_TOKEN; else process.env.CINEMA_BACKEND_TOKEN = old.token;
  }
});
