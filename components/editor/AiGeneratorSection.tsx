'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  Wand2,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { Message } from '@/types';
import { compressImageFile, newId } from '@/lib/utils';
import { normalizeSfxId } from '@/lib/sfx';

type GeneratorMode = 'create' | 'improvise';
type ContentGoal = 'drama_product' | 'comedy_product' | 'horror';
type ProductReveal = 'none' | 'link' | 'image';

interface StoryPreset {
  id: string;
  goal: ContentGoal;
  name: string;
  eyebrow: string;
  description: string;
  prompt: string;
  productName?: string;
  productDescription?: string;
  revealDirection?: Message['direction'];
  revealText?: string;
  closureText?: string;
}

interface RawAiMessage {
  type?: string;
  direction?: string;
  text?: string;
  caption?: string;
  time?: string;
  notifSender?: string;
  notifTitle?: string;
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
  imageData?: string;
  imageHint?: string;
  sfxId?: string;
  sfx?: string;
  sfxVolume?: number;
}

const MESSAGE_LENGTHS = [
  { count: 6, label: 'Cepat' },
  { count: 8, label: 'Ideal' },
  { count: 10, label: 'Detail' },
];

const STORY_PRESETS: StoryPreset[] = [
  {
    id: 'cold-war-apology',
    goal: 'drama_product',
    name: 'Perang Dingin',
    eyebrow: 'Apology',
    description: 'Tensi tinggi di awal, minta maaf, lalu reveal digital gift.',
    prompt:
      'PEMILIK HP / outgoing adalah cewek. KONTAK / incoming adalah cowok. Konflik utamanya: cowok berjanji akan mengabari setelah pulang kerja, tetapi menghilang sampai malam sementara statusnya terlihat online. Dalam dua bubble pertama, cewek menyebut janji yang dilanggar itu dengan jelas; jangan langsung membuka dengan kalimat ngambek tanpa sebab. Cowok awalnya memberi alasan, lalu mengakui bahwa ia salah karena membuat cewek menunggu. Cowok (incoming) mengirim digital gift sebagai cara menyampaikan permintaan maaf yang sudah ia pikirkan. Setelah reveal, beri satu reaksi cewek yang menunjukkan masalahnya mereda tetapi tetap natural. Jangan terasa seperti iklan.',
    productName: "I'm Sorry, Love",
    productDescription: 'Pesan yang sulit aku ucapkan langsung buat kamu',
    revealDirection: 'incoming',
    revealText: 'Aku bikin ini buat minta maaf.',
    closureText: 'Yaudah, aku baca dulu. Makasih udah mau usaha.',
  },
  {
    id: 'proud-but-caring',
    goal: 'drama_product',
    name: 'Gengsi tapi Sayang',
    eyebrow: 'Soft selling',
    description: 'Sulit bicara langsung, akhirnya mengirim sesuatu yang personal.',
    prompt:
      'PEMILIK HP / outgoing adalah cewek. KONTAK / incoming adalah cowok. Konflik utamanya: cowok membatalkan video call yang sudah dijanjikan, tetapi tidak memberi kabar sampai cewek menunggu lama. Dalam dua bubble pertama, sebutkan kejadian itu secara konkret sebelum cewek menyindir. Cowok sempat defensif, lalu mengaku tidak pandai merangkai kata dan sudah membuat digital gift untuk menjelaskan perasaannya. Setelah reveal, beri satu balasan cewek yang menerima usahanya tanpa langsung menjadi terlalu romantis. Buat percakapan natural dan tidak menjual secara terang-terangan.',
    productName: 'A Little Note for You',
    productDescription: 'Ada sesuatu yang ingin aku sampaikan lewat halaman ini',
    revealDirection: 'incoming',
    revealText: 'Aku susah ngomong langsung. Jadi aku bikin ini.',
    closureText: 'Aku masih kesel, tapi aku hargai kamu bikin ini.',
  },
  {
    id: 'digital-surprise',
    goal: 'drama_product',
    name: 'Kejutan Digital',
    eyebrow: 'Product reveal',
    description: 'Bangun rasa penasaran sebelum hadiah digital dibuka.',
    prompt:
      'KONTAK / incoming adalah orang yang sedang ulang tahun. PEMILIK HP / outgoing adalah pasangannya yang sebenarnya sudah menyiapkan kejutan. Konfliknya harus langsung terbaca: incoming menyinggung bahwa sejak pagi outgoing belum mengucapkan selamat, sehingga incoming mengira tanggal ulang tahunnya dilupakan. Outgoing sempat berpura-pura tidak ingat, lalu mengaku hanya menggoda dan sudah membuat digital gift. Setelah reveal, beri satu reaksi incoming yang lega atau terharu. Buat variasi natural, jangan menukar peran, jangan membuat orang yang ulang tahun mengirim hadiah untuk dirinya sendiri, dan jangan menulis kalimat aneh seperti "Hari ulang tahunku, deh".',
    productName: 'A Birthday Surprise',
    productDescription: 'Kejutan kecil yang aku siapkan khusus buat kamu',
    revealDirection: 'outgoing',
    revealText: 'Aku udah siapin ini buat kamu.',
    closureText: 'Kirain kamu beneran lupa. Makasih ya 😭',
  },
  {
    id: 'ngambek-karena-mimpi',
    goal: 'comedy_product',
    name: 'Ngambek karena Mimpi',
    eyebrow: 'Absurd bucin',
    description: 'Cewek marah gara-gara mimpi, cowok membela diri dari kejadian yang tidak ia lakukan.',
    prompt:
      'PEMILIK HP / outgoing adalah cewek. KONTAK / incoming adalah cowok. Dalam dua bubble pertama, jelaskan penyebabnya: cowok bertanya kenapa cewek dingin sejak bangun tidur, lalu cewek mengaku bermimpi cowok jalan dengan cewek lain. Cowok bingung karena merasa diadili atas kejadian di dalam mimpi. Buat salah pahamnya makin absurd tetapi tetap seperti chat pasangan asli. Cowok akhirnya mengirim digital gift sebagai punchline manis. Setelah reveal, cewek memberi reaksi yang masih sedikit gengsi tetapi menunjukkan ngambeknya reda. Jangan membuat semua bubble berupa lelucon dan jangan memakai bahasa formal.',
    productName: 'Bukti Aku Cuma Sayang Kamu',
    productDescription: 'Bukti manis untuk pacar yang ngambek karena mimpi',
    revealDirection: 'incoming',
    revealText: 'Biar aku gak dihukum karena mimpi kamu, nih.',
    closureText: 'Yaudah... hukuman kamu aku kurangin dikit.',
  },
  {
    id: 'tes-peka-gagal',
    goal: 'comedy_product',
    name: 'Tes Peka Gagal Total',
    eyebrow: 'Salah jawab',
    description: 'Kode cewek dibalas terlalu harfiah sampai suasananya makin kocak.',
    prompt:
      'PEMILIK HP / outgoing adalah cewek. KONTAK / incoming adalah cowok. Konflik utamanya: cowok lupa tanggal pertama kali mereka jadian, lalu cewek memberi satu kode yang konkret untuk mengetes apakah ia ingat. Jelaskan konteks tanggal itu dalam dua bubble pertama sebelum tes kepekaan dimulai. Cowok menjawab terlalu harfiah dan memilih jawaban yang salah. Cewek makin gemas, tetapi cowok ternyata sudah membuat halaman digital gift personal dan hanya salah menyebut tanggal. Cowok (incoming) mengirim preview, QR, atau link sebagai payoff. Setelah reveal, cewek memberi reaksi geli dan masalah selesai secara ringan. Gunakan humor dari timing dan salah paham, bukan kalimat random.',
    productName: 'Ternyata Aku Peka',
    productDescription: 'Kejutan kecil dari orang yang kelihatannya gak peka',
    revealDirection: 'incoming',
    revealText: 'Aku emang lemot, tapi yang ini udah aku siapin.',
    closureText: 'Oke... ternyata kamu peka juga, walau tanggalnya salah.',
  },
  {
    id: 'terserah-bukan-terserah',
    goal: 'comedy_product',
    name: 'Terserah Bukan Terserah',
    eyebrow: 'Drama receh',
    description: 'Satu kata “terserah” berubah menjadi ujian hidup untuk si cowok.',
    prompt:
      'PEMILIK HP / outgoing adalah cewek. KONTAK / incoming adalah cowok. Konflik utamanya: cowok terlambat satu jam dari janji menelepon karena ketiduran. Bubble pertama harus berupa cowok yang mengakui keterlambatan dan bertanya ingin dibujuk bagaimana; baru setelah konteks jelas cewek menjawab "terserah". Cowok menganggap itu jawaban sungguhan dan mencoba beberapa tebakan yang salah. Akhiri dengan cowok mengirim halaman digital gift personal sebagai jawaban yang akhirnya benar. Setelah reveal, cewek memberi reaksi singkat bahwa usahanya diterima, bukan langsung romantis berlebihan. Percakapan harus spontan dan relate.',
    productName: 'Pilihan yang Gak Bisa Salah',
    productDescription: 'Buat saat “terserah” ternyata punya jawaban benar',
    revealDirection: 'incoming',
    revealText: 'Oke, kali ini aku pilih yang aman.',
    closureText: 'Nah, ini baru jawaban yang bener.',
  },
  {
    id: 'salah-kirim-bucin',
    goal: 'comedy_product',
    name: 'Salah Kirim Bucin',
    eyebrow: 'Malu ketahuan',
    description: 'Pesan sok cuek gagal karena draft bucin terkirim ke orangnya langsung.',
    prompt:
      'PEMILIK HP / outgoing adalah cewek. KONTAK / incoming adalah cowok. Konflik pemicunya harus terlihat di awal: cowok tidak sengaja mengirim satu kalimat bucin yang jelas ditujukan kepada cewek, lalu langsung menghapus atau mengaku salah kirim. Cewek sempat membacanya dan menggoda. Cowok mencari alasan yang makin tidak masuk akal sebelum mengaku bahwa ia juga sudah membuat halaman digital gift personal untuk cewek. Cowok (incoming) mengirim preview, QR, atau link sebagai bukti. Setelah reveal, cewek menutup dengan godaan yang menunjukkan pengakuannya diterima. Humornya berasal dari rasa malu, bukan narasi.',
    productName: 'Ya, Ini Memang Buat Kamu',
    productDescription: 'Bukti bucin yang gagal disembunyikan',
    revealDirection: 'incoming',
    revealText: 'Yaudah iya, dari awal emang buat kamu.',
    closureText: 'Makanya jangan pura-pura cuek lagi wkwk.',
  },
  {
    id: 'boarding-house',
    goal: 'horror',
    name: 'Ada di Depan Kos',
    eyebrow: 'Horror realistis',
    description: 'Suara di luar kamar berubah menjadi bukti yang mengerikan.',
    prompt:
      'Chat malam hari di kos. Seseorang mendengar ketukan dan mengira pasangannya datang, padahal pasangannya masih jauh. Naikkan ketegangan sedikit demi sedikit dan beri plot twist yang masuk akal tetapi mengerikan pada pesan terakhir.',
  },
  {
    id: 'last-message',
    goal: 'horror',
    name: 'Chat Terakhir',
    eyebrow: 'Plot twist',
    description: 'Pesan baru datang dari orang yang seharusnya sudah tidak bisa chat.',
    prompt:
      'Tokoh utama menerima chat santai dari teman dekat. Perlahan muncul detail yang mustahil karena pengirim ternyata sudah meninggal atau hilang. Hindari penjelasan panjang; biarkan satu pesan terakhir menjadi plot twist.',
  },
  {
    id: 'wrong-number',
    goal: 'horror',
    name: 'Salah Nomor',
    eyebrow: 'Creepy chat',
    description: 'Orang asing tahu detail kamar dan posisi tokoh utama.',
    prompt:
      'Nomor asing mengirim pesan seperti salah sambung. Awalnya biasa, lalu ia menyebut detail kecil yang hanya bisa dilihat dari dalam kamar tokoh utama. Akhiri dengan pesan pendek yang membuat merinding.',
  },
];

