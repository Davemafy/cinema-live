import * as THREE from 'three';
// PBR shader injection derived from Drei MeshWobbleMaterial's onBeforeCompile
// pattern. CINEMA uses an analytic strip with mild high-frequency film flex.
export function filmMaterial(time:number,opacity:number,texture:THREE.Texture,physicalHoles=false){
 const mat=new THREE.MeshPhysicalMaterial({color:'#b2aaa0',metalness:.87,roughness:.28,clearcoat:1,clearcoatRoughness:.18,side:THREE.DoubleSide,transparent:opacity<1,opacity,envMapIntensity:1.1});
 mat.onBeforeCompile=(s)=>{
 s.uniforms.identTime={value:time};s.uniforms.emulsionTex={value:texture};
 s.vertexShader='uniform float identTime; varying vec2 filmUv;\n'+s.vertexShader;
 s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 filmUv=uv;
 float flex=sin(position.x*3.0+position.y*2.0+identTime*0.5)*0.012;
 transformed+=normal*flex;`);
 s.fragmentShader='uniform sampler2D emulsionTex; varying vec2 filmUv;\n'+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 float grain=fract(sin(dot(filmUv,vec2(731.7,219.3)))*43758.5453);
 roughnessFactor=clamp(roughnessFactor+(grain-.5)*.08,.12,.5);`);
 s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec2 cell=vec2(fract(filmUv.x*72.0),filmUv.y);
 float holeX=step(0.22,cell.x)*step(cell.x,0.78);
 float holes=holeX*(step(0.09,cell.y)*step(cell.y,0.23)+step(0.77,cell.y)*step(cell.y,0.91));
 ${physicalHoles?'':'if(holes>0.5) discard;'}
 float frame=step(0.26,cell.y)*step(cell.y,0.74);
 float border=1.0-smoothstep(0.015,0.026,min(fract(filmUv.x*12.0),1.0-fract(filmUv.x*12.0)));
 float emulsion=0.38+0.14*sin(floor(filmUv.x*12.0)*4.8);
 vec2 photoUv=vec2(fract(filmUv.x*12.0),(filmUv.y-.26)/.48);
 vec3 photo=texture2D(emulsionTex,photoUv).rgb;
 ${physicalHoles?'photo=vec3(dot(photo,vec3(.2126,.7152,.0722)));':''}
 diffuseColor.rgb*=mix(vec3(1.0),photo*.62+vec3(.09),frame);
 diffuseColor.rgb+=vec3(0.1,0.065,0.025)*border*frame;
 float edge=1.0-smoothstep(0.008,0.026,min(filmUv.y,1.0-filmUv.y));
 diffuseColor.rgb+=edge*vec3(0.2,0.13,0.06);`);
 if(physicalHoles)s.fragmentShader=s.fragmentShader.replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>\n metalnessFactor=mix(.80,.24,frame);`);
 };
 return mat;
}
