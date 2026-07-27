'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Volume2, Play, CheckCircle, AlertCircle, Mic, Eye, EyeOff, Key, ShieldCheck } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { ELEVENLABS_VOICES, ELEVENLABS_MODELS } from '@/types';

export default function TtsSection() {
  const {
    enableTts, ttsProvider, elevenKey, qwenKey, elevenModel,
    ttsVoiceIn, ttsVoiceOut, ttsStability, ttsStyle, ttsSpeed,
    messages, ttsAudioMap,
    setEnableTts, setTtsProvider, setElevenKey, setQwenKey, setElevenModel,
    setTtsVoiceIn, setTtsVoiceOut, setTtsStability, setTtsStyle, setTtsSpeed,
    setAudioMapEntry, clearAudioMap,
  } = useEditorStore();

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Load API keys from LocalStorage on mount
  useEffect(() => {
    try {
      const savedElevenKey = localStorage.getItem('wa_elevenlabs_api_key');
      if (savedElevenKey) setElevenKey(savedElevenKey);

      const savedQwenKey = localStorage.getItem('wa_qwen_api_key');
      if (savedQwenKey) setQwenKey(savedQwenKey);
    } catch {}
  }, [setElevenKey, setQwenKey]);

  const textMessages = messages.filter((m) => m.type === 'text' && m.text?.trim());

  async function generateAll() {
    if (!textMessages.length) return;
    setGenerating(true);
    setError(null);
    setDone(false);
    clearAudioMap();

    const activeApiKey = ttsProvider === 'qwen_cosyvoice' ? qwenKey : elevenKey;

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
            apiKey: activeApiKey,
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
        const localUrl = URL.createObjectURL(blob);

        // Store local blob URL for instant studio playback
        setAudioMapEntry(msg.id, localUrl);
        setAudioMapEntry(i, localUrl);

        // Upload to Cloudflare Worker (R2 / KV) for cloud sharing links
        try {
          const uploadRes = await fetch('/api/upload-audio', {
            method: 'POST',
            body: blob,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              setAudioMapEntry(msg.id, uploadData.url);
              setAudioMapEntry(i, uploadData.url);
            }
          }
        } catch (uploadErr) {
          console.warn('Audio cloud upload fallback:', uploadErr);
        }

        // Small pause between requests to avoid rate limiting
        await new Promise((r) => setTimeout(r, 150));
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
        apiKey: ttsProvider === 'qwen_cosyvoice' ? qwenKey : elevenKey,
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
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 'elevenlabs', label: '⭐ ElevenLabs', sub: 'Premium' },
                { value: 'qwen_cosyvoice', label: '🌐 Qwen AI', sub: 'CosyVoice' },
                { value: 'free_neural', label: '🆓 Google', sub: 'Gratis' },
              ].map(({ value, label, sub }) => (
                <button
                  key={value}
                  onClick={() => setTtsProvider(value as any)}
                  className="py-2 px-1.5 rounded-lg text-left border transition-all"
                  style={{
                    background: ttsProvider === value ? 'rgba(37,211,102,0.12)' : 'var(--ui-card)',
                    borderColor: ttsProvider === value ? 'var(--wa-green)' : 'var(--ui-border)',
                  }}
                >
                  <p className="text-[11.5px] font-semibold truncate" style={{ color: ttsProvider === value ? 'var(--wa-green)' : 'var(--wa-text)' }}>
                    {label}
                  </p>
                  <p className="text-[9.5px] truncate" style={{ color: 'var(--wa-text-muted)' }}>{sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ElevenLabs settings */}
          {ttsProvider === 'elevenlabs' && (
            <>
              {/* ElevenLabs API Key Input */}
              <div>
                <label className="section-label flex items-center gap-1.5">
                  <Key size={13} />
                  ElevenLabs API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="input pr-9 font-mono text-xs"
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={elevenKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setElevenKey(val);
                      try { localStorage.setItem('wa_elevenlabs_api_key', val); } catch {}
                    }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="absolute right-2 text-gray-400 hover:text-gray-200 transition-colors"
                    onClick={() => setShowKey((v) => !v)}
                    title={showKey ? 'Sembunyikan key' : 'Tampilkan key'}
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {/* Security badge */}
                <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-green-700/40 bg-green-950/40 px-2.5 py-1.5 text-[11px] text-green-300">
                  <ShieldCheck size={13} className="mt-0.5 shrink-0 text-green-400" />
                  <span>
                    Key disimpan secara lokal di browser kamu (<span className="font-semibold">LocalStorage</span>) &mdash; tidak pernah dikirim ke server kami. Hanya digunakan langsung ke API ElevenLabs.
                  </span>
                </div>
              </div>

              <div>
                <label className="section-label">Model Voice</label>
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

          {/* Qwen CosyVoice settings */}
          {ttsProvider === 'qwen_cosyvoice' && (
            <div className="p-2.5 rounded-lg border border-purple-800/40 bg-purple-950/30 flex flex-col gap-2.5">
              <div>
                <label className="section-label flex items-center gap-1.5 text-purple-300">
                  <Key size={13} />
                  Qwen / DashScope API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="input pr-9 font-mono text-xs border-purple-800/50 bg-purple-950/50 focus:border-purple-500"
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={qwenKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQwenKey(val);
                      try { localStorage.setItem('wa_qwen_api_key', val); } catch {}
                    }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="absolute right-2 text-purple-400 hover:text-purple-200 transition-colors"
                    onClick={() => setShowKey((v) => !v)}
                    title={showKey ? 'Sembunyikan key' : 'Tampilkan key'}
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Status info box */}
              <div className="flex items-start gap-1.5 rounded-lg border border-purple-700/40 bg-purple-950/60 px-2.5 py-2 text-[11px] text-purple-200 leading-relaxed">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-purple-400" />
                <div>
                  <p className="font-semibold text-purple-300 mb-0.5">ℹ️ Petunjuk Akses Aliyun Console:</p>
                  <span>
                    Pada menu <strong>Token Plan &gt; Audio</strong> di Aliyun Console (seperti di screenshot kamu), ubah toggle switch status model <strong className="text-purple-300">qwen-audio-3.0-tts-flash</strong> dari <span className="text-red-400 font-medium">Not Enabled</span> menjadi <span className="text-green-400 font-semibold">Enabled (ON)</span> agar API Key diizinkan men-generate suara.
                  </span>
                </div>
              </div>
            </div>
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
                  {ttsProvider === 'elevenlabs' ? (
                    ELEVENLABS_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))
                  ) : ttsProvider === 'qwen_cosyvoice' ? (
                    <>
                      <option value="longxiaochun">Longxiaochun (CosyVoice Wanita - Lembut)</option>
                      <option value="longwan">Longwan (CosyVoice Pria - Narasi)</option>
                      <option value="alex">Alex (CosyVoice English/Multi)</option>
                      <option value="anna">Anna (CosyVoice English/Multi)</option>
                    </>
                  ) : (
                    <option value="id">🇮🇩 Bahasa Indonesia</option>
                  )}
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
                  {ttsProvider === 'elevenlabs' ? (
                    ELEVENLABS_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))
                  ) : ttsProvider === 'qwen_cosyvoice' ? (
                    <>
                      <option value="longwan">Longwan (CosyVoice Pria - Narasi)</option>
                      <option value="longxiaochun">Longxiaochun (CosyVoice Wanita - Lembut)</option>
                      <option value="alex">Alex (CosyVoice English/Multi)</option>
                      <option value="anna">Anna (CosyVoice English/Multi)</option>
                    </>
                  ) : (
                    <option value="id">🇮🇩 Bahasa Indonesia</option>
                  )}
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