const FALLBACK_PRODUCT = {
  name: "I'm Sorry, Love",
  description: 'Klik untuk membuka pesan spesial buat kamu',
};

export default function AiGeneratorSection() {
  const { setName, reorderMessages, messages } = useEditorStore();
  const existingLink = useMemo(() => messages.find((message) => message.type === 'link'), [messages]);

  const [generatorMode, setGeneratorMode] = useState<GeneratorMode>('create');
  const [contentGoal, setContentGoal] = useState<ContentGoal>('drama_product');
  const [selectedPreset, setSelectedPreset] = useState('cold-war-apology');
  const [promptText, setPromptText] = useState(STORY_PRESETS[0].prompt);
  const [msgCount, setMsgCount] = useState(8);
  const [productReveal, setProductReveal] = useState<ProductReveal>(existingLink?.linkUrl ? 'link' : 'none');
  const [productUrl, setProductUrl] = useState(existingLink?.linkUrl ?? '');
  const [productName, setProductName] = useState(existingLink?.linkTitle ?? FALLBACK_PRODUCT.name);
  const [productDescription, setProductDescription] = useState(
    existingLink?.linkDescription ?? FALLBACK_PRODUCT.description,
  );
  const [productImage, setProductImage] = useState(existingLink?.linkImage ?? existingLink?.imageData ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  useEffect(() => {
    let savedKey = '';
    try {
      savedKey = localStorage.getItem('wa_gemini_api_key') || '';
    } catch {}
    const timer = window.setTimeout(() => setGeminiKey(savedKey), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function updateGeminiKey(value: string) {
    setGeminiKey(value);
    try {
      if (value) localStorage.setItem('wa_gemini_api_key', value);
      else localStorage.removeItem('wa_gemini_api_key');
    } catch {}
    setError(null);
  }

  const visiblePresets = STORY_PRESETS.filter((preset) => preset.goal === contentGoal);
  const presetAccent = contentGoal === 'horror'
    ? { border: 'rgba(168,85,247,0.55)', background: 'rgba(168,85,247,0.14)', text: '#c084fc' }
    : contentGoal === 'comedy_product'
      ? { border: 'rgba(251,191,36,0.58)', background: 'rgba(251,191,36,0.13)', text: '#fbbf24' }
      : { border: 'rgba(37,211,102,0.50)', background: 'rgba(37,211,102,0.12)', text: 'var(--wa-green)' };

  function chooseGoal(goal: ContentGoal) {
    const firstPreset = STORY_PRESETS.find((preset) => preset.goal === goal);
    setContentGoal(goal);
    setSelectedPreset(firstPreset?.id ?? '');
    setPromptText(firstPreset?.prompt ?? '');
    if (firstPreset?.productName) setProductName(firstPreset.productName);
    if (firstPreset?.productDescription) setProductDescription(firstPreset.productDescription);
    setGenerated(false);
    setError(null);
  }

  function choosePreset(preset: StoryPreset) {
    setSelectedPreset(preset.id);
    setPromptText(preset.prompt);
    if (preset.productName) setProductName(preset.productName);
    if (preset.productDescription) setProductDescription(preset.productDescription);
    setGenerated(false);
    setError(null);
  }

  async function generate() {
    const isProductStory = contentGoal !== 'horror';
    const effectiveProductReveal: ProductReveal =
      productReveal === 'link' && !productUrl.trim()
        ? 'none'
        : productReveal === 'image' && !productImage
          ? 'none'
          : productReveal;

    setLoading(true);
    setError(null);
    setGenerated(false);

    try {
      const topic = promptText.trim() ||
        (generatorMode === 'improvise'
          ? 'Lanjutkan percakapan secara natural tanpa harus menambahkan link atau foto.'
          : contentGoal === 'horror'
            ? 'Buat fake chat horror realistis dengan hook cepat dan plot twist.'
            : contentGoal === 'comedy_product'
              ? effectiveProductReveal === 'none'
                ? 'Buat fake chat komedi absurd pasangan yang relate, dengan salah paham dan punchline kuat tanpa media wajib.'
                : 'Buat fake chat komedi absurd pasangan; jadikan reveal halaman digital gift sebagai payoff atau punchline yang natural.'
              : effectiveProductReveal === 'none'
                ? 'Buat drama pasangan yang natural dan selesai melalui percakapan, tanpa link atau foto wajib.'
                : 'Buat drama pasangan yang berakhir dengan reveal halaman digital gift secara natural.');
      const currentMessages = messages;

      const res = await fetch('/api/ai-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          prompt: topic,
          count: msgCount,
          voiceStyle: 'normal',
          provider: 'google',
          geminiKeyCustom: geminiKey.trim(),
          mode: generatorMode,
          storyType: contentGoal,
          revealType: effectiveProductReveal,
          presetId: selectedPreset,
          product: generatorMode === 'create' && isProductStory && effectiveProductReveal !== 'none'
            ? {
                kind: 'digital_gift',
                url: productUrl.trim(),
                name: productName.trim() || FALLBACK_PRODUCT.name,
                description: productDescription.trim() || FALLBACK_PRODUCT.description,
              }
            : null,
          existingMessages: generatorMode === 'improvise' ? currentMessages : [],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const contactName: string = data.name || data.contactName || '';
      if (contactName && generatorMode === 'create') setName(contactName.trim());

      let raw: RawAiMessage[] = [];
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
          try {
            raw = JSON.parse(arrMatch[0]);
          } catch {}
        }
      }

      if (!Array.isArray(raw) || raw.length === 0) {
        throw new Error('AI tidak menghasilkan percakapan. Coba generate ulang.');
      }

      const now = new Date();
      let currentHour = now.getHours();
      let currentMin = now.getMinutes();
      const validTypes: Message['type'][] = [
        'text',
        'link',
        'image',
        'view_once',
        'notification',
        'transfer',
        'contact',
        'location',
        'deleted',
      ];

      const newMessages: Message[] = raw.map((item) => {
        let rawType = (item.type || 'text').toLowerCase();
        if (rawType === 'voice_note') rawType = 'text';
        const type = validTypes.includes(rawType as Message['type'])
          ? (rawType as Message['type'])
          : 'text';

        let timeStr = item.time;
        if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
          currentMin += Math.floor(Math.random() * 2) + 1;
          if (currentMin >= 60) {
            currentMin -= 60;
            currentHour = (currentHour + 1) % 24;
          }
          timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        }

        return {
          id: newId('msg'),
          type,
          direction: item.direction === 'outgoing' ? 'outgoing' : 'incoming',
          text: item.text ?? (type === 'text' ? '' : undefined),
          caption: item.caption ?? (['image', 'view_once'].includes(type) ? item.text?.trim() : undefined),
          notifSender: item.notifSender,
          notifTitle: item.notifTitle,
          imageData: item.imageData,
          imageHint: item.imageHint,
          linkUrl: item.linkUrl,
          linkTitle: item.linkTitle,
          linkDescription: item.linkDescription,
          linkImage: item.linkImage,
          sfxId: normalizeSfxId(item.sfxId ?? item.sfx),
          sfxVolume: typeof item.sfxVolume === 'number'
            ? Math.max(0, Math.min(1, item.sfxVolume))
            : undefined,
          time: timeStr,
        };
      });

      if (generatorMode === 'create' && isProductStory && effectiveProductReveal === 'none') {
        newMessages.forEach((message) => {
          if (!['link', 'image', 'view_once'].includes(message.type)) return;
          message.type = 'text';
          message.text = message.text || message.caption || 'Aku cuma pengin ngomong langsung aja.';
          message.caption = undefined;
          message.imageData = undefined;
          message.imageHint = undefined;
          message.linkUrl = undefined;
          message.linkTitle = undefined;
          message.linkDescription = undefined;
          message.linkImage = undefined;
        });
      }

      if (generatorMode === 'create' && isProductStory && effectiveProductReveal !== 'none') {
        const activePreset = STORY_PRESETS.find((preset) => preset.id === selectedPreset);
        const revealDirection = activePreset?.revealDirection ?? 'incoming';
        const closureDirection: Message['direction'] = revealDirection === 'incoming' ? 'outgoing' : 'incoming';
        const fallbackRevealText = activePreset?.revealText ?? 'Aku udah siapin ini buat kamu.';
        const fallbackClosureText = activePreset?.closureText ?? 'Aku baca dulu ya. Makasih udah bikin ini.';

        const nextMinute = (time?: string) => {
          if (!time || !/^\d{2}:\d{2}$/.test(time)) return time;
          const [hour, minute] = time.split(':').map(Number);
          const total = (hour * 60 + minute + 1) % (24 * 60);
          return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
        };

        const placeRevealBeforeClosure = (revealMessage: Message, sourceIndex: number) => {
          const originalLength = newMessages.length + (sourceIndex >= 0 ? 1 : 0);
          const mediaHadTrailingMessage = sourceIndex >= 0 && sourceIndex < originalLength - 1;
          const closureSource = newMessages.pop();
          const canKeepAiClosure = (
            (mediaHadTrailingMessage || sourceIndex < 0) &&
            closureSource?.type === 'text' &&
            closureSource.direction === closureDirection &&
            Boolean(closureSource.text?.trim())
          );

          let revealSlot: Message | undefined;
          if (sourceIndex < 0) revealSlot = newMessages.pop();

          revealMessage.time = revealSlot?.time ?? revealMessage.time ?? newMessages[newMessages.length - 1]?.time;

          const previousText = newMessages[newMessages.length - 1]?.text ?? '';
          const hasRevealCta = (value?: string) => /\b(buka|klik|link|tautan|lihat|cek)\b/i.test(value ?? '');
          if (revealMessage.type === 'image' && hasRevealCta(previousText)) {
            revealMessage.caption = undefined;
          }
          if (revealMessage.type === 'link' && hasRevealCta(previousText) && hasRevealCta(revealMessage.text)) {
            revealMessage.text = undefined;
          }

          const closureMessage: Message = {
            id: canKeepAiClosure && closureSource ? closureSource.id : newId('msg'),
            type: 'text',
            direction: closureDirection,
            text: canKeepAiClosure ? closureSource?.text : fallbackClosureText,
            time: nextMinute(revealMessage.time) ?? closureSource?.time,
            sfxId: canKeepAiClosure ? closureSource?.sfxId : undefined,
            sfxVolume: canKeepAiClosure ? closureSource?.sfxVolume : undefined,
          };

          newMessages.push(revealMessage, closureMessage);
        };

        if (effectiveProductReveal === 'image') {
          const imageIndex = newMessages.findIndex((message) => message.type === 'image');
          let productPhoto: Message;

          if (imageIndex >= 0) {
            [productPhoto] = newMessages.splice(imageIndex, 1);
            productPhoto = {
              ...productPhoto,
              type: 'image',
              direction: revealDirection,
              imageData: productImage,
              caption: productPhoto.caption || productPhoto.text || fallbackRevealText,
              text: undefined,
            };
          } else {
            productPhoto = {
              id: newId('msg'),
              type: 'image',
              direction: revealDirection,
              imageData: productImage,
              caption: fallbackRevealText,
              time: newMessages[Math.max(0, newMessages.length - 2)]?.time,
            };
          }

          placeRevealBeforeClosure(productPhoto, imageIndex);
        } else {
          const product = {
            linkUrl: productUrl.trim(),
            linkTitle: productName.trim() || FALLBACK_PRODUCT.name,
            linkDescription: productDescription.trim() || FALLBACK_PRODUCT.description,
            linkImage: productImage || undefined,
            imageData: productImage || undefined,
          };
          const linkIndex = newMessages.findIndex((message) => message.type === 'link');
          let productLink: Message;

          if (linkIndex >= 0) {
            [productLink] = newMessages.splice(linkIndex, 1);
            productLink = {
              ...productLink,
              ...product,
              direction: revealDirection,
            };
          } else {
            productLink = {
              id: newId('msg'),
              type: 'link',
              direction: revealDirection,
              text: `${fallbackRevealText} Buka deh.`,
              time: newMessages[Math.max(0, newMessages.length - 2)]?.time,
              ...product,
            };
          }

          placeRevealBeforeClosure(productLink, linkIndex);
        }
      }

      reorderMessages(
        generatorMode === 'improvise' && currentMessages.length > 0
          ? [...currentMessages, ...newMessages]
          : newMessages,
      );
      setGenerated(true);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Gagal memproses AI.';
      setError(
        /signal timed out|timeout|timed out/i.test(message)
          ? 'Permintaan AI melewati batas waktu. Jika kuota Google habis, buka “Ganti Gemini API key” lalu masukkan key dari akun lain.'
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-2">
      <div
        className="rounded-xl border p-1"
        style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}
      >
        <div className="grid grid-cols-2 gap-1">
          {([
            ['create', 'Cerita baru'],
            ['improvise', 'Lanjutkan chat'],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setGeneratorMode(mode);
                if (mode === 'improvise') {
                  setPromptText('');
                } else {
                  const activePreset = STORY_PRESETS.find((preset) => preset.id === selectedPreset);
                  setPromptText(activePreset?.prompt ?? '');
                }
                setGenerated(false);
                setError(null);
              }}
              className="rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors"
              style={{
                background: generatorMode === mode ? 'rgba(37,211,102,0.14)' : 'transparent',
                color: generatorMode === mode ? 'var(--wa-green)' : 'var(--wa-text-muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="-mt-3 flex items-center justify-between px-1 text-[9.5px]" style={{ color: 'var(--wa-text-muted)' }}>
        <span>✨ Gemini sebagai penulis utama</span>
        <span>Qwen cadangan otomatis</span>
      </div>

      {generatorMode === 'create' ? (
        <>
          <section>
            <label className="section-label">1 · Tujuan konten</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => chooseGoal('drama_product')}
                className="rounded-xl border p-2.5 text-center transition-all"
                style={{
                  background: contentGoal === 'drama_product' ? 'rgba(37,211,102,0.09)' : 'var(--ui-card)',
                  borderColor: contentGoal === 'drama_product' ? 'rgba(37,211,102,0.55)' : 'var(--ui-border)',
                }}
              >
                <span className="text-[18px]">💌</span>
                <strong className="mt-1 block text-[11px]" style={{ color: 'var(--wa-text)' }}>Drama</strong>
                <span className="mt-0.5 block text-[9.5px]" style={{ color: 'var(--wa-text-muted)' }}>
                  Emosional + reveal
                </span>
              </button>

              <button
                type="button"
                onClick={() => chooseGoal('comedy_product')}
                className="rounded-xl border p-2.5 text-center transition-all"
                style={{
                  background: contentGoal === 'comedy_product' ? 'rgba(251,191,36,0.09)' : 'var(--ui-card)',
                  borderColor: contentGoal === 'comedy_product' ? 'rgba(251,191,36,0.60)' : 'var(--ui-border)',
                }}
              >
                <span className="text-[18px]">😂</span>
                <strong className="mt-1 block text-[11px]" style={{ color: 'var(--wa-text)' }}>Komedi Bucin</strong>
                <span className="mt-0.5 block text-[9.5px]" style={{ color: 'var(--wa-text-muted)' }}>
                  Absurd + punchline
                </span>
              </button>

              <button
                type="button"
                onClick={() => chooseGoal('horror')}
                className="rounded-xl border p-2.5 text-center transition-all"
                style={{
                  background: contentGoal === 'horror' ? 'rgba(168,85,247,0.10)' : 'var(--ui-card)',
                  borderColor: contentGoal === 'horror' ? 'rgba(168,85,247,0.60)' : 'var(--ui-border)',
                }}
              >
                <span className="text-[18px]">👻</span>
                <strong className="mt-1 block text-[11px]" style={{ color: 'var(--wa-text)' }}>Horror</strong>
                <span className="mt-0.5 block text-[9.5px]" style={{ color: 'var(--wa-text-muted)' }}>
                  Tegang + plot twist
                </span>
              </button>
            </div>
          </section>

          <section>
            <label className="section-label">2 · Pilih alur</label>
            <div className="flex flex-col gap-2">
              {visiblePresets.map((preset) => {
                const active = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => choosePreset(preset)}
                    className="rounded-xl border px-3 py-2.5 text-left transition-all"
                    style={{
                      background: active ? 'rgba(255,255,255,0.045)' : 'transparent',
                      borderColor: active ? presetAccent.border : 'var(--ui-border)',
                    }}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <strong className="text-[12px]" style={{ color: 'var(--wa-text)' }}>{preset.name}</strong>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                        style={{
                          background: presetAccent.background,
                          color: presetAccent.text,
                        }}
                      >
                        {preset.eyebrow}
                      </span>
                    </span>
                    <span className="mt-1 block text-[10.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <div
          className="flex items-start gap-2.5 rounded-xl border p-3"
          style={{ background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.25)' }}
        >
          <span className="mt-0.5 shrink-0 text-[16px]">💬</span>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
            AI akan membaca <strong style={{ color: 'var(--wa-text)' }}>{messages.length} pesan</strong> yang sudah ada,
            lalu menambahkan kelanjutan tanpa menghapus chat lama. Link dan foto tidak diwajibkan;
            AI hanya memilih foto jika alurnya memang membutuhkan bukti visual.
          </p>
        </div>
      )}

      {generatorMode === 'create' && contentGoal !== 'horror' && (
        <section
          className="rounded-xl border p-3"
          style={{ background: 'rgba(56,189,248,0.05)', borderColor: 'rgba(56,189,248,0.22)' }}
        >
          <div className="mb-3 flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-[15px]">🎁</span>
            <div>
              <p className="text-[11.5px] font-semibold text-sky-300">Reveal digital gift (opsional)</p>
              <p className="mt-0.5 text-[10px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
                Hadiah berupa halaman web personal, bukan barang fisik. Naskah tetap bisa dibuat tanpa media.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-3 gap-2">
              {([
                ['none', '💬 Tanpa media', 'Percakapan saja'],
                ['link', '🔗 Kartu link', 'Halaman digital gift'],
                ['image', '▣ Preview / QR', 'Gambar akses gift'],
              ] as const).map(([value, label, description]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setProductReveal(value);
                    setError(null);
                  }}
                  className="rounded-lg border p-2 text-left transition-colors"
                  style={{
                    background: productReveal === value ? 'rgba(56,189,248,0.10)' : 'var(--ui-card)',
                    borderColor: productReveal === value ? 'rgba(56,189,248,0.60)' : 'var(--ui-border)',
                  }}
                >
                  <strong className="block text-[10.5px]" style={{ color: productReveal === value ? '#7dd3fc' : 'var(--wa-text)' }}>
                    {label}
                  </strong>
                  <span className="mt-0.5 block text-[9px]" style={{ color: 'var(--wa-text-muted)' }}>{description}</span>
                </button>
              ))}
            </div>

            {productReveal === 'link' && (
              <>
            <div>
              <label className="section-label">Link digital gift (opsional)</label>
              <input
                type="url"
                className="input font-mono text-[11px]"
                value={productUrl}
                onChange={(event) => setProductUrl(event.target.value)}
                placeholder="https://produk-kamu.com"
              />
            </div>
            <div>
              <label className="section-label">Judul kartu</label>
              <input
                className="input"
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                placeholder="I'm Sorry, Love"
              />
            </div>
            <div>
              <label className="section-label">Deskripsi singkat</label>
              <input
                className="input"
                value={productDescription}
                onChange={(event) => setProductDescription(event.target.value)}
                placeholder="Klik untuk membuka pesan spesial buat kamu"
              />
            </div>
              </>
            )}
            {productReveal !== 'none' && (
            <div>
              <label className="section-label">
                {productReveal === 'image' ? 'Preview halaman / barcode / QR (opsional)' : 'Thumbnail digital gift (opsional)'}
              </label>
              {productImage ? (
                <div
                  className="flex items-center gap-2 rounded-lg border p-2"
                  style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}
                >
                  <img
                    src={productImage}
                    alt="Thumbnail digital gift"
                    className="h-12 w-16 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-medium" style={{ color: 'var(--wa-text)' }}>
                      Gambar siap dipakai
                    </p>
                    <p className="mt-0.5 text-[9.5px]" style={{ color: 'var(--wa-text-muted)' }}>
                      {productReveal === 'image'
                        ? 'Gambar ini akan menjadi bubble terakhir.'
                        : 'Gambar ini akan muncul di kartu link.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductImage('')}
                    className="rounded-md px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/10"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="input p-1 text-[10px]"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      setProductImage(await compressImageFile(file));
                    } catch {
                      setError('Gambar tidak bisa diproses. Coba PNG, JPG, atau WebP lain.');
                    }
                  }}
                />
              )}
            </div>
            )}
          </div>

          <p className="mt-2 text-[9.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
            Pilih media hanya jika dibutuhkan. Hasilnya tetap bisa disesuaikan setelah generate di menu <strong>Urutan Pesan</strong>.
          </p>
        </section>
      )}

      <section>
        <label className="section-label">
          {generatorMode === 'improvise' ? 'Arahan lanjutan' : '3 · Detail cerita'}
        </label>
        <textarea
          className="input resize-none text-[12px] leading-relaxed"
          rows={5}
          value={promptText}
          onChange={(event) => setPromptText(event.target.value)}
          placeholder={generatorMode === 'improvise'
            ? 'Opsional: contoh “lanjutkan makin tegang” atau “cukup obrolan biasa, tanpa foto/link”...'
            : 'Ubah detail tokoh, konflik, atau ending di sini...'}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && event.ctrlKey) generate();
          }}
        />
      </section>

      <section>
        <label className="section-label">Panjang cerita</label>
        <div
          className="grid grid-cols-3 gap-1 rounded-xl border p-1"
          style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}
        >
          {MESSAGE_LENGTHS.map((option) => (
            <button
              key={option.count}
              type="button"
              onClick={() => setMsgCount(option.count)}
              className="rounded-lg px-2 py-2 text-[10.5px] transition-colors"
              style={{
                background: msgCount === option.count ? 'rgba(37,211,102,0.13)' : 'transparent',
                color: msgCount === option.count ? 'var(--wa-green)' : 'var(--wa-text-muted)',
              }}
            >
              <strong className="block text-[11.5px]">Target {option.count}</strong>
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <details
        className="rounded-xl border"
        style={{ background: 'var(--ui-card)', borderColor: geminiKey ? 'rgba(37,211,102,0.35)' : 'var(--ui-border)' }}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2">
            <KeyRound size={14} style={{ color: geminiKey ? 'var(--wa-green)' : 'var(--wa-text-muted)' }} />
            <span className="text-[11px] font-semibold" style={{ color: 'var(--wa-text)' }}>
              Ganti Gemini API key
            </span>
          </span>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold"
            style={{
              background: geminiKey ? 'rgba(37,211,102,0.12)' : 'rgba(255,255,255,0.05)',
              color: geminiKey ? 'var(--wa-green)' : 'var(--wa-text-muted)',
            }}
          >
            {geminiKey ? 'KEY MANUAL AKTIF' : 'OPSIONAL'}
          </span>
        </summary>

        <div className="border-t px-3 pb-3 pt-2.5" style={{ borderColor: 'var(--ui-border)' }}>
          <div className="relative flex items-center">
            <input
              type={showGeminiKey ? 'text' : 'password'}
              className="input pr-9 font-mono text-[10.5px]"
              value={geminiKey}
              onChange={(event) => updateGeminiKey(event.target.value.trim())}
              placeholder="Masukkan Google Gemini API key"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowGeminiKey((current) => !current)}
              className="absolute right-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--wa-text-muted)' }}
              title={showGeminiKey ? 'Sembunyikan API key' : 'Tampilkan API key'}
            >
              {showGeminiKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="mt-2 flex items-start justify-between gap-3">
            <p className="text-[9.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
              Disimpan lokal di browser ini dan hanya dikirim saat kamu membuat naskah.
            </p>
            {geminiKey ? (
              <button
                type="button"
                onClick={() => updateGeminiKey('')}
                className="shrink-0 text-[9.5px] font-semibold text-red-300 transition-opacity hover:opacity-70"
              >
                Pakai bawaan
              </button>
            ) : null}
          </div>
        </div>
      </details>

      {error && (
        <div
          className="rounded-xl border p-2.5 text-[11px] leading-relaxed"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#fca5a5' }}
        >
          {error}
        </div>
      )}

      {generated && !loading && (
        <div
          className="flex items-center gap-2 rounded-xl border p-2.5"
          style={{ background: 'rgba(37,211,102,0.08)', borderColor: 'rgba(37,211,102,0.25)' }}
        >
          <CheckCircle size={14} style={{ color: 'var(--wa-green)' }} />
          <span className="text-[11px]" style={{ color: 'var(--wa-green)' }}>
            Naskah siap. Kamu masih bisa mengedit setiap bubble di Urutan Pesan.
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="btn btn-primary w-full gap-2 py-3 text-[12.5px] font-bold"
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Menulis alur {contentGoal === 'horror' ? 'horror' : contentGoal === 'comedy_product' ? 'komedi' : 'drama'}…
          </>
        ) : (
          <>
            <Wand2 size={15} />
            {generatorMode === 'improvise' ? 'Lanjutkan naskah' : 'Buat naskah'}
          </>
        )}
      </button>

      {generated && (
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] transition-opacity hover:opacity-70"
          style={{ color: 'var(--wa-text-muted)' }}
        >
          <RefreshCw size={12} /> Generate versi lain
        </button>
      )}
    </div>
  );
}
