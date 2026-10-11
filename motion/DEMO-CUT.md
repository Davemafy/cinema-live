# CINEMA — deadline demo cut

The prior ident was not visually finished: the film still read as CG and the image fold was stiff. This cut is a deadline fallback, not a claim that photorealism has been solved.

- Opening: the supplied preferred `opening(1).mp4`, preserved without picture changes.
- Outro: 10 seconds. The same clearly labeled temporary photographic plate is held with a small eased push, then framed into a narrowing optical matte. The matte uncovers the unchanged CINEMA wordmark. No metallic fold, mesh deformation or object swap is used. Existing director typography and acknowledgments are retained.
- Combined: 15.5 seconds, including 12 black separation frames. Native video streams are retained around the separately encoded black segment; stereo audio follows the edit.

## Recommended for the actual demo

Use the preferred five-second opener and `cinema-demo-credit-3s.mp4` as the closer. This three-second cut uses the exact logo and requested director credit, ending on black, with no temporary landscape or simulated material. The ten-second optical ending remains an alternative, not a requirement to spend demo time on placeholder scenery.

## Reproduce

From `motion/`, generate the existing sound assets, then:

```sh
NODE_OPTIONS=--require=./runtime-shim.cjs npx remotion render src/index.tsx DemoOutro out/demo/cinema-demo-outro.mp4 --concurrency=2 --crf=17
python3 demo-assemble.py /absolute/path/to/preferred-opening.mp4
```

`npm run preview` provides a DEMO-OUTRO selection. The existing 3D compositions remain intact; the application and inference pipeline are unchanged.

The frame contact sheet was inspected for image continuity, matte timing, logo continuity and credits. Media QA checks verify all 120 / 240 / 372 frames, 1920×1080 at 24 fps, exact 5 / 10 / 15.5 second durations, stereo audio and regularly spaced picture timestamps.

The landscape remains original temporary AI-generated artwork, not verified CINEMA footage. Existing brand, font and sound attribution in FINAL-FRAME-ATTRIBUTION.md applies. The original opening remains CG; this contingency preserves the user's preferred version rather than calling it a new realism improvement. A later physical-film revision needs material and deformation work, not more finishing effects.
