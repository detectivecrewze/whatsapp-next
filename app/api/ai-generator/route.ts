import { NextRequest, NextResponse } from 'next/server';
import { SFX_AI_IDS } from '@/lib/sfx';

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

type StoryType = 'drama_product' | 'comedy_product' | 'horror';
type RevealType = 'none' | 'link' | 'image';
type GeneratedChatType = 'personal' | 'group';

interface ProductBrief {
  url?: string;
  name?: string;
  description?: string;
  image?: string;
  kind?: 'digital_gift';
}

interface GroupConfig {
  name?: string;
  members?: string[];
}

interface ExistingMessageBrief {
  direction?: string;
  senderName?: string;
  text?: string;
  caption?: string;
  type?: string;
  imageHint?: string;
  sfxId?: string;
}

function buildSfxDirective(storyType?: StoryType): string {
  const genreRule = storyType === 'horror'
    ? '- Untuk horror, pasang 1-3 SFX pada momen paling tegang atau plot twist. Pilih efek yang paling cocok dari horror-sting, eerie-hit, tension-boom, bone-crack, whip-hit, light-switch, horror-scream, creepy-notification, mystery-reveal, panic-triggered, glitch-loading, atau efek kamera.'
    : storyType === 'comedy_product'
      ? '- Untuk komedi, pakai 1-3 SFX hanya pada salah paham utama, reaksi paling lucu, atau punchline. Pilih efek seperti ding, bruh, comedy-fail, record-scratch, xp-error, hell-nah, oh-my-god, game-hurt, quack, skedaddle, atau efek reaction lain yang tersedia.'
    : storyType === 'drama_product'
      ? '- Untuk drama, pakai maksimal 2 SFX hanya jika benar-benar memperkuat konflik atau reveal.'
      : '- Ikuti genre percakapan lama: horror memakai 1-3 efek tegang; komedi memakai 1-3 efek punchline; drama memakai maksimal 2 efek halus.';

  return `EFEK SUARA PER BUBBLE:
- Field opsional bernama "sfxId". Nilai yang valid HANYA: ${SFX_AI_IDS}.
${genreRule}
- Jangan memberi SFX pada setiap bubble. Pilih momen penting saja agar hasil tidak berisik.
- SFX berbunyi tepat saat bubble muncul. Jangan menulis nama efek atau arahan suara di dalam teks chat.`;
}

