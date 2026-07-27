'use client';

import React from 'react';
import { useEditorStore } from '@/store/useEditorStore';

export default function ZoomSection() {
  const { autoZoom, zoomScale, zoomSpeed, setAutoZoom, setZoomScale, setZoomSpeed } = useEditorStore();

  return (
    <div className="flex flex-col gap-3">
      {/* Auto-zoom toggle */}
      <div
        className="flex items-center justify-between p-2.5 rounded-lg"
        style={{ background: 'var(--ui-card)' }}
      >
        <div>
          <p className="text-[13px] font-medium" style={{ color: 'var(--wa-text)' }}>
            🔍 Auto-Zoom Aktif
          </p>
          <p className="text-[11px]" style={{ color: 'var(--wa-text-muted)' }}>
            Zoom-in otomatis pada setiap pesan baru
          </p>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={autoZoom} onChange={(e) => setAutoZoom(e.target.checked)} />
          <span className="toggle-track" />
          <span className="toggle-thumb" />
        </label>
      </div>

      {autoZoom && (
        <>
          {/* Zoom scale */}
          <div>
            <label className="section-label">
              Skala Zoom —{' '}
              <span style={{ color: 'var(--wa-green)' }}>{zoomScale.toFixed(2)}×</span>
            </label>
            <input
              type="range"
              className="slider"
              min={1.0}
              max={2.0}
              step={0.05}
              value={zoomScale}
              onChange={(e) => setZoomScale(Number(e.target.value))}
            />
            <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--wa-text-muted)' }}>
              <span>1.0× (Normal)</span>
              <span>2.0× (Sangat Dekat)</span>
            </div>
          </div>

          {/* Zoom speed */}
          <div>
            <label className="section-label">
              Kecepatan Zoom —{' '}
              <span style={{ color: 'var(--wa-green)' }}>{zoomSpeed}ms</span>
            </label>
            <input
              type="range"
              className="slider"
              min={200}
              max={2000}
              step={100}
              value={zoomSpeed}
              onChange={(e) => setZoomSpeed(Number(e.target.value))}
            />
            <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--wa-text-muted)' }}>
              <span>Cepat (200ms)</span>
              <span>Lambat (2s)</span>
            </div>
          </div>

          {/* Visual preview */}
          <div
            className="rounded-lg p-3 text-center border"
            style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}
          >
            <p className="text-[11px] mb-1.5" style={{ color: 'var(--wa-text-muted)' }}>Preview Zoom</p>
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl transition-transform"
              style={{
                background: 'rgba(37,211,102,0.1)',
                transform: `scale(${autoZoom ? zoomScale : 1})`,
                transition: `transform ${zoomSpeed}ms ease-in-out`,
                border: '1px solid rgba(37,211,102,0.2)',
              }}
            >
              💬
            </div>
          </div>
        </>
      )}
    </div>
  );
}
