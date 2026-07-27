import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s timeout for longer generations

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

// ── Gemini model fallback chain ───────────────────────────────────────────────
const MODEL_CHAIN = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

// ── Build system prompt (porting langsung dari worker.js project lama) ────────
function buildSystemPrompt(targetLength: number, voiceStyle: 'dramatic' | 'normal'): string {
  let lengthRule = `Buat TEPAT ${targetLength} bubble chat dari awal sampai tamat cerita (tidak boleh kurang, tidak boleh lebih).`;

  const dramaticRuleInstruction = voiceStyle === 'normal'
    ? `3. GAYA NORMAL (TANPA TAG EMOSI & TANPA FORMAT EKSTREM):
   - DILARANG menyisipkan tag emosi kurung siku seperti [scared], [whispers], [laughing], dll.
   - DILARANG menggunakan format dramatis berlebihan seperti titik-titik berturut-turut banyak atau HURUF KAPITAL TERIAKAN.
   - Tulis teks percakapan biasa yang santai, alami, bercanda/serius sesuai tema, dan manusiawi.`
    : `3. ELEVENLABS AUDIO EMOTION TAGS & INTENSIFIKASI FORMATTING (SANGAT WAJIB & INTENS):
   - AI ElevenLabs v3 SANGAT PEKA terhadap simbol tanda baca, kapitalisasi, dan Audio Tag.
   - WAJIB SISIPKAN AUDIO TAG EMOSI DI SETIAP BUBBLE CHAT (terutama untuk Horor, Suspense, & Drama):
     * KALO HOROR / SUSPENSE / MISTERI (WAJIB EKSTREM & MENCEKAM):
       - WAJIB pasang Kombo Tag di AWAL setiap bubble: [scared][whispers], [panicked][shouting], [gasp][fearful], [crying][desperate], [trembling][quietly], [angry][shouting].
       - WAJIB gunakan Jeda Napas Ketakutan (... / ......), Gagap (B-bu..., K-kamu...), Teriakan ALL CAPS (JANGAN BUKA!), & Cutoff (—).
       - Contoh: { "type": "text", "direction": "outgoing", "time": "02:15", "text": "[scared][whispers] B-bu...... di luar kamar...... ada yang ketuk pintu......" }
     * KALO KOMEDI / LUCU / PRANK:
       - Gunakan tag: [laughing], [excited], [gasp], [angry], [sighs], [quietly]. Contoh: [laughing] Wkwkwk bjir... lu seriusan?!
     * KALO ROMANTIS / BUCIN:
       - Gunakan tag: [whispers], [shy], [happy], [sighs], [quietly], [crying]. Contoh: [whispers] Aku... aku kangen banget sama kamu...`;

  return `Kamu adalah penulis naskah cerita pendek percakapan WhatsApp viral profesional (spesialis konten Komedi, Romantis/Bucin, Drama, Horor, dan Olshop/Daily TikTok/Reels/Shorts).

Format Output WAJIB JSON Murni (TANPA markdown backtick, langsung raw JSON):
{
  "chatType": "personal",
  "name": "Nama Kontak yang Pas untuk Cerita (cth: Sayang 💕, Mantan 💔, Bokap 👨, dll)",
  "messages": [
    { "type": "text", "direction": "outgoing", "time": "21:30", "text": "Sayang" },
    { "type": "text", "direction": "outgoing", "time": "21:30", "text": "Kamu udah tidur belom?" },
    { "type": "text", "direction": "incoming", "time": "21:31", "text": "Belom nih, baru kelar cuci muka. Kenapa?" }
  ]
}

Aturan Penulisan Gaya Chat WhatsApp (SANGAT PENTING):
1. GAYA KETIKAN TEXT HP REALISTIS & MANUSIAWI (BUKAN BOT / BAKU OPERA):
   - Pesan buatanmu HARUS terasa seperti teks asli orang Indonesia yang diketik pakai jempol di HP (singkat, 1-8 kata per bubble, spontan, pakai bahasa gaul/santai sehari-hari seperti: wkwk, njir, banget, gak, lu, gua, aku, kamu, dll. sesuai konteks).
   - DILARANG BIKIN KALIMAT NARRATIVE TEATER PANJANG BAKU BOHONGAN.
   - Pisahkan teks menjadi bubble-bubble chat pendek yang alami! Satu bubble = 1 pikiran/respon pendek.

2. FLEXIBEL ADAPTASI GENRE / TEMA (SESUAIKAN DENGAN IDE USER):
   - BACA DENGAN TELITI ide/skenario dari User dan buat cerita yang 100% SESUAI GENRE NYA:
     * Kalo ide HOROR/SUSPENSE: Buat suasana seram mencekam, rasa takut luar biasa, intonasi emosi melimpah di setiap bubble, atau plot twist impostor.
     * Kalo ide KOMEDI/LUCU/PRANK: Buat cerita humor yang lucu, ada kebodohan konyol, salah paham kocak, atau ending yang bikin ngakak/tepok jidat. Bahasa santai & gaul!
     * Kalo ide ROMANTIS/BUCIN: Buat obrolan manis, cemburu lucu, kangen, atau momen romantis yang bikin senyum-senyum sendiri.
     * Kalo ide DAILY/OLSHOP/NAGIH UTANG: Buat obrolan realistis sehari-hari yang menghibur & relatable.

${dramaticRuleInstruction}

4. ATURAN FITUR:
   - DILARANG MENGGUNAKAN type "voice" (Voice Note).
   - Gunakan type "notification" HANYA jika cerita butuh notifikasi sistem (misalnya chat dibuka dari nomor lain).
   - Selain kasus khusus, pakai type "text" saja.
5. JUMLAH PESAN: ${lengthRule} Wajib penuhi target jumlah pesan TEPAT, jangan kurang.
6. Respon HANYA string JSON murni tanpa pembungkus markdown backtick.`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      count = 8,
      voiceStyle = 'dramatic',
    } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt kosong' }, { status: 400 });
    }

    if (!GEMINI_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY tidak dikonfigurasi di server.' }, { status: 500 });
    }

    const systemInstruction = buildSystemPrompt(Number(count), voiceStyle);
    const userPrompt = `${systemInstruction}\n\nIde Cerita & Spesifikasi User:\n${prompt.trim()}`;

    let geminiRes: Response | null = null;
    let lastError = '';

    // ── Try each model in chain ─────────────────────────────────────────────
    for (const model of MODEL_CHAIN) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      try {
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: userPrompt }] },
            ],
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 8192,
            },
          }),
        });

        if (res.ok) {
          geminiRes = res;
          break;
        } else {
          const errText = await res.text();
          lastError = `Model ${model} HTTP ${res.status}: ${errText.slice(0, 200)}`;
          console.warn(`[AI Generator] ${lastError}`);
        }
      } catch (e: any) {
        lastError = `Model ${model} exception: ${e.message}`;
        console.warn(`[AI Generator] ${lastError}`);
      }
    }

    if (!geminiRes) {
      return NextResponse.json(
        { error: `Semua Gemini model gagal. Error terakhir: ${lastError}` },
        { status: 500 }
      );
    }

    const geminiJson = await geminiRes.json();
    let rawText: string = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // ── Clean markdown wrappers ──────────────────────────────────────────────
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    // ── Extract JSON object ──────────────────────────────────────────────────
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      rawText = rawText.substring(firstBrace, lastBrace + 1);
    }

    // ── Parse & return ───────────────────────────────────────────────────────
    try {
      const parsed = JSON.parse(rawText);
      return NextResponse.json(parsed);
    } catch (parseErr) {
      console.error('[AI Generator] JSON parse failed. Raw:', rawText.slice(0, 500));
      return NextResponse.json({ error: 'AI menghasilkan format yang tidak valid — coba generate ulang.' }, { status: 500 });
    }
  } catch (e: any) {
    console.error('[POST /api/ai-generator] Error:', e);
    return NextResponse.json(
      { error: `Internal server error: ${e.message}` },
      { status: 500 }
    );
  }
}
