'use client';

import React, { useRef, useState } from 'react';
import { Check, Image as ImageIcon, Palette, Sparkles, Upload, X } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { compressImageFile } from '@/lib/utils';

const CHAT_THEMES = [
  { id: 'whatsapp', name: 'WhatsApp', background: '#efeae2', bubble: '#d9fdd3', isDefault: true },
  { id: 'ocean', name: 'Ocean', background: '#0c1c26', bubble: '#046a78' },
  { id: 'plum', name: 'Plum', background: '#181321', bubble: '#6b3fa0' },
  { id: 'rose', name: 'Rose', background: '#211418', bubble: '#8f3f52' },
  { id: 'moss', name: 'Moss', background: '#101b17', bubble: '#356653' },
  { id: 'midnight', name: 'Midnight', background: '#101725', bubble: '#315c9c' },
] as const;

const WALLPAPER_COLORS = ['#0b141a', '#0c1c26', '#181321', '#211418', '#101b17', '#101725'];
const BUBBLE_COLORS = ['#d9fdd3', '#005c4b', '#046a78', '#315c9c', '#6b3fa0', '#8f3f52'];

export default function WallpaperSection() {
  const {
    bgType,
    bgColor,
    bubbleColor,
    bgImage,
    setBgType,
    setBgColor,
    setBubbleColor,
    setBgImage,
  } = useEditorStore();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const activeTheme = CHAT_THEMES.find((theme) =>
    theme.id === 'whatsapp'
      ? bgType === 'default' && bubbleColor === theme.bubble
      : bgType === 'color' && bgColor === theme.background && bubbleColor === theme.bubble
  );

  function applyTheme(theme: (typeof CHAT_THEMES)[number]) {
    setBgColor(theme.background);
    setBubbleColor(theme.bubble);
    setBgType(theme.id === 'whatsapp' ? 'default' : 'color');
  }

  function chooseMode(mode: 'default' | 'color' | 'image') {
    if (mode === 'default') {
      setBgColor('#efeae2');
      setBubbleColor('#d9fdd3');
    }
    setBgType(mode);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      setBgImage(await compressImageFile(file, 1600, 0.88));
      setBgType('image');
    } finally {
      setIsCompressing(false);
      event.target.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <div>
            <label className="section-label mb-1">Preset chat</label>
            <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
              Wallpaper dan bubble langsung serasi seperti tema aplikasi chat modern.
            </p>
          </div>
          {activeTheme ? (
            <span
              className="mt-0.5 shrink-0 rounded-full px-2 py-1 text-[10px] font-bold"
              style={{ background: 'rgba(37,211,102,0.12)', color: '#25d366' }}
            >
              {activeTheme.name}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CHAT_THEMES.map((theme) => {
            const selected = activeTheme?.id === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => applyTheme(theme)}
                className="group relative overflow-hidden rounded-xl border p-2.5 text-left transition-all"
                style={{
                  background: selected ? 'rgba(37,211,102,0.07)' : 'var(--ui-card)',
                  borderColor: selected ? '#25d366' : 'var(--ui-border)',
                  boxShadow: selected ? '0 0 0 1px rgba(37,211,102,0.2)' : 'none',
                }}
              >
                <div
                  className="relative mb-2 h-14 overflow-hidden rounded-lg"
                  style={{
                    backgroundColor: theme.background,
                    backgroundImage: "url('/whatsapp-doodle.svg')",
                    backgroundSize: '100px 100px',
                  }}
                >
                  <span
                    className="absolute left-2 top-2 h-3.5 w-12 rounded-[5px_5px_5px_1px]"
                    style={{ background: theme.id === 'whatsapp' ? '#ffffff' : '#202c33' }}
                  />
                  <span
                    className="absolute right-2 top-7 h-4 w-16 rounded-[5px_1px_5px_5px]"
                    style={{ background: theme.bubble }}
                  />
                  {selected ? (
                    <span
                      className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ background: '#25d366', color: '#07130c' }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--wa-text)' }}>
                    {theme.name}
                  </span>
                  {theme.id === 'whatsapp' ? (
                    <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: '#00a884' }}>
                      Asli
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border p-3.5" style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'var(--ui-border)' }}>
        <label className="section-label">Wallpaper</label>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl p-1" style={{ background: '#11161d' }}>
          {[
            { value: 'default' as const, label: 'Bawaan', icon: Sparkles },
            { value: 'color' as const, label: 'Warna', icon: Palette },
            { value: 'image' as const, label: 'Foto', icon: ImageIcon },
          ].map(({ value, label, icon: Icon }) => {
            const selected = bgType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => chooseMode(value)}
                className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11.5px] font-semibold transition-all"
                style={{
                  background: selected ? '#202c33' : 'transparent',
                  color: selected ? '#e9edef' : '#8696a0',
                  boxShadow: selected ? '0 1px 4px rgba(0,0,0,0.28)' : 'none',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>

        {bgType === 'default' ? (
          <div className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ background: '#efeae2' }}>
            <div
              className="h-10 w-10 shrink-0 rounded-lg border"
              style={{
                backgroundColor: '#efeae2',
                backgroundImage: "url('/whatsapp-doodle.svg')",
                backgroundSize: '70px 70px',
                borderColor: 'rgba(134,150,160,0.2)',
              }}
            />
            <div>
              <p className="text-[12px] font-semibold" style={{ color: '#111b21' }}>WhatsApp Classic</p>
              <p className="mt-0.5 text-[10.5px]" style={{ color: '#667781' }}>Latar krem dan bubble hijau muda.</p>
            </div>
          </div>
        ) : null}

        {bgType === 'color' ? (
          <div className="mt-3">
            <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.12em]" style={{ color: '#8696a0' }}>
              Warna latar
            </p>
            <div className="grid grid-cols-6 gap-2">
              {WALLPAPER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Pilih wallpaper ${color}`}
                  onClick={() => setBgColor(color)}
                  className="relative aspect-square rounded-lg border-2 transition-transform hover:scale-105"
                  style={{
                    background: color,
                    borderColor: bgColor === color ? '#25d366' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  {bgColor === color ? (
                    <Check size={13} className="absolute inset-0 m-auto" color="#e9edef" strokeWidth={3} />
                  ) : null}
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: 'var(--ui-border)' }}>
              <input
                aria-label="Warna wallpaper kustom"
                type="color"
                value={bgColor}
                onChange={(event) => setBgColor(event.target.value)}
                className="h-8 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
              />
              <span className="text-[11px]" style={{ color: '#8696a0' }}>Warna kustom</span>
              <span className="ml-auto font-mono text-[10.5px] uppercase" style={{ color: '#aebac1' }}>{bgColor}</span>
            </div>
          </div>
        ) : null}

        {bgType === 'image' ? (
          <div className="mt-3">
            {bgImage ? (
              <div className="relative h-32 overflow-hidden rounded-xl border" style={{ borderColor: 'var(--ui-border)' }}>
                <img src={bgImage} alt="Wallpaper yang dipilih" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/10" />
                <button
                  type="button"
                  onClick={() => { setBgImage(null); chooseMode('default'); }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
                  aria-label="Hapus wallpaper"
                >
                  <X size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2.5 py-1.5 text-[10.5px] font-semibold text-white"
                >
                  Ganti foto
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isCompressing}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-6 transition-colors"
                style={{ borderColor: '#3b4a54', background: '#111b21', color: '#aebac1' }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: '#202c33', color: '#00a884' }}>
                  <Upload size={18} />
                </span>
                <span className="text-[12px] font-semibold">{isCompressing ? 'Menyiapkan foto…' : 'Pilih foto wallpaper'}</span>
                <span className="text-[10px]" style={{ color: '#8696a0' }}>Gambar otomatis diperkecil agar ringan.</span>
              </button>
            )}
          </div>
        ) : null}

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <label className="section-label mb-1">Bubble pesan kamu</label>
            <p className="text-[10.5px]" style={{ color: '#8696a0' }}>Bubble masuk tetap netral seperti WhatsApp asli.</p>
          </div>
          <span className="font-mono text-[10.5px] uppercase" style={{ color: '#aebac1' }}>{bubbleColor}</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {BUBBLE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Pilih warna bubble ${color}`}
              onClick={() => setBubbleColor(color)}
              className="relative aspect-square rounded-[9px_2px_9px_9px] border-2 transition-transform hover:scale-105"
              style={{
                background: color,
                borderColor: bubbleColor === color ? '#25d366' : 'rgba(255,255,255,0.06)',
              }}
            >
              {bubbleColor === color ? (
                <Check size={13} className="absolute inset-0 m-auto" color="#e9edef" strokeWidth={3} />
              ) : null}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
