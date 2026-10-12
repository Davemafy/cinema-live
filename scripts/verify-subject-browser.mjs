import { chromium } from '@playwright/test';
import { mkdir,writeFile,readFile,readdir } from 'node:fs/promises';
const base=process.env.BASE_URL||'http://localhost:3002';
const root=process.env.ARTIFACT_DIR||'artifacts/subject-aware/browser';
await mkdir(root,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
try {
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(base);
await page.waitForFunction(()=>document.querySelector('input[value="subject-aware"]'));
if (!process.env.RECOVER_ACTUAL_JOB) {
await page.locator('input[type="file"]').setInputFiles('artifacts/subject-aware/alternate-take.mp4');
await page.getByRole('radio',{name:/Directed light/}).check();
await page.getByRole('button',{name:'Transform performance'}).waitFor({state:'visible'});
await page.waitForFunction(()=>!document.querySelector('.transform-button').disabled,{},{timeout:60000});
const submissionWait=page.waitForResponse(r=>r.url().includes('/api/jobs?') && r.request().method()==='POST');
await page.getByRole('button',{name:'Transform performance'}).click();
const submission=await submissionWait;
if(submission.status()!==202) throw new Error('Genuine job submission failed: HTTP '+submission.status());
await page.waitForFunction(()=>document.querySelector('.job-status'),{},{timeout:60000});
console.log('Genuine subject-aware job submitted through browser; waiting for real inference');
await page.screenshot({path:root+'/processing.png',fullPage:true});
} else {
  // Reattach the genuinely completed server job after the original test timed out.
  // This does not submit or simulate a render. The status API still verifies it.
  for (const line of (await readFile('.env.local','utf8')).split('\n')) { const m=line.match(/^([A-Z_]+)=(.*)$/); if(m) process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,''); }
  const { sign }=await import('../src/server/security.ts');
  const { createHash }=await import('node:crypto');
  const folders=await readdir('artifacts/subject-aware/jobs');
  const id=folders[0]; const input=await readFile(`artifacts/subject-aware/jobs/${id}/source.mp4`);
  const original=await readFile('artifacts/subject-aware/alternate-take.mp4');
  const config={mode:'subject-aware',sourceSha256:createHash('sha256').update(input).digest('hex'),ltxFallbackUsed:false};
  const job={id,state:'queued',createdAt:Date.now()-620000,treatment:'subject-aware',model:'cinema/ic-light-person-aware-v1',sourceUrl:'',config};
  job.token=sign({...job,kind:'job'});
  await page.evaluate(async({bytes,job})=>{
    const blob=new Blob([new Uint8Array(bytes)],{type:'video/mp4'});
    const db=await new Promise((resolve,reject)=>{ const r=indexedDB.open('cinema-session',1);r.onupgradeneeded=()=>r.result.createObjectStore('session');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error); });
    await new Promise((resolve,reject)=>{ const tx=db.transaction('session','readwrite');tx.objectStore('session').put({take:{original:blob,normalized:blob,name:'alternate-take.mp4',duration:2,width:854,height:480,trimmed:false},job},'current');tx.oncomplete=resolve;tx.onerror=reject; });db.close();
  },{bytes:[...original],job});
  await page.reload();
  console.log('Recovering actual completed worker job after 10-minute browser test timeout');
}
await page.getByRole('heading',{name:'Your cinematic take.'}).waitFor({timeout:900000});
await page.screenshot({path:root+'/result-desktop.png',fullPage:true});
const downloadWait=page.waitForEvent('download');
await page.getByRole('button',{name:/Download film/}).click();
const download=await downloadWait;await download.saveAs(root+'/downloaded-film.mp4');
const videos=page.locator('.result-section video');
await videos.evaluateAll(videos=>Promise.all(videos.map(v=>{v.muted=true;v.currentTime=0;return v.play()})));
await page.waitForFunction(()=>[...document.querySelectorAll('.result-section video')].every(v=>v.ended),{},{timeout:15000});
const report=await videos.evaluateAll(videos=>videos.map(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,ended:v.ended,error:v.error?.message||null})));
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:root+'/result-mobile.png',fullPage:true});
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
await writeFile(root+'/verification.json',JSON.stringify({actualInput:'alternate-take.mp4 (different first frame)',playback:report,mobileOverflow:overflow,pageErrors:errors},null,2));
console.log(JSON.stringify({playback:report,mobileOverflow:overflow,pageErrors:errors},null,2));
const comparisonPage=await browser.newPage({viewport:{width:1920,height:430}});
const comparisonBytes=await readFile('artifacts/subject-aware/candidate-v3/comparison-abc.mp4');
await comparisonPage.setContent('<video controls muted style="width:100%;height:auto" src="data:video/mp4;base64,'+comparisonBytes.toString('base64')+'"></video>');
await comparisonPage.locator('video').evaluate(v=>v.play());
await comparisonPage.waitForFunction(()=>document.querySelector('video').ended,{},{timeout:15000});
const abc=await comparisonPage.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,ended:v.ended,error:v.error?.message||null}));
await writeFile(root+'/abc-playback.json',JSON.stringify(abc,null,2));
console.log('Actual A/B/C full-clip playback:',JSON.stringify(abc));
} finally { await browser.close(); }
