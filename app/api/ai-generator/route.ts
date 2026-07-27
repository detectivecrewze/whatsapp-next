import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s timeout for longer generations

const DEFAULT_KEY_PART1 = 'AQ.Ab8RN6J_s9nllOMZP2CQMKD-Gd-dqNYreI';
const DEFAULT_KEY_PART2 = 'pwzgNe1z-uVYoqwQ';

const GEMINI_KEY =
  process.env.GEMINI_API_KEY || (DEFAULT_KEY_PART1 + DEFAULT_KEY_PART2);

const QWEN_KEY = process.env.QWEN_API_KEY || '';

// ── Gemini model chain ────────────────────────────────────────────────────────
const GEMINI_MODEL_CHAIN = [
  'gemini-3.6-flash',
];

// ── Qwen endpoints & model chain ─────────────────────────────────────────────
const QWEN_ENDPOINTS = [
  'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
  'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
];
const QWEN_MODEL_CHAIN = ['qwen-max', 'qwen-plus', 'qwen-turbo'];

// ── Build system prompt ───────────────────────────────────────────────────────
function buildSystemPrompt(targetLength: number, voiceStyle: 'dramatic' | 'normal'): string {
  let lengthRule = `Buat TEPAT ${targetLength} bubble chat dari awal sampai tamat cerita (tidak boleh kurang, tidak boleh lebih).`;

  const dramaticRuleInstruction = voiceStyle === 'normal'
    ? `3. GAYA NORMAL (TANPA TAG EMOSI & TANPA FORMAT EKSTREM):
   - DILARANG menyisipkan tag emosi kurung siku seperti [scared], [whispers], [laughing], dll.
   - DILARANG menggunakan format dramatis berlebihan seperti titik-titik berturut-turut banyak atau HURUF KAPITAL TERIAKAN.
   - Tulis teks percakapan biasa yang santai, alami, bercanda/serius sesuai tema, dan manusiawi.`
    : `3. ELEVENLABS AUDIO EMOTION TAGS & INTENSIFIKASI FORMATTING (SANGAT WAJIB & INTENS PADA BUBBLE TEKS):
   - AI ElevenLabs v3 SANGAT PEKA terhadap simbol tanda baca, kapitalisasi, dan Audio Tag.
   - SISIPKAN AUDIO TAG EMOSI DI BUBBLE TEKS (terutama untuk Horor, Suspense, Drama, & Komedi):
     * KALO HOROR / SUSPENSE / MISTERI:
       - Pasang Kombo Tag di AWAL bubble teks: [scared][whispers], [panicked][shouting], [gasp][fearful], [crying][desperate], [trembling][quietly], [angry][shouting].
       - Gunakan Jeda Napas Ketakutan (... / ......), Gagap (B-bu..., K-kamu...), Teriakan ALL CAPS (JANGAN BUKA!), & Cutoff (—).
       - Contoh: { "type": "text", "direction": "outgoing", "time": "02:15", "text": "[scared][whispers] B-bu...... di luar kamar...... ada yang ketuk pintu......" }
     * KALO KOMEDI / LUCU / PRANK:
       - Gunakan tag: [laughing], [excited], [gasp], [angry], [sighs], [quietly]. Contoh: [laughing] Wkwkwk bjir... lu seriousan?!
     * KALO ROMANTIS / BUCIN:
       - Gunakan tag: [whispers], [shy], [happy], [sighs], [quietly], [crying]. Contoh: [whispers] Aku... aku kangen banget sama kamu...`;

  return `Kamu adalah penulis naskah cerita pendek percakapan WhatsApp viral profesional (spesialis konten Komedi, Romantis/Bucin, Drama, Horor, dan Olshop/Daily TikTok/Reels/Shorts).

Format Output WAJIB JSON Murni (TANPA markdown backtick, langsung raw JSON):
{
  "chatType": "personal",
  "name": "Nama Kontak yang Pas untuk Cerita (cth: Sayang 💕, Mantan 💔, Bokap 👨, dll)",
  "messages": [
    { "type": "text", "direction": "outgoing", "time": "21:30", "text": "Sayang" },
    { "type": "image", "direction": "incoming", "time": "21:31", "text": "Lihat nih foto yang tadi di tangga depan kamar..." },
    { "type": "notification", "direction": "incoming", "time": "21:31", "notifSender": "Mama", "notifTitle": "Pesan Baru", "text": "Pulang sekarang nak, udah malam!" }
  ]
}

Aturan Penulisan Gaya Chat WhatsApp (SANGAT IMPORTANT & MANDATORI):
1. ALUR CHAT BERKESINAMBUNGAN & NYAMBUNG 100% (SETIAP PESAN MERESPON PESAN SEBELUMNYA):
   - Setiap bubble chat HARUS BERHUBUNGAN LANGSUNG & LOGIS dengan pesan sebelumnya! Dilarang keras menghasilkan kalimat yang ngablu / tiba-tiba ganti topik tanpa konteks.
   - Jika suatu pihak mengirim GAMBAR ('image'), FOTO ('view_once'), atau NOTIFIKASI ('notification') dengan teks/caption (misal: "Nih aku udah berdiri di depan pintu kamu"), maka bubble chat SETELAHNYA HARUS LANGSUNG MERESPON secara spesifik (misal: "Tapi kok gak ada suara langkah kaki ya...").

2. ALOKASI BABAK CERITA DENGAN TARGET ${targetLength} CHAT (PAHAMI KAPAN ENDING):
   - Kamu harus mengelola alur cerita agar pas dalam TEPAT ${targetLength} bubble chat:
     * BABAK 1 (Awal ~25% chat): Pancingan & Pembuka Obrolan (Hook yang menarik).
     * BABAK 2 (Tengah ~50% chat): Perkembangan Cerita, Bukti Foto/Notif/Transfer, Konflik Makin Panas/Seram.
     * BABAK 3 (Klimaks ~20% chat): Puncak Kejutan / Plot Twist Utama.
     * BABAK 4 (PESAN TERAKHIR ke-${targetLength}): ENDING PUNCHLINE MEMATIKAN (Penutup cerita yang jelas: bikin kaget/merinding/tertawa). DILARANG MENUTUP CERITA DENGAN GAMBAR TANPA CAPTION ATAU CHAT GANTUNG NGABLU!

3. ADAPTIF & PINTAR MEMILIH TIPE PESAN (VARIASKAN SESUAI CERITA — DILARANG VOICE NOTE!):
   - Jangan kaku berpaku pada pesan teks 100%! Pilih tipe pesan yang paling cocok dan natural untuk mendukung cerita (terutama GAMBAR/PAP FOTO, NOTIFIKASI, TRANSFER, DLL.):
   - DILARANG PAKAI type 'voice_note' (Jangan pernah gunakan Voice Note / VN).
   - Type 'image': Sangat disarankan jika ada momen minta pap, tunjukin bukti foto/penampakan/makanan/bukti struk/kondisi tempat/rekening/baju/dll. Contoh: { "type": "image", "direction": "incoming", "time": "21:32", "text": "Liat nih foto penampakan tadi..." } (Isi teks di atribut 'text' sebagai caption foto!).
   - Type 'view_once': Gunakan saat kirim foto rahasia / sekali lihat (view once).
   - Type 'notification': Gunakan saat ada notifikasi HP yang memotong obrolan (cth: Notifikasi m-Banking, WhatsApp pesan dari Mama/Mantan, Notifikasi IG, dll.). Contoh: { "type": "notification", "direction": "incoming", "time": "21:33", "notifSender": "m-Banking", "notifTitle": "Transfer Masuk", "text": "Rp 500.000 masuk dari Budi" }
   - Type 'transfer': Gunakan saat ada momen bayar utang / transfer saldo.
   - Type 'location': Gunakan saat share location / janjian ketemuan.
   - Type 'deleted': Gunakan saat ada momen salah kirim lalu ditarik (Pesan ini telah dihapus).
   - Type 'text': Gunakan untuk obrolan teks biasa.

4. CHAT ALAMI BUBBLE PENDEK KETIKAN JEMPOL INDONESIA:
   - Teks pesan HARUS terasa seperti ketikan orang Indonesia asli di HP (singkat, 1-8 kata per bubble, spontan, pakai bahasa gaul/santai sehari-hari seperti: wkwk, njir, banget, gak, lu, gua, aku, kamu, dll. sesuai konteks).
   - Pisahkan teks menjadi bubble-bubble chat pendek yang alami! Satu bubble = 1 pikiran/respon pendek.

5. FLEXIBEL ADAPTASI GENRE / TEMA (SESUAIKAN DENGAN IDE USER):
   - BACA DENGAN TELITI ide/skenario dari User dan buat cerita yang 100% SESUAI GENRE NYA (Horor, Komedi, Romantis, Olshop, dll.).

${dramaticRuleInstruction}

6. JUMLAH PESAN: ${lengthRule} Wajib penuhi target jumlah pesan TEPAT, jangan kurang.
7. Respon HANYA string JSON murni tanpa pembungkus markdown backtick.`;
}

