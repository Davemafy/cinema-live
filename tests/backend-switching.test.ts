// Mock protocol checks, not evidence of GPU inference or public deployment.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { backendConnection, backendSelected } from '../src/server/backend';
import { connectedReadiness, submitVideo, getJob, exportMedia } from '../src/server/inference';
import { trustedMediaUrl, sign, verify } from '../src/server/security';
import { CINEMATOGRAPHY_MODEL } from '../src/server/cinematography';
import { KAGGLE_MODEL } from '../src/server/kaggle';

const origins=['https://cinema-test.trycloudflare.com','https://cinema-worker.modal.run','https://gpu.filmmaker.example:8443'];
const apiToken='test-backend-token-at-least-32-characters';
const signingSecret='independent-test-signing-secret-32-characters';
const id='a'.repeat(24);
const video={bytes:Buffer.from('UNIT PROTOCOL FIXTURE — not a generated film'),width:854,height:480,duration:2,inputDuration:2,fps:24};
function media(origin:string,expires=Math.floor(Date.now()/1000)+3600,token=apiToken,jobId=id) {
  const sig=createHmac('sha256',token).update(`${jobId}:${expires}`).digest('hex');
  return `${origin}/v1/jobs/${jobId}/video?e=${expires}&s=${sig}`;
}
async function sandbox(fn:()=>Promise<void>) {
  const vars=['CINEMA_BACKEND_URL','CINEMA_BACKEND_TOKEN','CINEMA_KAGGLE_URL','CINEMA_KAGGLE_TOKEN','CINEMA_CINEMATOGRAPHY_URL','JOB_SIGNING_SECRET','CINEMA_ALLOW_LOCAL_ENGINE'];
  const prior=Object.fromEntries(vars.map(k=>[k,process.env[k]]));const originalFetch=globalThis.fetch;
  try {for(const key of vars)delete process.env[key];process.env.JOB_SIGNING_SECRET=signingSecret;await fn();}
  finally {globalThis.fetch=originalFetch;for(const k of vars){if(prior[k]===undefined)delete process.env[k];else process.env[k]=prior[k];}}
}

for(const origin of origins) for(const mode of ['ltx','subject'] as const) {
  test(`${mode} protocol: bearer, submit, queued/rendering/success/failed and signed export on ${origin}`,async()=>sandbox(async()=>{
    process.env.CINEMA_BACKEND_URL=origin;process.env.CINEMA_BACKEND_TOKEN=apiToken;
    let state='queued';const requests:{path:string;method:string;payload:FormData|null}[]=[];
    globalThis.fetch=async(input,init)=>{
      const url=new URL(String(input));assert.equal(url.origin,origin);
      assert.equal(url.username,'');assert.equal(url.password,'');
      assert.equal(new Headers(init?.headers).get('Authorization'),`Bearer ${apiToken}`);
      assert.equal(init?.redirect,'error');
      requests.push({path:url.pathname,method:init?.method||'GET',payload:init?.body instanceof FormData?init.body:null});
      if(url.pathname==='/health')return Response.json(mode==='ltx'?{ok:true,model:KAGGLE_MODEL}:{ok:true,model:CINEMATOGRAPHY_MODEL,mode:'subject-aware',ltxFallback:false});
      if(url.pathname==='/v1/jobs')return Response.json({id,state:'queued'},{status:202});
      assert.equal(url.pathname,`/v1/jobs/${id}`);
      return Response.json({state,error:state==='failed'?'Actual worker failure':undefined,videoUrl:state==='succeeded'?media(origin):undefined,inferenceSeconds:12.3,
        config:{mode:'subject-aware',ltxFallbackUsed:false,imageAi:{imageAiExecuted:true},sourceSha256:createHash('sha256').update(video.bytes).digest('hex')}});
    };
    const health=await connectedReadiness();assert.equal(health.treatments[mode==='ltx'?'noir':'subject-aware'].available,true);
    assert.equal(health.treatments[mode==='ltx'?'subject-aware':'noir'].available,false);
    const job=await submitVideo(video,mode==='ltx'?'noir':'subject-aware');assert.equal(job.state,'queued');assert.equal(job.config.backendOrigin,origin);
    const payload=requests.find(r=>r.method==='POST')!.payload!;
    assert.ok(payload.get('video') instanceof File);
    assert.equal(payload.has(mode==='ltx'?'prompt':'treatment'),true);
    assert.equal(payload.has(mode==='ltx'?'treatment':'prompt'),false);
    assert.equal((await getJob(job.token)).state,'queued');state='rendering';assert.equal((await getJob(job.token)).state,'rendering');
    state='succeeded';const done=await getJob(job.token);assert.equal(done.videoUrl,media(origin));
    assert.equal(exportMedia(done.exportToken!).url,done.videoUrl);
    state='failed';const failed=await getJob(job.token);assert.equal(failed.state,'failed');assert.equal(failed.error,'Actual worker failure');
    assert.equal(requests.filter(r=>r.method==='POST').length,1,'No fallback/retry model job');
    assert.equal(process.env.JOB_SIGNING_SECRET,signingSecret);
  }));
}

