'use client';

import React, { useRef, useState } from 'react';
import { CheckCircle, Download, Film, Image as ImageIcon, Loader2, Maximize, Play, Smartphone, Sparkles, TriangleAlert, Upload, Volume2, X } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { compressImageFile } from '@/lib/utils';
import { END_TRANSITION_OPTIONS, END_TRANSITION_SFX_OPTIONS, getEndTransitionSfx } from '@/lib/endTransitions';
import type { EndTransitionSfx } from '@/types';
import { WhatsAppVideo } from '@/remotion/WhatsAppVideo';
import { getVoiceSource } from '@/remotion/audio';
import { getVideoDurationInFrames } from '@/remotion/timeline';
import {
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  type WhatsAppVideoProps,
} from '@/remotion/videoTypes';

type ExportStatus = 'idle' | 'checking' | 'rendering' | 'done' | 'error';

function collectVideoProps(): WhatsAppVideoProps {
  const state = useEditorStore.getState();

  return {
    name: state.name,
    pfp: state.pfp,
    phoneOs: state.phoneOs,
    chatType: state.chatType,
    groupSubtitle: state.groupSubtitle,
    batteryLevel: state.batteryLevel,
    customTime: state.customTime,
    useCustomTime: state.useCustomTime,
    bgType: state.bgType,
    bgColor: state.bgColor,
    bubbleColor: state.bubbleColor,
    bgImage: state.bgImage,
    messages: state.messages,
    holdMs: state.holdMs,
    replyDelay: state.replyDelay,
    useTyping: state.useTyping,
    useSoundIn: state.useSoundIn,
    useSoundOut: state.useSoundOut,
    autoZoom: state.autoZoom,
    zoomScale: state.zoomScale,
    zoomSpeed: state.zoomSpeed,
    exportLayout: state.exportLayout,
    exportLayoutBgImage: state.exportLayoutBgImage,
    endTransition: state.endTransition,
    endTransitionSfx: state.endTransitionSfx,
    enableTts: state.enableTts,
    ttsAudioMap: state.ttsAudioMap,
    ttsSpeed: state.ttsSpeed,
    headerStatus: state.headerStatus,
    headerStatusText: state.headerStatusText,
    pinnedMessage: state.pinnedMessage,
    unreadCount: state.unreadCount,
    dateBadge: state.dateBadge,
  };
}

function readAudioDurationMs(src: string) {
  return new Promise<number>((resolve) => {
    const audio = document.createElement('audio');
    let settled = false;

    const finish = (durationMs: number) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      audio.removeAttribute('src');
      audio.load();
      resolve(durationMs);
    };

    const timeout = window.setTimeout(() => finish(0), 10_000);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      finish(Number.isFinite(audio.duration) ? Math.ceil(audio.duration * 1000) : 0);
    };
    audio.onerror = () => finish(0);
    audio.src = src;
    audio.load();
  });
}

async function resolveVoiceDurations(props: WhatsAppVideoProps) {
  if (!props.enableTts) return {};

  const entries = await Promise.all(
    props.messages.map(async (message, index) => {
      const source = getVoiceSource(props, message, index);
      if (!source) return null;
      return [message.id, await readAudioDurationMs(source)] as const;
    })
  );

  return Object.fromEntries(entries.filter((entry): entry is readonly [string, number] => entry !== null));
}

function safeFileName(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'whatsapp-video';
}

