// Explicit mocked HTTP-410 browser test. No inference/media generation is simulated.
import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('**/api/health',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({inferenceAvailable:true,model:'cinema/ic-light-person-aware-v1',renderCodeRequired:false,treatments:{noir:{available:false},'subject-aware':{available:true}}})}));
 await page.route('**/api/jobs/status',r=>r.fulfill({status:410,contentType:'application/json',body:JSON.stringify({error:'This job belongs to the previous worker. Switching providers does not migrate jobs.'})}));
 await page.goto('http://localhost:3002');
 const source=await readFile('artifacts/subject-aware/alternate-take.mp4');
 await page.evaluate(async bytes=>{
  const blob=new Blob([new Uint8Array(bytes)],{type:'video/mp4'});
  const db=await new Promise(resolve=>{const r=indexedDB.open('cinema-session',1);r.onupgradeneeded=()=>r.result.createObjectStore('session');r.onsuccess=()=>resolve(r.result)});
  await new Promise((resolve,reject)=>{const tx=db.transaction('session','readwrite');tx.objectStore('session').put({take:{original:blob,normalized:blob,name:'protocol-fixture.mp4',duration:2,width:854,height:480,trimmed:false},job:{id:'protocol-fixture',token:'mock-protocol-capability',state:'queued',createdAt:Date.now(),treatment:'subject-aware',model:'cinema/ic-light-person-aware-v1',sourceUrl:'',config:{}}},'current');tx.oncomplete=resolve;tx.onerror=reject});db.close();
 },[...source]);
 await page.reload();
 await page.getByText(/Switching providers does not migrate jobs/).waitFor();
 if(!(await page.getByRole('button',{name:'Upload video',exact:true}).isEnabled()))throw new Error('Lost job still locks capture');
 if(!(await page.getByRole('button',{name:'Retry transformation'}).isEnabled()))throw new Error('Lost job still locks explicit retry');
 const report={scope:'Mocked terminal HTTP-410 UI test only; no render proof',lostJobBecomesFailed:true,sourceUploadEnabled:true,explicitRetryEnabled:true,automaticMigration:false};
 await writeFile('docs/evidence/backend-v1/lost-job-ui-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
} finally {await browser.close();}
