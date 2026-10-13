'use client';

import React from 'react';
import { useEditorStore } from '@/store/useEditorStore';

export default function VideoOptionsSection() {
  const {
    holdMs, imageHoldMs, replyDelay, useTyping, useSoundIn, useSoundOut,
    setHoldMs, setImageHoldMs, setReplyDelay, setUseTyping, setUseSoundIn, setUseSoundOut,
  } = useEditorStore();

  return (
    <div className="flex flex-col gap-3">
      {/* Hold duration */}
      <div>
        <label className="section-label">
          Durasi Tahan Pesan —{' '}
          <span style={{ color: 'var(--wa-green)' }}>{holdMs / 1000}s</span>
        </label>
        <input
          type="range"
          className="slider"
          min={500}
          max={6000}
          step={100}
          value={holdMs}
          onChange={(e) => setHoldMs(Number(e.target.value))}
        />
        <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--wa-text-muted)' }}>
          <span>0.5s</span>
          <span>6s</span>
        </div>
      </div>

      {/* Silent image hold duration */}
      <div
        className="rounded-lg border p-2.5"
        style={{ borderColor: 'rgba(56,189,248,0.24)', background: 'rgba(56,189,248,0.055)' }}
      >
        <label className="section-label">
          🖼️ Durasi Tahan Gambar —{' '}
          <span style={{ color: '#38bdf8' }}>{imageHoldMs / 1000}s</span>
        </label>
        <input
          type="range"
          className="slider"
          min={1000}
          max={12000}
          step={500}
          value={imageHoldMs}
          onChange={(e) => setImageHoldMs(Number(e.target.value))}
        />
        <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--wa-text-muted)' }}>
          <span>1s</span>
          <span>12s</span>
        </div>
        <p className="mt-1.5 text-[10.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
          Untuk Gambar &amp; View Once tanpa voice. Jika ada voice, durasinya tetap mengikuti voice + tahan pesan biasa.
        </p>
      </div>

      {/* Reply delay */}
      <div>
        <label className="section-label">
          Jeda Balas —{' '}
          <span style={{ color: 'var(--wa-green)' }}>{replyDelay / 1000}s</span>
        </label>
        <input
          type="range"
          className="slider"
          min={300}
          max={5000}
          step={100}
          value={replyDelay}
          onChange={(e) => setReplyDelay(Number(e.target.value))}
        />
        <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--wa-text-muted)' }}>
          <span>0.3s</span>
          <span>5s</span>
        </div>
      </div>

      {/* Toggle row: Typing indicator */}
      <div
        className="flex items-center justify-between p-2.5 rounded-lg"
        style={{ background: 'var(--ui-card)' }}
      >
        <div>
          <p className="text-[13px] font-medium" style={{ color: 'var(--wa-text)' }}>
            ⌨️ Animasi Mengetik
          </p>
          <p className="text-[11px]" style={{ color: 'var(--wa-text-muted)' }}>
            Tampilkan 3 titik sebelum pesan masuk
          </p>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={useTyping} onChange={(e) => setUseTyping(e.target.checked)} />
          <span className="toggle-track" />
          <span className="toggle-thumb" />
        </label>
      </div>

      {/* Toggle row: Suara pesan masuk */}
      <div
        className="flex items-center justify-between p-2.5 rounded-lg"
        style={{ background: 'var(--ui-card)' }}
      >
        <div>
          <p className="text-[13px] font-medium" style={{ color: 'var(--wa-text)' }}>
            🔔 Suara Pesan Masuk
          </p>
          <p className="text-[11px]" style={{ color: 'var(--wa-text-muted)' }}>
            Bunyi notifikasi WA saat pesan masuk
          </p>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={useSoundIn} onChange={(e) => setUseSoundIn(e.target.checked)} />
          <span className="toggle-track" />
          <span className="toggle-thumb" />
        </label>
      </div>

      {/* Toggle row: Suara pesan keluar */}
      <div
        className="flex items-center justify-between p-2.5 rounded-lg"
        style={{ background: 'var(--ui-card)' }}
      >
        <div>
          <p className="text-[13px] font-medium" style={{ color: 'var(--wa-text)' }}>
            📤 Suara Pesan Keluar
          </p>
          <p className="text-[11px]" style={{ color: 'var(--wa-text-muted)' }}>
            Bunyi send saat pesan keluar dikirim
          </p>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={useSoundOut} onChange={(e) => setUseSoundOut(e.target.checked)} />
          <span className="toggle-track" />
          <span className="toggle-thumb" />
        </label>
      </div>
    </div>
  );
}