test('invalid or partial new connections fail closed and cannot fall back to legacy',async()=>sandbox(async()=>{
  process.env.CINEMA_KAGGLE_URL='https://'+apiToken+'@legacy.example.com';
  const invalid=['http://worker.example.com','https://user:secret@worker.example.com','https://worker.example.com/path','https://worker.example.com?token=secret','https://worker.example.com#fragment','https://localhost','https://127.0.0.1','https://169.254.169.254','https://[::1]','https://private.internal','file:///tmp/model'];
  process.env.CINEMA_BACKEND_TOKEN=apiToken;
  for(const url of invalid){process.env.CINEMA_BACKEND_URL=url;assert.equal(backendSelected(),true);assert.throws(()=>backendConnection());}
  delete process.env.CINEMA_BACKEND_URL;assert.throws(()=>backendConnection());
  process.env.CINEMA_BACKEND_URL=origins[0];delete process.env.CINEMA_BACKEND_TOKEN;assert.throws(()=>backendConnection());
  process.env.CINEMA_BACKEND_TOKEN='bad\nheader';assert.throws(()=>backendConnection());
}));

test('media origin, job identity, HMAC, expiry and query validation stay strict',async()=>sandbox(async()=>{
  process.env.CINEMA_BACKEND_URL=origins[2];process.env.CINEMA_BACKEND_TOKEN=apiToken;
  const good=media(origins[2]);assert.equal(trustedMediaUrl(good,origins[2],id),good);
  for(const bad of [media(origins[0]),good.replace('/video?','/other?'),media(origins[2],Math.floor(Date.now()/1000)-1),media(origins[2],Math.floor(Date.now()/1000)+86400),media(origins[2],undefined,'wrong-key'),good+'&token=secret',good+'&e=123',good+'#fragment',good.replace('https://','https://secret@'),'https://fal.media/unrelated.mp4'])assert.throws(()=>trustedMediaUrl(bad,origins[2],id));
  assert.throws(()=>trustedMediaUrl(media(origins[2],undefined,apiToken,'b'.repeat(24)),origins[2],id));
}));

test('unavailable, unauthorized, malformed and wrong-engine backends create no fallback job',async()=>sandbox(async()=>{
  process.env.CINEMA_BACKEND_URL=origins[0];process.env.CINEMA_BACKEND_TOKEN=apiToken;
  const failures=[async()=>{throw new TypeError('offline')},async()=>Response.json({error:'Unauthorized'},{status:401}),async()=>new Response('not json'),async()=>Response.json({ok:true,model:KAGGLE_MODEL})];
  for(const failure of failures){let post=false;globalThis.fetch=async(_u,init)=>{if(init?.method==='POST')post=true;return failure()};
    await assert.rejects(submitVideo(video,'subject-aware'));assert.equal(post,false);
  }
  globalThis.fetch=async()=>{throw new TypeError('offline')};assert.equal((await connectedReadiness()).inferenceAvailable,false);
  globalThis.fetch=async()=>Response.json({ok:false,model:CINEMATOGRAPHY_MODEL,mode:'subject-aware',ltxFallback:false});assert.equal((await connectedReadiness()).inferenceAvailable,false);
}));

test('changing provider preserves app signatures but does not migrate jobs or exports',async()=>sandbox(async()=>{
  process.env.CINEMA_BACKEND_URL=origins[0];process.env.CINEMA_BACKEND_TOKEN=apiToken;
  const capability=sign({kind:'job',id,model:KAGGLE_MODEL,treatment:'noir',state:'queued',createdAt:Date.now(),sourceUrl:'',config:{backendOrigin:origins[0]}});
  const exported=sign({kind:'export',id,url:media(origins[0]),backendOrigin:origins[0]});
  process.env.CINEMA_BACKEND_URL=origins[1];process.env.CINEMA_BACKEND_TOKEN='replacement-token-with-32-characters-minimum';
  assert.equal(verify<{id:string;expires:number}>(capability).id,id);
  let called=false;globalThis.fetch=async()=>{called=true;throw new Error('must not poll a migrated id')};
  await assert.rejects(getJob(capability),/does not migrate/);assert.equal(called,false);
  assert.throws(()=>exportMedia(exported),/do not migrate/);
  delete process.env.JOB_SIGNING_SECRET;assert.throws(()=>sign({kind:'job'}),/security is not configured/);
}));

test('legacy separate worker configurations remain usable with independent signing',async()=>sandbox(async()=>{
  process.env.CINEMA_KAGGLE_URL='https://'+apiToken+'@legacy-ltx.example.com';
  process.env.CINEMA_CINEMATOGRAPHY_URL='https://'+apiToken+'@legacy-subject.example.com';
  assert.equal(backendSelected(),false);assert.equal(trustedMediaUrl(media('https://legacy-ltx.example.com')),media('https://legacy-ltx.example.com'));
  assert.equal(trustedMediaUrl(media('https://legacy-subject.example.com')),media('https://legacy-subject.example.com'));
  assert.equal(process.env.JOB_SIGNING_SECRET,signingSecret);
}));

test('client preserves terminal HTTP status for lost-job recovery controls',async()=>{
  const originalFetch=globalThis.fetch;
  try {
    const { jobStatus, ApiError }=await import('../src/lib/api');
    globalThis.fetch=async()=>Response.json({error:'Previous worker job is unavailable'},{status:410});
    await assert.rejects(jobStatus('protocol-fixture'),e=>e instanceof ApiError && e.status===410);
  } finally { globalThis.fetch=originalFetch; }
});
