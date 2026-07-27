'use client';

import React, { useState } from 'react';
import { Loader2, Volume2, Play, CheckCircle, AlertCircle, Mic } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { ELEVENLABS_VOICES, ELEVENLABS_MODELS } from '@/types';

export default function TtsSection() {
  const {
    enableTts, ttsProvider, elevenKey, elevenModel,
    ttsVoiceIn, ttsVoiceOut, ttsStability, ttsStyle, ttsSpeed,
    messages, ttsAudioMap,
    setEnableTts, setTtsProvider, setElevenKey, setElevenModel,
    setTtsVoiceIn, setTtsVoiceOut, setTtsStability, setTtsStyle, setTtsSpeed,
    setAudioMapEntry, clearAudioMap,
  } = useEditorStore();

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const textMessages = messages.filter((m) => m.type === 'text' && m.text?.trim());

  async function generateAll() {
    if (!textMessages.length) return;
    setGenerating(true);
    setError(null);
    setDone(false);
    clearAudioMap();

    try {
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.type !== 'text' || !msg.text?.trim()) continue;

        const voiceId = msg.direction === 'incoming' ? ttsVoiceIn : ttsVoiceOut;
        setProgress(`Generating TTS pesan ${i + 1}/${messages.length}…`);

        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: msg.text,
            provider: ttsProvider,
            voiceId,
            apiKey: elevenKey,
            model: elevenModel,
            stability: ttsStability,
            style: ttsStyle,
            speed: ttsSpeed,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setAudioMapEntry(i, url);

        // Small pause between requests to avoid rate limiting
        await new Promise((r) => setTimeout(r, 200));
      }

      setProgress(null);
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'TTS generation gagal');
      setProgress(null);
    } finally {
      setGenerating(false);
    }
  }

  function previewVoice(voiceId: string, direction: 'incoming' | 'outgoing') {
    const sampleText = direction === 'incoming'
      ? 'Halo, ini adalah suara pesan masuk.'
      : 'Oke, ini adalah suara pesan keluar.';
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: sampleText,
        provider: ttsProvider,
        voiceId,
        apiKey: elevenKey,
        model: elevenModel,
        stability: ttsStability,
        style: ttsStyle,
        speed: ttsSpeed,
      }),
    })
      .then((r) => r.blob())
      .then((blob) => {
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
      })
      .catch(console.error);
  }

  const audioCount = Object.keys(ttsAudioMap).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Enable TTS toggle */}
      <div
        className="flex items-center justify-between p-2.5 rounded-lg"
        style={{ background: 'var(--ui-card)' }}
      >
        <div>
          <p className="text-[13px] font-medium" style={{ color: 'var(--wa-text)' }}>
            🎙️ Voice Over AI (TTS)
          </p>
          <p className="text-[11px]" style={{ color: 'var(--wa-text-muted)' }}>
            Generate suara per-pesan saat animasi diputar
          </p>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={enableTts} onChange={(e) => setEnableTts(e.target.checked)} />
          <span className="toggle-track" />
          <span className="toggle-thumb" />
        </label>
      </div>

      {enableTts && (
        <>
          {/* Provider selector */}
          <div>
            <label className="section-label">Provider TTS</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: 'elevenlabs', label: '⭐ ElevenLabs', sub: 'Premium, Realistis' },
                { value: 'free_neural', label: '🆓 Google TTS', sub: 'Gratis, Cepat' },
              ].map(({ value, label, sub }) => (
                <button
                  key={value}
                  onClick={() => setTtsProvider(value as 'elevenlabs' | 'free_neural')}
                  className="py-2 px-2 rounded-lg text-left border transition-all"
                  style={{
                    background: ttsProvider === value ? 'rgba(37,211,102,0.12)' : 'var(--ui-card)',
                    borderColor: ttsProvider === value ? 'var(--wa-green)' : 'var(--ui-border)',
                  }}
                >
                  <p className="text-[12px] font-semibold" style={{ color: ttsProvider === value ? 'var(--wa-green)' : 'var(--wa-text)' }}>
                    {label}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--wa-text-muted)' }}>{sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ElevenLabs settings */}
          {ttsProvider === 'elevenlabs' && (
            <>
              <div>
                <label className="section-label">API Key ElevenLabs</label>
                <input
                  type="password"
                  className="input font-mono text-[11px]"
                  value={elevenKey}
                  onChange={(e) => setElevenKey(e.target.value)}
                  placeholder="sk_xxxx..."
                />
              </div>
              <div>
                <label className="section-label">Model</label>
                <select
                  className="select"
                  value={elevenModel}
                  onChange={(e) => setElevenModel(e.target.value)}
                >
                  {ELEVENLABS_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Voice selectors */}
          <div className="grid grid-cols-1 gap-2">
            {/* Incoming voice */}
            <div>
              <label className="section-label">🟦 Suara Pesan Masuk (Lawan Bicara)</label>
              <div className="flex gap-1.5">
                <select
                  className="select flex-1"
                  value={ttsVoiceIn}
                  onChange={(e) => setTtsVoiceIn(e.target.value)}
                  disabled={ttsProvider === 'free_neural'}
                >
                  {ttsProvider === 'elevenlabs'
                    ? ELEVENLABS_VOICES.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))
                    : <option value="id">🇮🇩 Bahasa Indonesia</option>
                  }
                </select>
                {ttsProvider === 'elevenlabs' && (
                  <button
                    onClick={() => previewVoice(ttsVoiceIn, 'incoming')}
                    className="px-2 rounded-lg border transition-all hover:opacity-80"
                    style={{ borderColor: 'var(--ui-border)', background: 'var(--ui-card)' }}
                    title="Preview suara masuk"
                  >
                    <Play size={13} style={{ color: 'var(--wa-green)' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Outgoing voice */}
            <div>
              <label className="section-label">🟩 Suara Pesan Keluar (Kamu)</label>
              <div className="flex gap-1.5">
                <select
                  className="select flex-1"
                  value={ttsVoiceOut}
                  onChange={(e) => setTtsVoiceOut(e.target.value)}
                  disabled={ttsProvider === 'free_neural'}
                >
                  {ttsProvider === 'elevenlabs'
                    ? ELEVENLABS_VOICES.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))
                    : <option value="id">🇮🇩 Bahasa Indonesia</option>
                  }
                </select>
                {ttsProvider === 'elevenlabs' && (
                  <button
                    onClick={() => previewVoice(ttsVoiceOut, 'outgoing')}
                    className="px-2 rounded-lg border transition-all hover:opacity-80"
                    style={{ borderColor: 'var(--ui-border)', background: 'var(--ui-card)' }}
                    title="Preview suara keluar"
                  >
                    <Play size={13} style={{ color: 'var(--wa-green)' }} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Advanced sliders (ElevenLabs only) */}
          {ttsProvider === 'elevenlabs' && (
            <div className="flex flex-col gap-2">
              <div>
                <label className="section-label">Stability — <span style={{ color: 'var(--wa-green)' }}>{ttsStability.toFixed(2)}</span></label>
                <input type="range" className="slider" min={0} max={1} step={0.05} value={ttsStability} onChange={(e) => setTtsStability(Number(e.target.value))} />
              </div>
              <div>
                <label className="section-label">Style — <span style={{ color: 'var(--wa-green)' }}>{ttsStyle.toFixed(2)}</span></label>
                <input type="range" className="slider" min={0} max={1} step={0.05} value={ttsStyle} onChange={(e) => setTtsStyle(Number(e.target.value))} />
              </div>
              <div>
                <label className="section-label">Speed — <span style={{ color: 'var(--wa-green)' }}>{ttsSpeed.toFixed(2)}×</span></label>
                <input type="range" className="slider" min={0.5} max={2.0} step={0.05} value={ttsSpeed} onChange={(e) => setTtsSpeed(Number(e.target.value))} />
              </div>
            </div>
          )}

          {/* Status & Generate button */}
          {error && (
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={14} style={{ color: 'var(--ui-danger)', flexShrink: 0 }} />
              <span className="text-[11.5px]" style={{ color: 'var(--ui-danger)' }}>{error}</span>
            </div>
          )}
          {done && audioCount > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)' }}>
              <CheckCircle size={14} style={{ color: 'var(--wa-green)', flexShrink: 0 }} />
              <span className="text-[11.5px]" style={{ color: 'var(--wa-green)' }}>{audioCount} audio berhasil digenerate! Putar animasi untuk mendengar.</span>
            </div>
          )}

          <button
            onClick={generateAll}
            disabled={generating || textMessages.length === 0}
            className="btn btn-primary w-full py-2 text-[13px] font-bold gap-2"
            style={{ background: generating ? 'var(--ui-card)' : 'var(--wa-green)', color: generating ? 'var(--wa-text-muted)' : '#000' }}
          >
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {progress || 'Generating…'}
              </>
            ) : (
              <>
                <Mic size={14} />
                Generate {textMessages.length} Audio TTS
              </>
            )}
          </button>

          {audioCount > 0 && !generating && (
            <button
              onClick={clearAudioMap}
              className="text-[11px] text-center w-full py-1 rounded-lg border transition-all hover:opacity-70"
              style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)' }}
            >
              🗑️ Hapus semua audio yang digenerate
            </button>
          )}
        </>
      )}
    </div>
  );
}
