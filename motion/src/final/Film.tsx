import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as T from 'three';
import { Hero } from '../reconstruction/Hero';
import { LensRibbon } from '../reconstruction/LensRibbon';
import { Logo } from '../reconstruction/Edit';
import { Rig, Director } from '../Scene';
import { smooth } from '../geometry';
import { mediaFile } from '../media';
import { ImageSheet, sheetPoint } from './ImageSheet';
function Fonts() { const [h] = useState(() => delayRender('Licensed credit typography')); useEffect(() => { const f = new FontFace('CinemaCredits', `url(${mediaFile('fonts/CormorantGaramond-subset.ttf')})`, { weight: '300 700' }); f.load().then(x => { (document.fonts as any).add(x); continueRender(h); }).catch(() => continueRender(h)); }, [h]); return null; }
const V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
export function FinalFilm({ kind = 'opening', sound = true }: {
    kind?: 'opening' | 'outro';
    sound?: boolean;
}) {
    const frame = useCurrentFrame(), { fps, width, height } = useVideoConfig(), t = frame / fps, outro = kind === 'outro';
    const q = smooth(.75, 3.25, t), wipe = smooth(3.25, 4.1, t), light = smooth(.12, 1.6, t);
    const cameraPath = new T.CatmullRomCurve3([V(-1.1, .25, 3.2), V(-.9, .4, 3.8), V(.1, .85, 5.6), V(1.35, 1.1, 7.4), V(.45, 1.1, 8.25)]);
    let d: Director = { position: cameraPath.getPoint(q), target: V(-.85 + .9 * q, .5 + .1 * q, 1.2 * (1 - q)), fov: 44 - 6 * q, focus: 1.85 + 6.15 * q, environment: .03 + .9 * smooth(.5, 1.7, t), bloom: .07, aperture: .00005 };
    if (outro) {
        const approach = smooth(3.65, 4.35, t), p = smooth(1.5, 3.65, t), anchor = sheetPoint(.42, .5, 1), a = sheetPoint(.421, .5, 1).sub(anchor).normalize(), b = sheetPoint(.42, .51, 1).sub(anchor).normalize(), normal = new T.Vector3().crossVectors(a, b).normalize();
        if (normal.z < 0)
            normal.negate();
        d = { position: V(.4 * p, .7 * p, 7 + .8 * p).lerp(anchor.clone().addScaledVector(normal, .055), approach), target: V(0, 0, 0).lerp(anchor, approach), fov: 33, focus: 7 * (1 - approach) + .06 * approach, environment: .9 * p * (1 - smooth(4.22, 4.4, t)), aperture: .00001, bloom: .055 };
    }
    const scene = outro ? t < 4.4 : t < 4.15;
    const lensX = wipe * 300 - 100, black = smooth(outro ? 9.45 : 4.82, outro ? 9.95 : 4.95, t);
    const credit = smooth(5.8, 6.13, t), creditOut = smooth(7.48, 7.7, t), ack = smooth(7.7, 7.94, t);
    return <AbsoluteFill style={{ background: '#000', color: '#f0efea' }}><Fonts />
 {scene && <ThreeCanvas width={width} height={height} camera={{ fov: 33, near: .012, far: 60, position: [0, 0, 7] }} gl={{ antialias: true, alpha: false }}><color attach="background" args={['#000']}/><Rig t={t} director={d}/>{outro ? <ImageSheet time={t}/> : <Hero time={t} imageFile="final-frame-plate.jpg" photographic/>}{!outro && wipe > 0 && <LensRibbon progress={wipe}/>}
 <rectAreaLight position={[-2, 3, 4]} width={.12 + .48 * light} height={7} intensity={outro ? 11 * smooth(1.5, 2.7, t) : 18 * light} color="#ffd4a0"/><rectAreaLight position={[3, 1, 2]} rotation={[0, -.5, 0]} width={.2} height={6} intensity={outro ? 7 * smooth(1.5, 2.7, t) : 8 * light} color="#b9d6eb"/>
 </ThreeCanvas>}
 {!outro && <AbsoluteFill style={{ background: '#000', opacity: 1 - smooth(.05, .36, t) }}/>}
 {scene && <AbsoluteFill style={{ background: `radial-gradient(ellipse at 48% 45%,transparent 48%,rgba(0,0,0,${outro ? .22 : .6}))` }}/>}
 {!outro && wipe > 0 && <><AbsoluteFill style={{ background: '#000', clipPath: `inset(0 ${Math.max(0, 100 - (lensX - 92))}% 0 0)` }}/><AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', clipPath: `inset(0 ${Math.max(0, 100 - (lensX - 92))}% 0 0)` }}><Logo /></AbsoluteFill></>}
 {outro && t >= 4.4 && t < 5.8 && <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', clipPath: `inset(0 ${(1 - smooth(4.4, 4.82, t)) * 50}% 0 ${(1 - smooth(4.4, 4.82, t)) * 50}%)` }}><Logo /></AbsoluteFill>}
 {outro && t >= 5.8 && t < 7.7 && <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 250, opacity: 1 - creditOut, clipPath: `inset(0 ${(1 - credit) * 100}% 0 0)`, transform: `translateY(${(1 - credit) * 16}px)` }}>
 <div style={{ fontFamily: 'Arial', fontSize: 25, letterSpacing: 8, color: '#efaa68', marginBottom: 26 }}>A FILM BY</div>
 <div style={{ fontFamily: 'CinemaCredits', fontWeight: 500, fontSize: 155, lineHeight: .94, letterSpacing: 1, color: '#f1e6d0', textShadow: `${(1 - credit) * 8}px 0 ${2 + 5 * (1 - credit)}px rgba(239,170,104,.14)` }}>DAVEMAFY<br />IMAFIDON</div>
 <div style={{ width: 90 + 400 * credit, height: 1, background: 'linear-gradient(90deg,#efaa68,transparent)', marginTop: 38 }}/>
 <div style={{ position: 'absolute', right: 280, top: 170, bottom: 170, width: 1, background: 'linear-gradient(transparent,#ad8658,transparent)', transform: `translateX(${(1 - credit) * 45}px)` }}/>
 </AbsoluteFill>}
 {outro && t >= 7.7 && <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', transform: `translateY(${(1 - ack) * 12}px)`, clipPath: `inset(0 0 ${(1 - ack) * 100}% 0)` }}><div style={{ fontFamily: 'Arial', letterSpacing: 6, fontSize: 23, color: '#efaa68', marginBottom: 22 }}>CREATED FOR</div><div style={{ fontFamily: 'CinemaCredits', fontSize: 99, letterSpacing: 3 }}>BANANA HACKS 2026</div><div style={{ height: 1, width: 120, background: '#af8556', margin: '35px 0' }}/><div style={{ fontFamily: 'Arial', fontSize: 20, letterSpacing: 4, color: '#a6a09a' }}>THREE.JS · REACT THREE FIBER · REMOTION</div></AbsoluteFill>}
 {outro && t < 4.4 && <div style={{ position: 'absolute', bottom: 30, left: 40, fontFamily: 'Arial', fontSize: 17, letterSpacing: 2, color: '#eee', textShadow: '0 2px 6px #000' }}>TEMPORARY CINEMATIC PLATE · ORIGINAL AI-GENERATED ARTWORK</div>}
 <AbsoluteFill style={{ background: '#000', opacity: black }}/>
 {sound && <Audio src={mediaFile(outro ? 'final-outro.wav' : 'opening.wav')}/>}
 </AbsoluteFill>;
}
export const FinalCombined = () => <AbsoluteFill style={{ background: '#000' }}><Sequence durationInFrames={120}><FinalFilm /></Sequence><Sequence from={132} durationInFrames={240}><FinalFilm kind="outro"/></Sequence></AbsoluteFill>;
