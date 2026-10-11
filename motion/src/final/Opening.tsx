import React from 'react';
import {AbsoluteFill,Audio,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {Rig,Director} from '../Scene';
import {smooth} from '../geometry';
import {Logo} from '../reconstruction/Edit';
import {mediaFile} from '../media';
import {Sculpture,FilmGate,gateReveal} from './Sculpture';
const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
export function openingDirector(t:number):Director{
 const discover=smooth(.38,1.28,t),through=smooth(1.7,2.95,t);
 const macro=V(1.665,-.36,5.959),wide=V(.15,.35,8.9),inside=V(-.28,-.28,2.85);
 const position=macro.clone().lerp(wide,discover).lerp(inside,through);
 const target=V(1.248,-.744,4.57).lerp(V(0,0,-.5),discover).lerp(V(.25,-.15,-2.7),through);
 return {position,target,fov:35+8*discover+5*through,focus:1.5+7.4*discover-6.1*through,environment:.035+1.16*smooth(.12,1.15,t),aperture:.000085*(1-through)+.000045*through,bloom:.12};
}
export function Opening({sound=true,renderQuality=1}:{sound?:boolean,renderQuality?:number}){
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),t=frame/fps;
 const wipe=smooth(2.95,3.86,t),reveal=gateReveal(wipe),light=smooth(.05,.72,t);
 return <AbsoluteFill style={{background:'#000'}}>
 {t<3.87&&<ThreeCanvas dpr={renderQuality} width={width} height={height} camera={{fov:43,near:.025,far:70,position:[0,0,9]}} gl={{antialias:true,alpha:false}}><color attach="background" args={['#000']}/><Rig t={t} director={openingDirector(t)}/><Sculpture time={t}/>{wipe>0&&<FilmGate progress={wipe}/>}
 <rectAreaLight position={[2.6,.9,7.1]} width={.16} height={3.5} intensity={35*smooth(.07,.48,t)*(1-smooth(.72,1.1,t))} color="#ffead6"/>
 <rectAreaLight position={[-3,3,4]} width={.18+.55*smooth(.5,1.3,t)} height={7} intensity={12*light} color="#ffe2b9"/>
 <pointLight position={[-2.5,1.7,3]} intensity={light*(16+8*smooth(2.65,3.15,t))} color="#ffd4a0"/>
 <pointLight position={[4,1,-2]} intensity={light*4} color="#b2d4ea"/>
 </ThreeCanvas>}
 <AbsoluteFill style={{background:'radial-gradient(ellipse at 47% 44%,transparent 42%,rgba(0,0,0,.55))'}}/>
 <AbsoluteFill style={{background:'#000',opacity:1-smooth(.03,.24,t)}}/>
 {wipe>0&&<><AbsoluteFill style={{background:'#000',clipPath:`inset(0 ${100-reveal}% 0 0)`}}/><AbsoluteFill style={{justifyContent:'center',alignItems:'center',clipPath:`inset(0 ${100-reveal}% 0 0)`}}><Logo/></AbsoluteFill></>}
 <AbsoluteFill style={{background:'#000',opacity:smooth(4.84,4.95,t)}}/>
 {sound&&<Audio src={mediaFile('directed-opening.wav')}/>}
 </AbsoluteFill>
}
