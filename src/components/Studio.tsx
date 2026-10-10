'use client';
import { useRef, useState, useEffect } from 'react';
import { TREATMENTS } from '@/lib/contracts';
import { useCinema } from '@/hooks/useCinema';
import { useCamera } from '@/hooks/useCamera';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import { useDownload } from '@/hooks/useDownload';
import { Comparison } from './Comparison';
import { Arrow } from './Arrow';

export default function Studio() {
  const cinema = useCinema();
  const exporter = useDownload();
  const camera = useCamera((blob, name) => { camera.release(); void cinema.accept(blob, name); });
  const input = useRef<HTMLInputElement>(null);
  const source = useObjectUrl(cinema.take?.original);
  const normalized = useObjectUrl(cinema.take?.normalized);
  const [treatment, setTreatment] = useState('noir');
  const [code, setCode] = useState('');
  const [now, setNow] = useState(0);
  const [playbackError, setPlaybackError] = useState('');
  const [sampleLoading, setSampleLoading] = useState(false);
  useEffect(() => {
    if (!cinema.active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cinema.active]);
  const disabled = Boolean(cinema.busy || cinema.active || camera.recording || camera.requesting || sampleLoading || !cinema.loaded);
  const succeeded = cinema.job?.state === 'succeeded';
  const kaggle = cinema.service?.model.startsWith('kaggle/');
  const elapsed = cinema.job && now ? Math.max(0, Math.floor((now - cinema.job.createdAt) / 1000)) : 0;
  async function newTake() { cinema.reset(); setPlaybackError(''); await camera.enable(); }
  async function sample() {
    setSampleLoading(true); setPlaybackError(''); camera.release();
    try {
      const response = await fetch('/demo-performance.mp4', { signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw new Error('The sample could not be loaded. Upload your own video instead.');
      await cinema.accept(await response.blob(), 'demo-performance.mp4');
    } catch (e) { setPlaybackError(e instanceof Error ? e.message : 'Unable to load the sample.'); }
    finally { setSampleLoading(false); }
  }
  return <main>
    <header className="app-header"><a className="wordmark" href="/" aria-label="CINEMA home">CINEMA<span className="wordmark-dot" /></a><span className="header-description">Performance → cinematic treatment</span><a className="quiet-link" href="https://github.com/Davemafy/cinema-live" target="_blank" rel="noreferrer">Project <Arrow /></a></header>
    <div className="workspace-title"><div><p className="eyebrow">PERFORMANCE STUDIO</p><h1>Record your performance.</h1></div><p>Record a short performance or upload a clip.<br />Explore a cinematic treatment from your footage.</p></div>
    <div className="workspace">
      <section className="capture-section" aria-label="Capture and preview">
        <div className="monitor-header"><span>{camera.recording ? 'RECORDING' : cinema.take ? 'SOURCE PERFORMANCE' : camera.ready ? 'LIVE CAMERA' : 'CAMERA / UPLOAD'}</span><span className={camera.recording ? 'record-time' : ''}>{camera.recording ? `${camera.elapsed.toFixed(1)} / 5.0 s` : cinema.take ? `${cinema.take.duration.toFixed(1)} s · ${cinema.take.width} × ${cinema.take.height}` : 'Up to 5 seconds'}</span></div>
        <div className="monitor">
          <video className={!cinema.take && camera.ready ? 'camera-video' : 'camera-video concealed'} ref={camera.video} autoPlay muted playsInline aria-label="Live camera preview" />
          {cinema.take && source && <video className="source-video" src={source} controls playsInline preload="metadata" aria-label="Original recording preview" onError={() => setPlaybackError('Your browser could not play the original format. The normalized MP4 remains available below.')} />}
          {!cinema.take && !camera.ready && <div className="monitor-empty"><div className="frame-corner top-left" /><div className="frame-corner bottom-right" /><p className="eyebrow">YOUR PERFORMANCE STARTS HERE</p><h2>Ready for your take.</h2><p>Your camera opens only when you enable it.<br />A video upload works just as well.</p><button className="primary" onClick={camera.enable} disabled={disabled}>{camera.requesting ? 'Opening camera…' : 'Enable camera'}</button></div>}
          {camera.recording && <span className="recording-marker"><span /> REC</span>}
          {cinema.busy === 'preparing' && <div className="monitor-status" role="status">Preparing compatible video…</div>}
        </div>
        <div className="capture-controls">
          <div className="capture-actions">
            {!cinema.take && camera.ready && <button className={camera.recording ? 'stop-button' : 'primary'} onClick={camera.recording ? camera.stop : camera.record} disabled={!camera.recording && disabled}>{camera.recording ? 'Stop recording' : 'Record 5-second take'}</button>}
            {cinema.take && <button onClick={newTake} disabled={disabled}>Retake with camera</button>}
            <button onClick={() => input.current?.click()} disabled={disabled}>Upload video</button>
            <button className="text-button" onClick={sample} disabled={disabled}>{sampleLoading ? 'Loading sample…' : 'Use sample performance'}</button>
            {camera.ready && !camera.recording && <button className="text-button" onClick={camera.release}>Close camera</button>}
          </div>
          <span className="upload-hint">MP4, WebM, MOV · max 4 MB</span>
          <input ref={input} type="file" accept="video/mp4,video/webm,video/quicktime,.mov,.m4v" className="file-input" aria-label="Upload a performance video" onChange={e => { const file = e.target.files?.[0]; if (file) { camera.release(); setPlaybackError(''); void cinema.accept(file, file.name); } e.target.value = ''; }} />
        </div>
        <p className="capture-note">Recording is silent. Uploads keep their original audio; the AI output is silent. Clips longer than five seconds use their first five seconds. Framing is preserved without cropping.</p>
        {cinema.take && <div className="source-links"><a href={source} download={cinema.take.name}>Download original</a><a href={normalized} download="cinema-input.mp4">Download normalized input</a>{cinema.take.trimmed && <span>Inference uses the first 5 seconds.</span>}</div>}
        {cinema.take?.name === 'demo-performance.mp4' && <p className="capture-note">Sample input: ARTSEDGE, The Kennedy Center · Charleston dance · <a href="/demo-attribution.txt" target="_blank" rel="noreferrer">CC BY 3.0 attribution</a>. Excerpt and transcode by CINEMA.</p>}
        {(camera.error || playbackError) && <p className="error" role="alert">{camera.error || playbackError}</p>}
      </section>
      <section className="treatment-panel" aria-label="Cinematic treatment and rendering">
        <p className="eyebrow">VISUAL TREATMENT</p><h2>Choose a treatment.</h2>
        <fieldset disabled={disabled}><legend className="sr-only">Choose a cinematic treatment</legend>{TREATMENTS.map(t => <label className="treatment-option" key={t.id}><input type="radio" name="treatment" checked={treatment === t.id} value={t.id} onChange={() => setTreatment(t.id)} /><span><span className="treatment-category">{t.category}</span><strong>{t.name}</strong><span className="treatment-description">{t.description}</span></span></label>)}</fieldset>
        {kaggle ? <p className="treatment-note">Experimental Kaggle mode: LTX conditions on the FIRST FRAME of the uploaded clip. The generated motion does not preserve your original performance. Temporary demo only.</p> : <p className="treatment-note">The model receives the full short clip. Motion and identity fidelity require evaluation; exact preservation is not guaranteed.</p>}
        {cinema.service?.renderCodeRequired && <label className="code-label">Render access code<input type="password" value={code} onChange={e => setCode(e.target.value)} autoComplete="off" /></label>}
        <button className="primary transform-button" onClick={() => cinema.transform(treatment, code)} disabled={!cinema.take || !cinema.service?.inferenceAvailable || disabled}>{cinema.busy === 'submitting' ? 'Submitting performance…' : cinema.active ? 'Rendering in progress' : cinema.job?.state === 'failed' ? 'Retry transformation' : 'Transform performance'}<Arrow /></button>
        {!cinema.service && <p className="service-note" role="status">Checking inference connection…</p>}
        {cinema.service && !cinema.service.inferenceAvailable && <div className="service-note"><strong>AI rendering unavailable</strong><p>{cinema.service.reason} Capture and preprocessing are available.</p><button className="text-button" onClick={cinema.reconnect}>Check connection</button></div>}
        {cinema.service?.inferenceAvailable && <p className="service-note">{kaggle ? 'Experimental image-conditioned rendering on a temporary Kaggle GPU. The first frame guides the result; the original motion is not preserved.' : 'Asynchronous LTX-2.3 video-to-video rendering. Your clip is sent to fal for processing. Do not close this tab during submission.'}</p>}
        {cinema.active && <div className="job-status" role="status" aria-live="polite"><strong>{cinema.job?.state === 'queued' ? 'In the model queue' : 'Model is rendering your take'}</strong><p>Elapsed {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} · status comes from the provider.</p><p>You can return to this browser session after submission. No percentage estimate is available.</p></div>}
        {cinema.job?.state === 'failed' && <p className="error" role="alert">{cinema.job.error}</p>}
        {cinema.pollError && <div className="error" role="alert"><p>{cinema.pollError}</p><button onClick={cinema.checkAgain}>Check job again</button></div>}
        {cinema.error && <div className="error" role="alert"><p>{cinema.error}</p><button onClick={cinema.reconnect}>Retry connection</button></div>}
        {cinema.storageWarning && <p className="error" role="alert">{cinema.storageWarning}</p>}
        <div className="model-credit">{kaggle ? <>MODEL / LTX 2B · KAGGLE<br />FIRST-FRAME CONDITIONING</> : <>MODEL / LTX-2.3 DISTILLED<br />VIDEO-CONDITIONED GENERATION</>}</div>
      </section>
    </div>
    {succeeded && cinema.job?.videoUrl && <section className="result-section" aria-label="Rendered film"><div className="result-heading"><div><p className="eyebrow">RENDER COMPLETE</p><h2>Your cinematic take.</h2></div><div className="result-actions"><button className="primary" disabled={exporter.downloading} onClick={() => exporter.download(`/api/export?token=${encodeURIComponent(cinema.job!.exportToken!)}`, `cinema-${cinema.job!.id}.mp4`)}>{exporter.downloading ? "Downloading film…" : "Download film ↓"}</button><button onClick={() => { camera.release(); cinema.reset(); }}>New performance</button></div></div><Comparison source={normalized} result={cinema.job.videoUrl} />{exporter.error && <p className="error" role="alert">{exporter.error}</p>}<details className="render-details"><summary>Generation details</summary><p>Model: {cinema.job.model}<br />Job: {cinema.job.id}<br />Elapsed until result check: {cinema.job.durationSeconds} seconds<br />Seed: {cinema.job.seed ?? String(cinema.job.config.seed)}{cinema.job.inferenceSeconds !== undefined && <><br />Provider-measured inference: {cinema.job.inferenceSeconds.toFixed(1)} seconds</>}</p><pre>{JSON.stringify(cinema.job.config, null, 2)}</pre><p>Download promptly. Job links expire after 24 hours; provider media retention is not guaranteed.</p><button onClick={async () => { cinema.checkAgain(); }}>Refresh result status</button></details></section>}
    <footer><span>CINEMA / BANANA HACKS 2026</span><span>Capture. Condition. Compare. Export.</span></footer>
  </main>;
}
