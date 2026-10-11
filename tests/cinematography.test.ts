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
