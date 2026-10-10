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
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
];

// ── Qwen endpoints & model chain ─────────────────────────────────────────────
const QWEN_ENDPOINTS = [
  'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
  'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
];
const QWEN_MODEL_CHAIN = ['qwen-max', 'qwen-plus', 'qwen-turbo'];

type StoryType = 'drama_product' | 'horror';
type RevealType = 'link' | 'image';

interface ProductBrief {
  url?: string;
  name?: string;
  description?: string;
  image?: string;
}

interface ExistingMessageBrief {
  direction?: string;
  senderName?: string;
  text?: string;
  caption?: string;
  type?: string;
  imageHint?: string;
}

function buildStoryDirective(
  storyType: StoryType,
  product?: ProductBrief | null,
  revealType: RevealType = 'link',
): string {
  if (storyType === 'horror') {
    return `JENIS KONTEN: FAKE CHAT HORROR
- Mulai dengan kejadian biasa yang langsung memancing rasa penasaran dalam 1-2 bubble pertama.
- Naikkan ketegangan secara bertahap lewat detail kecil yang realistis, bukan narasi panjang.
- Pesan terakhir harus menjadi plot twist yang jelas dan pendek.
- Jangan gunakan link produk, promosi, komedi, tag suara, atau kalimat narator.
- Kamu BOLEH memakai maksimal satu bubble type "image" atau "view_once" jika bukti visual benar-benar membuat cerita lebih menyeramkan (contoh: foto lorong, tangkapan layar CCTV, atau sosok di jendela). Ini pilihan, bukan kewajiban.
- Jangan selalu menaruh gambar sebagai pesan terakhir. Setelah gambar, percakapan boleh berlanjut agar tokoh bereaksi dan plot twist terasa hidup.
- Jika memakai image/view_once, isi "imageHint" dengan deskripsi visual singkat dan konkret untuk membantu user memilih foto. Caption harus tetap berupa ucapan natural dari pengirim, bukan deskripsi gambar. Jangan mengarang URL gambar.`;
  }

  const safeProduct = {
    url: product?.url?.trim() || 'https://produk-kamu.com',
    name: product?.name?.trim() || 'Produk Digital',
    description: product?.description?.trim() || 'Klik untuk membuka',
  };

  if (revealType === 'image') {
    return `JENIS KONTEN: DRAMA + PRODUCT REVEAL
- Ini adalah cerita drama singkat, bukan iklan. Produk harus masuk sebagai penyelesaian emosi atau kejutan di akhir.
- Bangun pola: hook konflik → respons emosional → rasa penasaran → satu kalimat pengantar → foto/barcode.
- Pesan TERAKHIR wajib type "image". Aplikasi akan memasang foto/barcode asli milik user, jadi jangan mengarang URL atau isi gambar.
- Untuk pesan image terakhir, isi field caption dengan satu kalimat pendek yang natural sesuai konteks. Kosongkan caption jika bubble sebelumnya sudah menjadi pengantar yang jelas.
- Gambar dikirim oleh pihak yang menawarkan solusi/kejutan.
- Jangan menyebut istilah produk digital, soft selling, CTA, penonton, konten, iklan, atau menjelaskan bahwa gambar tersebut adalah barcode kecuali ide user memang memerlukannya.`;
  }

  return `JENIS KONTEN: DRAMA + PRODUCT REVEAL
- Ini adalah cerita drama singkat, bukan iklan. Produk harus masuk sebagai penyelesaian emosi atau kejutan di akhir.
- Bangun pola: hook konflik → respons emosional → rasa penasaran → satu kalimat pengantar → kartu link.
- Tema produk dan kalimat pengantar link WAJIB mengikuti ide user. Jangan memakai kalimat tentang minta maaf atau "sedikit tenang" jika ceritanya ulang tahun, hadiah, atau tema lain.
- Hanya boleh ada SATU ajakan membuka link: pilih salah satu antara bubble sebelum kartu ATAU field text pada kartu link. Jangan menulis dua ajakan yang maknanya sama.
- Pesan TERAKHIR wajib type "link" dan gunakan data produk berikut PERSIS, jangan mengarang URL/judul baru:
  linkUrl: ${JSON.stringify(safeProduct.url)}
  linkTitle: ${JSON.stringify(safeProduct.name)}
  linkDescription: ${JSON.stringify(safeProduct.description)}
  linkImage: ""
- Kartu link dikirim oleh pihak yang menawarkan solusi/kejutan. Isi field text dengan kalimat pendek yang sesuai konteks, atau kosongkan jika bubble sebelumnya sudah mengajak membuka link.
- Thumbnail asli dipasang otomatis oleh aplikasi setelah AI selesai; jangan mengarang URL gambar.
- Jangan menyebut istilah produk digital, soft selling, CTA, penonton, konten, atau iklan di dalam percakapan.`;
}

