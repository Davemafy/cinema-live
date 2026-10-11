# CINEMA — Into the Frame: final visual QA

## Recommended edit

This is the evolution of the supplied preferred `opening(1).mp4`, not a replacement with the later single-coil experiment. The seven analytic ribbon forms and original staging orientation are preserved. All final-named films are the recommended delivery; proofs are review evidence.

| Film | Duration | Frames | Narrative |
| --- | --- | --- | --- |
| cinema-opening-final.mp4 | 5 s | 120 | Film-edge discovery → seven-ribbon sculpture → spatial push → film-gate lens sweep → exact identity |
| cinema-outro-final.mp4 | 10 s | 240 | Full-screen final image → UV-continuous folding sheet → lens approach → identity → director → acknowledgments → black |
| cinema-combined-final.mp4 | 15.5 s | 372 | Opening, 12 black frames, outro |

## Visual review and revisions

The two supplied MP4s were decoded and inspected as contact sheets. The preferred opening had a rich sculpture but a largely similar wide composition across its middle and a disconnected fragment/identity passage. The later combined film had useful image deformation and director type but reduced the opening to one coil.

1. Preserved the seven preferred shapes, removed their collapse stage, and constructed front/back surfaces, edge walls and real perforations. Consistent normals come from the original ribbon tangents and welded topology. Original photographic texture treatment is restrained and monochromatic so champagne/cool lighting controls the palette.
2. Replaced general motion with an authored macro subject, eased pullback and a forward push into the structure. The initial proof exposed an off-subject, dim macro. The revised camera targets a sampled front ribbon patch and a narrow front light reveals its detail. Wider lighting and environmental fill were adjusted after viewing the actual frames.
3. Removed perpetual group rotation, fragment disappearance and particles from the final opening. Sculpture staging is almost static; camera and illumination create progression and parallax.
4. Added a curved camera-space film gate that covers the entire viewport. Its trailing geometric edge drives the precise logo mask. Dense review of frames 76–92 showed that the initial gate was too dark to read. A modest transmitted champagne edge light was added, and frames 70–95 were re-rendered at full resolution.
5. Retained the successful continuous image-to-film sheet and corrected physical rails from the preceding production. The sheet uses one unbroken UV 0–1 image through the morph; the camera approaches a normal sampled from that same surface.
6. Moved the outro identity passage to 4.5 s and synchronized its sound cue. Preserved the prominent licensed serif director typography, optical movement and rule framing. Added a quiet curved/perforated rail echo to connect the credit to the film world without rebuilding it as another sculpture.
7. Kept acknowledgments factual: requested Banana Hacks 2026 submission context and actually installed Three.js, React Three Fiber and Remotion. No sponsorship relationship is implied.

The full-resolution opening, revised gate and new outro identity/credit frames were reviewed and joined on exact frame boundaries. Successful full-resolution outro frames 0–105 from the preceding final production were retained unchanged; frames 106–239 were rendered again. A complete export from the committed compositions includes every correction directly; the split delivery render only retains already successful pictures. The portable browser preview uses reduced interactive resolution; final MP4s use full resolution. The preview loaded its actual licensed font, with no page errors. Repeat seeks at opening frame 50 and outro frame 80 were byte-identical and the intervening comparison frames were visibly different.

## Storyboard comparison

- First Light: a near-black physical edge and perforations become visible before the sculpture opens up.
- Impossible Sculpture: the preferred interwoven seven-ribbon world is retained, with champagne rails and subtle cool separation.
- Through the Frame: the camera advances inside the structure, changing foreground scale, silhouettes and overlap. This is the largest visible change from the preferred static middle.
- Light Break: actual film geometry covers the lens; edge light makes the crossing legible. The payoff is controlled rather than a large white flash.
- Identity: unchanged original ivory wordmark and amber square, held on black. The authentic repository logo is bolder than the conceptual storyboard; preserving real identity takes priority.

The outro is intentionally different: one full-screen image becomes one broad photographic surface, then an asymmetric movie credit and a quieter acknowledgment composition. It does not repeat the opening sculpture.

## Remaining limitations

The landscape is an original, visibly labeled **temporary AI-generated plate**, not verified CINEMA inference footage or a live-action shot. No suitable verified product footage with provenance was available. The initial plate is held as a final still; the hero image remains provisional for submission. Its replacement is isolated to the texture asset and does not require an engine rebuild.

This remains real-time raster/PMREM rendering with restrained depth of field and bloom, not path-traced transmission, caustics or offline motion blur. The lens gate uses an authored transmitted-edge shader, and the fold is a geometric interpolation rather than cloth simulation. Sound is original deterministic synthesis. No claim of studio-quality or award parity is made; the matched before/after frames provide the basis for judging the improvement.

## Verified media and preview checks

All three final files passed full FFmpeg decode, frame counts, 1920×1080 dimensions, 24 fps, exact 5 / 10 / 15.5 s container durations, stereo AAC at 48 kHz, and RGB-zero last frames. The opening begins at RGB zero. All 12 separation frames are RGB zero. Frame presentation timestamps advance by 1/24 s, with maximum decimal reporting error below 0.7 microseconds; no encoded frame gaps were found.

The initial combined re-encode left a faint near-black residual. Final assembly stream-copies the finished pictures around a separately encoded black segment. Video-only intermediates avoid AAC priming shifting the joined picture timestamps. Final video and audio start at zero and run for exactly 15.5 s.

Opening peak is −11.48 dBFS; outro peak is −11.61 dBFS. Original stereo scores contain no commercial samples. Opening cues follow discovery, camera acceleration and the 3.72 s identity passage; outro identity, director and acknowledgment cues occur at 4.5, 5.8 and 7.7 s. Audio was checked for clipping, exact length, waveform decay and edit alignment; calibrated listening-room mastering was not available.

The final portable preview loaded without page errors and loaded the licensed credit font. It waits for actual 3D frame completion before capture. Repeat seeks at opening frame 50 and outro frame 80 produced byte-identical canvas images; their comparison frames 18 and 48 were visibly different. A first cold-start capture was premature under renderer load; draw-completion gating corrected that QA race.

Native playback checks are recorded in playback-qa.json. Initial software-browser playback under simultaneous build/QA load dropped presentation frames, although the files decoded completely. The final isolated software-compositor pass is reported separately below. Encoded timing and native presentation performance are distinct checks.

All committed changes are under motion/. Main, the production base branch, the application and inference functionality are preserved. Native contact sheets and matched before/after sheets contain actual film frames, not browser screenshots.

The final software-compositor playback completed all three files. Its counters reported 120 / 240 / 372 decoded frames and 12 / 1 / 18 dropped presentation frames respectively. This environment did not provide reliably uninterrupted real-time presentation; that remains a preview-performance limitation. Independent full decode and every encoded frame timestamp passed, so no missing or irregularly timed frames are present in the delivered files. Native browser duration includes approximately 5–13 ms of AAC decoder padding; MP4 container durations and picture timelines are exact.
