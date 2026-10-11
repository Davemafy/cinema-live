const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.cwd()+'/node_modules/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1100}});page.setDefaultTimeout(90000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('file://'+process.cwd()+'/out/final/cinema-browser-preview.html');
  await page.waitForFunction(()=>window.__CINEMA_PLAYER);
  async function seek(frame){await page.evaluate(frame=>window.__CINEMA_PLAYER.seekTo(frame),frame);if(frame<106)await page.waitForFunction(frame=>window.__CINEMA_RENDERED_TIME===frame/24,frame);await page.waitForTimeout(1000)}
  async function canvas(){return page.screenshot({clip:await page.locator('canvas').boundingBox()})}
  const repeatTests=[];
  for(const [film,frame,away] of [['OPENING',50,18],['OUTRO',80,48]]){
   await page.getByRole('button',{name:film,exact:true}).click();
   await seek(frame);const first=await canvas();fs.writeFileSync(`out/final/${film}-first.png`,first);
   await seek(away);const different=await canvas();
   await seek(frame);const repeated=await canvas();fs.writeFileSync(`out/final/${film}-repeat.png`,repeated);
   repeatTests.push({film,frame,awayFrame:away,repeatSeekByteIdentical:first.equals(repeated),awayFrameVisiblyDifferent:!first.equals(different)});
  }
  await seek(166);await page.screenshot({path:'out/final/director-credit-review.png'});
  const fontLoaded=await page.evaluate(()=>document.fonts.check('500 155px CinemaCredits'));
  const report={errors,fontLoaded,repeatTests};fs.writeFileSync('out/final/browser-qa.json',JSON.stringify(report,null,2));console.log(report);
  if(errors.length||!fontLoaded||repeatTests.some(x=>!x.repeatSeekByteIdentical||!x.awayFrameVisiblyDifferent))process.exitCode=1;
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