// ── Build system prompt ───────────────────────────────────────────────────────
function buildSystemPrompt(
  targetLength: number,
  storyType: StoryType,
  product?: ProductBrief | null,
  revealType: RevealType = 'link',
): string {
  return `Kamu adalah penulis naskah fake chat WhatsApp untuk video TikTok dan Reels Indonesia.

${buildStoryDirective(storyType, product, revealType)}

ATURAN CERITA:
1. Buat TEPAT ${targetLength} bubble chat dari awal sampai ending. Tidak boleh kurang atau lebih.
2. Setiap bubble harus merespons bubble sebelumnya dan menjaga identitas dua tokoh secara konsisten.
3. "outgoing" adalah pemilik HP; "incoming" adalah kontak lawan bicara.
4. Gunakan bahasa Indonesia sehari-hari yang natural. Satu bubble berisi satu pikiran, idealnya 2-14 kata.
5. Percakapan harus terasa seperti dua orang yang sudah saling mengenal. Hindari bahasa formal/kaku seperti "aku percaya kamu pasti punya sesuatu yang mengejutkan", "aku baik-baik saja kok", atau kalimat yang menjelaskan situasi secara terang-terangan.
6. Jangan mengulang informasi, pertanyaan, maupun ajakan yang sama di dua bubble berurutan. Respons harus membawa percakapan maju.
7. Utamakan ketikan jempol yang spontan: respons pendek, sedikit tidak sempurna, dan sesuai emosi. Jangan membuat setiap bubble menjadi kalimat lengkap yang rapi.
8. Jangan memakai tag ElevenLabs seperti [scared], [whispers], atau teks narasi dalam tanda kurung.
9. Jangan memakai voice_note. Tipe yang diizinkan: text, link, image, view_once, notification, transfer, location, deleted.
10. Gunakan image/view_once/notifikasi hanya jika benar-benar membantu alur. Untuk media visual, caption adalah ucapan pengirim dan imageHint adalah petunjuk foto yang perlu disiapkan user.
11. Jam harus maju secara wajar dengan format HH:MM.
12. Sebelum mengeluarkan JSON, lakukan pengecekan diam-diam: siapa pemilik HP, siapa kontak, siapa yang mengalami masalah, siapa yang menawarkan solusi, dan apa yang sudah diketahui masing-masing. Perbaiki setiap kata ganti atau respons yang tertukar.

FORMAT OUTPUT — JSON MURNI TANPA MARKDOWN:
{
  "chatType": "personal",
  "name": "Nama kontak yang sesuai cerita",
  "messages": [
    { "type": "text", "direction": "outgoing", "time": "21:30", "text": "Isi pesan" },
    { "type": "text", "direction": "incoming", "time": "21:31", "text": "Balasan" }
  ]
}

Jika memakai type "link", formatnya:
{ "type": "link", "direction": "incoming", "time": "21:35", "text": "Kalimat pengantar singkat", "linkUrl": "https://...", "linkTitle": "Judul", "linkDescription": "Deskripsi", "linkImage": "https://... atau kosong" }

Jika memakai type "image", formatnya:
{ "type": "image", "direction": "incoming", "time": "21:35", "caption": "Kalimat pendek yang menyertai gambar", "imageHint": "Deskripsi singkat isi foto yang dibutuhkan" }

Jika memakai type "view_once", gunakan format yang sama dengan image dan ubah type menjadi "view_once".

Kembalikan hanya JSON valid.`;
}

