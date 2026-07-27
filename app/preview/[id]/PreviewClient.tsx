'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import dynamic from 'next/dynamic';

const WhatsAppCanvas = dynamic(
  () => import('@/components/canvas/WhatsAppCanvas'),
  { ssr: false }
);

interface Props {
  presetId: string;
}

type Status = 'loading' | 'countdown' | 'playing' | 'done' | 'error';

export default function PreviewClient({ presetId }: Props) {
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const { applyPayload } = useEditorStore();
  const { play, stop, isPlaying, isPaused, pause } = usePlayerStore();

  // ── Load preset from cloud / API ──────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/presets?id=${encodeURIComponent(presetId)}`, {
          cache: 'no-store',
        });
        
        let presetData = null;

        if (res.ok) {
          const json = await res.json();
          presetData = json?.preset?.data ?? json?.templates?.[presetId]?.data;
        } else {
          // Fallback: fetch all templates
          const resAll = await fetch('/api/presets', { cache: 'no-store' });
          if (resAll.ok) {
            const dataAll = await resAll.json();
            presetData = dataAll?.templates?.[presetId]?.data;
          }
        }

        if (!presetData) {
          throw new Error('Preset tidak ditemukan atau telah dihapus.');
        }

        applyPayload(presetData);

        // Short pause then start countdown
        setTimeout(() => startCountdown(), 400);
      } catch (e: any) {
        setErrorMsg(e.message || 'Gagal memuat preview');
        setStatus('error');
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);

  // ── Countdown → play ──────────────────────────────────────────────────────
  function startCountdown() {
    setStatus('countdown');
    setCountdown(3);
    let c = 3;
    countdownRef.current = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(countdownRef.current!);
        setStatus('playing');
        play();
      } else {
        setCountdown(c);
      }
    }, 1000);
  }

  // ── Watch playback end ────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'playing' && !isPlaying) {
      setStatus('done');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // ── Replay ────────────────────────────────────────────────────────────────
  function handleReplay() {
    stop();
    setCountdown(3);
    startCountdown();
  }

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Loading ── */}
      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid rgba(37,211,102,0.3)',
              borderTopColor: '#25d366',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ color: '#8696a0', fontSize: 14, margin: 0 }}>Memuat animasi…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Error ── */}
      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Preset Tidak Ditemukan</p>
          <p style={{ color: '#8696a0', fontSize: 13, margin: 0, maxWidth: 320 }}>{errorMsg}</p>
          <p style={{ color: '#555', fontSize: 12, margin: 0, fontFamily: 'monospace' }}>ID: {presetId}</p>
        </div>
      )}

      {/* ── Countdown ── */}
      {status === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div
            key={countdown}
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: '#25d366',
              lineHeight: 1,
              animation: 'countPop 0.6s cubic-bezier(.175,.885,.32,1.275)',
              textShadow: '0 0 60px rgba(37,211,102,0.5)',
            }}
          >
            {countdown}
          </div>
          <style>{`
            @keyframes countPop {
              from { transform: scale(1.8); opacity: 0; }
              to   { transform: scale(1);   opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* ── Phone Canvas ── */}
      {(status === 'countdown' || status === 'playing' || status === 'done') && (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: 'calc(100vh - 72px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <WhatsAppCanvas />
          </div>

          {/* Bottom HUD */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
              zIndex: 40,
            }}
          >
            {status === 'playing' && (
              <button
                onClick={() => (isPaused ? play() : pause())}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 50,
                  background: 'rgba(37,211,102,0.15)',
                  border: '1px solid rgba(37,211,102,0.4)',
                  color: '#25d366', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', backdropFilter: 'blur(8px)',
                }}
              >
                {isPaused
                  ? <><Play size={14} /> Lanjutkan</>
                  : <><Pause size={14} /> Pause</>
                }
              </button>
            )}

            {status === 'done' && (
              <>
                <button
                  onClick={handleReplay}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 28px', borderRadius: 50,
                    background: '#25d366', color: '#000',
                    fontWeight: 700, fontSize: 14,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 24px rgba(37,211,102,0.35)',
                  }}
                >
                  <RotateCcw size={15} /> Putar Ulang
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
