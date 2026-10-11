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
type ContentGoal = 'drama_product' | 'horror';
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
    description: 'Tensi tinggi di awal, minta maaf, lalu reveal produk.',
    prompt:
      'PEMILIK HP / outgoing adalah cewek. KONTAK / incoming adalah cowok. Cewek membuka dengan "Gak usah hubungin aku dulu. Aku capek debat terus." Cowok merespons singkat dan tulus. Akhiri dengan cowok (incoming) mengirim sesuatu sebagai bentuk permintaan maaf. Jangan terasa seperti iklan.',
    productName: "I'm Sorry, Love",
    productDescription: 'Pesan yang sulit aku ucapkan langsung buat kamu',
  },
  {
    id: 'proud-but-caring',
    goal: 'drama_product',
    name: 'Gengsi tapi Sayang',
    eyebrow: 'Soft selling',
    description: 'Sulit bicara langsung, akhirnya mengirim sesuatu yang personal.',
    prompt:
      'PEMILIK HP / outgoing adalah cewek. KONTAK / incoming adalah cowok. Cewek menyindir karena cowok terlihat tidak merasa bersalah. Cowok mengaku tidak pandai merangkai kata, lalu cowok (incoming) mengirim sesuatu yang sudah ia siapkan. Buat percakapan natural, emosional, dan tidak menjual secara terang-terangan.',
    productName: 'A Little Note for You',
    productDescription: 'Ada sesuatu yang ingin aku sampaikan lewat halaman ini',
  },
  {
    id: 'digital-surprise',
    goal: 'drama_product',
    name: 'Kejutan Digital',
    eyebrow: 'Product reveal',
    description: 'Bangun rasa penasaran sebelum hadiah digital dibuka.',
    prompt:
      'KONTAK / incoming adalah orang yang sedang ulang tahun. PEMILIK HP / outgoing adalah pasangannya yang sebenarnya sudah menyiapkan kejutan. Alur naturalnya: incoming bertanya "Kamu lupa hari ini hari apa?", outgoing menjawab santai "Hari apa emang?", incoming kecewa singkat "Oh, gapapa", lalu outgoing mengaku cuma bercanda dan sudah menyiapkan sesuatu. Akhiri dengan outgoing mengirim kejutan tersebut. Buat variasi dari alur ini, jangan salin kaku. Jangan menukar peran, jangan membuat orang yang ulang tahun mengirim hadiah untuk dirinya sendiri, dan jangan menulis kalimat aneh seperti "Hari ulang tahunku, deh".',
    productName: 'A Birthday Surprise',
    productDescription: 'Kejutan kecil yang aku siapkan khusus buat kamu',
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
          : effectiveProductReveal === 'none'
            ? 'Buat drama pasangan yang natural dan selesai melalui percakapan, tanpa link atau foto wajib.'
            : 'Buat drama pasangan yang berakhir dengan reveal produk secara natural.');
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
          product: generatorMode === 'create' && contentGoal === 'drama_product' && effectiveProductReveal !== 'none'
            ? {
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

      if (generatorMode === 'create' && contentGoal === 'drama_product' && effectiveProductReveal === 'none') {
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

      if (generatorMode === 'create' && contentGoal === 'drama_product' && effectiveProductReveal !== 'none') {
        const revealDirection = selectedPreset === 'digital-surprise' ? 'outgoing' : 'incoming';
        const fallbackRevealText = selectedPreset === 'digital-surprise'
          ? 'Aku udah siapin ini buat kamu.'
          : selectedPreset === 'proud-but-caring'
            ? 'Aku susah ngomong langsung. Jadi aku bikin ini.'
            : 'Aku bikin ini buat minta maaf.';

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
            const lastIndex = Math.max(0, newMessages.length - 1);
            productPhoto = {
              id: newId('msg'),
              type: 'image',
              direction: revealDirection,
              imageData: productImage,
              caption: fallbackRevealText,
              time: newMessages[lastIndex]?.time,
            };
            newMessages.splice(lastIndex, 1);
          }

          const previousText = newMessages[newMessages.length - 1]?.text ?? '';
          if (/\b(lihat|cek|foto|barcode|qr|ini)\b/i.test(previousText)) {
            productPhoto.caption = undefined;
          }
          newMessages.push(productPhoto);
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
          const lastIndex = Math.max(0, newMessages.length - 1);
          productLink = {
            id: newId('msg'),
            type: 'link',
            direction: revealDirection,
            text: selectedPreset === 'digital-surprise'
              ? 'Aku bikinin sesuatu buat kamu. Buka ya.'
              : selectedPreset === 'proud-but-caring'
                ? 'Aku susah ngomong langsung. Buka ini ya.'
                : 'Aku bikin ini buat minta maaf. Buka ya.',
            time: newMessages[lastIndex]?.time,
            ...product,
          };
          newMessages.splice(lastIndex, 1);
        }

        const previousText = newMessages[newMessages.length - 1]?.text ?? '';
        const hasRevealCta = (value?: string) => /\b(buka|klik|link|tautan)\b/i.test(value ?? '');
        if (hasRevealCta(previousText) && hasRevealCta(productLink.text)) {
          productLink.text = undefined;
        }
        newMessages.push(productLink);
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
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => chooseGoal('drama_product')}
                className="rounded-xl border p-3 text-left transition-all"
                style={{
                  background: contentGoal === 'drama_product' ? 'rgba(37,211,102,0.09)' : 'var(--ui-card)',
                  borderColor: contentGoal === 'drama_product' ? 'rgba(37,211,102,0.55)' : 'var(--ui-border)',
                }}
              >
                <span className="text-[18px]">💌</span>
                <strong className="mt-2 block text-[12px]" style={{ color: 'var(--wa-text)' }}>Drama + Produk</strong>
                <span className="mt-1 block text-[10.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
                  Cerita emosional dengan reveal produk yang halus.
                </span>
              </button>

              <button
                type="button"
                onClick={() => chooseGoal('horror')}
                className="rounded-xl border p-3 text-left transition-all"
                style={{
                  background: contentGoal === 'horror' ? 'rgba(168,85,247,0.10)' : 'var(--ui-card)',
                  borderColor: contentGoal === 'horror' ? 'rgba(168,85,247,0.60)' : 'var(--ui-border)',
                }}
              >
                <span className="text-[18px]">👻</span>
                <strong className="mt-2 block text-[12px]" style={{ color: 'var(--wa-text)' }}>Horror Chat</strong>
                <span className="mt-1 block text-[10.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
                  Chat realistis, tegang, dan berakhir plot twist.
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
                      borderColor: active
                        ? contentGoal === 'horror' ? 'rgba(168,85,247,0.55)' : 'rgba(37,211,102,0.50)'
                        : 'var(--ui-border)',
                    }}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <strong className="text-[12px]" style={{ color: 'var(--wa-text)' }}>{preset.name}</strong>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                        style={{
                          background: contentGoal === 'horror' ? 'rgba(168,85,247,0.14)' : 'rgba(37,211,102,0.12)',
                          color: contentGoal === 'horror' ? '#c084fc' : 'var(--wa-green)',
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

      {generatorMode === 'create' && contentGoal === 'drama_product' && (
        <section
          className="rounded-xl border p-3"
          style={{ background: 'rgba(56,189,248,0.05)', borderColor: 'rgba(56,189,248,0.22)' }}
        >
          <div className="mb-3 flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-[15px]">🎁</span>
            <div>
              <p className="text-[11.5px] font-semibold text-sky-300">Reveal produk (opsional)</p>
              <p className="mt-0.5 text-[10px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
                Naskah tetap bisa dibuat tanpa link, foto, barcode, atau QR.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-3 gap-2">
              {([
                ['none', '💬 Tanpa media', 'Percakapan saja'],
                ['link', '🔗 Kartu link', 'Thumbnail + tautan'],
                ['image', '▣ Foto / QR', 'Gambar saja'],
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
              <label className="section-label">Link produk (opsional)</label>
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
                {productReveal === 'image' ? 'Foto produk / barcode / QR (opsional)' : 'Thumbnail produk (opsional)'}
              </label>
              {productImage ? (
                <div
                  className="flex items-center gap-2 rounded-lg border p-2"
                  style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}
                >
                  <img
                    src={productImage}
                    alt="Thumbnail produk"
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
            Menulis alur {contentGoal === 'horror' ? 'horror' : 'drama'}…
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
