const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.cwd()+'/node_modules/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--disable-gpu','--disable-renderer-backgrounding','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),results=[];
  for(const name of ['cinema-opening-final.mp4','cinema-outro-final.mp4','cinema-combined-final.mp4']){
   await page.goto('file://'+process.cwd()+'/out/final/'+name);
   await page.waitForSelector('video');
   await page.evaluate(()=>{const v=document.querySelector('video');v.style.width='960px';v.style.height='540px';v.muted=true;return v.play()});
   await page.waitForFunction(()=>document.querySelector('video').ended,{},{timeout:60000});
   results.push(await page.evaluate(name=>{const v=document.querySelector('video'),q=v.getVideoPlaybackQuality();return{name,duration:v.duration,width:v.videoWidth,height:v.videoHeight,totalFrames:q.totalVideoFrames,droppedFrames:q.droppedVideoFrames}},name));
  }
  fs.writeFileSync('out/final/playback-qa.json',JSON.stringify({environment:'Headless Chromium software compositor; 960×540 playback surface; full 1080p files',results},null,2));console.log(results);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
