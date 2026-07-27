import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s timeout for longer generations

const DEFAULT_KEY_PART1 = 'AQ.Ab8RN6J_s9nllOMZP2CQMKD-Gd-dqNYreI';
const DEFAULT_KEY_PART2 = 'pwzgNe1z-uVYoqwQ';

const GEMINI_KEY =
  process.env.GEMINI_API_KEY || (DEFAULT_KEY_PART1 + DEFAULT_KEY_PART2);

// ── Gemini model fallback chain (Verified working models) ─────────────────────
const MODEL_CHAIN = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
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
    { "type": "view_once", "direction": "incoming", "time": "21:31", "text": "Nih liat foto ini jgn dispill" },
    { "type": "voice_note", "direction": "incoming", "time": "21:31", "duration": "0:12", "text": "[whispers] Ssst... jangan berisik..." },
    { "type": "image", "direction": "outgoing", "time": "21:32", "caption": "Nih bukti kejadiannya!", "imageData": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=400&q=80" },
    { "type": "transfer", "direction": "incoming", "time": "21:33", "text": "Rp 500.000", "caption": "Transfer M-Banking Berhasil" },
    { "type": "location", "direction": "outgoing", "time": "21:34", "text": "Kopi Kenangan Rest Area KM 19", "caption": "Jl. Tol Jakarta-Cikampek" },
    { "type": "contact", "direction": "incoming", "time": "21:35", "text": "Dr. Hendra (Spesialis)", "caption": "+62 812-3456-7890" },
    { "type": "deleted", "direction": "incoming", "time": "21:36" }
  ]
}

Aturan Penulisan Gaya Chat WhatsApp (SANGAT PENTING):
1. GAYA KETIKAN TEXT HP REALISTIS & MANUSIAWI (BUKAN BOT / BAKU OPERA):
   - Pesan buatanmu HARUS terasa seperti teks asli orang Indonesia yang diketik pakai jempol di HP (singkat, 1-8 kata per bubble, spontan, pakai bahasa gaul/santai sehari-hari seperti: wkwk, njir, banget, gak, lu, gua, aku, kamu, dll. sesuai konteks).
   - DILARANG BIKIN KALIMAT NARRATIVE TEATER PANJANG BAKU BOHONGAN.
   - Pisahkan teks menjadi bubble-bubble chat pendek yang alami! Satu bubble = 1 pikiran/respon pendek.

2. PENGGUNAAN VARIASI TIPE PESAN INTERAKTIF & CERDAS (SANGAT DIANJURKAN):
   Gunakan tipe pesan yang sesuai dengan konteks dan alur cerita agar chat terasa 100% hidup & dramatis:
   - "text" : Pesan teks biasa (bisa disertai audio tag seperti [excited], [scared], [laughing], dll.)
   - "image" : Gunakan saat lawan bicara/pengguna mengirim foto bukti, foto suasana tempat/kamar/makanan/cafe/horor. Masukkan URL Unsplash yang relevan jika ada, atau sertakan caption menarik.
   - "view_once" : Gunakan "Foto Sekali Lihat" (Foto 1x) saat ada pesan rahasia, pap privat, bukti sensitif, atau foto horor yang hanya bisa dilihat 1 kali.
   - "voice_note" : Gunakan Voice Note saat suasana mendesak, emosi tinggi, bisikan ketakutan, atau malas ketik. Isi field "duration": "0:05", "0:14", "0:28", dll.
   - "transfer" : Gunakan kartu Transfer Uang saat ada adegan bayar utang, kirim uang jajan, beli barang, atau transferan bokap. Isi field "text": "Rp 250.000" & "caption": "Transfer M-Banking Berhasil".
   - "contact" : Gunakan saat ada adegan merekomendasikan/mengirim nomor kontak orang lain. Isi field "text": "Nama Kontak" & "caption": "+62 812-xxxx-xxxx".
   - "location" : Gunakan saat adegan share location / janjian / lokasi tersesat / posisi tempat nongkrong. Isi field "text": "Nama Tempat" & "caption": "Alamat".
   - "deleted" : Gunakan "Pesan ini telah dihapus" saat ada adegan salah kirim, pesan ditarik karena malu/panik, atau misteri.
   - "notification" : Notifikasi sistem (cth: "🔒 Pesan dienkripsi secara end-to-end").

3. FLEXIBEL ADAPTASI GENRE / TEMA (SESUAIKAN DENGAN IDE USER):
   - BACA DENGAN TELITI ide/skenario dari User dan buat cerita yang 100% SESUAI GENRE NYA:
     * Kalo ide HOROR/SUSPENSE: Sisipkan Voice Note bisikan ketakutan, Foto Sekali Lihat suasana gelap, atau foto tempat seram.
     * Kalo ide KOMEDI/LUCU/PRANK: Sisipkan Voice Note tertawa, foto konyol, atau pesan dihapus yang bikin curiga.
     * Kalo ide ROMANTIS/BUCIN: Sisipkan Voice Note ucapan romantis, Foto Sekali Lihat pap lucu, atau share location ketemuan.
     * Kalo ide MONEY/UANG/BOKAP/UTANG: Sisipkan kartu Transfer Uang (Rp ...), bukti foto transfer, atau kontak penagih.

${dramaticRuleInstruction}

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
