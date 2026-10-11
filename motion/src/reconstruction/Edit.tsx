import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,Audio,Img} from 'remotion';
import {Hero} from './Hero';
import {LensRibbon} from './LensRibbon';
import {Rig} from '../Scene';
import {smooth} from '../geometry';
import {mediaFile} from '../media';
export type Shot='A'|'B'|'C'|'opening'|'ending';
// Frozen directly from the original Studio.tsx + globals.css wordmark, 5× scale.
export function Logo(){return <Img src={mediaFile('cinema-original-wordmark.png')} style={{width:684.265625,height:174}}/>}
export function Edit({kind='opening',sound=true}:{kind?:Shot,sound?:boolean}){
 const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig(),t=frame/fps;
 const closing=kind==='ending';
 const wipe=kind==='C'?smooth(.45,1.35,t):smooth(3.25,4.1,t);
 const lensX=wipe*300-100;
 const reveal=kind==='C'||kind==='opening';
 const light=kind==='opening'?smooth(.08,1.15,t):1;
 const endblack=closing?smooth(3.48,3.92,t):kind==='opening'?smooth(4.82,4.98,t):0;
 const imageClose=smooth(.6,2.2,t);
 return <AbsoluteFill style={{background:'#000'}}>
 {!closing&&<ThreeCanvas width={width} height={height} camera={{fov:43,near:.05,far:60,position:[0,0,7]}} gl={{antialias:true,alpha:false}}>
  <color attach="background" args={['#010203']}/><Rig t={t} shot={kind}/><Hero time={t}/>
  {reveal&&wipe>0&&wipe<1&&<LensRibbon progress={wipe}/>}
  <rectAreaLight position={[-2,3,4]} rotation={[0,0,0]} width={.6} height={7} intensity={15*light} color="#ffd8a2"/>
  <rectAreaLight position={[3,1,2]} rotation={[0,-.5,0]} width={.25} height={6} intensity={10*light} color="#bed9ed"/>
  <pointLight position={[-1,2.4,1]} intensity={7*light} color="#ffb45d"/>
 </ThreeCanvas>}
 {!closing&&<AbsoluteFill style={{background:'radial-gradient(ellipse at 48% 45%,transparent 45%,rgba(0,0,0,.7))'}}/>}
 {kind==='opening'&&<AbsoluteFill style={{background:'#000',opacity:1-light}}/>}
 {reveal&&wipe>0&&<>
  {/* Leading light belongs to the passing film gate. The opaque gate masks both
      the scene and the exact compositor, so identity never fades over geometry. */}
  <AbsoluteFill style={{background:'#000',clipPath:`inset(0 ${Math.max(0,100-(lensX-92))}% 0 0)`}}/>
  <AbsoluteFill style={{justifyContent:'center',alignItems:'center',clipPath:`inset(0 ${Math.max(0,100-(lensX-92))}% 0 0)`}}><Logo/></AbsoluteFill>
 </>}
 {closing&&<>
  <AbsoluteFill style={{justifyContent:'center',alignItems:'center'}}><Logo/></AbsoluteFill>
  <AbsoluteFill style={{justifyContent:'center',alignItems:'center',clipPath:`inset(${imageClose*50}% 0 ${imageClose*50}% 0)`}}>
   <Img src={mediaFile('generated-frame.jpg')} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${1.035-imageClose*.16})`}}/>
  </AbsoluteFill>
  {imageClose>0&&imageClose<1&&<div style={{position:'absolute',left:0,right:0,top:`${50-imageClose*50}%`,height:2,background:'#ecc394',boxShadow:'0 0 28px #f0a955'}}/>}
  <div style={{position:'absolute',left:45,top:38,color:'#fff',fontFamily:'Arial',fontSize:21,letterSpacing:2,background:'#000b',padding:'12px 18px'}}>PLACEHOLDER FOOTAGE · ENDING UNAPPROVED</div>
 </>}
 <AbsoluteFill style={{background:'#000',opacity:endblack}}/>
 {sound&&(kind==='opening'||closing)&&<Audio src={mediaFile(closing?'ending.wav':'opening.wav')}/>}
 </AbsoluteFill>
}