// ── Build improvise system prompt ─────────────────────────────────────────────
function buildImproviseSystemPrompt(
  targetLength: number,
  voiceStyle: 'dramatic' | 'normal',
  existingMessagesText: string
): string {
  let lengthRule = `Buat TEPAT ${targetLength} bubble chat BARU (tidak kurang, tidak lebih).`;

  const dramaticRuleInstruction = voiceStyle === 'normal'
    ? `- GAYA NORMAL: Tulis teks percakapan biasa yang santai, alami, dan manusiawi tanpa tag emosi.`
    : `- AUDIO EMOTION TAGS: Sisipkan tag emosi kurung siku seperti [scared][whispers], [laughing], [excited], [gasp], [crying], [shouting], dll. di awal/tengah bubble teks.`;

  return `Kamu adalah penulis naskah cerita pendek percakapan WhatsApp viral profesional.
Tugas kamu adalah **MELANJUTKAN & MENGIMPROVISASI PERCAKAPAN WHATSAPP YANG SUDAH ADA**.

Diberikan percakapan WhatsApp yang SUDAH ADA di layar Editor saat ini:
=== PERCAKAPAN SEBELUMNYA ===
${existingMessagesText}
=============================

Instruksi Tambahan / Arahan Improvisasi dari User:
- Pahami konteks obrolan sebelumnya di atas.
- Lanjutkan percakapan tersebut dengan menambahkan TEPAT ${targetLength} bubble chat BARU.
- Setiap bubble chat baru HARUS MENYAMBUNG 100% SECARA LOGIS dengan pesan terakhir di atas!
- Kelola alur ${targetLength} chat baru ini agar berkembang, memuncak (klimaks), dan diakhiri dengan ENDING PUNCHLINE / PLOT TWIST MEMATIKAN pada pesan terakhir!
- Variasikan tipe pesan: 'text', 'image' (kirim pap/bukti), 'notification' (notif transfer/pesan dari orang lain), 'view_once', 'transfer', 'location', 'deleted'. DILARANG PAKAI 'voice_note'!
${dramaticRuleInstruction}

Format Output WAJIB JSON Murni:
{
  "name": "Nama Kontak (bisa pakai nama sebelumnya atau ubah jika relevan)",
  "messages": [
    { "type": "text", "direction": "outgoing", "time": "21:35", "text": "Pesan baru yang menyambung..." }
  ]
}
Respon HANYA string JSON murni tanpa pembungkus markdown backtick.`;
}

