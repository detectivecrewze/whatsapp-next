'use client';

import React from 'react';
import {
  ExternalLink,
  Flame,
  Heart,
  MousePointerClick,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useBrandStudioStore } from '@/store/useBrandStudioStore';
import type { BrandGifOverlayItem, BrandGifPositionPreset } from '@/types/brand';
import styles from '@/app/brand/brand.module.css';

const SAMPLE_GIFS: Array<{ label: string; url: string; preset: BrandGifPositionPreset; icon: typeof Sparkles }> = [
  {
    label: 'Fire Glow',
    url: 'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif',
    preset: 'top-right',
    icon: Flame,
  },
  {
    label: 'Sparkle Star',
    url: 'https://media.giphy.com/media/Lp9pyy23rBsm48I55P/giphy.gif',
    preset: 'top-left',
    icon: Sparkles,
  },
  {
    label: 'Cute Heart',
    url: 'https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif',
    preset: 'center-right',
    icon: Heart,
  },
  {
    label: 'Pointing Arrow',
    url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    preset: 'bottom-center',
    icon: MousePointerClick,
  },
];

const POSITION_PRESETS: Array<{ id: BrandGifPositionPreset; label: string; row: number; col: number }> = [
  { id: 'top-left', label: 'TL', row: 0, col: 0 },
  { id: 'top-center', label: 'TC', row: 0, col: 1 },
  { id: 'top-right', label: 'TR', row: 0, col: 2 },
  { id: 'center-left', label: 'CL', row: 1, col: 0 },
  { id: 'center', label: 'C', row: 1, col: 1 },
  { id: 'center-right', label: 'CR', row: 1, col: 2 },
  { id: 'bottom-left', label: 'BL', row: 2, col: 0 },
  { id: 'bottom-center', label: 'BC', row: 2, col: 1 },
  { id: 'bottom-right', label: 'BR', row: 2, col: 2 },
];

