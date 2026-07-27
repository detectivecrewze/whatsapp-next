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

type Status = 'loading' | 'ready' | 'countdown' | 'playing' | 'done' | 'error';

const LOCAL_PREVIEW_KEY = 'wa_local_preview';

export default function PreviewClient({ presetId }: Props) {
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const { applyPayload } = useEditorStore();
  const { play, stop, isPlaying, isPaused, pause } = usePlayerStore();

  // ── Load preset from cloud / sessionStorage ────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        let presetData = null;

        // ── Local preview (no cloud) ──────────────────────────────────────────
        if (presetId === 'local') {
          const raw = sessionStorage.getItem(LOCAL_PREVIEW_KEY);
          if (!raw) throw new Error('Data preview lokal tidak ditemukan. Silakan coba lagi dari editor.');
          presetData = JSON.parse(raw);
        } else {
          // ── Cloud preset ────────────────────────────────────────────────────
          const res = await fetch(`/api/presets?id=${encodeURIComponent(presetId)}`, {
            cache: 'no-store',
          });

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
        }

        if (!presetData) {
          throw new Error('Preset tidak ditemukan atau telah dihapus.');
        }

        applyPayload(presetData);

        // Show Start button overlay so user gesture unlocks iOS Audio
        setStatus('ready');
      } catch (e: any) {
        setErrorMsg(e.message || 'Gagal memuat preview');
        setStatus('error');
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);


  // ── Unlock iOS Safari Audio on User Gesture ────────────────────────────────
  function unlockAudio() {
    try {
      const a = new Audio('/sounds/notification.mp3');
      a.volume = 0.01;
      a.play().then(() => {
        a.pause();
      }).catch(() => {});
    } catch {}
  }

  // ── Start playback via user gesture ───────────────────────────────────────
  function handleStart() {
    unlockAudio();
    startCountdown();
  }

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
    unlockAudio();
    stop();
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

      {/* ── Phone Canvas Preview ── */}
      {(status === 'ready' || status === 'countdown' || status === 'playing' || status === 'done') && (
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
              height: 'calc(100vh - 80px)',
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

          {/* Start Overlay Button (Required on iOS Safari to unlock HTML5 Audio Context via User Gesture) */}
          {status === 'ready' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                padding: 24,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'rgba(37,211,102,0.15)',
                  border: '2px solid #25d366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  boxShadow: '0 0 40px rgba(37,211,102,0.3)',
                }}
              >
                <Play size={32} fill="#25d366" color="#25d366" style={{ marginLeft: 4 }} />
              </div>
              <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 6px 0' }}>
                Preview Animasi Percakapan
              </p>
              <p style={{ color: '#8696a0', fontSize: 13, margin: '0 0 24px 0', maxWidth: 300 }}>
                Tekan tombol di bawah untuk mengaktifkan audio & memulai animasi percakapan
              </p>
              <button
                onClick={handleStart}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 36px',
                  borderRadius: 50,
                  background: '#25d366',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: 15,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(37,211,102,0.45)',
                  transition: 'transform 0.15s, background 0.15s',
                }}
              >
                <Play size={18} fill="#000" />
                Mulai Putar Animasi
              </button>
            </div>
          )}

          {/* Bottom HUD - Replay Button when done */}
          {status === 'done' && (
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 40,
              }}
            >
              <button
                onClick={handleReplay}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 32px', borderRadius: 50,
                  background: '#25d366', color: '#000',
                  fontWeight: 800, fontSize: 15,
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 6px 28px rgba(37,211,102,0.45)',
                  transition: 'transform 0.2s',
                }}
              >
                <RotateCcw size={16} /> Putar Ulang
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
