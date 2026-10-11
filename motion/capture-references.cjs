const fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const root=process.cwd(),refs=path.resolve(root,'../../references'),out=path.join(root,'out/reconstruction/references');fs.mkdirSync(out,{recursive:true});
const mime=p=>p.endsWith('.js')||p.endsWith('.mjs')?'text/javascript':p.endsWith('.html')?'text/html':p.endsWith('.png')?'image/png':'text/plain';
const server=http.createServer((req,res)=>{
 try{let url=new URL(req.url,'http://localhost').pathname,p,body;
  if(url==='/spline.html'||url==='/morph.html'){
   p=path.join(refs,'three-source/examples',url==='/spline.html'?'webgl_geometry_extrude_splines.html':'webgl_morphtargets.html');
   body=fs.readFileSync(p,'utf8').replace('../build/three.module.js','/modern/build/three.module.js').replace('./jsm/','/modern/examples/jsm/');
  }else if(url.startsWith('/modern/'))p=path.join(root,'node_modules/three',url.slice(8));
  else if(url.startsWith('/path/'))p=path.join(refs,'path-flow',url.slice(6));
  else if(url.startsWith('/post/'))p=path.join(refs,'post-harness/node_modules/postprocessing',url.slice(6));
  else if(url==='/post.html'){p='post.html';body=`<!doctype html><style>body{margin:0;background:black}</style><script type="importmap">{"imports":{"three":"/modern/build/three.module.js"}}</script><script type="module">
   import * as T from 'three';import {EffectComposer,RenderPass,EffectPass,BloomEffect,DepthOfFieldEffect} from '/post/build/index.js';
   const s=new T.Scene(),c=new T.PerspectiveCamera(38,innerWidth/innerHeight,.1,40);c.position.set(0,1,9);c.lookAt(0,0,0);
   const r=new T.WebGLRenderer({antialias:true});r.setSize(innerWidth,innerHeight);document.body.append(r.domElement);
   s.add(new T.HemisphereLight(0xffdeb0,0x223344,3));const l=new T.PointLight(0xffddaa,80);l.position.set(-2,3,4);s.add(l);
   for(let i=0;i<9;i++){const m=new T.Mesh(new T.TorusGeometry(1,.08,20,100),new T.MeshStandardMaterial({color:0x98764c,metalness:.8,roughness:.2,emissive:0x98764c,emissiveIntensity:i===3?1.6:0}));m.position.set((i%3-1)*2.5,Math.floor(i/3)-1,(i%3-1)*2);m.rotation.y=i*.4;s.add(m)}
   const co=new EffectComposer(r);co.addPass(new RenderPass(s,c));const dof=new DepthOfFieldEffect(c,{focusDistance:.22,focalLength:.07,bokehScale:2});const bloom=new BloomEffect({luminanceThreshold:1,intensity:.3,mipmapBlur:true});co.addPass(new EffectPass(c,dof,bloom));co.render();window.__ready=true;
   </script>`;}
  else {res.writeHead(404);return res.end()}
  res.setHeader('Content-Type',mime(p));res.end(body||fs.readFileSync(p));
 }catch(e){res.writeHead(404);res.end(String(e))}
});
(async()=>{await new Promise(r=>server.listen(4311,'127.0.0.1',r));
 const vite=spawn(path.join(refs,'windline/node_modules/.bin/vite'),['--config','vite.demo.config.ts'],{cwd:path.join(refs,'windline'),env:{...process.env,NODE_OPTIONS:'--require='+path.join(root,'runtime-shim.cjs')},stdio:'ignore'});
 const browser=await chromium.launch({executablePath:path.join(root,'node_modules/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell'),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const results=[];
 for(const [name,url] of [['path-flow','http://127.0.0.1:4311/path/flow.html'],['spline-camera','http://127.0.0.1:4311/spline.html'],['morph-targets','http://127.0.0.1:4311/morph.html'],['postprocessing','http://127.0.0.1:4311/post.html'],['windline','http://127.0.0.1:4192/?backend=webgl']]){
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{await page.goto(url,{waitUntil:'networkidle',timeout:30000});await page.waitForTimeout(3500);
   if(name==='spline-camera'){const inputs=page.locator('input[type=checkbox]');if(await inputs.count())await inputs.nth(1).check();}
   if(name==='morph-targets'){const inputs=page.locator('input[type=number]');await inputs.first().fill('.65');await inputs.first().dispatchEvent('change');}
   await page.waitForTimeout(1000);await page.screenshot({path:path.join(out,name+'.png')});results.push({name,url,errors,canvas:await page.locator('canvas').count()});
  }catch(e){results.push({name,error:String(e),errors});try{await page.screenshot({path:path.join(out,name+'-blocked.png'),timeout:3000})}catch{}}
  console.log(name,errors);await page.close();
 }
 fs.writeFileSync(path.join(out,'runs.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));await browser.close();vite.kill();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
