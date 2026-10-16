'use client';

import { useState } from 'react';
import { CheckCircle2, Download, Film, Loader2, TriangleAlert } from 'lucide-react';
import {
  assertBrandRenderSupport,
  downloadBrandVideo,
  renderBrandVideo,
} from '@/lib/renderBrandVideo';
import { getBrandVideoProps, useBrandStudioStore } from '@/store/useBrandStudioStore';

type ExportStatus = 'idle' | 'checking' | 'rendering' | 'done' | 'error';

export default function BrandExportButton() {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function exportVideo() {
    setStatus('checking');
    setProgress(0);
    setError(null);

    try {
      const props = getBrandVideoProps();
      if (!props.copy.hookTitle.trim() && !props.copy.hookAccent.trim()) {
        throw new Error('Isi minimal satu teks hook sebelum export.');
      }
      if (props.outputMode === 'campaign' && !props.copy.cta.trim()) {
        throw new Error('CTA harus diisi sebelum export campaign.');
      }

      await assertBrandRenderSupport();
      setStatus('rendering');
      const blob = await renderBrandVideo(props, setProgress);
      downloadBrandVideo(blob, props);

      setProgress(100);
      setStatus('done');
    } catch (caughtError) {
      setStatus('error');
      setError(caughtError instanceof Error ? caughtError.message : 'Export video gagal.');
    }
  }

  const busy = status === 'checking' || status === 'rendering';
  const outputMode = useBrandStudioStore((state) => state.outputMode);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        className="btn btn-primary w-full py-3 text-[12px] font-bold"
        onClick={() => void exportVideo()}
        disabled={busy}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />}
        {status === 'checking'
          ? 'Memeriksa browser…'
          : status === 'rendering'
            ? `Rendering MP4 — ${progress}%`
            : outputMode === 'hook'
              ? 'Export Hook MP4 HD'
              : 'Export Brand Video'}
      </button>

      {status === 'rendering' ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-black/25">
          <div
            className="h-full rounded-full bg-[#d79a87] transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {status === 'done' ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] text-emerald-200">
          <CheckCircle2 size={15} />
          {outputMode === 'hook' ? 'Hook MP4 HD berhasil dibuat.' : 'MP4 berhasil dibuat dan diunduh.'}
          <Download size={14} className="ml-auto" />
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[10.5px] leading-relaxed text-red-200">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}
    </div>
  );
}

