import React,{useMemo,useLayoutEffect} from 'react';
import {useLoader} from '@react-three/fiber';
import * as THREE from 'three';
import {mediaFile} from '../media';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Original CINEMA mesh. Arc-length framing follows the method studied in
// Three.js CurveModifier (MIT); no zz85/path-flow code or unlicensed assets.
export const heroPath=new THREE.CatmullRomCurve3([
 [-5,-2,-1],[-2.8,-1.2,.1],[-.9,.7,.5],[1.1,1.45,-.5],
 [2.6,.35,-1],[1.6,-1.15,.2],[-.5,-1.0,1.7],[-1.5,.45,1.8],
 [-.25,2.05,.4],[2.6,2.1,-1.3],[5.6,.2,-3]
].map(p=>new THREE.Vector3(...p)),false,'centripetal');
heroPath.arcLengthDivisions=1200;
function solidFilm(){
 const p:number[]=[],uv:number[]=[];const N=384,ys=[-.62,-.53,-.40,.40,.53,.62];
 const pos=(u:number,v:number,d:number)=>{
  const c=heroPath.getPointAt(u),t=heroPath.getTangentAt(u);
  const n=new THREE.Vector3(-t.y,t.x,0).normalize();
  n.applyAxisAngle(t,.55*Math.sin(u*9)+u*.6-.2);
  const b=new THREE.Vector3().crossVectors(t,n).normalize();
  return c.addScaledVector(n,v).addScaledVector(b,d);
 };
 const vertex=(u:number,v:number,d:number)=>{const a=pos(u,v,d);p.push(a.x,a.y,a.z);uv.push(u*24,v/1.24+.5)};
 const quad=(a:number[],b:number[],c:number[],d:number[])=>{for(const q of [a,b,c,a,c,d])vertex(q[0],q[1],q[2])};
 const exists=(i:number,j:number)=>i>=0&&i<N&&j>=0&&j<5&&!((j===1||j===3)&&i%12>=3&&i%12<=7);
 for(let i=0;i<N;i++)for(let j=0;j<5;j++)if(exists(i,j)){
  const a=i/N,b=(i+1)/N,l=ys[j],r=ys[j+1],z=.018;
  quad([a,l,z],[b,l,z],[b,r,z],[a,r,z]);
  quad([a,r,-z],[b,r,-z],[b,l,-z],[a,l,-z]);
  if(!exists(i,j-1))quad([a,l,-z],[b,l,-z],[b,l,z],[a,l,z]);
  if(!exists(i,j+1))quad([a,r,z],[b,r,z],[b,r,-z],[a,r,-z]);
  if(!exists(i-1,j))quad([a,l,z],[a,r,z],[a,r,-z],[a,l,-z]);
  if(!exists(i+1,j))quad([b,l,-z],[b,r,-z],[b,r,z],[b,l,z]);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const welded=mergeVertices(g,.00001);welded.computeVertexNormals();g.dispose();return welded;
}
export function Hero({time}:{time:number}){
 const tex=useLoader(THREE.TextureLoader,mediaFile('generated-frame.jpg'));tex.colorSpace=THREE.SRGBColorSpace;
 const geometry=useMemo(solidFilm,[]);
 const material=useMemo(()=>{
  const m=new THREE.MeshPhysicalMaterial({color:'#99713d',metalness:.64,roughness:.23,clearcoat:1,clearcoatRoughness:.12,side:THREE.DoubleSide});
  m.onBeforeCompile=s=>{
   s.uniforms.photograph={value:tex};s.uniforms.filmTime={value:time};
   s.vertexShader='varying vec2 filmUV; uniform float filmTime;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    filmUV=uv; transformed+=normal*(.012*sin(uv.x*1.1+filmTime*.7));`);
   s.fragmentShader='varying vec2 filmUV; uniform sampler2D photograph;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float center=step(.18,filmUV.y)*step(filmUV.y,.82);
    vec2 imageUV=vec2(fract(filmUV.x),clamp((filmUV.y-.18)/.64,0.,1.));
    float picture=dot(texture2D(photograph,imageUV).rgb,vec3(.2126,.7152,.0722));
    float gate=step(.06,imageUV.x)*step(imageUV.x,.94);
    float grain=fract(sin(dot(floor(filmUV*vec2(96.,230.)),vec2(12.9898,78.233)))*43758.5453);
    float scratch=(1.-smoothstep(0.,.001,abs(filmUV.y-.233)))*.02;
    diffuseColor.rgb=mix(vec3(.40,.32,.22),vec3(.06,.05,.04)+picture*vec3(.22,.19,.15)*gate,center);
    diffuseColor.rgb*=.99+grain*.02;diffuseColor.rgb+=scratch;
    `);
   s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    roughnessFactor=mix(.19,.24,center)+grain*.035;`);
   s.fragmentShader=s.fragmentShader.replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
    metalnessFactor=mix(.74,.28,center);`);
   m.userData.shader=s;
  };return m;
 },[tex]);
 useLayoutEffect(()=>{if(material.userData.shader)material.userData.shader.uniforms.filmTime.value=time},[time,material]);
 useLayoutEffect(()=>()=>{geometry.dispose();material.dispose()},[geometry,material]);
 return <mesh geometry={geometry} material={material}/>;
}