function buildStoryDirective(
  storyType: StoryType,
  product?: ProductBrief | null,
  revealType: RevealType = 'none',
  chatType: GeneratedChatType = 'personal',
): string {
  if (storyType === 'horror') {
    return `JENIS KONTEN: FAKE CHAT HORROR${chatType === 'group' ? ' GRUP' : ''}
- Mulai dengan kejadian biasa yang langsung memancing rasa penasaran dalam 1-2 bubble pertama.
- Naikkan ketegangan secara bertahap lewat detail kecil yang realistis, bukan narasi panjang.
- Pesan terakhir harus menjadi plot twist yang jelas dan pendek.
- ${chatType === 'group'
  ? 'Gunakan dinamika beberapa anggota: tiap pengirim punya pengetahuan, reaksi, dan gaya bicara berbeda. Horor harus muncul dari interaksi grup, bukan dialog dua orang yang hanya diberi nama pengirim.'
  : 'Jaga pengetahuan kedua tokoh tetap konsisten dan jangan menukar identitas pengirim.'}
- Jangan gunakan link produk, promosi, komedi, tag suara, atau kalimat narator.
- Kamu BOLEH memakai maksimal satu bubble type "image" atau "view_once" jika bukti visual benar-benar membuat cerita lebih menyeramkan (contoh: foto lorong, tangkapan layar CCTV, atau sosok di jendela). Ini pilihan, bukan kewajiban.
- Jangan selalu menaruh gambar sebagai pesan terakhir. Setelah gambar, percakapan boleh berlanjut agar tokoh bereaksi dan plot twist terasa hidup.
- Jika memakai image/view_once, isi "imageHint" dengan deskripsi visual singkat dan konkret untuk membantu user memilih foto. Caption harus tetap berupa ucapan natural dari pengirim, bukan deskripsi gambar. Jangan mengarang URL gambar.`;
  }

  const genreRules = storyType === 'comedy_product'
    ? chatType === 'group'
      ? `- Ini komedi circle pertemanan yang ramai tetapi alurnya tetap mudah diikuti.
- Bangun satu premis jelas: kejadian pemicu → reaksi beberapa anggota → kekacauan/salah paham → reveal atau punchline → closure.
- Dalam dua bubble pertama, jelaskan kejadian konkret yang membuat grup aktif. Jangan memulai dari kekacauan tanpa konteks.
- Setiap anggota harus punya fungsi dan gaya berbeda; misalnya admin panik, teman receh, teman jujur, dan target kejutan. Jangan membuat semua orang terdengar sama.
- Kelucuan berasal dari saling menyela, rahasia yang hampir bocor, atau alasan yang terlalu kentara—bukan kalimat random.
- Produk, jika dipakai, adalah halaman digital berisi wish/ucapan bersama yang dibuat circle, bukan barang fisik.
- Setelah reveal, beri reaksi target dan maksimal satu punchline penutup agar ending tetap jelas.`
      : `- Ini komedi pasangan/bucin yang absurd tetapi masih masuk akal sebagai chat asli.
- Bangun satu premis yang jelas: penyebab konkret → salah paham makin besar → usaha memperbaiki → payoff/punchline → reaksi penutup.
- Dalam dua bubble pertama, jelaskan kejadian pemicu secara konkret: siapa melakukan apa, janji apa yang dilanggar, atau kalimat apa yang membuat salah paham. Jangan mulai dari "terserah", ngambek, marah, atau sindiran sebelum penyebabnya diketahui pembaca.
- Kelucuan harus datang dari karakter, timing balasan, gengsi, atau logika yang terlalu harfiah. Jangan membuat kalimat random hanya supaya terlihat lucu.
- Jangan menjadikan setiap bubble sebagai punchline. Sisakan respons pendek seperti "hah?", "serius?", atau "ya ampun" agar ritmenya natural.
- Produk, jika dipakai, harus menjadi jawaban tak terduga, alat berdamai, atau bukti bucin—bukan iklan yang ditempel.
- Setelah punchline/reveal, akhiri dengan satu reaksi yang menunjukkan nasib konflik: dimaafkan sedikit, masih digoda, atau sepakat membicarakannya. Jangan memaksakan perubahan emosi total.`
    : chatType === 'group'
      ? `- Buat drama pertemanan/circle yang hangat dan terasa seperti obrolan grup asli.
- Dalam dua bubble pertama, jelaskan momen utamanya secara konkret: wisuda, ulang tahun, perpisahan, pencapaian, atau konflik pertemanan.
- Beri 3-5 anggota fungsi yang berbeda. Percakapan harus bergerak lewat respons antaranggota, bukan monolog bergantian.
- Jika ada digital gift, posisikan sebagai halaman Circle Wishes berisi ucapan, foto, atau harapan dari banyak anggota.
- Setelah reveal, target memberi reaksi yang menjawab momen awal; anggota lain boleh menutup dengan dukungan atau candaan kecil. Jangan membuat semua anggota mendadak berbicara formal.`
      : `- Buat drama pasangan yang emosional tetapi tetap terasa seperti chat sehari-hari.
- Dalam dua bubble pertama, jelaskan kejadian pemicu secara konkret: siapa melakukan apa dan kenapa itu membuat tokoh lain kecewa. Jangan membuka dengan kemarahan atau ngambek tanpa sebab yang bisa dipahami pembaca.
- Produk, jika dipakai, harus masuk sebagai usaha memperbaiki konflik—bukan iklan yang ditempel.
- Setelah reveal, akhiri dengan satu reaksi yang jelas dari penerima: menerima usahanya, belum sepenuhnya memaafkan, atau menyepakati langkah berikutnya. Closure harus terasa wajar, bukan mendadak kembali mesra.`;

  const contentLabel = storyType === 'comedy_product'
    ? chatType === 'group' ? 'KOMEDI GROUP CHAT' : 'KOMEDI BUCIN ABSURD'
    : chatType === 'group' ? 'DRAMA GROUP CHAT' : 'DRAMA PASANGAN';

  if (revealType === 'none') {
    return `JENIS KONTEN: FAKE CHAT ${contentLabel} TANPA MEDIA WAJIB
${genreRules}
- Buat cerita singkat yang utuh melalui percakapan saja dan akhiri dengan closure teks yang menjawab konflik utama.
- Jangan menambahkan link, kartu web, foto, barcode, QR, produk, atau ajakan membuka sesuatu.
- Jangan membuat tokoh berkata akan mengirim sesuatu jika tidak benar-benar ada media setelahnya.
- Ending terakhir harus tetap terasa kuat sebagai chat teks natural, bukan kalimat narator.`;
  }

  const safeProduct = {
    url: product?.url?.trim() || 'https://produk-kamu.com',
    name: product?.name?.trim() || 'Digital Gift untuk Kamu',
    description: product?.description?.trim() || 'Klik untuk membuka',
  };

  const digitalGiftRules = `KONTEKS PRODUK — WAJIB DIPATUHI:
- Produk user adalah DIGITAL GIFT berupa halaman web personal${chatType === 'group' ? ' atau Circle Wishes yang dapat diisi banyak teman' : ''}. Ini BUKAN barang fisik.
- Tokoh membuat atau menyiapkan halaman digital tersebut untuk menyampaikan ucapan, perasaan, atau kejutan yang lebih personal daripada chat biasa.
- Jangan membuat adegan mengantar barang, datang ke rumah/kosan, menunggu di depan, mengirim paket, membungkus hadiah, membeli barang, atau menyerahkan benda.
- Jangan menyebutnya "barang", "paket", "pesanan", atau "barang yang kamu pengen". Di dalam chat gunakan ungkapan natural seperti "aku bikinin sesuatu", "aku tulis semuanya di sini", atau "coba buka sebentar".
- Reveal harus terasa seperti kelanjutan emosi percakapan: penerima membuka halaman itu untuk membaca pesan, wish, atau kejutan, bukan untuk melihat katalog produk.`;

  if (revealType === 'image') {
    return `JENIS KONTEN: ${contentLabel} + PRODUCT REVEAL
${genreRules}
${digitalGiftRules}
- Bangun pola sesuai genre → usaha memperbaiki → satu kalimat pengantar → preview/QR → reaksi penutup.
- Pesan KEDUA TERAKHIR wajib type "image". Aplikasi akan memasang preview halaman digital, barcode, atau QR asli milik user, jadi jangan mengarang URL atau isi gambar.
- Pesan TERAKHIR wajib type "text" dari penerima digital gift. Reaksinya harus menjawab konflik awal secara singkat dan natural; tidak harus langsung memaafkan sepenuhnya.
- Untuk pesan image terakhir, isi field caption dengan satu kalimat pendek yang natural sesuai konteks. Kosongkan caption jika bubble sebelumnya sudah menjadi pengantar yang jelas.
- Gambar dikirim oleh pihak yang membuat digital gift. Gambar adalah akses/preview hadiah digital, bukan foto sebuah benda.
- Jangan menyebut istilah soft selling, CTA, penonton, konten, atau iklan, dan jangan menjelaskan bahwa gambar tersebut adalah barcode kecuali konteks chat memang memerlukannya.`;
  }

  return `JENIS KONTEN: ${contentLabel} + PRODUCT REVEAL
${genreRules}
${digitalGiftRules}
- Bangun pola sesuai genre → usaha memperbaiki → satu kalimat pengantar → kartu link → reaksi penutup.
- Tema digital gift dan kalimat pengantar link WAJIB mengikuti ide user. Jangan memakai kalimat tentang minta maaf atau "sedikit tenang" jika ceritanya ulang tahun, hadiah, atau tema lain.
- Hanya boleh ada SATU ajakan membuka link: pilih salah satu antara bubble sebelum kartu ATAU field text pada kartu link. Jangan menulis dua ajakan yang maknanya sama.
- Pesan KEDUA TERAKHIR wajib type "link" dan gunakan data produk berikut PERSIS, jangan mengarang URL/judul baru:
  linkUrl: ${JSON.stringify(safeProduct.url)}
  linkTitle: ${JSON.stringify(safeProduct.name)}
  linkDescription: ${JSON.stringify(safeProduct.description)}
  linkImage: ""
- Kartu link dikirim oleh pihak yang menawarkan solusi/kejutan. Isi field text dengan kalimat pendek yang sesuai konteks, atau kosongkan jika bubble sebelumnya sudah mengajak membuka link.
- Pesan TERAKHIR wajib type "text" dari penerima digital gift. Reaksinya harus memberi closure terhadap konflik awal secara singkat dan tidak berlebihan.
- Thumbnail asli dipasang otomatis oleh aplikasi setelah AI selesai; jangan mengarang URL gambar.
- Jangan menyebut istilah soft selling, CTA, penonton, konten, atau iklan di dalam percakapan.`;
}

