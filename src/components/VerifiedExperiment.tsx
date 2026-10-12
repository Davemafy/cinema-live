'use client';

import { useRef, useState } from 'react';

const evidenceRoot = 'https://raw.githubusercontent.com/Davemafy/cinema-live/fcb3c350baee688901d53b655a492a2e7eb57633/docs/evidence/preservation-v1';
const filmUrl = `${evidenceRoot}/treated-source.mp4`;
const demoUrl = `${evidenceRoot}/cinema-evidence-demo.mp4`;
const creditsUrl = 'https://github.com/Davemafy/cinema-live/blob/fcb3c350baee688901d53b655a492a2e7eb57633/docs/evidence/preservation-v1/CREDITS.md';

export function VerifiedExperiment() {
  const source = useRef<HTMLVideoElement>(null);
  const film = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');

  async function playTogether() {
    if (!source.current || !film.current) return;
    setError('');
    source.current.pause();
    film.current.pause();
    source.current.currentTime = 0;
    film.current.currentTime = 0;
    try {
      await Promise.all([source.current.play(), film.current.play()]);
    } catch {
      source.current.pause();
      film.current.pause();
      setError('Synchronized playback could not start. Use the individual controls or the direct film link.');
    }
  }

  return (
    <section id="verified-experiment" className="evidence-section" aria-labelledby="evidence-title">
      <div className="result-heading">
        <div>
          <p className="eyebrow">VERIFIED EXPERIMENT / OFFLINE RESULT</p>
          <h2 id="evidence-title">One performance, a different look.</h2>
        </div>
        <button type="button" onClick={playTogether}>Play both from start</button>
      </div>
      <p className="evidence-note">
        This comparison is a previously rendered, source-preserving experiment—not a response to
        your upload. An AI-edited reference frame supplied the lighting and color direction.
        Motion-aware processing applied that look to the original frames; the film does not
        contain video-diffusion-generated faces or movement.
      </p>
      <div className="comparison-grid">
        <figure>
          <figcaption>Original performance <span>Licensed sample · 5 seconds</span></figcaption>
          <video ref={source} src="/demo-performance.mp4" controls playsInline preload="none" aria-label="Original licensed Charleston performance" />
        </figure>
        <figure>
          <figcaption>Cinematic treatment <span>AI-directed appearance transfer · 854 × 480</span></figcaption>
          <video ref={film} src={filmUrl} controls playsInline preload="none"
            aria-label="Verified offline appearance-transfer film"
            onError={() => setError('The evidence video could not load here. Open the direct film link below.')} />
        </figure>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="evidence-links">
        <a href={filmUrl} target="_blank" rel="noreferrer">Open verified MP4</a>
        <a href={demoUrl} target="_blank" rel="noreferrer">Watch 56-second evidence demo</a>
        <a href={creditsUrl} target="_blank" rel="noreferrer">Method and media credits</a>
      </div>
      <p className="evidence-footnote">
        This is an offline AI-image-directed finishing experiment, not evidence of a fully
        deployed camera-to-AI rendering service or arbitrary scene generation. Live generation
        availability is shown separately above.
      </p>
    </section>
  );
}
