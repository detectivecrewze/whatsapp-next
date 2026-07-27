'use client';

import React, { useState } from 'react';
import { Loader2, Wand2, RefreshCw, CheckCircle, Mic, MicOff } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { Message } from '@/types';
import { newId } from '@/lib/utils';

const MSG_COUNTS = [4, 6, 8, 10, 12, 16, 20];

export default function AiGeneratorSection() {
  const { setName, reorderMessages } = useEditorStore();

  const [promptText, setPromptText] = useState('');
  const [msgCount, setMsgCount] = useState(8);
  const [voiceStyle, setVoiceStyle] = useState<'dramatic' | 'normal'>('dramatic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setGenerated(false);

    try {
      const topic = promptText.trim() || 'Drama percintaan antara pacar yang lucu dan viral';

      const res = await fetch('/api/ai-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000), // Max 30s timeout
        body: JSON.stringify({
          prompt: topic,
          count: msgCount,
          voiceStyle,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      // Route sekarang langsung return parsed JSON object
      const data = await res.json();

      // ── Ambil contactName dari response ────────────────────────────────────
      const contactName: string =
        data.name || data.contactName || '';
      if (contactName) {
        setName(contactName.trim());
      }

      // ── Ambil messages array ───────────────────────────────────────────────
      let raw: { type?: string; direction: string; text: string; time?: string }[] = [];

      if (Array.isArray(data.messages) && data.messages.length > 0) {
        raw = data.messages;
      } else if (Array.isArray(data)) {
        raw = data;
      } else {
        // Last resort: try to extract from text field (old format)
        const textField = data.text ?? '';
        const objMatch = textField.match(/\{[\s\S]*\}/);
        const arrMatch = textField.match(/\[[\s\S]*\]/);
        if (objMatch) {
          try {
            const parsed = JSON.parse(objMatch[0]);
            raw = parsed.messages ?? [];
            if (parsed.name || parsed.contactName) {
              setName((parsed.name || parsed.contactName).trim());
            }
          } catch {}
        }
        if (raw.length === 0 && arrMatch) {
          try { raw = JSON.parse(arrMatch[0]); } catch {}
        }
      }

      if (!Array.isArray(raw) || raw.length === 0) {
        throw new Error('AI tidak menghasilkan naskah percakapan. Coba generate ulang atau ubah prompt.');
      }

      // ── Build Message objects with sequential timestamps & rich types ─────────
      const now = new Date();
      let currentHour = now.getHours();
      let currentMin = now.getMinutes();

      const validTypes = ['text', 'image', 'view_once', 'notification', 'transfer', 'contact', 'location', 'deleted'];

      const newMessages: Message[] = raw.map((item) => {
        // Validate type (convert voice_note to text as requested)
        let rawType = (item.type || 'text').toLowerCase();
        if (rawType === 'voice_note') rawType = 'text';
        const type = (validTypes.includes(rawType) ? rawType : 'text') as Message['type'];

        // Determine timestamp
        let timeStr = item.time;
        if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
          currentMin += Math.floor(Math.random() * 2) + 1;
          if (currentMin >= 60) { currentMin -= 60; currentHour = (currentHour + 1) % 24; }
          timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        }

        // Image fallback handling
        let imageData = (item as any).imageData;
        if (type === 'image' && !imageData) {
          const lowerPrompt = topic.toLowerCase();
          if (lowerPrompt.includes('horor') || lowerPrompt.includes('hantu') || lowerPrompt.includes('seram')) {
            imageData = 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=400&q=80';
          } else if (lowerPrompt.includes('makan') || lowerPrompt.includes('seblak') || lowerPrompt.includes('kafe') || lowerPrompt.includes('kopi')) {
            imageData = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80';
          } else {
            imageData = 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&q=80';
          }
        }

        // Voice note waveform generation
        const waveform = type === 'voice_note'
          ? Array.from({ length: 24 }, (_, i) => Math.floor(Math.sin(i * 0.45 + Math.random()) * 35) + 30)
          : undefined;

        return {
          id: newId('msg'),
          type,
          direction: (item.direction === 'outgoing' ? 'outgoing' : 'incoming') as 'incoming' | 'outgoing',
          text: item.text ?? (type === 'text' ? '' : undefined),
          caption: (item as any).caption,
          imageData,
          duration: (item as any).duration || (type === 'voice_note' ? '0:12' : undefined),
          waveform,
          time: timeStr,
        };
      });

      reorderMessages(newMessages);
      setGenerated(true);
    } catch (e: any) {
      setError(e.message || 'Gagal generate naskah. Cek koneksi dan API key.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Intro */}
      <div
        className="p-2.5 rounded-lg border"
        style={{ background: 'rgba(37,211,102,0.06)', borderColor: 'rgba(37,211,102,0.2)' }}
      >
        <p className="text-[12px]" style={{ color: 'var(--wa-text-muted)' }}>
          🤖 AI akan membuatkan script percakapan WA viral otomatis berdasarkan topik yang kamu ketik di bawah!
        </p>
      </div>

      {/* Prompt Input Textarea */}
      <div>
        <label className="section-label">Prompt / Cerita yang Ingin Dibuat</label>
        <textarea
          className="input resize-none text-[12.5px] leading-relaxed"
          rows={4}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Ketik topik cerita di sini (cth: Cerita horor ada hantu di kos, chat mantan ngajak balikan, bokap transfer uang, prank teman soal utang, dll)..."
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
          <span className="text-[11.5px]" style={{ color: 'var(--wa-green)' }}>Script berhasil digenerate! Lihat di canvas ➡️</span>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading}
        className="btn btn-primary w-full py-2.5 text-[13px] font-bold gap-2"
        style={{
          background: loading ? 'var(--ui-card)' : 'linear-gradient(135deg, var(--wa-green) 0%, #1a9e50 100%)',
          color: loading ? 'var(--wa-text-muted)' : '#000',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            AI sedang menulis {msgCount} pesan…
          </>
        ) : (
          <>
            <Wand2 size={14} />
            ✨ Generate Script AI ({msgCount} pesan)
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
          <RefreshCw size={12} /> Generate Ulang
        </button>
      )}
    </div>
  );
}
