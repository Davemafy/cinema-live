import React, { useMemo, useLayoutEffect, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import * as T from 'three';
import { mediaFile } from '../media';
import { smooth } from '../geometry';
export function sheetPoint(u: number, v: number, p: number, side = 0) {
    const a = (u - .5) * Math.PI * 2.15 + .25, r = 2.35 - .6 * u;
    const c = new T.Vector3(r * Math.cos(a), (u - .5) * 1.2 + .2 * Math.sin(a), r * .55 * Math.sin(a));
    const tangent = new T.Vector3(-.6 * Math.cos(a) - r * Math.sin(a) * Math.PI * 2.15, 1.2 + .2 * Math.cos(a) * Math.PI * 2.15, -.33 * Math.sin(a) + r * .55 * Math.cos(a) * Math.PI * 2.15).normalize();
    const n = new T.Vector3(0, 1, 0).addScaledVector(tangent, -tangent.y).normalize().applyAxisAngle(tangent, .28 * Math.sin(a));
    const b = new T.Vector3().crossVectors(tangent, n).normalize();
    const flat = new T.Vector3((u - .5) * 7.373, (v - .5) * 4.147, side * .012);
    return flat.lerp(c.addScaledVector(n, (v - .5) * (1.65 + 1.2 * (1 - p))).addScaledVector(b, side * .012), p);
}
export function ImageSheet({ time }: {
    time: number;
}) {
    const tex = useLoader(T.TextureLoader, mediaFile('final-frame-plate.jpg'));
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 8;
    const geometry = useMemo(() => {
        const g = new T.BufferGeometry(), pos = [], uv = [], ix = [];
        const nx = 180, ny = 28;
        for (let s = 0; s < 2; s++)
            for (let i = 0; i <= nx; i++)
                for (let j = 0; j <= ny; j++) {
                    pos.push(0, 0, 0);
                    uv.push(i / nx, j / ny);
                }
        const row = ny + 1, layer = (nx + 1) * row;
        for (let s = 0; s < 2; s++)
            for (let i = 0; i < nx; i++)
                for (let j = 0; j < ny; j++) {
                    const a = s * layer + i * row + j, b = a + row, c = b + 1, d = a + 1;
                    ix.push(...(s ? [a, c, b, a, d, c] : [a, b, c, a, c, d]));
                }
        for (let i = 0; i < nx; i++)
            for (const j of [0, ny]) {
                const a = i * row + j, b = a + row;
                ix.push(a, a + layer, b, b, a + layer, b + layer);
            }
        for (const i of [0, nx])
            for (let j = 0; j < ny; j++) {
                const a = i * row + j, b = a + 1;
                ix.push(a, b, a + layer, b, b + layer, a + layer);
            }
        g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
        g.setIndex(ix);
        return g;
    }, []);
    const p = smooth(1.5, 3.65, time);
    useLayoutEffect(() => {
        const a = geometry.attributes.position as T.BufferAttribute, uv = geometry.attributes.uv as T.BufferAttribute, layer = a.count / 2;
        for (let i = 0; i < a.count; i++) {
            const v = sheetPoint(uv.getX(i), uv.getY(i), p, i < layer ? 1 : -1);
            a.setXYZ(i, v.x, v.y, v.z);
        }
        a.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
    }, [geometry, p]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    const dark = 1 - smooth(4.22, 4.4, time);
    return <><mesh geometry={geometry}><meshPhysicalMaterial map={tex} side={T.DoubleSide} roughness={.85 - .57 * p} metalness={.08 * p} clearcoat={p * .8} clearcoatRoughness={.14} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={(1 - p) * .8 * dark} color={new T.Color().setScalar(dark)}/></mesh>{p > .08 && <FilmRails p={p} dark={dark}/>}</>;
}
function FilmRails({ p, dark }: {
    p: number;
    dark: number;
}) {
    const g = useMemo(() => {
        const geo = new T.BufferGeometry(), pos: number[] = [], uv: number[] = [], indices: number[] = [];
        // Four longitudinal rows on each edge. Rectangular gaps have actual depth walls.
        const ys = [0, .014, .046, .066], nx = 180, rows = 4, layer = (nx + 1) * rows;
        for (let edge = 0; edge < 2; edge++)
            for (let side = 0; side < 2; side++)
                for (let i = 0; i <= nx; i++)
                    for (let j = 0; j < rows; j++) {
                        pos.push(0, 0, 0);
                        uv.push(i / nx, edge ? 1 + ys[j] : -ys[j]);
                    }
        for (let edge = 0; edge < 2; edge++)
            for (let i = 0; i < nx; i++)
                for (let j = 0; j < 3; j++) {
                    if (j === 1 && i % 12 >= 3 && i % 12 <= 7)
                        continue;
                    const a = edge * layer * 2 + i * rows + j, b = a + rows, c = b + 1, d = a + 1;
                    indices.push(a, b, c, a, c, d, a + layer, c + layer, b + layer, a + layer, d + layer, c + layer);
                    for (const [x, y] of [[a, b], [b, c], [c, d], [d, a]])
                        indices.push(x, y, x + layer, y, y + layer, x + layer);
                }
        geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
        geo.setIndex(indices);
        return geo;
    }, []);
    useLayoutEffect(() => { const a = g.attributes.position as T.BufferAttribute, uv = g.attributes.uv as T.BufferAttribute, layer = 181 * 4; for (let i = 0; i < a.count; i++) {
        const vv = uv.getY(i), edge = Math.floor(i / (layer * 2)), v = edge + (vv - edge) * smooth(.1, .65, p);
        const q = sheetPoint(uv.getX(i), v, p, Math.floor(i / layer) % 2 ? -1 : 1);
        a.setXYZ(i, q.x, q.y, q.z);
    } a.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); }, [g, p]);
    useEffect(() => () => g.dispose(), [g]);
    return <mesh geometry={g}><meshPhysicalMaterial color={new T.Color('#69523d').multiplyScalar(dark)} metalness={.5} roughness={.24} clearcoat={1} side={T.DoubleSide}/></mesh>;
}
