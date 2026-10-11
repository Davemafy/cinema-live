import * as T from 'three';
// Physical polyester/emulsion look development. No vertex displacement: geometry
// and its computed normals remain coherent. Derivative-filtered detail avoids sparkle.
export function tactileFilmMaterial(photo:T.Texture){
 const m=new T.MeshPhysicalMaterial({color:'#827d74',metalness:0,roughness:.24,clearcoat:.85,clearcoatRoughness:.085,ior:1.48,side:T.DoubleSide,envMapIntensity:1});
 m.onBeforeCompile=s=>{s.uniforms.photo={value:photo};s.vertexShader='varying vec2 filmUV;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfilmUV=uv;');
 s.fragmentShader='uniform sampler2D photo; varying vec2 filmUV;\n'+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float frame=step(.18,filmUV.y)*step(filmUV.y,.82);
 float number=floor(filmUV.x*12.);
 vec2 uvp=vec2(fract(filmUV.x*12.),(filmUV.y-.18)/.64);
 uvp.x=mix(uvp.x,1.-uvp.x,mod(number,2.));
 uvp=uvp*.82+vec2(.09)+vec2(.035*sin(number*2.),.025*cos(number*3.));
 vec3 image=texture2D(photo,uvp).rgb;image=mix(vec3(dot(image,vec3(.2126,.7152,.0722))),image,.08);
 float border=smoothstep(.012,.026,min(fract(filmUV.x*12.),1.-fract(filmUV.x*12.)));
 diffuseColor.rgb=mix(vec3(.13,.125,.115),image*.92+vec3(.03),frame*border);
 `);
 s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 float bandwidth=length(fwidth(filmUV))*400.;
 float detail=sin(filmUV.x*350.)*sin(filmUV.y*130.);
 roughnessFactor=clamp(.24+.018*detail/(1.+bandwidth),.21,.28);`);
 };return m;
}