// ── Build improvise system prompt ─────────────────────────────────────────────
function buildImproviseSystemPrompt(
  targetLength: number,
  existingMessagesText: string,
): string {
  return `Kamu adalah penulis naskah fake chat WhatsApp untuk video TikTok dan Reels Indonesia.
Tugasmu adalah MELANJUTKAN percakapan yang sudah ada tanpa mengulang atau mengubah pesan lama.

=== PERCAKAPAN SEBELUMNYA ===
${existingMessagesText}
=============================

ATURAN LANJUTAN:
- Tambahkan TEPAT ${targetLength} bubble BARU.
- Bubble pertama harus langsung merespons pesan terakhir percakapan lama.
- Jaga identitas dan arah incoming/outgoing secara konsisten.
- Ikuti suasana, hubungan tokoh, dan konflik yang sudah terbentuk. Jangan mengubahnya menjadi promosi atau genre lain tanpa diminta user.
- Gunakan bahasa Indonesia sehari-hari yang spontan, satu pikiran per bubble, tanpa tag emosi ElevenLabs dan tanpa narasi.
- Secara default gunakan type "text". Tidak ada kewajiban mengakhiri chat dengan foto, link, produk, CTA, atau plot twist.
- DILARANG menambahkan kartu link secara otomatis. Gunakan type "link" hanya jika arahan user secara eksplisit meminta link dan memberikan konteks link yang jelas.
- Kamu BOLEH memakai maksimal satu type "image" atau "view_once" hanya jika arahan user atau alur percakapan benar-benar membutuhkan bukti visual. Jika dipakai, isi caption dengan ucapan natural dan imageHint dengan deskripsi singkat foto yang perlu diunggah user. Jangan mengarang URL gambar.
- Jangan memakai voice_note.
- Jam harus melanjutkan waktu percakapan lama secara wajar.

FORMAT OUTPUT — JSON MURNI TANPA MARKDOWN:
{
  "name": "Nama kontak",
  "messages": [
    { "type": "text", "direction": "outgoing", "time": "21:35", "text": "Pesan baru yang menyambung" }
  ]
}

Format media opsional:
{ "type": "image", "direction": "incoming", "time": "21:36", "caption": "Coba lihat ini deh", "imageHint": "Foto lorong rumah yang gelap dengan bayangan samar di ujung" }

Kembalikan hanya JSON valid.`;
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

async function requestGemini(
  systemInstruction: string,
  userPrompt: string,
  customKey = '',
): Promise<string> {
  const activeGeminiKey = customKey.trim() || GEMINI_KEY;
  if (!activeGeminiKey) throw new Error('GEMINI_API_KEY tidak dikonfigurasi.');

  const fullPrompt = `${systemInstruction}\n\n${userPrompt}`;
  let lastError = '';

  for (const model of GEMINI_MODEL_CHAIN) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeGeminiKey}`;
    const startedAt = Date.now();
    console.log(`[AI/Gemini] → Trying model: ${model}...`);
    try {
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.72,
            maxOutputTokens: 8192,
          },
        }),
      });

      console.log(`[AI/Gemini] ← ${model}: HTTP ${response.status} in ${Date.now() - startedAt}ms`);
      if (response.ok) {
        const json = await response.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) return text;
        lastError = `${model} mengembalikan respons kosong.`;
      } else {
        const body = await response.text();
        lastError = `${model} HTTP ${response.status}: ${body.slice(0, 300)}`;
      }
    } catch (error) {
      lastError = `${model}: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  throw new Error(lastError || 'Semua model Gemini gagal.');
}

