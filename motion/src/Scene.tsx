import {mediaFile} from './media';
import React,{useMemo,useLayoutEffect} from 'react';
import {useThree,useFrame,useLoader} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,Img,staticFile,Audio} from 'remotion';
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {BokehPass} from 'three/examples/jsm/postprocessing/BokehPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {ribbon,smooth} from './geometry';
import {filmMaterial} from './material';
import {ImageFragments,LogoFragments} from './Fragments';
function Rig({t}:{t:number}){
 const {gl,scene,camera,size}=useThree();
 const composer=useMemo(()=>{RectAreaLightUniformsLib.init();gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.05;
 const env=new THREE.Scene();env.background=new THREE.Color('#040505');
 for(const [x,y,z,w,h,c,intensity] of [[-4,3,2,.55,8,'#ffb869',3.2],[4,1,-2,.3,8,'#9cd6ff',2.2],[0,5,0,8,.3,'#fff0dc',3],[0,-4,1,6,.12,'#feba70',1.8]] as any[]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(intensity)}));panel.position.set(x,y,z);panel.lookAt(0,0,0);env.add(panel)}
 const pmrem=new THREE.PMREMGenerator(gl);scene.environment=pmrem.fromScene(env,.03).texture;pmrem.dispose();
 const c=new EffectComposer(gl);c.addPass(new RenderPass(scene,camera));
 const b=new BokehPass(scene,camera,{focus:9.3,aperture:.00032,maxblur:.018});c.addPass(b);
 c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width,size.height),.26,.45,1.2));c.addPass(new OutputPass());return c;
 },[gl,scene,camera]);
 useLayoutEffect(()=>{composer.setSize(size.width,size.height)},[size,composer]);
 useLayoutEffect(()=>{
 scene.environmentIntensity=.2+.8*smooth(.3,1.7,t);scene.environmentRotation.y=t*.12;
 const move=smooth(1.6,3.5,t),settle=smooth(3.1,4.3,t);
 camera.position.set(1.2*Math.sin(t*.6)*(1-settle),.18*Math.sin(t*.9)*(1-settle),7.6-1.8*move+4.5*settle);
 camera.lookAt(.22*Math.sin(t*.6)*(1-settle),0,-.4);
 const cam=camera as THREE.PerspectiveCamera;cam.fov=43-5*settle;cam.updateProjectionMatrix();
 (composer.passes[1] as any).uniforms.focus.value=camera.position.z+.3;
 },[t,camera,composer]);
 useFrame(()=>composer.render(),1);return null;
}
function Ribbons({t,closing}:{t:number,closing:boolean}){
 const tex=useLoader(THREE.TextureLoader,mediaFile('generated-frame.jpg'));tex.colorSpace=THREE.SRGBColorSpace;
 const opacity=1-smooth(2.85,4.15,t);
 const objs=useMemo(()=>Array.from({length:7},(_,i)=>({g:ribbon(i,t,closing),m:filmMaterial(t,opacity,tex)})),[t,opacity]);
 useLayoutEffect(()=>()=>objs.forEach(o=>{o.g.dispose();o.m.dispose()}),[objs]);
 return <group rotation={[.2,-.23,-.3+smooth(2,4,t)*.14]}>{objs.map((o,i)=><mesh key={i} geometry={o.g} material={o.m}/>)}</group>
}
function Dust({t}:{t:number}){
 const geo=useMemo(()=>{const p=[];for(let i=0;i<500;i++){const seed=(n:number)=>{const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x)};p.push((seed(i+1)-.5)*14,(seed(i+600)-.5)*8,(seed(i+1200)-.5)*10)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return g},[]);
 return <points geometry={geo} rotation={[0,t*.012,t*.006]}><shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={{time:{value:t}}} vertexShader={`uniform float time; varying float intensity; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); intensity=(.2+.4*sin(position.x*71.0+time*.4))*(1.0-smoothstep(2.0,16.0,-mv.z)); gl_PointSize=1.7+9.0/max(1.0,-mv.z); gl_Position=projectionMatrix*mv; }`} fragmentShader={`varying float intensity; void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vec3(1.0,.72,.4),pow(1.0-d*2.0,2.0)*intensity);}`}/></points>
}
export function Ident({kind='opening',sound=true}:{kind?:'opening'|'ending'|'proof',sound?:boolean}){
 const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig();const seconds=frame/fps;
 const end=kind==='ending';const t=kind==='proof'?seconds+.6:end?seconds*1.2+.45:seconds;
 const reveal=end?smooth(2.15,2.95,seconds):smooth(3.65,4.4,seconds);
 const black=end?smooth(3.48,3.95,seconds):smooth(4.85,5,seconds);
 const light=smooth(.05,1.4,t);
 return <AbsoluteFill style={{background:'#020405'}}>
 <ThreeCanvas width={width} height={height} camera={{fov:43,near:.1,far:60,position:[0,0,9.8]}} gl={{antialias:true,alpha:false}}>
 <color attach="background" args={['#020405']}/><fog attach="fog" args={['#020405',10,28]}/>
 <Rig t={t}/><Ribbons t={t} closing={end}/><Dust t={t}/>{end&&<ImageFragments seconds={seconds} t={t}/>}<LogoFragments t={t}/>
 <rectAreaLight position={[-3,3,4]} rotation={[0,0,0]} width={3} height={7} intensity={light*5} color="#ffd5a2"/>
 <pointLight position={[-2.5,1.7,3]} color="#ffc17b" intensity={light*16}/>
 <pointLight position={[4,1,-2]} color="#9fd6ff" intensity={light*5}/>
 </ThreeCanvas>
 {end&&<Img src={mediaFile('generated-frame.jpg')} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',opacity:1-smooth(.15,.45,seconds)}}/>}
 <AbsoluteFill style={{background:'radial-gradient(ellipse at 45% 43%,transparent 30%,rgba(0,0,0,.65) 100%)',pointerEvents:'none'}}/>
 {!end&&<AbsoluteFill style={{background:'#000',opacity:1-light}}/>}
 <AbsoluteFill style={{justifyContent:'center',alignItems:'center',opacity:reveal}}>
 <div style={{display:'inline-flex',gap:40,alignItems:'baseline',fontFamily:'Arial, Helvetica, sans-serif',fontWeight:800,fontSize:150,letterSpacing:'-.05em',color:'#f0efea',textShadow:'0 0 32px rgba(255,214,167,.13)'}}>CINEMA<span style={{width:30,height:30,background:'#efaa68'}}/></div>
 </AbsoluteFill>
 <AbsoluteFill style={{background:'#000',opacity:black}}/>
 {sound&&<Audio src={mediaFile(end?'ending.wav':'opening.wav')}/>}
 </AbsoluteFill>
}
