import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {Rig,Director} from '../Scene';
import {Sculpture} from './Sculpture';
const ease=(x:number)=>{x=T.MathUtils.clamp(x,0,1);return x*x*x*(x*(x*6-15)+10)};
export function proofDirector(t:number):Director{
 const discover=ease(t/.95),travel=ease((t-.95)/1.05);
 const position=new T.Vector3(1.665,-.36,5.959).lerp(new T.Vector3(.15,.35,8.9),discover).lerp(new T.Vector3(-.48,.15,4.5),travel);
 const target=new T.Vector3(1.248,-.744,4.57).lerp(new T.Vector3(0,0,-.5),discover).lerp(new T.Vector3(.25,-.15,-2),travel);
 return {position,target,fov:40,focus:position.distanceTo(target),environment:.15+.85*ease(t/.7),aperture:.000025,bloom:.045};
}
export function RealismProof({tactile=true}:{tactile?:boolean}){
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),t=frame/fps;
 return <AbsoluteFill style={{background:'#000'}}><ThreeCanvas width={width} height={height} shadows camera={{fov:40,near:.025,far:70}} gl={{antialias:true,alpha:false}}>
 <color attach="background" args={['#000']}/><Rig neutral={tactile} t={t} director={proofDirector(t)}/><Sculpture time={1.4} tactile={tactile}/>
 <rectAreaLight position={[-3,3,4]} width={.45} height={7} intensity={15} color="#ffe4c4"/>
 <rectAreaLight position={[4,1,2]} rotation={[0,.6,0]} width={.16} height={5} intensity={9} color="#c7dfec"/>
 <directionalLight castShadow position={[-3,5,6]} intensity={2.2} color="#ffe3bb" shadow-mapSize={[2048,2048]} shadow-bias={-.00015} shadow-normalBias={.015} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7}/>
 </ThreeCanvas></AbsoluteFill>;
}
