# CINEMA — Preferred Opening: Cinematic Reference Harvest V4
**Date:** 2026-10-11  
**Basis:** User-selected 5-second `opening.mp4`, 1920×1080 at 24 fps, plus primary studio pages, direct public videos, engineering documentation, and the source in this branch.  
**Scope:** Reference research and design specification **only**; no new motion edit has been rendered in this V4 harvest.

## Creative lock

**Preserve:** layered/interwoven seven-film-strip sculpture; classic sprocket perforations; warm bronze/champagne specular highlights; deep black space; secondary cool highlights; atmospheric progression; CINEMA's exact bold ivory wordmark and orange accent square.

**Do not:** simplify to one hero strip; remake as a UI promo; turn everything into neon/light trails; insert broad metallic sheet instead of separate film strips; add many random particles; use perpetual slow rotation; pretend a fade is a physical ribbon-to-logo transition.

## Observed source-video frame samples

| Time | What the attached preferred opening shows | Opportunity |
|---|---|---|
| 0.08 s | Near-black | Excellent opening silence/darkness; retain |
| 0.48 s | First partial loops emerge | Reveal must be motivated by a travelling light, not blanket exposure |
| 0.95–2.95 s | Similar interwoven sculpture, increasingly illuminated, slight motion | Largest weakness: composition and camera scale barely change despite beautiful geometry |
| 3.45 s | Sculpture smaller and breaking away into fragments | Use an intentional foreground film wipe / sweep instead of independent dissolves |
| 3.95 s | Fragmented transitional wordmark | Clean aliasing, mask alignment, and exact timing |
| 4.45 s | Clear CINEMA wordmark | Retain readable uncompromised logo hold |

These notes derive from the **uploaded CINEMA file**, not the external references.

## Ranked direct visual references (film links; research based on official descriptions/stills, not frame-accurate independent viewing of every external video)

### 1 — Film4 Cinematic Ident, ManvsMachine / Analog
**Film:** https://vimeo.com/186967236  
**Studio:** https://mvsm.com/project/film4  
**Director/process:** https://www.mwinckelmann.com/film4  
**Detailed CGI process:** https://analogstudio.co.uk/work/film-4-film-ident  
**Behind the scenes:** https://vimeo.com/107610366

Production describes a camera journey through an architectural celluloid environment, CGI spaces looped in camera, controlled changes in lighting and mood, and a final brand reveal. Design and full-CG production are independently documented by MvM and Analog.

**Transfer:** Stage visible foreground, middle, and background film layers as a navigable *world*. Choreograph a real camera passage through a large near-field ribbon, synchronized with a lighting cue. Use film itself as a transition agent.

**Avoid:** Rebuilding Film4's actual identity/geometry shot-for-shot or implying comparable photorealism without rendering proof.

### 2 — Radical 3D Ribbon Logo Animation, One Road
**Direct film:** https://vimeo.com/844165034

The author describes more than 20 coordinated ribbons that form a structure, transform into an infinity symbol and resolve into a logo, with careful spacing/timing. Produced with Cinema4D and After Effects.

**Transfer:** Multi-ribbon choreography with staggered arrivals, depth layering, controlled acceleration and negative space that remains readable. Group 7–9 independent strips into front/middle/background families with slightly different movement.

**Avoid:** Rainbow colours; morphing CINEMA's exact letterforms via unreliable generated text; random turbulence.

### 3 — The Crown title sequence, Elastic
**Video/title study:** https://www.artofthetitle.com/title/the-crown/  
**Direct film listing:** https://vimeo.com/groups/728139/videos/190211478  
**Initial design work:** https://maxxburman.artstation.com/projects/2VkgB

Elastic's molten gold, glints, dark edges, and macro look development are documented by Art of the Title. The design intent emphasised intricacy, shadow and scale.

**Transfer:** Three levels of highlights — razor-bright grazing key, faint amber bounce, restrained cool edge; rough microfacet variation and black regions. Start with mysterious close-up, reveal greater structure.

**Avoid:** Literal molten gold; CINEMA's material must still read as film stock with sprocket holes.

### 4 — Netflix Originals Film Identity, Imaginary Forces
**Film:** https://vimeo.com/344134811  
**Studio breakdown:** https://imaginaryforces.com/project/netflix-originals

The film's source describes beams derived from a folded ribbon converging into the logo, with sound used as an identity cue.

**Transfer:** Commit to one clear visual-to-logo transformation and audible punctuation, followed by a clean hold.

**Avoid:** Netflix's recognisable 'N', spectrum palette, or sonic signature.

### 5 — Ant-Man Main-on-End, Sarofsky
**Film:** https://vimeo.com/147530605  
**Detailed production breakdown:** https://www.sarofsky.com/work/ant-man/

Sarofsky documents camera travel through red-gold thread worlds and sound-triggered light pulses. Typography occupies positioned frames, integrated with the scene.

**Transfer:** A shift of scale during the complex ribbon segment; type and audio timed as intentional visual events in the longer CINEMA outro.

**Avoid:** Building long scenic travels that don't fit a 5-second ident.

### 6 — Avengers: Infinity War Main-on-End, Sarofsky
**Credits study:** https://www.sarofsky.com/work/avengers-infinity-war/

Studio explains why quiet typography with a decisive final flourish can follow spectacle.

