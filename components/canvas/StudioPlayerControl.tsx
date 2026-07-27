'use client';

import React from 'react';
import { Play, RotateCcw, Square } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useEditorStore } from '@/store/useEditorStore';

export default function StudioPlayerControl() {
  const { isPlaying, visibleCount, isTyping, play, stop } = usePlayerStore();
  const messages = useEditorStore((s) => s.messages);

  const totalMessages = messages.length;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 rounded-full border shadow-2xl backdrop-blur-md transition-all"
      style={{
        background: 'rgba(22, 27, 34, 0.94)',
        borderColor: isPlaying ? 'var(--wa-green)' : 'var(--ui-border)',
        boxShadow: isPlaying
          ? '0 0 24px rgba(37,211,102,0.25), 0 12px 32px rgba(0,0,0,0.6)'
          : '0 12px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Play / Stop button */}
      {!isPlaying ? (
        <button
          onClick={play}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all hover:scale-105"
          style={{ background: 'var(--wa-green)', color: '#000' }}
          title="Putar animasi di studio canvas"
        >
          <Play size={14} fill="black" />
          <span>Putar Animasi</span>
        </button>
      ) : (
        <button
          onClick={stop}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all hover:scale-105"
          style={{ background: 'var(--ui-danger)', color: '#fff' }}
          title="Hentikan animasi dan kembali ke mode edit"
        >
          <Square size={14} fill="white" />
          <span>Stop</span>
        </button>
      )}

      {/* Replay button */}
      <button
        onClick={play}
        className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        title="Putar ulang dari awal (Replay)"
      >
        <RotateCcw size={16} />
      </button>

      {/* Divider */}
      <div className="w-[1px] h-4 bg-gray-700" />

      {/* Simple step counter */}
      <div className="flex items-center gap-1 text-[12px] font-mono px-1" style={{ color: 'var(--wa-text-muted)' }}>
        <span style={{ color: isPlaying ? 'var(--wa-green)' : 'var(--wa-text)' }}>
          {isTyping ? '⌨️ Typing...' : `${visibleCount === -1 ? totalMessages : visibleCount}/${totalMessages}`}
        </span>
        <span>pesan</span>
      </div>
    </div>
  );
}
