import React,{useMemo,useLayoutEffect,useEffect,useRef} from 'react';
import {useLoader,useThree} from '@react-three/fiber';
import * as T from 'three';
import {ribbon,smooth} from '../geometry';
import {filmMaterial} from '../material';
import {tactileFilmMaterial} from './TactileMaterial';
import {mediaFile} from '../media';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// Preserve the preferred opening's seven original analytic strip forms.
// Freeze the old shape before its collapse stage; no geometry fades or perpetual rotation.
export function Sculpture({time,tactile=false}:{time:number,tactile?:boolean}){
 const photo=useLoader(T.TextureLoader,mediaFile('final-frame-plate.jpg'));photo.colorSpace=T.SRGBColorSpace;
 const objects=useMemo(()=>Array.from({length:7},(_,i)=>({geometry:solidPreferredRibbon(i,tactile),material:tactile?tactileFilmMaterial(photo):filmMaterial(1.4,1,photo,true)})),[photo,tactile]);
 useEffect(()=>()=>objects.forEach(x=>{x.geometry.dispose();x.material.dispose()}),[objects]);
 return <group rotation={[.2,-.23,-.3]}>{objects.map((x,i)=><mesh castShadow={tactile} receiveShadow={tactile} key={i} geometry={x.geometry} material={x.material} position={[.055*Math.sin(i*1.7)*smooth(.65,1.55,time),.045*Math.cos(i*1.2)*smooth(.7,1.6,time),.12*Math.sin(i)*smooth(.8,1.7,time)]}/>)}</group>
}
// Camera-space coordinated film gate: 2.2 viewport widths provide a genuine
// fully occluded interval. The same physical trailing edge drives exact compositing.
export function FilmGate({progress}:{progress:number}){
 const {camera,size}=useThree(),mesh=useRef<T.Mesh>(null);
 const material=useMemo(()=>{const m=new T.MeshPhysicalMaterial({color:'#665442',metalness:.48,roughness:.21,clearcoat:1,clearcoatRoughness:.14,side:T.DoubleSide});m.onBeforeCompile=s=>{s.vertexShader='varying vec2 gateUV;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\n gateUV=uv; transformed.z+=.026*sin(uv.y*3.14159);`);s.fragmentShader='varying vec2 gateUV;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\n float cell=fract(gateUV.y*18.);\n if((gateUV.x<.018||gateUV.x>.982)&&cell>.18&&cell<.72)discard;\n float rim=pow(1.-gateUV.x,28.);float emulsion=step(.032,gateUV.x)*step(gateUV.x,.968);\n diffuseColor.rgb*=mix(.06,.35,1.-emulsion)+rim*.75;`);s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\n // A restrained transmitted edge light makes the physical occluder legible.\n float leading=pow(gateUV.x,32.);float trailing=pow(1.-gateUV.x,42.);\n totalEmissiveRadiance+=vec3(1.,.72,.40)*(1.6*leading+.22*trailing);`)};return m},[]);
 useEffect(()=>()=>material.dispose(),[material]);
 useLayoutEffect(()=>{if(!mesh.current)return;const d=.48,h=2*d*Math.tan(T.MathUtils.degToRad((camera as T.PerspectiveCamera).fov/2)),w=h*size.width/size.height;mesh.current.scale.set(w*2.2,h*1.65,1);mesh.current.quaternion.copy(camera.quaternion);mesh.current.position.copy(camera.localToWorld(new T.Vector3(w*(4*progress-2),0,-d)))},[progress,camera,size]);
 return <mesh ref={mesh} material={material}><planeGeometry args={[1,1,4,48]}/></mesh>
}
export const gateReveal=(p:number)=>Math.max(0,Math.min(100,(4*p-2.6)*100));

export function solidPreferredRibbon(i:number,tactile=false){
 const original=ribbon(i,1.4),a=original.attributes.position;
 const surface=(u:number,v:number)=>{const n=Math.min(259,Math.floor(u*260)),f=u*260-n;const at=(k:number,j:number)=>new T.Vector3(a.getX(k*7+j),a.getY(k*7+j),a.getZ(k*7+j));return at(n,0).lerp(at(n+1,0),f).lerp(at(n,6).lerp(at(n+1,6),f),v)};
 const pos=(u:number,v:number,d:number)=>{const c=surface(u,v),t=surface(Math.min(1,u+.0001),v).sub(surface(Math.max(0,u-.0001),v)),across=surface(u,1).sub(surface(u,0));return c.addScaledVector(t.cross(across).normalize(),d)};
 const us:number[]=[0];for(let k=0;k<(tactile?48:72);k++)us.push((k+.22)/(tactile?48:72),(k+.78)/(tactile?48:72),(k+1)/(tactile?48:72));
 const vs=tactile?[0,.055,.135,.18,.82,.865,.945,1]:[0,.09,.23,.26,.74,.77,.91,1],p:number[]=[],uv:number[]=[];
 const exists=(n:number,j:number)=>n>=0&&n<(tactile?144:216)&&j>=0&&j<7&&!((j===1||j===5)&&n%3===1);
 const vertex=(u:number,v:number,d:number)=>{const q=pos(u,v,d);p.push(q.x,q.y,q.z);uv.push(u,v)};
 const quad=(a:number[],b:number[],c:number[],d:number[])=>{for(const q of [a,b,c,a,c,d])vertex(q[0],q[1],q[2])};
 for(let n=0;n<(tactile?144:216);n++)for(let j=0;j<7;j++)if(exists(n,j)){const u=us[n],w=us[n+1],v=vs[j],h=vs[j+1],d=tactile?.002:.009;quad([u,v,d],[w,v,d],[w,h,d],[u,h,d]);quad([u,h,-d],[w,h,-d],[w,v,-d],[u,v,-d]);if(!exists(n,j-1))quad([u,v,-d],[w,v,-d],[w,v,d],[u,v,d]);if(!exists(n,j+1))quad([u,h,d],[w,h,d],[w,h,-d],[u,h,-d]);if(!exists(n-1,j))quad([u,v,d],[u,h,d],[u,h,-d],[u,v,-d]);if(!exists(n+1,j))quad([w,v,-d],[w,h,-d],[w,h,d],[w,v,d]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));const welded=mergeVertices(g,1e-5);welded.computeVertexNormals();g.dispose();original.dispose();return welded;
}