**Transfer:** After the ribbon wipe, stop the camera, remove visual clutter, and give CINEMA's exact logo and **A FILM BY / DAVEMAFY IMAFIDON** space to read.

### 7 — His Dark Materials, Elastic + Painting Practice
**Title sequence and production:** https://www.artofthetitle.com/title/his-dark-materials/

An environment-led CGI title sequence that interconnects multiple worlds with a musical identity.

**Transfer:** Make the camera movement a journey with discovery, not rotation around a centrepiece.

## What to actually change in the existing first-opening implementation

The initial ribbon shot's implementation is described in:
- `motion/src/Scene.tsx` (`Rig`, `Ribbons`, `Ident`)
- `motion/src/geometry.ts` (`ribbon`)
- `motion/src/material.ts` (film material)
- `motion/src/Fragments.tsx` (old fragmentation/reveal)

The prior implementation uses approximately seven separate meshes, mild frame-driven camera drift, uniform fading of geometry around 2.85–4.15 seconds, and a separate logo fade around 3.65–4.4. This explains why the structure appears visually persistent and the reveal appears disconnected.

**Proposed V4:** Retain the multi-ribbon sculpture. Upgrade only shot choreography, lighting, physical edge clarity, lens masking, and finishing. Preserve the existing precise logo as 2D compositing.

## Source-code harvest

1. **Three.js arc-length camera/curves:** https://threejs.org/docs/pages/Curve.html — `getPointAt`, `getTangentAt`, `computeFrenetFrames`; path length and orientation. Three.js is MIT.
2. **Material polish:** https://threejs.org/docs/pages/MeshPhysicalMaterial.html — clearcoat, roughness, anisotropy where valid, environmental reflection. Reflective film != solid gold; the photographic emulsion should stay recognisable.
3. **Studio lighting:** https://threejs.org/docs/pages/RectAreaLight.html and https://threejs.org/docs/pages/PMREMGenerator.html — narrow strip softboxes and roughness-aware reflection sampling. `RectAreaLight` by itself does **not** cast shadows.
4. **Frame-accurate 3D export:** https://www.remotiondocs.com/docs/three-canvas — `useCurrentFrame`, no uncontrolled `useFrame` motion.
5. **Motion blur:** https://www.remotion.dev/docs/motion-blur — evaluate sparingly, only at fast foreground ribbon crossings; prefer actual multipass/temporal samples over global blur. Check pinned Remotion 4.0.406 compatibility first.
6. **Per-object velocity blur exploration (experimental/reference only):** https://github.com/gkjohnson/threejs-sandbox/blob/master/motionBlurPass/webgl_postprocessing_perobjectmotionblur.html — velocity buffers require previous and current object transforms. Study technique, do not import blindly.

**Asset, license and frame-copy limitation:** external film footage is for research and technique study only. Do not redistribute or incorporate copyrighted frames/audio without rights. Publicly accessible source pages alone do not authorize copying. Studio code and videos are separate from Third Party Notice obligations.

## 5-second revised shot clock (120 frames @24fps)

| Interval | Action and camera | Sound |
|---|---|---|
| 0–0.45 s (frames 0–10) | Near black; edge highlight finds one perforated foreground strip | restrained contact/sprocket click |
| 0.45–1.30 (11–30) | Coordinated ribbons unfurl and separate in depth; visual hierarchy forms | first low rising resonance |
| 1.30–2.35 (31–55) | **Dolly through central coil** with parallax, close ribbon crosses foreground | accelerating textured scrape |
| 2.35–3.20 (56–76) | Camera emerges at new perspective; visible staggered strips snap into composition; golden light sweep | musical downbeat and brief emphasis |
| 3.20–3.92 (77–93) | One existing ribbon traverses camera completely; occlusion causally hides sculpture and reveals exact logo | restrained whoosh/impact |
| 3.92–5.00 (94–119) | Clear, static CINEMA wordmark + orange square, hold and quiet decay | identifiable original cue/silence |

The timeline above is a **creative proposal**, not a claim that external studio videos have these precise shot lengths.

## Pass/fail gates

**Retain visual DNA:** seven layered strips remain visually distinct; metallic film with perforations, not opaque solid metal; black and champagne colour grading.

**Movement:** clear camera position and scale change at 1.5 vs 2.5s; near-field ribbon performs an actual lens crossing.

**Reveal:** no partially clipped logo or unwanted fragment-text frames; exact original wordmark preserved.

**Finishing:** protect gold highlight detail, ensure blacks retain depth; no starburst/particle noise dominating the frame. Physical/simulated motion blur should not obscure perforations.

**Outputs:** individual 5s ident MP4, matching browser preview, audio reviewed, diagnostic contact sheet across 10 sampled frames, exact frame counts at 24fps.

## Recommendation

Use roughly **35% Film4 camera/world grammar, 25% Radical multi-ribbon orchestration, 20% The Crown material/lighting, 10% Netflix identity payoff, 10% Sarofsky soundtrack/credit staging**. These percentages are an art-direction weighting, not measured source analysis.

**Do not rebuild the preferred opening from scratch.** Produce one edited 5s pass that keeps its seven-strip composition, makes 1.30–3.20s genuinely dynamic, and replaces the disconnected fade with a physical mask.