export default function BrandGifStickersSection() {
  const gifOverlays = useBrandStudioStore((state) => state.gifOverlays ?? []);
  const addGifOverlay = useBrandStudioStore((state) => state.addGifOverlay);
  const updateGifOverlay = useBrandStudioStore((state) => state.updateGifOverlay);
  const removeGifOverlay = useBrandStudioStore((state) => state.removeGifOverlay);
  const toggleGifOverlay = useBrandStudioStore((state) => state.toggleGifOverlay);

  const handleAddCustom = () => {
    addGifOverlay({
      url: '',
      label: `GIF #${gifOverlays.length + 1}`,
      preset: 'top-right',
      width: 260,
      scope: 'hook',
    });
  };

  const handleAddSample = (sample: (typeof SAMPLE_GIFS)[number]) => {
    addGifOverlay({
      url: sample.url,
      label: sample.label,
      preset: sample.preset,
      width: 260,
      scope: 'hook',
    });
  };

  return (
    <div className={styles.sectionStack}>
      <div className={styles.mediaCard} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f5ebe6' }}>Stiker & GIF Overlay</h3>
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#a89a91', lineHeight: 1.45 }}>
              Tempel animasi GIF di atas video preview dan hasil export MP4. Cukup paste link URL tanpa perlu upload.
            </p>
          </div>
          <button
            type="button"
            className={styles.effectPreviewButton}
            onClick={handleAddCustom}
            style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', whiteSpace: 'nowrap' }}
          >
            <Plus size={14} /> Tambah GIF
          </button>
        </div>

        {/* Quick Sample Presets */}
        <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#bbaea6', marginBottom: 8 }}>
            Contoh Cepat (Eksperimen Langsung):
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {SAMPLE_GIFS.map((sample) => {
              const Icon = sample.icon;
              return (
                <button
                  key={sample.label}
                  type="button"
                  className={styles.audioPresetCard}
                  onClick={() => handleAddSample(sample)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', textAlign: 'left', width: '100%' }}
                >
                  <Icon size={14} style={{ opacity: 0.85, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sample.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {gifOverlays.length === 0 ? (
        <div className={styles.variantEmptyState} style={{ padding: '26px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Sparkles size={26} style={{ opacity: 0.5, margin: '0 auto 8px', display: 'block', color: 'var(--brand-accent, #d79a87)' }} />
          <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#f5ebe6' }}>Belum ada stiker GIF</h4>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: '#a89a91', lineHeight: 1.5, maxWidth: 280 }}>
            Pilih salah satu contoh di atas atau klik tombol di bawah untuk menaruh link GIF kamu sendiri.
          </p>
          <button
            type="button"
            onClick={handleAddCustom}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 40,
              padding: '0 24px',
              borderRadius: 11,
              border: '1px solid rgba(215, 154, 135, 0.58)',
              background: 'linear-gradient(135deg, #d79a87, #b9786d)',
              color: '#171311',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={15} /> Tambah GIF Baru
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {gifOverlays.map((item, index) => (
            <GifOverlayCard
              key={item.id}
              item={item}
              index={index}
              onUpdate={(updates) => updateGifOverlay(item.id, updates)}
              onRemove={() => removeGifOverlay(item.id)}
              onToggle={() => toggleGifOverlay(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GifOverlayCard({
  item,
  index,
  onUpdate,
  onRemove,
  onToggle,
}: {
  item: BrandGifOverlayItem;
  index: number;
  onUpdate: (updates: Partial<BrandGifOverlayItem>) => void;
  onRemove: () => void;
  onToggle: () => void;
}) {
  return (
    <section className={styles.mediaCard} style={{ opacity: item.enabled ? 1 : 0.65 }}>
      {/* Header */}
      <div className={styles.mediaCardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {item.url ? (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.25)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.label || 'GIF thumbnail'}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.08)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 700,
                opacity: 0.5,
              }}
            >
              GIF
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>
              {item.label || `Stiker GIF #${index + 1}`}
            </span>
            <span style={{ fontSize: 11, opacity: 0.65, display: 'block' }}>
              Posisi: {item.preset} · {item.width}px · {item.scope === 'hook' ? 'Hook Only' : 'Full Video'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className={styles.clearButton}
            onClick={onToggle}
            style={{ padding: '6px 10px', fontSize: 11 }}
          >
            {item.enabled ? 'Aktif' : 'Nonaktif'}
          </button>
          <button
            type="button"
            className={styles.clearButton}
            onClick={onRemove}
            title="Hapus GIF"
            style={{ color: '#ff6b6b' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Input URL */}
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <label className={styles.fieldLabel}>
          Link URL GIF (Direct .gif / Giphy / Tenor)
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="url"
            value={item.url}
            placeholder="https://media.giphy.com/media/.../giphy.gif"
            onChange={(e) => onUpdate({ url: e.target.value })}
            className={styles.input}
            style={{ flex: 1 }}
          />
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.clearButton}
              title="Buka link di tab baru"
              style={{ display: 'grid', placeItems: 'center', padding: '0 12px' }}
            >
              <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
      </div>

      {/* Grid Posisi 9-Titik */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className={styles.fieldLabel} style={{ margin: 0 }}>Penempatan Cepat (9 Titik)</span>
          <span style={{ fontSize: 11, opacity: 0.65 }}>Aktif: {item.preset}</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            maxWidth: 240,
            background: 'rgba(0,0,0,0.18)',
            padding: 6,
            borderRadius: 10,
          }}
        >
          {POSITION_PRESETS.map((pos) => {
            const isActive = item.preset === pos.id;
            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => onUpdate({ preset: pos.id })}
                style={{
                  height: 34,
                  borderRadius: 6,
                  border: isActive ? '1.5px solid var(--brand-accent, #e8789a)' : '1px solid rgba(255,255,255,0.08)',
                  background: isActive ? 'rgba(232, 120, 154, 0.22)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {pos.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders: Size, Offset X, Offset Y */}
      <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span>Ukuran GIF (Lebar)</span>
            <strong>{item.width} px</strong>
          </div>
          <input
            type="range"
            min={80}
            max={520}
            step={10}
            value={item.width}
            onChange={(e) => onUpdate({ width: Number(e.target.value) })}
            className={styles.slider}
          />
        </div>

        <div className={styles.twoColumns}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span>Geser X</span>
              <span>{item.offsetX > 0 ? `+${item.offsetX}%` : `${item.offsetX}%`}</span>
            </div>
            <input
              type="range"
              min={-40}
              max={40}
              step={1}
              value={item.offsetX}
              onChange={(e) => onUpdate({ offsetX: Number(e.target.value) })}
              className={styles.slider}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span>Geser Y</span>
              <span>{item.offsetY > 0 ? `+${item.offsetY}%` : `${item.offsetY}%`}</span>
            </div>
            <input
              type="range"
              min={-40}
              max={40}
              step={1}
              value={item.offsetY}
              onChange={(e) => onUpdate({ offsetY: Number(e.target.value) })}
              className={styles.slider}
            />
          </div>
        </div>

        <div className={styles.twoColumns}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span>Rotasi</span>
              <span>{item.rotation}°</span>
            </div>
            <input
              type="range"
              min={-45}
              max={45}
              step={1}
              value={item.rotation}
              onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
              className={styles.slider}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span>Transparansi</span>
              <span>{Math.round(item.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={item.opacity}
              onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
              className={styles.slider}
            />
          </div>
        </div>

        {/* Reset fine-tuning */}
        {(item.offsetX !== 0 || item.offsetY !== 0 || item.rotation !== 0 || item.opacity !== 1) && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => onUpdate({ offsetX: 0, offsetY: 0, rotation: 0, opacity: 1 })}
            style={{ alignSelf: 'start', fontSize: 10.5, display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <RotateCcw size={12} /> Reset Geser & Rotasi
          </button>
        )}
      </div>

      {/* Scope / Kemunculan Scene */}
      <div style={{ marginTop: 14 }}>
        <span className={styles.fieldLabel}>Waktu Kemunculan</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
          <button
            type="button"
            className={item.scope === 'hook' ? styles.goalCardActive : styles.goalCard}
            onClick={() => onUpdate({ scope: 'hook' })}
            style={{ padding: '8px 12px', textAlign: 'left', minHeight: 0 }}
          >
            <strong style={{ display: 'block', fontSize: 12 }}>Hook Saja</strong>
            <small style={{ fontSize: 10.5, opacity: 0.72 }}>Muncul di klip pembuka</small>
          </button>
          <button
            type="button"
            className={item.scope === 'always' ? styles.goalCardActive : styles.goalCard}
            onClick={() => onUpdate({ scope: 'always' })}
            style={{ padding: '8px 12px', textAlign: 'left', minHeight: 0 }}
          >
            <strong style={{ display: 'block', fontSize: 12 }}>Sepanjang Video</strong>
            <small style={{ fontSize: 10.5, opacity: 0.72 }}>Tampil di semua scene</small>
          </button>
        </div>
      </div>
    </section>
  );
}
