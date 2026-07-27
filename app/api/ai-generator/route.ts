import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s timeout for longer generations

const DEFAULT_KEY_PART1 = 'AQ.Ab8RN6J_s9nllOMZP2CQMKD-Gd-dqNYreI';
const DEFAULT_KEY_PART2 = 'pwzgNe1z-uVYoqwQ';

const GEMINI_KEY =
  process.env.GEMINI_API_KEY || (DEFAULT_KEY_PART1 + DEFAULT_KEY_PART2);

// ── Gemini model (gemini-3.6-flash = ~6s, terbukti paling cepat untuk key ini) ──
const MODEL_CHAIN = [
  'gemini-3.6-flash',
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
1. INTI CHAT HARUS TEKS BUBBLE REALISTIS (95%+ PESAN ADALAH TEKS):
   - Sebagian besar percakapan (95%+) HARUS menggunakan type "text".
   - Pesan buatanmu HARUS terasa seperti teks asli orang Indonesia yang diketik pakai jempol di HP (singkat, 1-8 kata per bubble, spontan, pakai bahasa gaul/santai sehari-hari seperti: wkwk, njir, banget, gak, lu, gua, aku, kamu, dll. sesuai konteks).
   - DILARANG BIKIN KALIMAT NARRATIVE TEATER PANJANG BAKU BOHONGAN.
   - Pisahkan teks menjadi bubble-bubble chat pendek yang alami! Satu bubble = 1 pikiran/respon pendek.

2. ATURAN PENGGUNAAN TIPE PESAN NON-TEKS (SPARINGLY & KETAT):
   - DILARANG MENGGUNAKAN type "voice_note" (Jangan pernah pakai Voice Note).
   - Tipe selain teks ("image", "view_once", "transfer", "location", "contact", "deleted", "notification") HANYA DIGUNAKAN JIKA SANGAT COCOK & RELEVAN DENGAN ALUR CERITA (Maksimal 1 atau 2 pesan non-teks dalam seluruh cerita):
     * "notification" : Gunakan HANYA jika cerita membutuhkan Notifikasi Push Popup HP di atas layar (cth: Notifikasi m-Banking transfer masuk, notifikasi pesan dari Mama/Orang tua yang memotong obrolan, notifikasi akun Instagram, dll.). Format JSON: { "type": "notification", "notifSender": "Mama", "notifTitle": "Pesan Baru", "text": "Pulang sekarang nak, udah malam!" }
     * "transfer" : Gunakan HANYA jika ada adegan spesifik transfer uang (cth: bokap transfer / bayar utang).
     * "image" / "view_once" : Gunakan HANYA jika cerita spesifik meminta pap foto / bukti foto.
     * "location" : Gunakan HANYA jika cerita spesifik tentang share location ketemuan.
     * "deleted" : Gunakan HANYA jika ada adegan spesifik salah kirim / pesan ditarik.
   - Jika cerita berupa obrolan santai/drama/curhat biasa, gunakan 100% PESAN TEKS ("text").

3. FLEXIBEL ADAPTASI GENRE / TEMA (SESUAIKAN DENGAN IDE USER):
   - BACA DENGAN TELITI ide/skenario dari User dan buat cerita yang 100% SESUAI GENRE NYA (Horor, Komedi, Romantis, Olshop, dll.).

${dramaticRuleInstruction}

5. JUMLAH PESAN: ${lengthRule} Wajib penuhi target jumlah pesan TEPAT, jangan kurang.
6. Respon HANYA string JSON murni tanpa pembungkus markdown backtick.`;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  console.log(`[AI] ─── NEW REQUEST ───────────────────────────`);
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

    console.log(`[AI] Prompt built. Chars: ${userPrompt.length}, Count: ${count}, VoiceStyle: ${voiceStyle}`);

    let geminiRes: Response | null = null;
    let lastError = '';

    // ── Try each model in chain ─────────────────────────────────────────────
    for (const model of MODEL_CHAIN) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      const tModel = Date.now();
      console.log(`[AI] → Trying model: ${model}...`);
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

        const elapsed = Date.now() - tModel;
        console.log(`[AI] ← Model ${model} responded: HTTP ${res.status} in ${elapsed}ms`);

        if (res.ok) {
          geminiRes = res;
          break;
        } else {
          const errText = await res.text();
          lastError = `Model ${model} HTTP ${res.status}: ${errText.slice(0, 300)}`;
          console.warn(`[AI] FAIL: ${lastError}`);
        }
      } catch (e: any) {
        const elapsed = Date.now() - tModel;
        lastError = `Model ${model} exception after ${elapsed}ms: ${e.message}`;
        console.warn(`[AI] FAIL: ${lastError}`);
      }
    }

    if (!geminiRes) {
      console.error(`[AI] All models failed after ${Date.now() - t0}ms. Last: ${lastError}`);
      return NextResponse.json(
        { error: `Semua Gemini model gagal. Error terakhir: ${lastError}` },
        { status: 500 }
      );
    }

    const tParse = Date.now();
    const geminiJson = await geminiRes.json();
    let rawText: string = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    console.log(`[AI] Response parsed in ${Date.now() - tParse}ms. Raw length: ${rawText.length} chars`);

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
      console.log(`[AI] ✅ DONE in ${Date.now() - t0}ms. Messages: ${parsed.messages?.length ?? 0}, Name: ${parsed.name}`);
      return NextResponse.json(parsed);
    } catch (parseErr) {
      console.error('[AI] JSON parse failed. Raw:', rawText.slice(0, 500));
      return NextResponse.json({ error: 'AI menghasilkan format yang tidak valid — coba generate ulang.' }, { status: 500 });
    }
  } catch (e: any) {
    console.error(`[AI] FATAL after ${Date.now() - t0}ms:`, e);
    return NextResponse.json(
      { error: `Internal server error: ${e.message}` },
      { status: 500 }
    );
  }
}
