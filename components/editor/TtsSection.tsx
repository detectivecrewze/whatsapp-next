'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Mic, Pause, Play, RefreshCw, Sparkles, Trash2, Volume2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { ELEVENLABS_VOICES, type Message } from '@/types';
import { getMessageSpeakableText } from '@/lib/speech';

type SimpleProvider = 'elevenlabs' | 'free_neural';

export default function TtsSection() {
  const {
    enableTts, ttsProvider, elevenKey, elevenModel, ttsVoiceIn, ttsVoiceOut,
    ttsStability, ttsStyle, ttsSpeed, messages, ttsAudioMap,
    setEnableTts, setTtsProvider, setElevenKey, setTtsVoiceIn, setTtsVoiceOut,
    setAudioMapEntry, removeAudioMapEntry, clearAudioMap,
  } = useEditorStore();

  const [generationTarget, setGenerationTarget] = useState<string | 'missing' | 'all' | null>(null);
  const [previewing, setPreviewing] = useState<'incoming' | 'outgoing' | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const bubbleAudioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => () => {
    const audio = bubbleAudioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    bubbleAudioRef.current = null;
  }, []);

  const speakableMessages = messages.filter((message) => Boolean(getMessageSpeakableText(message)));
  const generatedCount = speakableMessages.filter((message) => Boolean(ttsAudioMap[message.id])).length;
  const missingMessages = speakableMessages.filter((message) => !ttsAudioMap[message.id]);
  const generating = generationTarget !== null;
  const simpleProvider: SimpleProvider = ttsProvider === 'elevenlabs' ? 'elevenlabs' : 'free_neural';
  // Existing presets may still contain the previous v3 value. V4 is better at
  // speaking a language that differs from the source voice's original accent.
  const activeElevenModel = elevenModel === 'eleven_v3' ? 'eleven_v4' : elevenModel;

  function stopBubbleAudio() {
    const audio = bubbleAudioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute('src');
      audio.load();
    }
    bubbleAudioRef.current = null;
    setPlayingMessageId(null);
  }

  async function toggleBubbleAudio(messageId: string) {
    const source = ttsAudioMap[messageId];
    if (!source) return;

    if (playingMessageId === messageId) {
      stopBubbleAudio();
      return;
    }

    stopBubbleAudio();
    setError(null);

    const audio = new Audio(source);
    audio.preload = 'auto';
    audio.preservesPitch = true;
    audio.playbackRate = Math.max(0.5, Math.min(2, ttsSpeed || 1));
    audio.onended = () => {
      if (bubbleAudioRef.current === audio) {
        bubbleAudioRef.current = null;
        setPlayingMessageId(null);
      }
    };
    audio.onerror = () => {
      if (bubbleAudioRef.current === audio) {
        bubbleAudioRef.current = null;
        setPlayingMessageId(null);
        setError('Audio voice ini tidak bisa diputar. Coba buat ulang voice bubble tersebut.');
      }
    };

    bubbleAudioRef.current = audio;
    setPlayingMessageId(messageId);

    try {
      await audio.play();
    } catch {
      if (bubbleAudioRef.current === audio) {
        bubbleAudioRef.current = null;
        setPlayingMessageId(null);
      }
      setError('Browser gagal memutar audio voice ini. Coba klik play sekali lagi.');
    }
  }

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

  function validateGeneration() {
    if (simpleProvider === 'elevenlabs' && !elevenKey.trim()) {
      setError('Masukkan ElevenLabs API key dulu, atau pilih mode Gratis.');
      return false;
    }
    return true;
  }

  async function generateMessageAudio(message: Message) {
    const text = getMessageSpeakableText(message);
    if (!text) return { cloudUploadFailed: false };

    let voiceId = message.direction === 'incoming' ? ttsVoiceIn : ttsVoiceOut;
    if (simpleProvider === 'elevenlabs') {
      const validVoice = ELEVENLABS_VOICES.some((voice) => voice.id === voiceId) || voiceId.length > 15;
      if (!validVoice) {
        voiceId = message.direction === 'incoming'
          ? 'EXAVITQu4vr4xnSDxMaL'
          : 'pNInz6obpgDQGcFmaJgB';
      }
    }

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
    const previousUrl = useEditorStore.getState().ttsAudioMap[message.id];
    setAudioMapEntry(message.id, localUrl);
    if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl);

    try {
      const uploadResponse = await fetch('/api/upload-audio', { method: 'POST', body: blob });
      if (uploadResponse.ok) {
        const upload = await uploadResponse.json();
        if (upload.url) {
          setAudioMapEntry(message.id, upload.url);
          URL.revokeObjectURL(localUrl);
        }
      } else {
        console.warn('Audio cloud upload failed:', await uploadResponse.text());
        return { cloudUploadFailed: true };
      }
    } catch (uploadError) {
      console.warn('Audio cloud upload fallback:', uploadError);
      return { cloudUploadFailed: true };
    }

    return { cloudUploadFailed: false };
  }

  async function generateBatch(targetMessages: Message[], target: 'missing' | 'all') {
    if (!targetMessages.length || !validateGeneration()) return;

    stopBubbleAudio();
    setGenerationTarget(target);
    setError(null);
    setDone(false);
    if (target === 'all') clearAudioMap();

    try {
      let cloudUploadFailures = 0;
      for (let index = 0; index < targetMessages.length; index++) {
        const message = targetMessages[index];
        setProgress(`Membuat suara ${index + 1} dari ${targetMessages.length}…`);
        const result = await generateMessageAudio(message);
        if (result.cloudUploadFailed) cloudUploadFailures += 1;
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
      setGenerationTarget(null);
    }
  }

  async function generateOne(message: Message) {
    if (!validateGeneration()) return;

    if (playingMessageId === message.id) stopBubbleAudio();
    setGenerationTarget(message.id);
    setError(null);
    setDone(false);
    setProgress(null);

    try {
      const result = await generateMessageAudio(message);
      setDone(true);
      if (result.cloudUploadFailed) {
        setError('Voice siap untuk preview lokal, tetapi belum tersimpan ke cloud. Aplikasi akan mencoba upload lagi saat project disimpan.');
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Voice over gagal dibuat.');
    } finally {
      setGenerationTarget(null);
    }
  }

  async function previewVoice(voiceId: string, direction: 'incoming' | 'outgoing') {
    if (!elevenKey.trim()) {
      setError('Masukkan ElevenLabs API key untuk mencoba karakter suara.');
      return;
    }

    stopBubbleAudio();
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
            <label className="section-label">{simpleProvider === 'elevenlabs' ? '4' : '2'} · Buat audio</label>
            <div className="mb-2.5 flex items-center justify-between rounded-xl border px-3 py-2.5" style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}>
              <div className="flex items-center gap-2"><Sparkles size={14} style={{ color: 'var(--wa-green)' }} /><span className="text-[10.5px]" style={{ color: 'var(--wa-text)' }}>{generatedCount}/{speakableMessages.length} voice siap</span></div>
              <span className="text-[9.5px] font-semibold" style={{ color: missingMessages.length ? '#fbbf24' : 'var(--wa-green)' }}>
                {missingMessages.length ? `${missingMessages.length} belum dibuat` : 'Lengkap'}
              </span>
            </div>

            {error && <div className="mb-2.5 flex items-start gap-2 rounded-xl border p-2.5" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}><AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: '#fca5a5' }} /><span className="text-[10.5px] leading-relaxed" style={{ color: '#fca5a5' }}>{error}</span></div>}
            {done && generatedCount > 0 && <div className="mb-2.5 flex items-center gap-2 rounded-xl border p-2.5" style={{ background: 'rgba(37,211,102,0.08)', borderColor: 'rgba(37,211,102,0.25)' }}><CheckCircle size={14} className="shrink-0" style={{ color: 'var(--wa-green)' }} /><span className="text-[10.5px]" style={{ color: 'var(--wa-green)' }}>Voice over siap diputar dan dirender.</span></div>}
            {generating && <div className="mb-2.5 flex items-center gap-2 rounded-xl border px-3 py-2.5" style={{ background: 'rgba(56,189,248,0.06)', borderColor: 'rgba(56,189,248,0.22)' }}><Loader2 size={13} className="shrink-0 animate-spin text-sky-300" /><span className="text-[10px] text-sky-200">{progress || 'Membuat satu voice bubble…'}</span></div>}

            <button type="button" onClick={() => generateBatch(missingMessages, 'missing')} disabled={generating || missingMessages.length === 0} className="btn btn-primary w-full gap-2 py-3 text-[12.5px] font-bold">
              {generationTarget === 'missing' ? <><Loader2 size={15} className="animate-spin" />{progress || 'Membuat voice baru…'}</> : <><Mic size={15} />{missingMessages.length ? `Buat ${missingMessages.length} voice yang belum ada` : 'Semua voice sudah siap'}</>}
            </button>

            {speakableMessages.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: 'var(--ui-border)', background: 'var(--ui-card)' }}>
                <div className="border-b px-3 py-2" style={{ borderColor: 'var(--ui-border)' }}>
                  <p className="text-[10px] font-semibold" style={{ color: 'var(--wa-text)' }}>Voice per bubble</p>
                  <p className="mt-0.5 text-[9px]" style={{ color: 'var(--wa-text-muted)' }}>Buat ulang hanya chat yang ingin kamu perbaiki.</p>
                </div>
                <div className="max-h-64 overflow-y-auto p-1.5">
                  {speakableMessages.map((message) => {
                    const messageIndex = messages.findIndex((item) => item.id === message.id);
                    const text = getMessageSpeakableText(message) || '';
                    const ready = Boolean(ttsAudioMap[message.id]);
                    const isGeneratingThis = generationTarget === message.id;

                    return (
                      <div key={message.id} className="flex items-center gap-2 rounded-lg px-2 py-2" style={{ background: ready ? 'rgba(37,211,102,0.045)' : 'transparent' }}>
                        <span className="w-5 shrink-0 text-center text-[9.5px]" style={{ color: 'var(--wa-text-muted)' }}>#{messageIndex + 1}</span>
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: ready ? 'var(--wa-green)' : '#f59e0b' }} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10.5px]" style={{ color: 'var(--wa-text)' }}>{text}</p>
                          <p className="mt-0.5 text-[8.5px]" style={{ color: 'var(--wa-text-muted)' }}>
                            {message.direction === 'incoming' ? 'Lawan bicara' : 'Pemilik HP'} · {playingMessageId === message.id ? 'Sedang diputar' : ready ? 'Voice siap' : 'Belum ada voice'}
                          </p>
                        </div>
                        {ready && (
                          <button
                            type="button"
                            onClick={() => toggleBubbleAudio(message.id)}
                            disabled={generating}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-opacity hover:opacity-75 disabled:opacity-40"
                            style={{
                              background: playingMessageId === message.id ? 'rgba(37,211,102,0.13)' : 'transparent',
                              borderColor: 'rgba(37,211,102,0.35)',
                              color: 'var(--wa-green)',
                            }}
                            title={playingMessageId === message.id ? 'Hentikan voice bubble ini' : 'Putar voice bubble ini'}
                            aria-label={playingMessageId === message.id ? 'Hentikan voice bubble ini' : 'Putar voice bubble ini'}
                          >
                            {playingMessageId === message.id ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => generateOne(message)}
                          disabled={generating}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-opacity hover:opacity-75 disabled:opacity-40"
                          style={{ borderColor: ready ? 'rgba(37,211,102,0.35)' : 'var(--ui-border)', color: 'var(--wa-green)' }}
                          title={ready ? 'Buat ulang voice bubble ini' : 'Buat voice bubble ini'}
                        >
                          {isGeneratingThis ? <Loader2 size={13} className="animate-spin" /> : ready ? <RefreshCw size={13} /> : <Mic size={13} />}
                        </button>
                        {ready && (
                          <button
                            type="button"
                            onClick={() => {
                              if (playingMessageId === message.id) stopBubbleAudio();
                              removeAudioMapEntry(message.id);
                              setDone(false);
                            }}
                            disabled={generating}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
                            style={{ color: 'var(--wa-text-muted)' }}
                            title="Hapus voice bubble ini"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {generatedCount > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => generateBatch(speakableMessages, 'all')} disabled={generating} className="flex items-center justify-center gap-1.5 rounded-lg border py-2 text-[9.5px] transition-opacity hover:opacity-70 disabled:opacity-40" style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)' }}>
                  <RefreshCw size={11} /> {generationTarget === 'all' ? progress || 'Membuat ulang…' : 'Buat ulang semua'}
                </button>
                <button type="button" onClick={() => { stopBubbleAudio(); clearAudioMap(); setDone(false); }} disabled={generating} className="flex items-center justify-center gap-1.5 rounded-lg border py-2 text-[9.5px] transition-opacity hover:opacity-70 disabled:opacity-40" style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)' }}>
                  <Trash2 size={11} /> Hapus semua
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
