import * as THREE from 'three';
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const smooth=(a:number,b:number,x:number)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
// Analytic strip surface; tangent and binormal are derived from the curve.
// Every evaluated point depends only on t, never on the preceding frame.
export function ribbon(i:number,t:number,closing=false){
 const N=260,M=6, positions=[],uvs=[],idx=[];
 const converge=smooth(2.6,4.15,t), phase=i*1.047;
 const radius=2.1+(i%3)*.7, width=.42+(i%3)*.16;
 for(let n=0;n<=N;n++)for(let m=0;m<=M;m++){
  const u=n/N,v=m/M-.5;
  const theta=phase+(u-.5)*Math.PI*(1.35+(i%2)*.72)+t*.14;
  const r=radius+.24*Math.sin(u*7+phase+t*.3);
  const twist=theta*.85+phase*.8+1.15*Math.sin(u*6+t*.3);
  const along=new THREE.Vector3(-Math.sin(theta),Math.cos(theta)*.78,.22*Math.cos(u*5+phase));along.normalize();
  const radial=new THREE.Vector3(Math.cos(theta),Math.sin(theta)*.78,0).normalize();
  const b=new THREE.Vector3().crossVectors(along,radial).normalize();
  const across=radial.multiplyScalar(Math.cos(twist)).add(b.multiplyScalar(Math.sin(twist)));
  const center=new THREE.Vector3(r*Math.cos(theta)+(i%2?-.7:.6),r*Math.sin(theta)*.78+Math.sin(phase)*.55,(i-3)*1.35+Math.sin(u*5+phase)*1.2);
  center.addScaledVector(across,v*width);
  // Collapse toward six distinct letter positions with a continuous orbit.
  center.x*=1-converge*.32; center.y*=1-converge*.34;
  center.z-=converge*1.4;
  positions.push(center.x,center.y,center.z);uvs.push(u,v+.5);
  if(n<N&&m<M){const a=n*(M+1)+m;idx.push(a,a+M+1,a+1,a+1,a+M+1,a+M+2)}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
