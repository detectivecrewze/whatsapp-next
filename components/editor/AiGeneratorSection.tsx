'use client';

import React, { useState } from 'react';
import { Loader2, Zap, Wand2, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { Message } from '@/types';
import { newId } from '@/lib/utils';

const SCENARIOS = [
  { label: '💔 Drama Percintaan', value: 'drama_cinta', desc: 'Chat mesra yang berujung salah paham' },
  { label: '😂 Lucu / Receh', value: 'komedi', desc: 'Percakapan random yang bikin ngakak' },
  { label: '💰 Transferan Bokap', value: 'uang', desc: 'Chat minta uang ke orang tua' },
  { label: '🎯 Plot Twist', value: 'plot_twist', desc: 'Chat yang berakhir mengejutkan' },
  { label: '😤 Drama Teman', value: 'drama_teman', desc: 'Salah paham dengan teman dekat' },
  { label: '🤫 Rahasia Terungkap', value: 'rahasia', desc: 'Chat yang tanpa sengaja membongkar rahasia' },
  { label: '🛒 Titip Belanja', value: 'titip', desc: 'Nitip beli sesuatu yang berlebihan' },
  { label: '✍️ Kustom Bebas', value: 'custom', desc: 'Tulis sendiri konteks ceritanya' },
];

const MSG_COUNTS = [4, 6, 8, 10, 12];

export default function AiGeneratorSection() {
  const { name, setName, reorderMessages } = useEditorStore();
  const addMessage = useEditorStore((s) => s.addMessage);

  const [scenario, setScenario] = useState('drama_cinta');
  const [customPrompt, setCustomPrompt] = useState('');
  const [msgCount, setMsgCount] = useState(6);
  const [geminiKey, setGeminiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setGenerated(false);

    try {
      const scenarioObj = SCENARIOS.find((s) => s.value === scenario);
      const scenarioLabel = scenarioObj?.label ?? scenario;

      const prompt = scenario === 'custom'
        ? customPrompt
        : `Buat percakapan WhatsApp antara 2 orang dengan tema: ${scenarioLabel}. ${scenarioObj?.desc ?? ''}.`;

      const fullPrompt = `Kamu adalah generator konten viral WhatsApp Indonesia.

Buat percakapan WhatsApp yang natural, autentik, dan menarik dalam Bahasa Indonesia (gaul/sehari-hari).
Jumlah pesan: ${msgCount} pesan.
Tema: ${prompt}
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
- Buat percakapan yang engaging dan ada emosi/konflik/humor
- Hanya tampilkan JSON array, tidak ada penjelasan lain`;

      let responseText: string;

      if (geminiKey.trim()) {
        // Use Gemini API directly
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
            }),
          }
        );
        if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
        const data = await res.json();
        responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      } else {
        // Fallback: use our own Next.js API route
        const res = await fetch('/api/ai-generator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: fullPrompt }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status} — Masukkan Gemini API Key`);
        }
        const data = await res.json();
        responseText = data.text ?? '';
      }

      // Parse JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Format respons AI tidak valid — coba lagi');

      const raw: { direction: string; text: string }[] = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(raw) || raw.length === 0) throw new Error('AI tidak menghasilkan pesan');

      // Clear existing messages and add generated ones
      const store = useEditorStore.getState();
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newMessages: Message[] = raw.map((item, i) => ({
        id: newId('msg'),
        type: 'text' as const,
        direction: (item.direction === 'outgoing' ? 'outgoing' : 'incoming') as 'incoming' | 'outgoing',
        text: item.text,
        time: timeStr,
      }));

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
          🤖 AI akan generate script percakapan WA yang viral secara otomatis. Pilih tema, jumlah pesan, lalu klik Generate!
        </p>
      </div>

      {/* Scenario selector */}
      <div>
        <label className="section-label">Tema / Skenario</label>
        <div className="grid grid-cols-2 gap-1.5">
          {SCENARIOS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setScenario(value)}
              className="py-1.5 px-2 rounded-lg text-left border transition-all text-[11.5px]"
              style={{
                background: scenario === value ? 'rgba(37,211,102,0.12)' : 'var(--ui-card)',
                borderColor: scenario === value ? 'var(--wa-green)' : 'var(--ui-border)',
                color: scenario === value ? 'var(--wa-green)' : 'var(--wa-text)',
                fontWeight: scenario === value ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom prompt */}
      {scenario === 'custom' && (
        <div>
          <label className="section-label">Konteks Cerita Kustom</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Contoh: Chat antara aku dan pacar yang lagi marahan karena aku lupa anniversary..."
          />
        </div>
      )}

      {/* Message count */}
      <div>
        <label className="section-label">Jumlah Pesan</label>
        <div className="flex gap-1.5">
          {MSG_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setMsgCount(n)}
              className="flex-1 py-1 rounded-lg text-[12px] font-medium border transition-all"
              style={{
                background: msgCount === n ? 'rgba(37,211,102,0.15)' : 'var(--ui-card)',
                borderColor: msgCount === n ? 'var(--wa-green)' : 'var(--ui-border)',
                color: msgCount === n ? 'var(--wa-green)' : 'var(--wa-text-muted)',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Gemini API Key (optional) */}
      <div>
        <label className="section-label">Gemini API Key (Opsional)</label>
        <input
          type="password"
          className="input font-mono text-[11px]"
          value={geminiKey}
          onChange={(e) => setGeminiKey(e.target.value)}
          placeholder="AIza... (kosong = pakai server bawaan)"
        />
        <p className="text-[10px] mt-1" style={{ color: 'var(--wa-text-muted)' }}>
          Dapatkan gratis di{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--wa-green)' }}>
            aistudio.google.com
          </a>
        </p>
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
          <span className="text-[11.5px]" style={{ color: 'var(--wa-green)' }}>Script berhasil digenerate! Lihat di preview canvas ➡️</span>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading || (scenario === 'custom' && !customPrompt.trim())}
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
