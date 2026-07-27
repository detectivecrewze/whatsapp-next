'use client';

import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Square } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useEditorStore } from '@/store/useEditorStore';

export default function StudioPlayerControl() {
  const { isPlaying, isPaused, visibleCount, isTyping, playbackSpeed, play, pause, stop, setSpeed } =
    usePlayerStore();
  const messages = useEditorStore((s) => s.messages);

  const totalMessages = messages.length;
  const currentProgress =
    visibleCount === -1 ? totalMessages : visibleCount + (isTyping ? 0.5 : 0);

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-full border shadow-2xl backdrop-blur-md transition-all"
      style={{
        background: 'rgba(22, 27, 34, 0.92)',
        borderColor: isPlaying ? 'var(--wa-green)' : 'var(--ui-border)',
        boxShadow: isPlaying
          ? '0 0 24px rgba(37,211,102,0.2), 0 12px 32px rgba(0,0,0,0.6)'
          : '0 12px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Play / Pause button */}
      {!isPlaying ? (
        <button
          onClick={play}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-bold transition-all hover:scale-105"
          style={{ background: 'var(--wa-green)', color: '#000' }}
          title="Putar animasi di studio canvas"
        >
          <Play size={14} fill="black" />
          <span>Putar Animasi</span>
        </button>
      ) : (
        <button
          onClick={stop}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-bold transition-all hover:scale-105"
          style={{ background: 'var(--ui-danger)', color: '#fff' }}
          title="Hentikan animasi dan kembali ke mode edit"
        >
          <Square size={14} fill="white" />
          <span>Stop</span>
        </button>
      )}

      {/* Reset button */}
      <button
        onClick={play}
        className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        title="Putar ulang dari awal"
      >
        <RotateCcw size={15} />
      </button>

      {/* Divider */}
      <div className="w-[1px] h-4 bg-gray-700" />

      {/* Progress Counter */}
      <div className="flex items-center gap-1.5 text-[11.5px] font-mono" style={{ color: 'var(--wa-text-muted)' }}>
        <span style={{ color: isPlaying ? 'var(--wa-green)' : 'var(--wa-text)' }}>
          {isTyping ? '⌨️ Typing...' : `${visibleCount === -1 ? totalMessages : visibleCount}/${totalMessages}`}
        </span>
        <span>pesan</span>
      </div>

      {/* Speed selector */}
      <div className="flex items-center gap-1">
        {[1, 1.25, 1.5, 2].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono transition-all"
            style={{
              background: playbackSpeed === s ? 'rgba(37,211,102,0.2)' : 'transparent',
              color: playbackSpeed === s ? 'var(--wa-green)' : 'var(--wa-text-muted)',
              border: playbackSpeed === s ? '1px solid var(--wa-green)' : '1px solid transparent',
            }}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
