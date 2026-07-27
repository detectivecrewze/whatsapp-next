'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw, Play } from 'lucide-react';

interface Props {
  presetId: string;
}

export default function PreviewClient({ presetId }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'playing' | 'done' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // In Phase 7, this will fetch the preset from cloud using presetId
    // For now, just show a ready state after 1s
    const timer = setTimeout(() => setStatus('ready'), 1000);
    return () => clearTimeout(timer);
  }, [presetId]);

  function handlePlay() {
    setStatus('playing');
    setCountdown(3);
    let c = 3;
    const interval = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(interval);
        setStatus('done');
      }
    }, 1000);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        gap: 24,
        padding: 24,
        textAlign: 'center',
      }}
    >
      {status === 'loading' && (
        <>
          <div
            style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid #25d366',
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ color: '#8696a0', fontSize: 14 }}>Memuat preview…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {status === 'ready' && (
        <>
          <div
            style={{
              fontSize: 13,
              color: '#8696a0',
              background: 'rgba(255,255,255,0.05)',
              padding: '6px 14px',
              borderRadius: 20,
            }}
          >
            ID: {presetId}
          </div>
          <div style={{ fontSize: 40 }}>📱</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Preview Siap!</h1>
          <p style={{ color: '#8696a0', fontSize: 14, margin: 0 }}>
            Player animasi WhatsApp akan muncul di sini (Fase 7)
          </p>
          <button
            onClick={handlePlay}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 50,
              background: '#25d366', color: '#000',
              fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
            }}
          >
            <Play size={16} /> Mulai Animasi
          </button>
        </>
      )}

      {status === 'playing' && (
        <>
          <div
            style={{
              fontSize: 80, fontWeight: 900,
              color: '#25d366',
              animation: 'pulse 0.5s ease',
            }}
          >
            {countdown > 0 ? countdown : '▶'}
          </div>
          <p style={{ color: '#8696a0', fontSize: 14 }}>Bersiap memutar animasi…</p>
          <style>{`@keyframes pulse { from { transform: scale(1.3); opacity: 0.5; } to { transform: scale(1); opacity: 1; } }`}</style>
        </>
      )}

      {status === 'done' && (
        <>
          <div style={{ fontSize: 48 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Selesai!</h2>
          <p style={{ color: '#8696a0', fontSize: 14, margin: 0 }}>
            Player lengkap akan diimplementasi di Fase 7
          </p>
          <button
            onClick={() => setStatus('ready')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 50,
              background: 'rgba(37,211,102,0.15)', color: '#25d366',
              border: '1px solid rgba(37,211,102,0.3)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} /> Putar Ulang
          </button>
        </>
      )}
    </div>
  );
}