function buildConversationDirective(
  chatType: GeneratedChatType,
  groupConfig?: GroupConfig | null,
): string {
  if (chatType === 'personal') {
    return `FORMAT PERCAKAPAN: CHAT PERSONAL
- Hanya ada dua tokoh: "outgoing" adalah pemilik HP dan "incoming" adalah kontak lawan bicara.
- Field senderName tidak perlu dipakai.`;
  }

  const requestedName = groupConfig?.name?.trim();
  const requestedMembers = groupConfig?.members
    ?.map((member) => member.trim())
    .filter(Boolean) ?? [];

  return `FORMAT PERCAKAPAN: GROUP CHAT WHATSAPP
- "outgoing" selalu pemilik HP / kamu. Pesan outgoing TIDAK memakai senderName.
- "incoming" adalah pesan anggota lain. SETIAP pesan incoming WAJIB memiliki senderName yang konsisten.
- Gunakan 3-5 anggota aktif dan variasikan giliran bicara secara natural. Jangan hanya membuat satu anggota membalas semua pesan.
- Setiap anggota harus punya gaya, emosi, dan pengetahuan yang konsisten. Jangan menukar peran target kejutan, admin, atau pelaku konflik.
- Output wajib berisi chatType "group", name sebagai nama grup, groupSubtitle, dan participants.
- groupSubtitle berupa daftar ringkas anggota di header, diakhiri "kamu".
${requestedName ? `- Gunakan nama grup ini: ${JSON.stringify(requestedName)}.` : '- Buat nama grup yang singkat, natural, dan relevan dengan cerita.'}
${requestedMembers.length > 0
  ? `- Gunakan nama anggota berikut secara konsisten: ${requestedMembers.map((member) => JSON.stringify(member)).join(', ')}.`
  : '- Buat 3-5 nama anggota Indonesia yang mudah dibedakan.'}`;
}

