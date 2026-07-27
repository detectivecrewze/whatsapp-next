'use client';

import React, { useRef } from 'react';
import { Upload, X, Palette } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

const PRESET_COLORS = [
  '#111b21', '#0d1117', '#1a1a2e', '#16213e',
  '#0f3460', '#1b2838', '#1a0a0a', '#0a1a0a',
  '#1a0f1a', '#2d1b69', '#1a1a1a', '#0d0d0d',
];

export default function WallpaperSection() {
  const { bgType, bgColor, bgImage, setBgType, setBgColor, setBgImage } = useEditorStore();
  const imageInputRef = useRef<HTMLInputElement>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBgImage(ev.target?.result as string);
      setBgType('image');
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Type selector */}
      <div>
        <label className="section-label">Tipe Wallpaper</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { value: 'default', label: '🌿 Default' },
            { value: 'color', label: '🎨 Warna' },
            { value: 'image', label: '🖼️ Foto' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setBgType(value as 'default' | 'color' | 'image')}
              className="py-1.5 rounded-lg text-[11.5px] font-medium transition-all border"
              style={{
                background: bgType === value ? 'rgba(37,211,102,0.15)' : 'var(--ui-card)',
                borderColor: bgType === value ? 'var(--wa-green)' : 'var(--ui-border)',
                color: bgType === value ? 'var(--wa-green)' : 'var(--wa-text-muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      {bgType === 'color' && (
        <div>
          <label className="section-label">Pilih Warna</label>
          {/* Preset colors */}
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setBgColor(color)}
                className="w-full aspect-square rounded-lg border-2 transition-all"
                style={{
                  background: color,
                  borderColor: bgColor === color ? 'var(--wa-green)' : 'transparent',
                  boxShadow: bgColor === color ? '0 0 0 1px var(--wa-green)' : 'none',
                }}
              />
            ))}
          </div>
          {/* Custom color picker */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border"
              style={{ background: bgColor, borderColor: 'var(--ui-border)' }}
            />
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="flex-1 h-8 rounded-lg cursor-pointer border"
              style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}
            />
            <span className="text-[11px] font-mono" style={{ color: 'var(--wa-text-muted)' }}>
              {bgColor}
            </span>
          </div>
        </div>
      )}

      {/* Image upload */}
      {bgType === 'image' && (
        <div>
          <label className="section-label">Upload Foto Wallpaper</label>
          {bgImage ? (
            <div className="relative rounded-lg overflow-hidden" style={{ height: 100 }}>
              <img src={bgImage} alt="wallpaper" className="w-full h-full object-cover" />
              <button
                onClick={() => { setBgImage(null); setBgType('default'); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'var(--ui-danger)' }}
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 transition-all hover:opacity-80"
              style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)' }}
            >
              <Upload size={20} />
              <span className="text-[12px]">Klik untuk upload gambar</span>
            </button>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      )}
    </div>
  );
}
