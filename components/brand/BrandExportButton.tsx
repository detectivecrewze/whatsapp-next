'use client';

import { useState } from 'react';
import { CheckCircle2, Download, Film, Loader2, TriangleAlert } from 'lucide-react';
import {
  BRAND_VIDEO_FPS,
  BRAND_VIDEO_HEIGHT,
  BRAND_VIDEO_WIDTH,
  getBrandDurationInFrames,
} from '@/lib/brandTemplates';
import { BrandVideo } from '@/remotion/brand/BrandVideo';
import { getBrandVideoProps } from '@/store/useBrandStudioStore';

type ExportStatus = 'idle' | 'checking' | 'rendering' | 'done' | 'error';

function fileName(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return normalized || 'brand-video';
}

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
      if (!props.copy.hookTitle.trim() || !props.copy.cta.trim()) {
        throw new Error('Hook dan CTA harus diisi sebelum export.');
      }

      const { canRenderMediaOnWeb, renderMediaOnWeb } = await import('@remotion/web-renderer');
      const support = await canRenderMediaOnWeb({
        container: 'mp4',
        videoCodec: 'h264',
        audioCodec: 'aac',
        muted: false,
        width: BRAND_VIDEO_WIDTH,
        height: BRAND_VIDEO_HEIGHT,
      });

      if (!support.canRender) {
        const reason = support.issues
          .filter((issue) => issue.severity === 'error')
          .map((issue) => issue.message)
          .join(' ');
        throw new Error(
          reason || 'Browser belum mendukung export MP4. Gunakan Chrome atau Edge terbaru.',
        );
      }

      const durationInFrames = getBrandDurationInFrames(props);
      setStatus('rendering');

      const result = await renderMediaOnWeb({
        licenseKey: 'free-license',
        composition: {
          id: 'FYABrandVideo',
          component: BrandVideo,
          durationInFrames,
          fps: BRAND_VIDEO_FPS,
          width: BRAND_VIDEO_WIDTH,
          height: BRAND_VIDEO_HEIGHT,
          calculateMetadata: null,
          defaultProps: props,
        },
        inputProps: props,
        container: 'mp4',
        videoCodec: 'h264',
        audioCodec: 'aac',
        muted: false,
        videoBitrate: 12_000_000,
        hardwareAcceleration: 'prefer-hardware',
        pageResponsiveness: 'medium',
        delayRenderTimeoutInMilliseconds: 120_000,
        onProgress: ({ progress: nextProgress }) => {
          setProgress(Math.round(Math.max(0, Math.min(1, nextProgress)) * 100));
        },
      });

      const blob = await result.getBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${fileName(props.copy.productName)}-9x16.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

      setProgress(100);
      setStatus('done');
    } catch (caughtError) {
      setStatus('error');
      setError(caughtError instanceof Error ? caughtError.message : 'Export video gagal.');
    }
  }

  const busy = status === 'checking' || status === 'rendering';

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
          MP4 berhasil dibuat dan diunduh.
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

