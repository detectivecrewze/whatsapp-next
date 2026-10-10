'use client';

import React from 'react';
import { Focus, Gauge, Info, Timer, ZoomIn } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

const ZOOM_PRESETS = [
  { label: 'Natural', value: 1.08, description: 'Halus' },
  { label: 'Fokus', value: 1.16, description: 'Jelas' },
  { label: 'Dramatis', value: 1.28, description: 'Dekat' },
] as const;

export default function ZoomSection() {
  const { autoZoom, zoomScale, zoomSpeed, setAutoZoom, setZoomScale, setZoomSpeed } = useEditorStore();

  return (
    <div className="flex flex-col gap-4">
      <section
        className="rounded-2xl border p-4"
        style={{
          background: autoZoom ? 'rgba(37,211,102,0.07)' : 'var(--ui-card)',
          borderColor: autoZoom ? 'rgba(37,211,102,0.34)' : 'var(--ui-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: autoZoom ? 'rgba(37,211,102,0.15)' : '#161b22', color: autoZoom ? '#25d366' : '#8696a0' }}
          >
            <Focus size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold" style={{ color: 'var(--wa-text)' }}>
                Auto Zoom Global
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                style={{
                  background: autoZoom ? 'rgba(37,211,102,0.15)' : 'rgba(134,150,160,0.12)',
                  color: autoZoom ? '#25d366' : '#8696a0',
                }}
              >
                {autoZoom ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
              Kamera mengikuti setiap bubble baru saat animasi dan render MP4.
            </p>
          </div>
          <label className="toggle shrink-0" aria-label="Aktifkan Auto Zoom Global">
            <input type="checkbox" checked={autoZoom} onChange={(event) => setAutoZoom(event.target.checked)} />
            <span className="toggle-track" />
            <span className="toggle-thumb" />
          </label>
        </div>
      </section>

      {autoZoom ? (
        <>
          <section>
            <div className="mb-2 flex items-center gap-2">
              <ZoomIn size={15} style={{ color: '#25d366' }} />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: '#aebac1' }}>
                  Kekuatan zoom
                </p>
                <p className="mt-0.5 text-[10px]" style={{ color: '#8696a0' }}>Pilih karakter zoom global.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ZOOM_PRESETS.map((preset) => {
                const selected = Math.abs(zoomScale - preset.value) < 0.001;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setZoomScale(preset.value)}
                    className="rounded-xl border px-2 py-2.5 text-center transition-colors"
                    style={{
                      background: selected ? 'rgba(37,211,102,0.1)' : 'var(--ui-card)',
                      borderColor: selected ? '#25d366' : 'var(--ui-border)',
                    }}
                  >
                    <span className="block text-[11.5px] font-semibold" style={{ color: selected ? '#25d366' : '#e9edef' }}>
                      {preset.label}
                    </span>
                    <span className="mt-0.5 block text-[9.5px]" style={{ color: '#8696a0' }}>
                      {preset.value.toFixed(2)}× · {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border p-3.5" style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'var(--ui-border)' }}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[11.5px] font-semibold" style={{ color: '#e9edef' }}>
                <Gauge size={15} style={{ color: '#53bdeb' }} />
                Skala kustom
              </span>
              <span className="rounded-md px-2 py-1 font-mono text-[11px] font-bold" style={{ background: '#111b21', color: '#25d366' }}>
                {zoomScale.toFixed(2)}×
              </span>
            </div>
            <input
              type="range"
              className="slider"
              min={1}
              max={2}
              step={0.02}
              value={zoomScale}
              onChange={(event) => setZoomScale(Number(event.target.value))}
              aria-label="Skala Auto Zoom Global"
            />
            <div className="mt-1 flex justify-between text-[9.5px]" style={{ color: '#8696a0' }}>
              <span>1.00× Normal</span>
              <span>2.00× Sangat dekat</span>
            </div>
          </section>

          <section className="rounded-xl border p-3.5" style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'var(--ui-border)' }}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[11.5px] font-semibold" style={{ color: '#e9edef' }}>
                <Timer size={15} style={{ color: '#53bdeb' }} />
                Kecepatan gerakan
              </span>
              <span className="rounded-md px-2 py-1 font-mono text-[11px] font-bold" style={{ background: '#111b21', color: '#25d366' }}>
                {zoomSpeed} ms
              </span>
            </div>
            <input
              type="range"
              className="slider"
              min={200}
              max={2000}
              step={100}
              value={zoomSpeed}
              onChange={(event) => setZoomSpeed(Number(event.target.value))}
              aria-label="Kecepatan Auto Zoom Global"
            />
            <div className="mt-1 flex justify-between text-[9.5px]" style={{ color: '#8696a0' }}>
              <span>200 ms · Cepat</span>
              <span>2000 ms · Lembut</span>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--ui-border)', background: '#0b141a' }}>
            <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: 'rgba(134,150,160,0.12)' }}>
              <span className="text-[10.5px] font-semibold" style={{ color: '#aebac1' }}>Simulasi fokus</span>
              <span className="text-[9.5px]" style={{ color: '#667781' }}>Perkiraan gerakan kamera</span>
            </div>
            <div className="relative h-28 overflow-hidden">
              <div
                className="absolute inset-0 flex flex-col justify-center gap-2 px-7"
                style={{
                  transform: `scale(${zoomScale})`,
                  transition: `transform ${zoomSpeed}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                  transformOrigin: '70% 62%',
                }}
              >
                <span className="h-6 w-24 rounded-[7px_7px_7px_2px]" style={{ background: '#202c33' }} />
                <span className="ml-auto h-7 w-36 rounded-[7px_2px_7px_7px]" style={{ background: '#005c4b', boxShadow: '0 0 0 2px rgba(37,211,102,0.18)' }} />
              </div>
            </div>
          </section>

          <div className="flex gap-2 rounded-xl border px-3 py-2.5" style={{ background: 'rgba(83,189,235,0.05)', borderColor: 'rgba(83,189,235,0.2)' }}>
            <Info size={15} className="mt-0.5 shrink-0" style={{ color: '#53bdeb' }} />
            <p className="text-[10.5px] leading-relaxed" style={{ color: '#8696a0' }}>
              Pengaturan ini berlaku untuk semua pesan. Opsi zoom pada masing-masing pesan dapat menimpa pengaturan global.
            </p>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed px-4 py-6 text-center" style={{ borderColor: '#30363d', background: 'rgba(255,255,255,0.015)' }}>
          <ZoomIn size={23} className="mx-auto" style={{ color: '#667781' }} />
          <p className="mt-2 text-[12px] font-semibold" style={{ color: '#aebac1' }}>Kamera tetap statis</p>
          <p className="mx-auto mt-1 max-w-[250px] text-[10.5px] leading-relaxed" style={{ color: '#667781' }}>
            Aktifkan Auto Zoom Global untuk memberi fokus otomatis saat setiap pesan muncul.
          </p>
        </div>
      )}
    </div>
  );
}
