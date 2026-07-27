'use client';

import React, { useState } from 'react';
import { Loader2, Wand2, RefreshCw, CheckCircle } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { Message } from '@/types';
import { newId } from '@/lib/utils';

const MSG_COUNTS = [4, 6, 8, 10, 12];

export default function AiGeneratorSection() {
  const { name, reorderMessages } = useEditorStore();

  const [promptText, setPromptText] = useState('');
  const [msgCount, setMsgCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setGenerated(false);

    try {
      const topic = promptText.trim() || 'Drama percintaan antara pacar yang lucu dan viral';

      const fullPrompt = `Kamu adalah generator konten viral WhatsApp Indonesia.

Buat percakapan WhatsApp yang natural, autentik, dan menarik dalam Bahasa Indonesia (gaul/sehari-hari).
Jumlah pesan: ${msgCount} pesan.
Topik/Cerita: ${topic}
Nama kontak lawan bicara: "${name}".

WAJIB output JSON array (tanpa markdown code block, langsung raw JSON):
[
  { "direction": "incoming" | "outgoing", "text": "isi pesan" },
  ...
]

Aturan:
- Gunakan bahasa gaul Indonesia yang natural (dong, sih, wkwk, asli, bro, kak, dll)
- Arah "incoming" = pesan dari lawan bicara (${name})
- Arah "outgoing" = pesan dari pengguna (kamu)
- Gunakan tag suara ElevenLabs seperti [sighs], [excited], [laughing], [gasp], [happy] jika cocok
- Hanya tampilkan JSON array, tidak ada penjelasan lain`;

      const res = await fetch('/api/ai-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          scenario: topic,
          count: msgCount,
          name,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const responseText = data.text ?? '';

      // Parse JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Format respons AI tidak valid — coba lagi');

      const raw: { direction: string; text: string }[] = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(raw) || raw.length === 0) throw new Error('AI tidak menghasilkan pesan');

      // Populate store with generated messages
      const now = new Date();
      let currentHour = now.getHours();
      let currentMin = now.getMinutes();

      const newMessages: Message[] = raw.map((item) => {
        currentMin += Math.floor(Math.random() * 2) + 1;
        if (currentMin >= 60) {
          currentMin -= 60;
          currentHour = (currentHour + 1) % 24;
        }
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

        return {
          id: newId('msg'),
          type: 'text' as const,
          direction: (item.direction === 'outgoing' ? 'outgoing' : 'incoming') as 'incoming' | 'outgoing',
          text: item.text,
          time: timeStr,
        };
      });

      reorderMessages(newMessages);
      setGenerated(true);
    } catch (e: any) {
      setError(e.message || 'Gagal generate naskah');
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
          🤖 AI akan membuatkan script percakapan WA otomatis berdasarkan topik yang kamu ketik di bawah!
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
          placeholder="Ketik topik cerita di sini (cth: Chat mantan ngajak balikan, temen nunggak utang, kado digital anniversary 40 ribu, dll)..."
        />
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
              {n} Pesan
            </button>
          ))}
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
            AI sedang menulis…
          </>
        ) : (
          <>
            <Wand2 size={14} />
            Generate Script AI
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