async function requestQwen(
  systemInstruction: string,
  userPrompt: string,
  customKey = '',
): Promise<string> {
  const activeQwenKey = customKey.trim() || QWEN_KEY;
  if (!activeQwenKey) throw new Error('QWEN_API_KEY tidak dikonfigurasi.');

  let lastError = '';
  for (const model of QWEN_MODEL_CHAIN) {
    for (const endpoint of QWEN_ENDPOINTS) {
      try {
        console.log(`[AI/Qwen] → Trying model: ${model}...`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeQwenKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.72,
          }),
        });

        if (response.ok) {
          const json = await response.json();
          const text = json?.choices?.[0]?.message?.content ?? '';
          if (text) return text;
          lastError = `${model} mengembalikan respons kosong.`;
        } else {
          const body = await response.text();
          lastError = `${model} HTTP ${response.status}: ${body.slice(0, 300)}`;
        }
      } catch (error) {
        lastError = `${model}: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  }

  throw new Error(lastError || 'Semua model Qwen gagal.');
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  console.log(`[AI] ─── NEW REQUEST ───────────────────────────`);
  try {
    const {
      prompt,
      count = 8,
      provider = 'google', // Gemini is the primary writer; Qwen remains available as a fallback provider.
      geminiKeyCustom = '',
      qwenKeyCustom = '',
      mode = 'create', // 'create' | 'improvise' | 'enhance_emotion'
      storyType = 'drama_product',
      revealType = 'link',
      product = null,
      existingMessages = [],
    } = await req.json();

    const normalizedStoryType: StoryType = storyType === 'horror' ? 'horror' : 'drama_product';
    const normalizedRevealType: RevealType = revealType === 'image' ? 'image' : 'link';

    if (!prompt?.trim() && mode === 'create') {
      return NextResponse.json({ error: 'Prompt kosong' }, { status: 400 });
    }

    let systemInstruction = '';
    let userPrompt = '';

    if (mode === 'enhance_emotion' && Array.isArray(existingMessages) && existingMessages.length > 0) {
      const formattedHistory = existingMessages
        .map((m: ExistingMessageBrief, idx: number) => {
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
        .map((m: ExistingMessageBrief, idx: number) => {
          const dir = m.direction === 'incoming' ? '[Masuk]' : '[Keluar]';
          const sender = m.senderName ? `(${m.senderName})` : '';
          const content = m.text || m.caption || `[Tipe: ${m.type}]`;
          const mediaContext = m.imageHint ? ` [Isi visual: ${m.imageHint}]` : '';
          return `${idx + 1}. ${dir}${sender}: ${content}${mediaContext}`;
        })
        .join('\n');

      systemInstruction = buildImproviseSystemPrompt(
        Number(count),
        formattedHistory,
      );
      userPrompt = prompt?.trim()
        ? `Arahan Khusus Improvisasi:\n${prompt.trim()}`
        : `Lanjutkan obrolan di atas secara natural. Tidak perlu menambahkan foto, link, produk, CTA, atau ending khusus.`;
    } else {
      systemInstruction = buildSystemPrompt(Number(count), normalizedStoryType, product, normalizedRevealType);
      userPrompt = `Ide Cerita & Spesifikasi User:\n${prompt?.trim() || 'Drama percakapan WhatsApp viral'}`;
    }

    let rawText = '';
    let activeProvider = provider === 'qwen' ? 'qwen' : 'google';
    const providerOrder = provider === 'qwen' ? ['qwen'] : ['google', 'qwen'];
    const providerErrors: string[] = [];

    for (const candidate of providerOrder) {
      try {
        rawText = candidate === 'google'
          ? await requestGemini(systemInstruction, userPrompt, geminiKeyCustom)
          : await requestQwen(systemInstruction, userPrompt, qwenKeyCustom);
        activeProvider = candidate;
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        providerErrors.push(`${candidate}: ${message}`);
        console.warn(`[AI] ${candidate} failed${candidate === 'google' ? ', trying Qwen fallback' : ''}: ${message}`);
      }
    }

    if (!rawText) {
      return NextResponse.json(
        { error: `Semua provider AI gagal. ${providerErrors.join(' | ')}` },
        { status: 500 },
      );
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
      console.log(`[AI] ✅ DONE in ${Date.now() - t0}ms via ${activeProvider}. Messages: ${parsed.messages?.length ?? 0}, Name: ${parsed.name}`);
      return NextResponse.json(parsed);
    } catch {
      console.error('[AI] JSON parse failed. Raw:', rawText.slice(0, 500));
      return NextResponse.json({ error: 'AI menghasilkan format yang tidak valid — coba generate ulang.' }, { status: 500 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[AI] FATAL after ${Date.now() - t0}ms:`, error);
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
