'use client';

import React, { useState } from 'react';
import { Loader2, Wand2, RefreshCw, CheckCircle, Mic, MicOff } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { Message } from '@/types';
import { newId } from '@/lib/utils';

const MSG_COUNTS = [4, 6, 8, 10, 12, 16, 20];

interface PresetTheme {
  id: string;
  name: string;
  emoji: string;
  badgeColor: string;
  prompt: string;
}

const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'horror',
    name: 'Horor Mencekam',
    emoji: '👻',
    badgeColor: '#ef4444',
    prompt: 'Cerita horor plot twist malam hari di kosan, pacar ketakutan dengar suara di luar kamar, ternyata orang yang ngechat adalah setan itu sendiri.',
  },
  {
    id: 'comedy',
    name: 'Komedi & Prank',
    emoji: '🤣',
    badgeColor: '#f59e0b',
    prompt: 'Obrolan komedi konyol prank teman tagih utang seblak yang lupa dibayar 2 minggu, saling bales meme dan stiker lucu.',
  },
  {
    id: 'romance',
    name: 'Romantis & Bucin',
    emoji: '💕',
    badgeColor: '#ec4899',
    prompt: 'Obrolan romantis bucin malam hari antara sepasang kekasih, ceweknya ngambek minta dibelikan boba lalu cowoknya kejutan kirim notifikasi transfer.',
  },
  {
    id: 'drama',
    name: 'Drama & Perselingkuhan',
    emoji: '🎭',
    badgeColor: '#a855f7',
    prompt: 'Drama perselisihan mantan pacar yang tiba-tiba ngechat ngajak balikan pas malam minggu, tapi ketahuan sudah punya gebetan baru.',
  },
  {
    id: 'olshop',
    name: 'Olshop & Transfer',
    emoji: '💸',
    badgeColor: '#10b981',
    prompt: 'Chat penjual olshop dengan pembeli yang nawar harga sadis tapi langsung dikirimkan bukti transfer uang M-Banking.',
  },
];