// ── Build system prompt ───────────────────────────────────────────────────────
function buildSystemPrompt(
  targetLength: number,
  storyType: StoryType,
  product?: ProductBrief | null,
  revealType: RevealType = 'none',
  chatType: GeneratedChatType = 'personal',
  groupConfig?: GroupConfig | null,
): string {
  const outputExample = chatType === 'group'
    ? `{
  "chatType": "group",
  "name": "Nama Grup yang sesuai cerita",
  "groupSubtitle": "Naya, Dimas, Raka, kamu",
  "participants": ["Naya", "Dimas", "Raka"],
  "messages": [
    { "type": "text", "direction": "incoming", "senderName": "Naya", "time": "21:30", "text": "Isi pesan Naya" },
    { "type": "text", "direction": "outgoing", "time": "21:31", "text": "Balasan pemilik HP" },
    { "type": "text", "direction": "incoming", "senderName": "Dimas", "time": "21:31", "text": "Balasan Dimas" }
  ]
}`
    : `{
  "chatType": "personal",
  "name": "Nama kontak yang sesuai cerita",
  "messages": [
    { "type": "text", "direction": "outgoing", "time": "21:30", "text": "Isi pesan" },
    { "type": "text", "direction": "incoming", "time": "21:31", "text": "Balasan" }
  ]
}`;

  return `Kamu adalah penulis naskah fake chat WhatsApp untuk video TikTok dan Reels Indonesia.

${buildConversationDirective(chatType, groupConfig)}

${buildStoryDirective(storyType, product, revealType, chatType)}

${buildSfxDirective(storyType)}

ATURAN CERITA:
1. Buat TEPAT ${targetLength} bubble chat dari awal sampai ending. Tidak boleh kurang atau lebih.
2. Setiap bubble harus merespons bubble sebelumnya dan menjaga identitas semua tokoh secara konsisten.
3. Patuhi format arah dan senderName sesuai jenis percakapan. Jangan pernah memberi senderName pada outgoing.
4. Gunakan bahasa Indonesia sehari-hari yang natural. Satu bubble berisi satu pikiran, idealnya 2-14 kata.
5. Percakapan harus terasa seperti dua orang yang sudah saling mengenal. Hindari bahasa formal/kaku seperti "aku percaya kamu pasti punya sesuatu yang mengejutkan", "aku baik-baik saja kok", atau kalimat yang menjelaskan situasi secara terang-terangan.
6. Jangan mengulang informasi, pertanyaan, maupun ajakan yang sama di dua bubble berurutan. Respons harus membawa percakapan maju.
7. Utamakan ketikan jempol yang spontan: respons pendek, sedikit tidak sempurna, dan sesuai emosi. Jangan membuat setiap bubble menjadi kalimat lengkap yang rapi.
8. Jangan memakai tag ElevenLabs seperti [scared], [whispers], atau teks narasi dalam tanda kurung.
9. Jangan memakai voice_note. Tipe yang diizinkan: text, link, image, view_once, notification, transfer, location, deleted.
10. Gunakan image/view_once/notifikasi hanya jika benar-benar membantu alur. Untuk media visual, caption adalah ucapan pengirim dan imageHint adalah petunjuk foto yang perlu disiapkan user.
11. Jam harus maju secara wajar dengan format HH:MM.
12. Sebelum mengeluarkan JSON, lakukan pengecekan diam-diam: siapa pemilik HP, siapa setiap pengirim, siapa target momen/kejutan, siapa yang menawarkan solusi, dan apa yang sudah diketahui masing-masing. Perbaiki senderName, kata ganti, atau respons yang tertukar.
13. Jika ada product reveal, cek ulang bahwa tidak ada dialog yang menggambarkan produk sebagai barang fisik, paket, pesanan, atau sesuatu yang diantar ke rumah.

FORMAT OUTPUT — JSON MURNI TANPA MARKDOWN:
${outputExample}

Jika memakai type "link", formatnya:
{ "type": "link", "direction": "incoming", "time": "21:35", "text": "Kalimat pengantar singkat", "linkUrl": "https://...", "linkTitle": "Judul", "linkDescription": "Deskripsi", "linkImage": "https://... atau kosong" }

Jika memakai type "image", formatnya:
{ "type": "image", "direction": "incoming", "time": "21:35", "caption": "Kalimat pendek yang menyertai gambar", "imageHint": "Deskripsi singkat isi foto yang dibutuhkan" }

Jika memakai type "view_once", gunakan format yang sama dengan image dan ubah type menjadi "view_once".

Untuk bubble yang membutuhkan efek, tambahkan field opsional seperti:
{ "type": "text", "direction": "incoming", "time": "21:36", "text": "Jangan nengok belakang.", "sfxId": "horror-sting" }

Kembalikan hanya JSON valid.`;
}

