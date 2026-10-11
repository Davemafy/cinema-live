'use client';
import { useRef, useState } from 'react';
export function Comparison({ source, result, treatmentName = 'Silver screen', originalSource = false }: { source: string; result: string; treatmentName?: string; originalSource?: boolean }) {
  const original = useRef<HTMLVideoElement>(null);
  const output = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  async function playBoth() {
    setError('');
    if (!original.current || !output.current) return;
    original.current.currentTime = 0; output.current.currentTime = 0;
    try { await Promise.all([original.current.play(), output.current.play()]); }
    catch { original.current.pause(); output.current.pause(); setError('Playback could not start. Use the individual video controls.'); }
  }
  return <section className="comparison" aria-label="Original and transformed video comparison">
    <div className="comparison-heading"><h2>Compare the performance</h2><button onClick={playBoth}>Play both from start</button></div>
    <div className="comparison-grid">
      <figure><figcaption>Original input <span>{originalSource ? 'Original performance' : 'Normalized for inference'}</span></figcaption><video ref={original} src={source} controls playsInline preload="metadata" onError={() => setError('The original could not be played. Try downloading your source recording.')} /></figure>
      <figure><figcaption>AI treatment <span>{treatmentName}</span></figcaption><video ref={output} src={result} controls playsInline preload="metadata" onError={() => setError('The result could not be played. Refresh status or try downloading it.')} /></figure>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
  </section>;
}
