import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const data=await readFile('submission/assets/cinema-final-demo.mp4');
 await page.setContent('<video controls muted style="width:100%" src="data:video/mp4;base64,'+data.toString('base64')+'"></video>');
 await page.locator('video').evaluate(v=>v.play());
 await page.waitForFunction(()=>document.querySelector('video').ended,{},{timeout:100000});
 const result=await page.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,ended:v.ended,error:v.error?.message||null}));
 await writeFile('submission/assets/demo-browser-verification.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
} finally {await browser.close();}
