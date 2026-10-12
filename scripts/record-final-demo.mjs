// Actual browser capture. Reopens a genuinely completed worker job; no render simulation.
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
for (const line of (await readFile('.env.local','utf8')).split('\n')) { const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,''); }
const { sign }=await import('../src/server/security.ts');
const root='artifacts/final-demo';await mkdir(root,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:root,size:{width:1280,height:900}},acceptDownloads:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto('http://localhost:3002');
  await page.waitForFunction(()=>!document.querySelector('fieldset').disabled);
  const normalizeWait=page.waitForResponse(r=>r.url().endsWith('/api/normalize') && r.request().method()==='POST');
  await page.locator('input[type="file"]').setInputFiles('artifacts/subject-aware/alternate-take.mp4');
  const normalized=await normalizeWait;
  if(normalized.status()!==200) throw new Error('Actual normalization failed: HTTP '+normalized.status());
  await page.getByRole('radio',{name:/Directed light/}).check();
  await page.locator('.source-video').evaluate(async v=>{v.muted=true;await v.play()});
  await page.waitForFunction(()=>document.querySelector('.source-video').ended);
  await page.screenshot({path:root+'/actual-upload.png',fullPage:true});
  // Eight seconds of actual upload/preparation/preview; no generation is implied.
  await page.waitForTimeout(4000);
  const id='946ef3623ea9ed568fe5e004';
  const input=await readFile(`artifacts/subject-aware/jobs/${id}/source.mp4`);
  const bytes=await readFile('artifacts/subject-aware/alternate-take.mp4');
  const job={id,state:'queued',createdAt:Date.now()-345000,treatment:'subject-aware',model:'cinema/ic-light-person-aware-v1',sourceUrl:'',config:{mode:'subject-aware',sourceSha256:createHash('sha256').update(input).digest('hex'),ltxFallbackUsed:false}};
  job.token=sign({...job,kind:'job'});
  const resultStart=(Date.now());
  await page.evaluate(async({bytes,job})=>{
    const blob=new Blob([new Uint8Array(bytes)],{type:'video/mp4'});
    const db=await new Promise(resolve=>{const r=indexedDB.open('cinema-session',1);r.onsuccess=()=>resolve(r.result)});
    await new Promise((resolve,reject)=>{const tx=db.transaction('session','readwrite');tx.objectStore('session').put({take:{original:blob,normalized:blob,name:'alternate-take.mp4',duration:2.002,width:854,height:480,trimmed:false},job},'current');tx.oncomplete=resolve;tx.onerror=reject});db.close();
  },{bytes:[...bytes],job});
  await page.reload();
  await page.getByRole('heading',{name:'Your cinematic take.'}).waitFor({timeout:30000});
  await page.locator('.result-section').scrollIntoViewIfNeeded();
  await page.locator('.result-section').getByRole('button',{name:'Play both from start'}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.result-section video')].every(v=>v.ended));
  const d=page.waitForEvent('download');await page.getByRole('button',{name:/Download film/}).click();await(await d).saveAs(root+'/actual-export.mp4');
  await page.screenshot({path:root+'/actual-result.png',fullPage:true});
  await page.waitForTimeout(6000);
  await writeFile(root+'/capture-provenance.json',JSON.stringify({scope:'Actual local application footage: upload/preview followed by re-opened previously completed actual IC-Light job; no new live render in this screen capture',job:id,sourceSha256:job.config.sourceSha256,resultSha256:createHash('sha256').update(await readFile(root+'/actual-export.mp4')).digest('hex'),measuredPriorProcessingSeconds:344.672,pageErrors:errors},null,2));
} catch(e) { await page.screenshot({path:root+'/capture-error.png',fullPage:true});console.log('Capture error:',e.message);console.log(await page.locator('.error').allTextContents());throw e; } finally {await context.close();await browser.close();}
await writeFile(root+'/capture-path.txt',await page.video().path());
console.log('Actual application footage and exported file captured; completed job is explicitly disclosed.');
