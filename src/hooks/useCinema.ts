'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createJob, health, jobStatus, prepareVideo } from '@/lib/api';
import { loadSession, saveSession, type Take } from '@/lib/storage';
import type { Health, Job } from '@/lib/contracts';

export function useCinema() {
  const [take, setTake] = useState<Take | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [service, setService] = useState<Health | null>(null);
  const [busy, setBusy] = useState<'preparing' | 'submitting' | null>(null);
  const [error, setError] = useState('');
  const [pollError, setPollError] = useState('');
  const [storageWarning, setStorageWarning] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const alive = useRef(true);
  const locked = useRef(false);
  const saveChain = useRef(Promise.resolve());
  const active = job?.state === 'queued' || job?.state === 'rendering';
  useEffect(() => {
    alive.current = true;
    loadSession().then(value => { if (alive.current && value) { setTake(value.take); setJob(value.job); } })
      .catch(() => { if (alive.current) setStorageWarning('Browser storage is unavailable. Keep this tab open while rendering.'); })
      .finally(() => { if (alive.current) setLoaded(true); });
    health().then(setService).catch(() => setError('Could not connect to the service. Check your connection and retry.'));
    return () => { alive.current = false; };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    // Serialize writes so an old async save cannot overwrite a newer session.
    saveChain.current = saveChain.current.then(() => saveSession({ take, job })).catch(() => {
      if (alive.current) setStorageWarning('This take could not be saved in your browser. Keep this tab open.');
    });
  }, [take, job, loaded]);
  useEffect(() => {
    if (!job || !active) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;
    const deadline = Date.now() + 20 * 60_000;
    setPollError('');
    async function poll() {
      if (disposed) return;
      try {
        const next = await jobStatus(job!.token);
        if (disposed) return;
        setJob(next); failures = 0; setPollError('');
        if (next.state === 'succeeded' || next.state === 'failed') return;
      } catch (e) {
        if (disposed) return;
        failures++;
        setPollError(e instanceof Error ? e.message : 'Status is temporarily unavailable.');
        if (failures >= 3) return;
      }
      if (Date.now() > deadline) { setPollError('Automatic status checks paused after 20 minutes. Check again to resume. Your job has not been cancelled.'); return; }
      timer = setTimeout(poll, failures ? 10_000 : 4000);
    }
    void poll();
    return () => { disposed = true; clearTimeout(timer); };
    // The capability is stable for a job. State updates do not restart polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.token, refresh]);
  const accept = useCallback(async (blob: Blob, name: string) => {
    if (locked.current) return;
    locked.current = true; setBusy('preparing'); setError('');
    try { const prepared = await prepareVideo(blob, name); setTake(prepared); setJob(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to prepare this take.'); }
    finally { locked.current = false; setBusy(null); }
  }, []);
  async function transform(treatment: string, code: string) {
    if (!take || locked.current || active) return;
    locked.current = true; setBusy('submitting'); setError('');
    try { setJob(await createJob(take, treatment, code)); }
    catch (e) { setError(`${e instanceof Error ? e.message : 'Unable to start rendering.'} If the connection dropped during submission, check the provider history before resubmitting; a job may already have been accepted.`); }
    finally { locked.current = false; setBusy(null); }
  }
  async function reconnect() {
    setError('');
    try { setService(await health()); } catch { setError('Could not connect. Try again shortly.'); }
  }
  function reset() { if (!busy && !active) { setTake(null); setJob(null); setError(''); setPollError(''); } }
  return { take, job, service, busy, active, error, pollError, storageWarning, loaded, accept, transform, reconnect, reset, checkAgain: () => setRefresh(n => n + 1) };
}