export default function VideoExportButton() {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const transitionAudioRef = useRef<HTMLAudioElement | null>(null);
  const messageCount = useEditorStore((state) => state.messages.length);
  const ttsSpeed = useEditorStore((state) => state.ttsSpeed);
  const setTtsSpeed = useEditorStore((state) => state.setTtsSpeed);
  const exportLayout = useEditorStore((state) => state.exportLayout);
  const setExportLayout = useEditorStore((state) => state.setExportLayout);
  const exportLayoutBgImage = useEditorStore((state) => state.exportLayoutBgImage);
  const setExportLayoutBgImage = useEditorStore((state) => state.setExportLayoutBgImage);
  const endTransition = useEditorStore((state) => state.endTransition);
  const setEndTransition = useEditorStore((state) => state.setEndTransition);
  const endTransitionSfx = useEditorStore((state) => state.endTransitionSfx);
  const setEndTransitionSfx = useEditorStore((state) => state.setEndTransitionSfx);

  function previewTransitionSfx() {
    const option = getEndTransitionSfx(endTransitionSfx);
    if (!option?.file) return;

    transitionAudioRef.current?.pause();
    const audio = new Audio(`/${option.file}`);
    audio.volume = 0.22;
    transitionAudioRef.current = audio;
    void audio.play();
  }

  async function handleBackgroundUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setError(null);
      setExportLayoutBgImage(await compressImageFile(file, 1600, 0.86));
    } catch {
      setError('Foto background gagal diproses. Coba gunakan JPG, PNG, atau WebP lain.');
    }
  }

  async function handleExport() {
    setStatus('checking');
    setProgress(0);
    setError(null);

    try {
      if (messageCount === 0) {
        throw new Error('Tambahkan minimal satu pesan sebelum export video.');
      }

      const { canRenderMediaOnWeb, renderMediaOnWeb } = await import('@remotion/web-renderer');
      const support = await canRenderMediaOnWeb({
        container: 'mp4',
        videoCodec: 'h264',
        audioCodec: 'aac',
        muted: false,
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
      });

      if (!support.canRender) {
        const reason = support.issues
          .filter((issue) => issue.severity === 'error')
          .map((issue) => issue.message)
          .join(' ');
        throw new Error(
          reason || 'Browser ini belum mendukung export MP4. Gunakan Chrome atau Microsoft Edge terbaru.'
        );
      }

      const baseProps = collectVideoProps();
      const inputProps: WhatsAppVideoProps = {
        ...baseProps,
        voiceDurationsMs: await resolveVoiceDurations(baseProps),
      };
      const durationInFrames = getVideoDurationInFrames(inputProps);

      setStatus('rendering');

      const result = await renderMediaOnWeb({
        licenseKey: 'free-license',
        composition: {
          id: 'WhatsAppVerticalHD',
          component: WhatsAppVideo,
          durationInFrames,
          fps: VIDEO_FPS,
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
          calculateMetadata: null,
          defaultProps: inputProps,
        },
        inputProps,
        container: 'mp4',
        videoCodec: 'h264',
        audioCodec: 'aac',
        muted: false,
        videoBitrate: 12_000_000,
        hardwareAcceleration: 'prefer-hardware',
        pageResponsiveness: 'medium',
        onProgress: ({ progress: nextProgress }) => {
          setProgress(Math.max(0, Math.min(100, Math.round(nextProgress * 100))));
        },
      });

      const blob = await result.getBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${safeFileName(inputProps.name)}-9x16-hd.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

      setProgress(100);
      setStatus('done');
    } catch (exportError) {
      console.error('[Video Export]', exportError);
      setError(exportError instanceof Error ? exportError.message : 'Export video gagal.');
      setStatus('error');
    }
  }

  const busy = status === 'checking' || status === 'rendering';

  return (
    <div
      className="rounded-xl border p-2.5"
      style={{ background: 'rgba(83,189,235,0.06)', borderColor: 'rgba(83,189,235,0.25)' }}
    >
      <div
        className="mb-2.5 rounded-lg border p-2.5"
        style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}
      >
        <div className="mb-2">
          <p className="text-[10.5px] font-semibold" style={{ color: 'var(--wa-text)' }}>Layout video</p>
          <p className="mt-0.5 text-[8.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
            Pilih tampilan final yang dipakai saat render MP4.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setExportLayout('normal')}
            className="rounded-lg border p-2 text-left transition-colors disabled:opacity-50"
            style={{
              borderColor: exportLayout === 'normal' ? 'var(--wa-green)' : 'var(--ui-border)',
              background: exportLayout === 'normal' ? 'rgba(37,211,102,0.10)' : 'var(--ui-bg)',
            }}
          >
            <Maximize size={16} style={{ color: exportLayout === 'normal' ? 'var(--wa-green)' : 'var(--wa-text-muted)' }} />
            <span className="mt-1.5 block text-[10.5px] font-semibold" style={{ color: 'var(--wa-text)' }}>Normal</span>
            <span className="mt-0.5 block text-[8px] leading-snug" style={{ color: 'var(--wa-text-muted)' }}>Chat memenuhi video seperti sebelumnya.</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setExportLayout('phone')}
            className="rounded-lg border p-2 text-left transition-colors disabled:opacity-50"
            style={{
              borderColor: exportLayout === 'phone' ? 'var(--wa-green)' : 'var(--ui-border)',
              background: exportLayout === 'phone' ? 'rgba(37,211,102,0.10)' : 'var(--ui-bg)',
            }}
          >
            <Smartphone size={16} style={{ color: exportLayout === 'phone' ? 'var(--wa-green)' : 'var(--wa-text-muted)' }} />
            <span className="mt-1.5 block text-[10.5px] font-semibold" style={{ color: 'var(--wa-text)' }}>Layout HP</span>
            <span className="mt-0.5 block text-[8px] leading-snug" style={{ color: 'var(--wa-text-muted)' }}>HP utuh di tengah dan aman dari crop.</span>
          </button>
        </div>

        {exportLayout === 'phone' ? (
          <div className="mt-2.5 rounded-lg border p-2" style={{ borderColor: 'var(--ui-border)', background: 'var(--ui-bg)' }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className="h-10 w-8 shrink-0 rounded-md border bg-cover bg-center"
                  style={{
                    borderColor: 'var(--ui-border)',
                    backgroundImage: exportLayoutBgImage
                      ? `linear-gradient(rgba(4,16,13,.2), rgba(4,16,13,.48)), url(${JSON.stringify(exportLayoutBgImage)})`
                      : 'radial-gradient(circle at 50% 20%, rgba(37,211,102,.5), transparent 42%), linear-gradient(180deg,#08251f,#04100d)',
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-[9.5px] font-semibold" style={{ color: 'var(--wa-text)' }}>
                    {exportLayoutBgImage ? 'Foto background sendiri' : 'Tema hijau WhatsApp'}
                  </p>
                  <p className="text-[8px]" style={{ color: 'var(--wa-text-muted)' }}>Background di luar layar HP</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <input
                  ref={backgroundInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleBackgroundUpload}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => backgroundInputRef.current?.click()}
                  className="flex h-8 items-center gap-1 rounded-md border px-2 text-[8.5px] font-semibold disabled:opacity-50"
                  style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-green)' }}
                >
                  {exportLayoutBgImage ? <ImageIcon size={12} /> : <Upload size={12} />}
                  {exportLayoutBgImage ? 'Ganti' : 'Upload'}
                </button>
                {exportLayoutBgImage ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setExportLayoutBgImage(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-md border disabled:opacity-50"
                    style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)' }}
                    aria-label="Hapus foto background layout"
                  >
                    <X size={13} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="mb-2.5 rounded-lg border p-2.5"
        style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}
      >
        <div className="mb-2 flex items-start gap-2">
          <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--wa-green)' }} />
          <div>
            <p className="text-[10.5px] font-semibold" style={{ color: 'var(--wa-text)' }}>Transisi akhir</p>
            <p className="mt-0.5 text-[8.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
              Menutup chat dengan rapi dan siap disambungkan ke video produk nanti.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {END_TRANSITION_OPTIONS.map((option) => {
            const selected = endTransition === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={busy}
                onClick={() => setEndTransition(option.id)}
                className="rounded-lg border p-2 text-left disabled:opacity-50"
                style={{
                  borderColor: selected ? 'var(--wa-green)' : 'var(--ui-border)',
                  background: selected ? 'rgba(37,211,102,0.10)' : 'var(--ui-bg)',
                }}
              >
                <span className="block text-[9.5px] font-semibold" style={{ color: selected ? 'var(--wa-green)' : 'var(--wa-text)' }}>
                  {option.label}
                </span>
                <span className="mt-0.5 block text-[7.5px] leading-snug" style={{ color: 'var(--wa-text-muted)' }}>
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        {endTransition !== 'none' ? (
          <div className="mt-2.5 rounded-lg border p-2" style={{ borderColor: 'var(--ui-border)', background: 'var(--ui-bg)' }}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div>
                <p className="text-[9.5px] font-semibold" style={{ color: 'var(--wa-text)' }}>SFX transisi</p>
                <p className="text-[7.5px]" style={{ color: 'var(--wa-text-muted)' }}>Volume aman 22% · diputar saat transisi mulai</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <select
                className="select min-w-0 flex-1"
                value={endTransitionSfx}
                disabled={busy}
                onChange={(event) => setEndTransitionSfx(event.target.value as EndTransitionSfx)}
                aria-label="Pilih SFX transisi akhir"
              >
                {END_TRANSITION_SFX_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || endTransitionSfx === 'none'}
                onClick={previewTransitionSfx}
                className="flex w-10 shrink-0 items-center justify-center rounded-lg border disabled:opacity-40"
                style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-green)' }}
                title="Dengarkan SFX transisi"
                aria-label="Dengarkan SFX transisi"
              >
                <Play size={14} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="mb-2.5 rounded-lg border p-2.5"
        style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Volume2 size={14} className="shrink-0" style={{ color: 'var(--wa-green)' }} />
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold" style={{ color: 'var(--wa-text)' }}>Kecepatan voice</p>
              <p className="text-[8.5px]" style={{ color: 'var(--wa-text-muted)' }}>Preview, play bubble, dan hasil MP4</p>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-bold" style={{ color: 'var(--wa-green)' }}>{ttsSpeed.toFixed(2)}×</span>
        </div>
        <input
          type="range"
          className="slider w-full"
          min={0.8}
          max={2}
          step={0.05}
          value={ttsSpeed}
          disabled={busy}
          onChange={(event) => setTtsSpeed(Number(event.target.value))}
          aria-label="Kecepatan voice untuk preview dan video MP4"
        />
        <div className="mt-1 flex justify-between text-[8.5px]" style={{ color: 'var(--wa-text-muted)' }}>
          <span>0.80×</span><span>Normal 1.00×</span><span>2.00×</span>
        </div>
        <p className="mt-1.5 text-[8.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
          Bisa diubah kapan saja tanpa membuat ulang audio.
        </p>
      </div>

      <button
        onClick={handleExport}
        disabled={busy || messageCount === 0}
        className="btn w-full py-2.5 text-[13px] font-bold gap-2 disabled:opacity-50"
        style={{ background: '#53bdeb', color: '#06131a' }}
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : status === 'done' ? (
          <CheckCircle size={16} />
        ) : (
          <Film size={16} />
        )}
        {status === 'checking'
          ? 'Memeriksa browser…'
          : status === 'rendering'
            ? `Rendering MP4 — ${progress}%`
            : status === 'done'
              ? 'Export Lagi MP4 HD'
              : 'Export MP4 HD 9:16'}
      </button>

      {status === 'rendering' ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{ width: `${progress}%`, background: '#53bdeb' }}
          />
        </div>
      ) : null}

      <div className="mt-1.5 flex items-center justify-center gap-1 text-[10.5px]" style={{ color: 'var(--wa-text-muted)' }}>
        <Download size={11} />
        1080×1920 · MP4 H.264 + AAC
      </div>

      {error ? (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg p-2 text-[10.5px] text-red-300" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <TriangleAlert size={12} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}

