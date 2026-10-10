'use client';
import { useEffect, useRef, useState } from 'react';
export function useCamera(onRecorded: (blob: Blob, filename: string) => void) {
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const callback = useRef(onRecorded); callback.current = onRecorded;
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  function clearTimers() {
    if (timer.current) clearInterval(timer.current);
    if (stopTimer.current) clearTimeout(stopTimer.current);
  }
  function stop() { if (recorder.current?.state === 'recording') recorder.current.stop(); }
  function release() {
    stop(); stream.current?.getTracks().forEach(t => t.stop()); stream.current = null;
    if (mounted.current) setReady(false);
  }
  async function enable() {
    setError(''); setRequesting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Camera recording requires a supported browser on HTTPS. You can upload a video instead.');
      release();
      const value = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false });
      if (!mounted.current) { value.getTracks().forEach(t => t.stop()); return; }
      stream.current = value;
      value.getVideoTracks()[0].addEventListener('ended', () => { stop(); setReady(false); setError('Camera disconnected. Reconnect it or upload a video.'); });
      if (video.current) { video.current.srcObject = value; await video.current.play(); }
      setReady(true);
    } catch (e) {
      release();
      const name = e instanceof DOMException ? e.name : '';
      setError(name === 'NotAllowedError' ? 'Camera permission was denied. Allow the camera in your browser settings or upload a video.'
        : name === 'NotFoundError' ? 'No camera was found. Upload a video to continue.'
        : name === 'NotReadableError' ? 'Another application may be using your camera. Close it or upload a video.'
        : e instanceof Error ? e.message : 'Unable to open the camera. Upload a video instead.');
    } finally { if (mounted.current) setRequesting(false); }
  }
  function record() {
    if (!stream.current || recording) return;
    try {
      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/mp4', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
      const instance = new MediaRecorder(stream.current, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 2_000_000 });
      recorder.current = instance;
      const chunks: Blob[] = [];
      instance.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      instance.onerror = () => { clearTimers(); setRecording(false); setError('Recording failed. Try again or upload a video.'); };
      instance.onstop = () => {
        clearTimers();
        if (!mounted.current) return;
        setRecording(false);
        const type = instance.mimeType.split(';')[0];
        const blob = new Blob(chunks, { type });
        if (blob.size) callback.current(blob, `take.${type.includes('mp4') ? 'mp4' : 'webm'}`);
        else setError('The recording was empty. Try again.');
      };
      instance.start(250); setElapsed(0); setRecording(true); setError('');
      const start = performance.now();
      timer.current = setInterval(() => setElapsed((performance.now() - start) / 1000), 100);
      stopTimer.current = setTimeout(stop, 5000);
    } catch { setError('This browser could not start recording. Upload a video instead.'); }
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimers(); release(); };
    // Capture lifecycle is intentionally tied to this hook's mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { video, ready, requesting, recording, elapsed, error, enable, record, stop, release };
}