// ── Build improvise system prompt ─────────────────────────────────────────────
function buildImproviseSystemPrompt(
  targetLength: number,
  existingMessagesText: string,
  chatType: GeneratedChatType = 'personal',
  groupConfig?: GroupConfig | null,
): string {
  return `Kamu adalah penulis naskah fake chat WhatsApp untuk video TikTok dan Reels Indonesia.
Tugasmu adalah MELANJUTKAN percakapan yang sudah ada tanpa mengulang atau mengubah pesan lama.

=== PERCAKAPAN SEBELUMNYA ===
${existingMessagesText}
=============================

${buildConversationDirective(chatType, groupConfig)}

${buildSfxDirective()}

ATURAN LANJUTAN:
- Tambahkan TEPAT ${targetLength} bubble BARU.
- Bubble pertama harus langsung merespons pesan terakhir percakapan lama.
- Jaga identitas dan arah incoming/outgoing secara konsisten.${chatType === 'group' ? ' Setiap incoming baru wajib mempertahankan senderName anggota yang sudah ada atau memakai anggota yang tercantum di grup.' : ''}
- Ikuti suasana, hubungan tokoh, dan konflik yang sudah terbentuk. Jangan mengubahnya menjadi promosi atau genre lain tanpa diminta user.
- Gunakan bahasa Indonesia sehari-hari yang spontan, satu pikiran per bubble, tanpa tag emosi ElevenLabs dan tanpa narasi.
- Secara default gunakan type "text". Tidak ada kewajiban mengakhiri chat dengan foto, link, produk, CTA, atau plot twist.
- DILARANG menambahkan kartu link secara otomatis. Gunakan type "link" hanya jika arahan user secara eksplisit meminta link dan memberikan konteks link yang jelas.
- Kamu BOLEH memakai maksimal satu type "image" atau "view_once" hanya jika arahan user atau alur percakapan benar-benar membutuhkan bukti visual. Jika dipakai, isi caption dengan ucapan natural dan imageHint dengan deskripsi singkat foto yang perlu diunggah user. Jangan mengarang URL gambar.
- Jangan memakai voice_note.
- Jam harus melanjutkan waktu percakapan lama secara wajar.

FORMAT OUTPUT — JSON MURNI TANPA MARKDOWN:
{
  "chatType": "${chatType}",
  "name": "${chatType === 'group' ? 'Nama grup' : 'Nama kontak'}",
  "messages": [
    { "type": "text", "direction": "${chatType === 'group' ? 'incoming' : 'outgoing'}", ${chatType === 'group' ? '"senderName": "Nama anggota", ' : ''}"time": "21:35", "text": "Pesan baru yang menyambung" }
  ]
}

Format media opsional:
{ "type": "image", "direction": "incoming", "time": "21:36", "caption": "Coba lihat ini deh", "imageHint": "Foto lorong rumah yang gelap dengan bayangan samar di ujung" }

Field sfxId juga boleh ditambahkan pada bubble baru jika benar-benar mendukung momen cerita.

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
      chatType = 'personal',
      revealType = 'none',
      product = null,
      groupConfig = null,
      existingMessages = [],
    } = await req.json();

    const normalizedStoryType: StoryType = storyType === 'horror'
      ? 'horror'
      : storyType === 'comedy_product'
        ? 'comedy_product'
        : 'drama_product';
    const normalizedRevealType: RevealType =
      revealType === 'image' ? 'image' : revealType === 'link' ? 'link' : 'none';
    const normalizedChatType: GeneratedChatType = chatType === 'group' ? 'group' : 'personal';
    const normalizedGroupConfig: GroupConfig | null = normalizedChatType === 'group'
      ? {
          name: typeof groupConfig?.name === 'string' ? groupConfig.name.trim().slice(0, 60) : '',
          members: Array.isArray(groupConfig?.members)
            ? groupConfig.members
                .filter((member: unknown): member is string => typeof member === 'string')
                .map((member: string) => member.trim().slice(0, 30))
                .filter(Boolean)
                .slice(0, 8)
            : [],
        }
      : null;

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
          const sfxContext = m.sfxId ? ` [SFX: ${m.sfxId}]` : '';
          return `${idx + 1}. ${dir}${sender}: ${content}${mediaContext}${sfxContext}`;
        })
        .join('\n');

      systemInstruction = buildImproviseSystemPrompt(
        Number(count),
        formattedHistory,
        normalizedChatType,
        normalizedGroupConfig,
      );
      userPrompt = prompt?.trim()
        ? `Arahan Khusus Improvisasi:\n${prompt.trim()}`
        : `Lanjutkan obrolan di atas secara natural. Tidak perlu menambahkan foto, link, produk, CTA, atau ending khusus.`;
    } else {
      systemInstruction = buildSystemPrompt(
        Number(count),
        normalizedStoryType,
        product,
        normalizedRevealType,
        normalizedChatType,
        normalizedGroupConfig,
      );
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
      if (normalizedChatType === 'group' && mode !== 'enhance_emotion') {
        const requestedMembers = normalizedGroupConfig?.members ?? [];
        const aiParticipants = Array.isArray(parsed.participants)
          ? parsed.participants
              .filter((member: unknown): member is string => typeof member === 'string')
              .map((member: string) => member.trim())
              .filter((member: string) => Boolean(member) && member.toLowerCase() !== 'kamu')
          : [];
        const participantNames = [...new Set(aiParticipants.length > 0 ? aiParticipants : requestedMembers)];
        const fallbackParticipants = participantNames.length > 0
          ? participantNames
          : ['Naya', 'Dimas', 'Raka'];
        let fallbackSenderIndex = 0;

        parsed.chatType = 'group';
        parsed.name = normalizedGroupConfig?.name || parsed.name || parsed.groupName || 'Circle Kita';
        parsed.participants = fallbackParticipants;
        const generatedSubtitle = typeof parsed.groupSubtitle === 'string' && parsed.groupSubtitle.trim()
          ? parsed.groupSubtitle.trim()
          : `${fallbackParticipants.join(', ')}, kamu`;
        parsed.groupSubtitle = /\bkamu\b/i.test(generatedSubtitle)
          ? generatedSubtitle
          : `${generatedSubtitle}, kamu`;
        if (Array.isArray(parsed.messages)) {
          parsed.messages = parsed.messages.map((message: Record<string, unknown>) => {
            if (message.direction === 'outgoing') {
              const outgoingMessage = { ...message };
              delete outgoingMessage.senderName;
              delete outgoingMessage.senderColor;
              return outgoingMessage;
            }

            const senderName = typeof message.senderName === 'string' && message.senderName.trim()
              ? message.senderName.trim()
              : fallbackParticipants[fallbackSenderIndex++ % fallbackParticipants.length];
            return { ...message, direction: 'incoming', senderName };
          });
        }
      }
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
