import React,{useMemo,useLayoutEffect,useRef} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
// Camera-space ribbon. The same trailing-edge parameter drives the compositor.
export function LensRibbon({progress}:{progress:number}){
 const {camera,size}=useThree();const mesh=useRef<THREE.Mesh>(null);
 const material=useMemo(()=>{
  const m=new THREE.MeshPhysicalMaterial({color:'#342618',metalness:.75,roughness:.21,clearcoat:1});
  m.onBeforeCompile=s=>{
   s.vertexShader='varying vec2 gateUV;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    gateUV=uv;transformed.z+=.018*sin(uv.y*3.14159);`);
   s.fragmentShader='varying vec2 gateUV;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float edge=step(.93,gateUV.x)+step(gateUV.x,.045);
    float hole=step(.12,fract(gateUV.y*15.))*step(fract(gateUV.y*15.),.72);
    if(edge>.5&&hole>.5)discard;
    diffuseColor.rgb*=.15+.85*pow(gateUV.x,7.);
    `);
  };return m;
 },[]);
 useLayoutEffect(()=>()=>material.dispose(),[material]);
 useLayoutEffect(()=>{
  if(!mesh.current)return;const cam=camera as THREE.PerspectiveCamera,d=.7;
  const h=2*d*Math.tan(THREE.MathUtils.degToRad(cam.fov/2)),w=h*size.width/size.height;
  mesh.current.scale.set(w*.92,h*1.3,1);
  mesh.current.quaternion.copy(camera.quaternion);
  mesh.current.position.copy(camera.localToWorld(new THREE.Vector3(w*(progress*3-1-.46-.5),0,-d)));
 },[progress,camera,size]);
 return <mesh ref={mesh} material={material}><planeGeometry args={[1,1,1,64]}/></mesh>;
}
