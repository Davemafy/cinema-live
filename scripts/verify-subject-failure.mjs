import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://localhost:3002');
  await page.locator('input[type="file"]').setInputFiles('artifacts/subject-aware/no-person-diagnostic.mp4');
  await page.getByRole('radio',{name:/Directed light/}).check();
  await page.waitForFunction(()=>!document.querySelector('.transform-button').disabled,{},{timeout:60000});
  await page.getByRole('button',{name:'Transform performance'}).click();
  await page.getByText(/No visible person detected/).waitFor({timeout:90000});
  await page.getByRole('button',{name:'Retry transformation'}).click();
  await page.getByText(/No visible person detected/).waitFor({timeout:90000});
  await page.waitForFunction(()=>!document.querySelector('.transform-button').disabled);
  const report={diagnostic:'Synthetic empty clip tests error recovery only; no AI quality claim',genuineWorkerFailure:'No visible person detected; no image render attempted',retryEnabled:true,ltxFallbackUsed:false};
  await writeFile('artifacts/subject-aware/browser/failure-verification.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
} finally {await browser.close();}