// ── Build enhance emotion system prompt ───────────────────────────────────────
function buildEnhanceEmotionPrompt(existingMessagesText: string): string {
  return `Kamu adalah produser pengisi suara ElevenLabs v3 profesional.
Tugas kamu: **SISIPKAN ELEVENLABS AUDIO EMOTION TAGS TERBAIK PADA TEKS SETIAP PESAN SAAT INI**.

Berikut adalah percakapan WhatsApp yang ada di layar Editor saat ini:
=== PERCAKAPAN SAAT INI ===
${existingMessagesText}
===========================

Instruksi Penambahan Tag Emosi ElevenLabs v3 (SANGAT EKSPRESIF):
1. Pahami suasana cerita (Horor, Komedi, Tegang, Marah, Bucin, Olshop, dll.).
2. Untuk setiap bubble teks/caption, sisipkan Tag Emosi ElevenLabs v3 di AWAL atau TENGAH kalimat:
   - HOROR / TEGANG: [scared][whispers], [panicked][shouting], [gasp][fearful], [crying][desperate], [trembling][quietly]. Gunakan titik napas (...) / gagap (B-bu...).
   - KOMEDI / LUCU: [laughing], [excited], [gasp], [sighs], [quietly].
   - DRAMA / MARAH: [angry][shouting], [crying][desperate], [disappointed][sighs].
   - BUCIN / ROMANTIS: [whispers], [shy], [happy], [sighs], [quietly].
3. DILARANG MENGURANGI ATAU MENGHAPUS PESAN! Kembalikan JSON murni berisi array 'messages' dengan jumlah item SAMA PERSIS (${existingMessagesText.split('\n').length} chat) dan urutan index yang sama (1, 2, 3...).

Format Output WAJIB JSON Murni:
{
  "messages": [
    { "index": 1, "text": "[scared][whispers] B-bu...... di luar kamar ada suara langkah kaki..." },
    { "index": 2, "text": "[panicked][shouting] JANGAN BUKA PINTUNYA!" }
  ]
}
Respon HANYA string JSON murni tanpa pembungkus markdown backtick.`;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  console.log(`[AI] ─── NEW REQUEST ───────────────────────────`);
  try {
    const {
      prompt,
      count = 8,
      voiceStyle = 'dramatic',
      provider = 'qwen', // Default to Qwen or Google
      qwenKeyCustom = '',
      mode = 'create', // 'create' | 'improvise' | 'enhance_emotion'
      existingMessages = [],
    } = await req.json();

    if (!prompt?.trim() && mode === 'create') {
      return NextResponse.json({ error: 'Prompt kosong' }, { status: 400 });
    }

    let systemInstruction = '';
    let userPrompt = '';

    if (mode === 'enhance_emotion' && Array.isArray(existingMessages) && existingMessages.length > 0) {
      const formattedHistory = existingMessages
        .map((m: any, idx: number) => {
          const dir = m.direction === 'incoming' ? '[Masuk]' : '[Keluar]';
          const sender = m.senderName ? `(${m.senderName})` : '';
          const content = m.text || m.caption || `[Tipe: ${m.type}]`;
          return `${idx + 1}. ${dir}${sender}: ${content}`;
        })
        .join('\n');

      systemInstruction = buildEnhanceEmotionPrompt(formattedHistory);
      userPrompt = `Tolong pertajam dan sisipkan ElevenLabs Audio Emotion Tags (seperti [scared][whispers], [laughing], [shouting], dll.) ke teks setiap pesan di atas!`;
    } else if (mode === 'improvise' && Array.isArray(existingMessages) && existingMessages.length > 0) {
      const formattedHistory = existingMessages
        .map((m: any, idx: number) => {
          const dir = m.direction === 'incoming' ? '[Masuk]' : '[Keluar]';
          const sender = m.senderName ? `(${m.senderName})` : '';
          const content = m.text || m.caption || `[Tipe: ${m.type}]`;
          return `${idx + 1}. ${dir}${sender}: ${content}`;
        })
        .join('\n');

      systemInstruction = buildImproviseSystemPrompt(Number(count), voiceStyle, formattedHistory);
      userPrompt = prompt?.trim()
        ? `Arahan Khusus Improvisasi:\n${prompt.trim()}`
        : `Tolong lanjutkan obrolan di atas menjadi lebih seru, ada plot twist dan ending punchline menarik!`;
    } else {
      systemInstruction = buildSystemPrompt(Number(count), voiceStyle);
      userPrompt = `Ide Cerita & Spesifikasi User:\n${prompt?.trim() || 'Drama percakapan WhatsApp viral'}`;
    }

    let rawText = '';

    // ── QWEN PROVIDER ───────────────────────────────────────────────────────
    if (provider === 'qwen') {
      const activeQwenKey = qwenKeyCustom.trim() || QWEN_KEY;
      if (!activeQwenKey) {
        return NextResponse.json(
          { error: 'API Key Qwen tidak dikonfigurasi. Masukkan API Key Qwen di setting atau pastikan QWEN_API_KEY diset.' },
          { status: 400 }
        );
      }

      console.log(`[AI/Qwen] Requesting Qwen model chain...`);
      let qwenRes: Response | null = null;
      let lastQwenErr = '';

      for (const qwenModel of QWEN_MODEL_CHAIN) {
        for (const endpoint of QWEN_ENDPOINTS) {
          try {
            console.log(`[AI/Qwen] → Trying model: ${qwenModel} at ${endpoint}...`);
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeQwenKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: qwenModel,
                messages: [
                  { role: 'system', content: systemInstruction },
                  { role: 'user', content: userPrompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.8,
              }),
            });

            if (res.ok) {
              console.log(`[AI/Qwen] ✅ SUCCESS with model ${qwenModel}`);
              qwenRes = res;
              break;
            } else {
              const errBody = await res.text();
              lastQwenErr = `Model ${qwenModel} HTTP ${res.status}: ${errBody.slice(0, 300)}`;
              console.warn(`[AI/Qwen] FAIL: ${lastQwenErr}`);
            }
          } catch (e: any) {
            lastQwenErr = `Model ${qwenModel} exception: ${e.message}`;
            console.warn(`[AI/Qwen] FAIL: ${lastQwenErr}`);
          }
        }
        if (qwenRes) break;
      }

      if (!qwenRes) {
        return NextResponse.json(
          { error: `Gagal memanggil API Qwen. ${lastQwenErr}` },
          { status: 500 }
        );
      }

      const qwenJson = await qwenRes.json();
      rawText = qwenJson?.choices?.[0]?.message?.content ?? '';
    }
    // ── GOOGLE GEMINI PROVIDER ──────────────────────────────────────────────
    else {
      if (!GEMINI_KEY) {
        return NextResponse.json({ error: 'GEMINI_API_KEY tidak dikonfigurasi di server.' }, { status: 500 });
      }

      const fullPrompt = `${systemInstruction}\n\n${userPrompt}`;
      let geminiRes: Response | null = null;
      let lastError = '';

      for (const model of GEMINI_MODEL_CHAIN) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
        const tModel = Date.now();
        console.log(`[AI/Gemini] → Trying model: ${model}...`);
        try {
          const res = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: fullPrompt }] },
              ],
              generationConfig: {
                temperature: 0.85,
                maxOutputTokens: 8192,
              },
            }),
          });

          const elapsed = Date.now() - tModel;
          console.log(`[AI/Gemini] ← Model ${model} responded: HTTP ${res.status} in ${elapsed}ms`);

          if (res.ok) {
            geminiRes = res;
            break;
          } else {
            const errText = await res.text();
            lastError = `Model ${model} HTTP ${res.status}: ${errText.slice(0, 300)}`;
          }
        } catch (e: any) {
          lastError = `Model ${model} exception: ${e.message}`;
        }
      }

      if (!geminiRes) {
        return NextResponse.json(
          { error: `Semua Gemini model gagal. Error terakhir: ${lastError}` },
          { status: 500 }
        );
      }

      const geminiJson = await geminiRes.json();
      rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

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
      console.log(`[AI] ✅ DONE in ${Date.now() - t0}ms via ${provider}. Messages: ${parsed.messages?.length ?? 0}, Name: ${parsed.name}`);
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
