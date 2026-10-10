'use client';
import { useState } from 'react';
export function useDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  async function download(url: string, name: string) {
    if (downloading) return;
    setDownloading(true); setError('');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(125_000) });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Download failed. Refresh the result status and retry.');
      }
      const blob = await response.blob();
      if (!blob.size || !blob.type.includes('video/')) throw new Error('The export was not a playable video. Please retry.');
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = href; link.download = name;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(href), 60_000);
    } catch (e) { setError(e instanceof Error ? e.message : 'Download failed. Try again.'); }
    finally { setDownloading(false); }
  }
  return { downloading, error, download };
}
