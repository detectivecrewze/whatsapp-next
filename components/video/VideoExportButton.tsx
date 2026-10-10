'use client';

import React, { useState } from 'react';
import { CheckCircle, Download, Film, Loader2, TriangleAlert } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
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
  const messageCount = useEditorStore((state) => state.messages.length);

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

