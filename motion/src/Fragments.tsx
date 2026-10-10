import {mediaFile} from './media';
import React,{useMemo,useLayoutEffect} from 'react';import * as THREE from 'three';import {useLoader} from '@react-three/fiber';import {staticFile} from 'remotion';import {smooth,ribbon} from './geometry';
// Supplied image is subdivided into actual image-bearing geometry. Each band
// bends toward the same analytic film surface used by the opening.
export function ImageFragments({seconds,t}:{seconds:number,t:number}){
 const tex=useLoader(THREE.TextureLoader,mediaFile('generated-frame.jpg'));tex.colorSpace=THREE.SRGBColorSpace;
 const p=smooth(.2,1.7,seconds),opacity=1-smooth(1.65,2.25,seconds);
 const bands=useMemo(()=>Array.from({length:7},(_,i)=>{
 const target=ribbon(i,t),a=target.getAttribute('position'),N=260,M=6;
 const pos=[],uv=[];
 for(let n=0;n<=N;n++)for(let m=0;m<=M;m++){
 const u=n/N,v=m/M,ix=n*(M+1)+m;
 const x=(u-.5)*10.65,y=((i+v)/7-.5)*5.99;
 pos.push(THREE.MathUtils.lerp(x,a.getX(ix),p),THREE.MathUtils.lerp(y,a.getY(ix),p),THREE.MathUtils.lerp(0,a.getZ(ix),p));uv.push(u,(i+v)/7);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(target.index);g.computeVertexNormals();target.dispose();return g;
 }),[p,t]);
 useLayoutEffect(()=>()=>bands.forEach(g=>g.dispose()),[bands]);
 return <group rotation={[p*.2,p*-.23,p*(-.3+smooth(2,4,t)*.14)]}>{bands.map((g,i)=><mesh key={i} geometry={g}><meshPhysicalMaterial map={tex} color="white" metalness={p*.45} roughness={.3} clearcoat={1} transparent opacity={opacity} side={THREE.DoubleSide} emissive="white" emissiveMap={tex} emissiveIntensity={(1-p)*.7}/></mesh>)}</group>
}
function mask(){const c=document.createElement('canvas');c.width=720;c.height=190;const ctx=c.getContext('2d')!;ctx.fillStyle='white';ctx.font='800 150px Arial, Helvetica, sans-serif';(ctx as any).letterSpacing='-7.5px';ctx.fillText('CINEMA',0,145);const w=ctx.measureText('CINEMA').width;ctx.fillStyle='#efaa68';ctx.fillRect(w+40,115,30,30);const a=ctx.getImageData(0,0,720,190).data;const points=[];for(let y=0;y<190;y+=12)for(let x=0;x<w+71;x+=12){if(a[(y*720+x)*4+3]>128)points.push(new THREE.Vector3((x-(w+70)/2)*.00656,(92-y)*.00656,0))}return points}
export function LogoFragments({t}:{t:number}){
 const targets=useMemo(mask,[]),p=smooth(2.65,4.12,t),opacity=smooth(2.25,2.8,t)*(1-smooth(4.1,4.4,t));
 const geometry=useMemo(()=>new THREE.BoxGeometry(.072,.072,.014),[]);
 const mesh=useMemo(()=>new THREE.InstancedMesh(geometry,new THREE.MeshPhysicalMaterial({color:'#8f8172',metalness:.7,roughness:.32,transparent:true,opacity}),targets.length),[targets,geometry]);
 useLayoutEffect(()=>{(mesh.material as THREE.MeshPhysicalMaterial).opacity=opacity;const obj=new THREE.Object3D();targets.forEach((v,i)=>{const theta=i*2.399,rad=2+(i%71)/30;const start=new THREE.Vector3(Math.cos(theta)*rad,Math.sin(theta)*rad*.65,Math.sin(theta*.3)*3);obj.position.copy(start.lerp(v,p));obj.rotation.set((1-p)*theta*.3,(1-p)*theta*.7,(1-p)*theta);const s=.6+.4*p;obj.scale.set(s,s,s);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix)});mesh.instanceMatrix.needsUpdate=true},[t,p,opacity,mesh]);return <primitive object={mesh}/>;
}
