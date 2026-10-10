'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Mic, Play, Sparkles, Trash2, Volume2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { ELEVENLABS_VOICES } from '@/types';

type SimpleProvider = 'elevenlabs' | 'free_neural';

export default function TtsSection() {
  const {
    enableTts, ttsProvider, elevenKey, elevenModel, ttsVoiceIn, ttsVoiceOut,
    ttsStability, ttsStyle, ttsSpeed, messages, ttsAudioMap,
    setEnableTts, setTtsProvider, setElevenKey, setTtsVoiceIn, setTtsVoiceOut,
    setTtsSpeed, setAudioMapEntry, clearAudioMap,
  } = useEditorStore();

  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState<'incoming' | 'outgoing' | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('wa_elevenlabs_api_key');
      if (savedKey) setElevenKey(savedKey);
    } catch {}
  }, [setElevenKey]);

  // Project lama masih dapat memakai backend Qwen, tetapi alur UI utama dibuat fokus.
  useEffect(() => {
    if (ttsProvider === 'qwen_cosyvoice') setTtsProvider('free_neural');
  }, [setTtsProvider, ttsProvider]);

  function getMessageSpeakableText(msg: (typeof messages)[0]): string | undefined {
    if (msg.type === 'text') return msg.text?.trim();
    if (msg.type === 'link') {
      const commentary = msg.text && !msg.text.startsWith('http') ? msg.text : '';
      return (commentary || msg.caption || msg.linkTitle || 'Tautan terkirim')?.trim();
    }
    if (msg.type === 'image' || msg.type === 'view_once') return (msg.caption || msg.text)?.trim();
    if (msg.type === 'notification') {
      return msg.text?.trim() || msg.caption?.trim() || `${msg.notifSender || 'Notifikasi'}: ${msg.notifTitle || 'Pesan baru'}`;
    }
    if (['transfer', 'location', 'contact'].includes(msg.type)) return (msg.text || msg.caption)?.trim();
    return undefined;
  }

  const speakableMessages = messages.filter((message) => Boolean(getMessageSpeakableText(message)));
  const generatedCount = speakableMessages.filter((message) => Boolean(ttsAudioMap[message.id])).length;
  const simpleProvider: SimpleProvider = ttsProvider === 'elevenlabs' ? 'elevenlabs' : 'free_neural';
  // Existing presets may still contain the previous v3 value. V4 is better at
  // speaking a language that differs from the source voice's original accent.
  const activeElevenModel = elevenModel === 'eleven_v3' ? 'eleven_v4' : elevenModel;

  function changeProvider(provider: SimpleProvider) {
    setTtsProvider(provider);
    setError(null);
    setDone(false);
    clearAudioMap();
    if (provider === 'elevenlabs') {
      if (!ELEVENLABS_VOICES.some((voice) => voice.id === ttsVoiceIn)) {
        setTtsVoiceIn('EXAVITQu4vr4xnSDxMaL');
      }
      if (!ELEVENLABS_VOICES.some((voice) => voice.id === ttsVoiceOut)) {
        setTtsVoiceOut('pNInz6obpgDQGcFmaJgB');
      }
    }
  }

  async function generateAll() {
    if (!speakableMessages.length) return;
    if (simpleProvider === 'elevenlabs' && !elevenKey.trim()) {
      setError('Masukkan ElevenLabs API key dulu, atau pilih mode Gratis.');
      return;
    }

    setGenerating(true);
    setError(null);
    setDone(false);
    clearAudioMap();

    try {
      let completed = 0;
      let cloudUploadFailures = 0;
      for (let index = 0; index < messages.length; index++) {
        const message = messages[index];
        const text = getMessageSpeakableText(message);
        if (!text) continue;

        let voiceId = message.direction === 'incoming' ? ttsVoiceIn : ttsVoiceOut;
        if (simpleProvider === 'elevenlabs') {
          const validVoice = ELEVENLABS_VOICES.some((voice) => voice.id === voiceId) || voiceId.length > 15;
          if (!validVoice) {
            voiceId = message.direction === 'incoming'
              ? 'EXAVITQu4vr4xnSDxMaL'
              : 'pNInz6obpgDQGcFmaJgB';
          }
        }

        completed += 1;
        setProgress(`Membuat suara ${completed} dari ${speakableMessages.length}…`);
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text, provider: simpleProvider, voiceId,
            apiKey: simpleProvider === 'elevenlabs' ? elevenKey : '',
            model: simpleProvider === 'elevenlabs' ? activeElevenModel : elevenModel,
            stability: ttsStability,
            style: ttsStyle,
            // Keep the generated MP3 at its natural pace. Speed is applied by
            // the player with pitch preservation so Indonesian stays clear.
            speed: 1,
          }),
        });

        if (!response.ok) {
          const detail = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(detail.error || `HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const localUrl = URL.createObjectURL(blob);
        setAudioMapEntry(message.id, localUrl);
        setAudioMapEntry(index, localUrl);

        try {
          const uploadResponse = await fetch('/api/upload-audio', { method: 'POST', body: blob });
          if (uploadResponse.ok) {
            const upload = await uploadResponse.json();
            if (upload.url) {
              setAudioMapEntry(message.id, upload.url);
              setAudioMapEntry(index, upload.url);
            }
          } else {
            cloudUploadFailures += 1;
            console.warn('Audio cloud upload failed:', await uploadResponse.text());
          }
        } catch (uploadError) {
          cloudUploadFailures += 1;
          console.warn('Audio cloud upload fallback:', uploadError);
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      setProgress(null);
      setDone(true);
      if (cloudUploadFailures > 0) {
        setError(`${cloudUploadFailures} audio siap untuk preview lokal, tetapi belum tersimpan ke cloud. Aplikasi akan mencoba upload lagi saat project disimpan.`);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Voice over gagal dibuat.');
      setProgress(null);
    } finally {
      setGenerating(false);
    }
  }

  async function previewVoice(voiceId: string, direction: 'incoming' | 'outgoing') {
    if (!elevenKey.trim()) {
      setError('Masukkan ElevenLabs API key untuk mencoba karakter suara.');
      return;
    }

    setPreviewing(direction);
    setError(null);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: direction === 'incoming'
            ? 'Halo, aku cuma mau bilang... jangan lupa buka pesannya, ya.'
            : 'Oke, aku kirim sekarang. Coba kamu buka, ya.',
          provider: 'elevenlabs', voiceId, apiKey: elevenKey, model: activeElevenModel,
          stability: ttsStability, style: ttsStyle, speed: 1,
        }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(detail.error || 'Preview suara gagal.');
      }
      const audio = new Audio(URL.createObjectURL(await response.blob()));
      audio.preservesPitch = true;
      audio.playbackRate = ttsSpeed;
      await audio.play();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Preview suara gagal.');
    } finally {
      setPreviewing(null);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-2">
      <div className="flex items-center justify-between rounded-xl border p-3" style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}>
        <div className="min-w-0 pr-3">
          <p className="text-[12px] font-semibold" style={{ color: 'var(--wa-text)' }}>Sertakan voice over</p>
          <p className="mt-0.5 text-[10px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>Suara ikut diputar di preview dan video MP4.</p>
        </div>
        <label className="toggle shrink-0">
          <input type="checkbox" checked={enableTts} onChange={(event) => setEnableTts(event.target.checked)} />
          <span className="toggle-track" /><span className="toggle-thumb" />
        </label>
      </div>

      {enableTts && (
        <>
          <section>
            <label className="section-label">1 · Pilih kualitas suara</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['elevenlabs', '✨ ElevenLabs', 'Paling natural · premium'],
                ['free_neural', '🌐 Gratis', 'Cepat · tanpa API key'],
              ] as const).map(([value, label, description]) => {
                const active = simpleProvider === value;
                return (
                  <button key={value} type="button" onClick={() => changeProvider(value)} className="rounded-xl border p-3 text-left transition-all" style={{ background: active ? 'rgba(37,211,102,0.09)' : 'var(--ui-card)', borderColor: active ? 'rgba(37,211,102,0.55)' : 'var(--ui-border)' }}>
                    <strong className="block text-[11.5px]" style={{ color: active ? 'var(--wa-green)' : 'var(--wa-text)' }}>{label}</strong>
                    <span className="mt-1 block text-[9.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>{description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {simpleProvider === 'elevenlabs' ? (
            <>
              <section>
                <label className="section-label">2 · Hubungkan ElevenLabs</label>
                <div className="relative flex items-center">
                  <input type={showKey ? 'text' : 'password'} className="input pr-9 font-mono text-[11px]" placeholder="ElevenLabs API key" value={elevenKey} onChange={(event) => {
                    const value = event.target.value;
                    setElevenKey(value);
                    try { localStorage.setItem('wa_elevenlabs_api_key', value); } catch {}
                  }} autoComplete="off" spellCheck={false} />
                  <button type="button" className="absolute right-2 transition-opacity hover:opacity-70" style={{ color: 'var(--wa-text-muted)' }} onClick={() => setShowKey((current) => !current)} title={showKey ? 'Sembunyikan key' : 'Tampilkan key'}>
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="mt-1.5 text-[9.5px]" style={{ color: 'var(--wa-text-muted)' }}>Key hanya disimpan di browser perangkat ini.</p>
              </section>

              <section>
                <label className="section-label">3 · Pilih karakter</label>
                <div className="mb-2.5 rounded-xl border p-2.5" style={{ background: 'rgba(56,189,248,0.06)', borderColor: 'rgba(56,189,248,0.22)' }}>
                  <p className="text-[10px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
                    Bahasa output dikunci ke Indonesia dan memakai Eleven v4. Preset bawaan tetap memiliki basis aksen Inggris; untuk aksen Indonesia asli diperlukan voice yang dibuat dari sampel Indonesia.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {([
                    ['incoming', 'Lawan bicara', ttsVoiceIn, setTtsVoiceIn],
                    ['outgoing', 'Pemilik HP', ttsVoiceOut, setTtsVoiceOut],
                  ] as const).map(([direction, label, value, setter]) => (
                    <div key={direction} className="rounded-xl border p-2.5" style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: direction === 'incoming' ? '#60a5fa' : 'var(--wa-green)' }} />
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--wa-text)' }}>{label}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <select className="select min-w-0 flex-1" value={value} onChange={(event) => setter(event.target.value)}>
                          {ELEVENLABS_VOICES.map((voice) => <option key={voice.id} value={voice.id}>{voice.name}</option>)}
                        </select>
                        <button type="button" onClick={() => previewVoice(value, direction)} disabled={previewing !== null} className="flex w-10 shrink-0 items-center justify-center rounded-lg border transition-opacity hover:opacity-75 disabled:opacity-50" style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-green)' }} title={`Coba suara ${label.toLowerCase()}`}>
                          {previewing === direction ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl border p-3" style={{ background: 'rgba(56,189,248,0.06)', borderColor: 'rgba(56,189,248,0.22)' }}>
              <Volume2 size={15} className="mt-0.5 shrink-0 text-sky-300" />
              <div>
                <p className="text-[11px] font-semibold text-sky-200">Siap tanpa pengaturan</p>
                <p className="mt-0.5 text-[10px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>Mode gratis memakai satu suara Bahasa Indonesia untuk semua bubble.</p>
              </div>
            </div>
          )}

          <section>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="section-label mb-0">
                {simpleProvider === 'elevenlabs' ? '4' : '2'} · Kecepatan bicara
              </label>
              <span className="text-[10.5px] font-semibold" style={{ color: 'var(--wa-green)' }}>
                {ttsSpeed.toFixed(2)}×
              </span>
            </div>
            <div className="rounded-xl border px-3 py-2.5" style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}>
              <input
                type="range"
                className="slider w-full"
                min={0.8}
                max={2}
                step={0.05}
                value={ttsSpeed}
                onChange={(event) => {
                  const nextSpeed = Number(event.target.value);
                  setTtsSpeed(nextSpeed);
                  setDone(false);
                }}
              />
              <div className="mt-1 flex justify-between text-[9px]" style={{ color: 'var(--wa-text-muted)' }}>
                <span>Lebih pelan</span><span>Normal</span><span>Lebih cepat</span>
              </div>
            </div>
            <p className="mt-1.5 text-[9.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
              Speed diterapkan saat preview dan render MP4 dengan pitch suara tetap dijaga. Audio tidak perlu dibuat ulang saat speed berubah; 1,15–1,40× biasanya paling jelas untuk dialog Indonesia.
            </p>
          </section>

          <section>
            <label className="section-label">{simpleProvider === 'elevenlabs' ? '5' : '3'} · Buat audio</label>
            <div className="mb-2.5 flex items-center justify-between rounded-xl border px-3 py-2.5" style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}>
              <div className="flex items-center gap-2"><Sparkles size={14} style={{ color: 'var(--wa-green)' }} /><span className="text-[10.5px]" style={{ color: 'var(--wa-text)' }}>{speakableMessages.length} bubble memiliki teks</span></div>
              {generatedCount > 0 && <span className="text-[9.5px] font-semibold" style={{ color: 'var(--wa-green)' }}>{generatedCount} siap</span>}
            </div>

            {error && <div className="mb-2.5 flex items-start gap-2 rounded-xl border p-2.5" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}><AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: '#fca5a5' }} /><span className="text-[10.5px] leading-relaxed" style={{ color: '#fca5a5' }}>{error}</span></div>}
            {done && generatedCount > 0 && <div className="mb-2.5 flex items-center gap-2 rounded-xl border p-2.5" style={{ background: 'rgba(37,211,102,0.08)', borderColor: 'rgba(37,211,102,0.25)' }}><CheckCircle size={14} className="shrink-0" style={{ color: 'var(--wa-green)' }} /><span className="text-[10.5px]" style={{ color: 'var(--wa-green)' }}>Voice over siap diputar dan dirender.</span></div>}

            <button type="button" onClick={generateAll} disabled={generating || speakableMessages.length === 0} className="btn btn-primary w-full gap-2 py-3 text-[12.5px] font-bold">
              {generating ? <><Loader2 size={15} className="animate-spin" />{progress || 'Membuat voice over…'}</> : <><Mic size={15} />Buat voice over</>}
            </button>
            {generatedCount > 0 && !generating && (
              <button type="button" onClick={() => { clearAudioMap(); setDone(false); }} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10.5px] transition-opacity hover:opacity-70" style={{ color: 'var(--wa-text-muted)' }}>
                <Trash2 size={12} /> Hapus voice over
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}