export default function AiGeneratorSection() {
  const { setName, reorderMessages, messages } = useEditorStore();

  const [generatorMode, setGeneratorMode] = useState<'create' | 'improvise' | 'enhance_emotion'>('create');
  const [promptText, setPromptText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [msgCount, setMsgCount] = useState(8);
  const [voiceStyle, setVoiceStyle] = useState<'dramatic' | 'normal'>('dramatic');
  const [aiProvider, setAiProvider] = useState<'qwen' | 'google'>('qwen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setGenerated(false);

    try {
      const topic = promptText.trim() || (
        generatorMode === 'enhance_emotion'
          ? 'Pertajam tag emosi ElevenLabs di percakapan ini'
          : generatorMode === 'improvise'
            ? 'Lanjutkan percakapan sebelumnya agar lebih seru'
            : 'Drama percintaan antara pacar yang lucu dan viral'
      );

      const currentMessages = messages;

      const res = await fetch('/api/ai-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(60000), // Max 60s timeout
        body: JSON.stringify({
          prompt: topic,
          count: msgCount,
          voiceStyle,
          provider: aiProvider,
          mode: generatorMode,
          existingMessages: (generatorMode === 'improvise' || generatorMode === 'enhance_emotion') ? currentMessages : [],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      // Route sekarang langsung return parsed JSON object
      const data = await res.json();

      // ── Ambil contactName dari response ────────────────────────────────────
      const contactName: string = data.name || data.contactName || '';
      if (contactName && generatorMode === 'create') {
        setName(contactName.trim());
      }

      // ── Ambil messages array ───────────────────────────────────────────────
      let raw: { type?: string; direction: string; text: string; time?: string; index?: number }[] = [];

      if (Array.isArray(data.messages) && data.messages.length > 0) {
        raw = data.messages;
      } else if (Array.isArray(data)) {
        raw = data;
      } else {
        const textField = data.text ?? '';
        const objMatch = textField.match(/\{[\s\S]*\}/);
        const arrMatch = textField.match(/\[[\s\S]*\]/);
        if (objMatch) {
          try {
            const parsed = JSON.parse(objMatch[0]);
            raw = parsed.messages ?? [];
          } catch {}
        }
        if (raw.length === 0 && arrMatch) {
          try { raw = JSON.parse(arrMatch[0]); } catch {}
        }
      }

      if (!Array.isArray(raw) || raw.length === 0) {
        throw new Error('AI tidak menghasilkan respon. Coba generate ulang atau ubah prompt.');
      }

      if (generatorMode === 'enhance_emotion') {
        if (currentMessages.length === 0) {
          throw new Error('Editor masih kosong. Tambahkan atau generate percakapan terlebih dahulu.');
        }

        // Map enhanced texts back onto existing messages in-place
        const updatedMessages = currentMessages.map((msg, idx) => {
          const item = raw[idx] || raw.find((r: any) => r.index === idx + 1);
          if (item && item.text) {
            if (msg.type === 'image' || msg.caption) {
              return { ...msg, caption: item.text };
            }
            return { ...msg, text: item.text };
          }
          return msg;
        });

        reorderMessages(updatedMessages);
        setGenerated(true);
        return;
      }

      // ── Build Message objects with sequential timestamps & rich types ─────────
      const now = new Date();
      let currentHour = now.getHours();
      let currentMin = now.getMinutes();

      const validTypes = ['text', 'image', 'view_once', 'notification', 'transfer', 'contact', 'location', 'deleted'];

      const newMessages: Message[] = raw.map((item) => {
        let rawType = (item.type || 'text').toLowerCase();
        if (rawType === 'voice_note') rawType = 'text';
        const type = (validTypes.includes(rawType) ? rawType : 'text') as Message['type'];

        let timeStr = item.time;
        if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
          currentMin += Math.floor(Math.random() * 2) + 1;
          if (currentMin >= 60) { currentMin -= 60; currentHour = (currentHour + 1) % 24; }
          timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        }

        let imageData: string | undefined = undefined;
        let caption: string | undefined = undefined;
        if (type === 'image') {
          if (item.text && item.text.trim()) {
            caption = item.text.trim();
          }
        }

        const waveform = type === 'voice_note'
          ? Array.from({ length: 24 }, (_, i) => Math.floor(Math.sin(i * 0.45 + Math.random()) * 35) + 30)
          : undefined;

        return {
          id: newId('msg'),
          type,
          direction: (item.direction === 'outgoing' ? 'outgoing' : 'incoming') as 'incoming' | 'outgoing',
          text: item.text ?? (type === 'text' ? '' : undefined),
          caption: caption || (item as any).caption,
          notifSender: (item as any).notifSender,
          notifTitle: (item as any).notifTitle,
          imageData,
          duration: (item as any).duration || (type === 'voice_note' ? '0:12' : undefined),
          waveform,
          time: timeStr,
        };
      });

      if (generatorMode === 'improvise' && currentMessages.length > 0) {
        reorderMessages([...currentMessages, ...newMessages]);
      } else {
        reorderMessages(newMessages);
      }
      setGenerated(true);
    } catch (e: any) {
      setError(e.message || 'Gagal memproses AI. Cek koneksi dan API key.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Generator Mode Switcher */}
      <div>
        <label className="section-label">🎯 Mode AI Generator</label>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg border bg-[var(--ui-card)] border-[var(--ui-border)]">
          <button
            type="button"
            onClick={() => setGeneratorMode('create')}
            className={`py-1.5 px-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
              generatorMode === 'create'
                ? 'bg-[#00a884] text-white shadow-sm font-bold'
                : 'text-[var(--wa-text-muted)] hover:text-gray-200'
            }`}
          >
            <span>📝 Cerita Baru</span>
          </button>
          <button
            type="button"
            onClick={() => setGeneratorMode('improvise')}
            className={`py-1.5 px-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
              generatorMode === 'improvise'
                ? 'bg-purple-600 text-white shadow-sm font-bold'
                : 'text-[var(--wa-text-muted)] hover:text-gray-200'
            }`}
          >
            <span>🪄 Lanjutkan</span>
          </button>
          <button
            type="button"
            onClick={() => setGeneratorMode('enhance_emotion')}
            className={`py-1.5 px-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
              generatorMode === 'enhance_emotion'
                ? 'bg-pink-600 text-white shadow-sm font-bold'
                : 'text-[var(--wa-text-muted)] hover:text-gray-200'
            }`}
          >
            <span>🎭 Tag Emosi</span>
          </button>
        </div>
      </div>

      {/* Mode Banner Info */}
      <div
        className="p-2.5 rounded-lg border transition-all"
        style={{
          background: generatorMode === 'enhance_emotion' ? 'rgba(236,72,153,0.1)' : generatorMode === 'improvise' ? 'rgba(168,85,247,0.1)' : 'rgba(37,211,102,0.06)',
          borderColor: generatorMode === 'enhance_emotion' ? 'rgba(236,72,153,0.3)' : generatorMode === 'improvise' ? 'rgba(168,85,247,0.3)' : 'rgba(37,211,102,0.2)',
        }}
      >
        <p className="text-[11.5px] leading-relaxed" style={{ color: generatorMode === 'enhance_emotion' ? '#fbcfe8' : generatorMode === 'improvise' ? '#e9d5ff' : 'var(--wa-text-muted)' }}>
          {generatorMode === 'enhance_emotion' ? (
            <>
              🎭 <strong>Mode Tag Emosi ElevenLabs:</strong> AI akan membaca <strong>{messages.length} pesan di Editor</strong> dan secara otomatis menyisipkan Audio Emotion Tags ElevenLabs ([scared][whispers], [laughing], [shouting], dll.) langsung ke setiap pesan!
            </>
          ) : generatorMode === 'improvise' ? (
            <>
              🪄 <strong>Mode Improvisasi:</strong> AI akan membaca <strong>{messages.length} chat saat ini</strong> di Editor dan menambahkan <strong>{msgCount} bubble chat baru</strong> yang menyambung secara alami!
            </>
          ) : (
            <>
              🤖 <strong>Mode Buat Baru:</strong> AI akan membuatkan script percakapan WA dari awal berdasarkan topik di bawah (menggantikan chat saat ini).
            </>
          )}
        </p>
      </div>

      {/* Preset Tone & Tema Cerita Viral */}
      <div>
        <label className="section-label flex items-center justify-between">
          <span>🎯 Preset Tone & Tema Cerita</span>
          {selectedPreset && (
            <button
              onClick={() => { setSelectedPreset(null); setPromptText(''); }}
              className="text-[10px] text-red-400 hover:underline"
            >
              Reset Preset
            </button>
          )}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_THEMES.map((theme) => {
            const isSelected = selectedPreset === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  setSelectedPreset(theme.id);
                  setPromptText(theme.prompt);
                }}
                className="px-2.5 py-1 rounded-lg text-[11.5px] font-medium border transition-all flex items-center gap-1.5"
                style={{
                  background: isSelected ? `${theme.badgeColor}22` : 'var(--ui-card)',
                  borderColor: isSelected ? theme.badgeColor : 'var(--ui-border)',
                  color: isSelected ? theme.badgeColor : 'var(--wa-text-muted)',
                  boxShadow: isSelected ? `0 0 10px ${theme.badgeColor}33` : 'none',
                }}
              >
                <span>{theme.emoji}</span>
                <span>{theme.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Provider Engine Choice */}
      <div>
        <label className="section-label">⚡ AI Engine Provider</label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setAiProvider('qwen')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
              aiProvider === 'qwen'
                ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-sm shadow-purple-500/20'
                : 'bg-[var(--ui-card)] border-[var(--ui-border)] text-[var(--wa-text-muted)] hover:text-gray-200'
            }`}
          >
            <span>🌐 Qwen (Aliyun)</span>
          </button>

          <button
            type="button"
            onClick={() => setAiProvider('google')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
              aiProvider === 'google'
                ? 'bg-blue-950/60 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/20'
                : 'bg-[var(--ui-card)] border-[var(--ui-border)] text-[var(--wa-text-muted)] hover:text-gray-200'
            }`}
          >
            <span>✨ Google Gemini</span>
          </button>
        </div>
      </div>

      {/* Prompt Input Textarea */}
      <div>
        <label className="section-label">
          {generatorMode === 'improvise'
            ? 'Arahan Improvisasi / Lanjutan Cerita (Opsional)'
            : 'Prompt / Cerita yang Ingin Dibuat'}
        </label>
        <textarea
          className="input resize-none text-[12.5px] leading-relaxed"
          rows={3}
          value={promptText}
          onChange={(e) => {
            setPromptText(e.target.value);
            setSelectedPreset(null);
          }}
          placeholder={
            generatorMode === 'improvise'
              ? 'Ketik arahan lanjutan (cth: "Tiba-tiba ada yang ketuk jendela dan mama kirim notif transfer 500rb"), atau kosongkan untuk improvisasi otomatis AI...'
              : 'Ketik topik cerita di sini (cth: Cerita horor ada hantu di kos, chat mantan ngajak balikan, bokap transfer uang, dll)...'
          }
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) generate(); }}
        />
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--wa-text-muted)' }}>
          Ctrl+Enter untuk generate cepat
        </p>
      </div>

      {/* Voice Style Toggle */}
      <div>
        <label className="section-label">Gaya Suara / Emosi</label>
        <div className="flex gap-2">
          <button
            onClick={() => setVoiceStyle('dramatic')}
            className="flex-1 py-1.5 rounded-lg text-[12px] font-medium border transition-all flex items-center justify-center gap-1.5"
            style={{
              background: voiceStyle === 'dramatic' ? 'rgba(37,211,102,0.15)' : 'var(--ui-card)',
              borderColor: voiceStyle === 'dramatic' ? 'var(--wa-green)' : 'var(--ui-border)',
              color: voiceStyle === 'dramatic' ? 'var(--wa-green)' : 'var(--wa-text-muted)',
            }}
          >
            <Mic size={11} />
            Dramatis (ElevenLabs)
          </button>
          <button
            onClick={() => setVoiceStyle('normal')}
            className="flex-1 py-1.5 rounded-lg text-[12px] font-medium border transition-all flex items-center justify-center gap-1.5"
            style={{
              background: voiceStyle === 'normal' ? 'rgba(37,211,102,0.15)' : 'var(--ui-card)',
              borderColor: voiceStyle === 'normal' ? 'var(--wa-green)' : 'var(--ui-border)',
              color: voiceStyle === 'normal' ? 'var(--wa-green)' : 'var(--wa-text-muted)',
            }}
          >
            <MicOff size={11} />
            Normal (Tanpa Tag)
          </button>
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'var(--wa-text-muted)' }}>
          {voiceStyle === 'dramatic'
            ? '🎭 Akan ditambahkan tag emosi [scared], [laughing], dll. — bagus untuk TTS ElevenLabs'
            : '💬 Tanpa tag emosi — cocok untuk pesan biasa tanpa voice over'}
        </p>
      </div>

      {/* Message count */}
      <div>
        <label className="section-label">Jumlah Pesan (Pilih atau Ketik Sendiri)</label>
        <div className="flex gap-1.5 flex-wrap items-center">
          {MSG_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setMsgCount(n)}
              className="py-1 px-2.5 rounded-lg text-[12px] font-medium border transition-all"
              style={{
                background: msgCount === n ? 'rgba(37,211,102,0.15)' : 'var(--ui-card)',
                borderColor: msgCount === n ? 'var(--wa-green)' : 'var(--ui-border)',
                color: msgCount === n ? 'var(--wa-green)' : 'var(--wa-text-muted)',
              }}
            >
              {n}
            </button>
          ))}
          {/* Custom input */}
          <div className="flex items-center gap-1 bg-[var(--ui-card)] border border-[var(--ui-border)] rounded-lg px-2 py-0.5 ml-auto">
            <span className="text-[11px]" style={{ color: 'var(--wa-text-muted)' }}>Kustom:</span>
            <input
              type="number"
              min={1}
              max={30}
              value={msgCount}
              onChange={(e) => setMsgCount(Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1)))}
              className="w-12 bg-transparent text-center text-[12px] font-bold focus:outline-none"
              style={{ color: 'var(--wa-green)' }}
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 rounded-lg text-[11.5px]" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--ui-danger)', border: '1px solid rgba(239,68,68,0.25)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Success */}
      {generated && !loading && (
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)' }}>
          <CheckCircle size={14} style={{ color: 'var(--wa-green)' }} />
          <span className="text-[11.5px]" style={{ color: 'var(--wa-green)' }}>
            {generatorMode === 'enhance_emotion'
              ? '🎭 Tag Emosi ElevenLabs berhasil disisipkan ke percakapan!'
              : 'Script berhasil digenerate! Lihat di canvas ➡️'}
          </span>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading}
        className="btn btn-primary w-full py-2.5 text-[13px] font-bold gap-2 shadow-lg"
        style={{
          background: loading
            ? 'var(--ui-card)'
            : generatorMode === 'enhance_emotion'
              ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
              : generatorMode === 'improvise'
                ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)'
                : 'linear-gradient(135deg, var(--wa-green) 0%, #1a9e50 100%)',
          color: loading ? 'var(--wa-text-muted)' : '#fff',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            {generatorMode === 'enhance_emotion'
              ? `AI sedang menyisipkan tag emosi…`
              : generatorMode === 'improvise'
                ? `AI sedang mengimprovisasi +${msgCount} pesan…`
                : `AI sedang menulis ${msgCount} pesan…`}
          </>
        ) : (
          <>
            <Wand2 size={14} />
            {generatorMode === 'enhance_emotion'
              ? `🎭 Auto-Inject Tag Emosi ElevenLabs`
              : generatorMode === 'improvise'
                ? `🪄 Improvisasi & Lanjutkan (+${msgCount} Chat)`
                : `✨ Generate Script AI (${msgCount} Pesan)`}
          </>
        )}
      </button>

      {generated && (
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[12px] border transition-all hover:opacity-70"
          style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)' }}
        >
          <RefreshCw size={12} /> {generatorMode === 'enhance_emotion' ? 'Pertajam Tag Emosi Lagi' : generatorMode === 'improvise' ? 'Improvisasi Ulang' : 'Generate Ulang'}
        </button>
      )}
    </div>
  );
}
