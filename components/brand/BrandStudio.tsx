'use client';

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { Player } from '@remotion/player';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  Film,
  Image as ImageIcon,
  LayoutTemplate,
  Layers3,
  Music2,
  PackageOpen,
  Palette,
  Play,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Type,
  Upload,
  Video,
  Volume2,
  WandSparkles,
} from 'lucide-react';
import { BRAND_CONTENT_GOALS, getRecommendedVariant } from '@/lib/brandVariants';
import {
  BRAND_HOOK_PRESETS,
  BRAND_KIT_PRESETS,
  BRAND_PALETTE_PRESETS,
  BRAND_SFX_FILES,
  BRAND_SFX_GROUPS,
  BRAND_TEMPLATE_LIST,
  BRAND_VIDEO_FPS,
  BRAND_VIDEO_HEIGHT,
  BRAND_VIDEO_WIDTH,
  getBrandDurationInFrames,
} from '@/lib/brandTemplates';
import { BrandVideo } from '@/remotion/brand/BrandVideo';
import {
  getBrandVideoProps,
  useBrandStudioStore,
  type BrandEditorSection,
} from '@/store/useBrandStudioStore';
import type {
  BrandCopy,
  BrandContentGoal,
  BrandHookAlignment,
  BrandHookBackgroundMode,
  BrandHookBackgroundMotion,
  BrandHookExit,
  BrandHookMotion,
  BrandHookPartMotions,
  BrandHookSequenceMode,
  BrandHookTypography,
  BrandMediaSlot,
  BrandOutputMode,
  BrandPalette,
  BrandTiming,
  BrandTransitionSfx,
} from '@/types/brand';
import BrandExportButton from './BrandExportButton';
import BrandBatchExport from './BrandBatchExport';
import BrandTemplatePackFields from './BrandTemplatePackFields';
import styles from '@/app/brand/brand.module.css';

const SECTIONS: Array<{
  id: BrandEditorSection;
  label: string;
  description: string;
  icon: typeof LayoutTemplate;
}> = [
  { id: 'templates', label: 'Template', description: 'Pilih gaya campaign', icon: LayoutTemplate },
  { id: 'template-packs', label: 'Template Pack', description: 'Cerita siap produksi', icon: PackageOpen },
  { id: 'copy', label: 'Naskah', description: 'Hook, cerita, dan CTA', icon: Type },
  { id: 'effects', label: 'Efek', description: 'Transisi dan SFX', icon: WandSparkles },
  { id: 'media', label: 'Media', description: 'Foto atau video produk', icon: ImageIcon },
  { id: 'style', label: 'Warna', description: 'Palet visual brand', icon: Palette },
  { id: 'timing', label: 'Timing', description: 'Durasi setiap scene', icon: Clock3 },
  { id: 'audio', label: 'Audio', description: 'Backsound dan SFX', icon: Music2 },
  { id: 'variants', label: 'Variasi', description: 'Buat dan pilih versi A/B/C', icon: Layers3 },
  { id: 'export', label: 'Export', description: 'Render MP4 vertikal', icon: Download },
];

const HOOK_MOTION_OPTIONS: Array<{ value: BrandHookMotion; label: string }> = [
  { value: 'fade', label: 'Fade' },
  { value: 'soft', label: 'Soft rise' },
  { value: 'pop', label: 'Pop' },
  { value: 'slide', label: 'Slide' },
  { value: 'blur', label: 'Blur reveal' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'word-reveal', label: 'Kata per kata' },
  { value: 'cinematic', label: 'Cinematic focus' },
];

function sectionDescription(section: BrandEditorSection, outputMode: BrandOutputMode) {
  if (outputMode === 'campaign') {
    return SECTIONS.find((entry) => entry.id === section)?.description ?? '';
  }

  if (section === 'templates') return 'Pilih gaya visual hook';
  if (section === 'template-packs') return 'Cerita lengkap siap dipersonalisasi';
  if (section === 'copy') return 'Teks, tipografi, dan animasi';
  if (section === 'effects') return 'Transisi masuk, keluar, dan SFX';
  if (section === 'media') return 'Background foto atau video hook';
  if (section === 'style') return 'Warna hook sesuai brand';
  if (section === 'timing') return 'Durasi klip pembuka';
  if (section === 'audio') return 'Backsound dan SFX pembuka';
  if (section === 'variants') return 'Buat, bandingkan, dan pilih versi A/B/C';
  if (section === 'export') return 'Export Hook MP4 HD';
  return '';
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function CopyFields() {
  const copy = useBrandStudioStore((state) => state.copy);
  const hook = useBrandStudioStore((state) => state.hook);
  const timing = useBrandStudioStore((state) => state.timing);
  const outputMode = useBrandStudioStore((state) => state.outputMode);
  const activeHookPresetId = useBrandStudioStore((state) => state.activeHookPresetId);
  const showSafeArea = useBrandStudioStore((state) => state.showSafeArea);
  const updateCopy = useBrandStudioStore((state) => state.updateCopy);
  const updateHook = useBrandStudioStore((state) => state.updateHook);
  const updateTiming = useBrandStudioStore((state) => state.updateTiming);
  const applyHookPreset = useBrandStudioStore((state) => state.applyHookPreset);
  const setShowSafeArea = useBrandStudioStore((state) => state.setShowSafeArea);
  const sequenceMode = hook.sequenceMode ?? 'single';
  const hookFields: Array<{ key: keyof BrandCopy; label: string; multiline?: boolean }> = [
    { key: 'eyebrow', label: 'Brand kecil di atas' },
    { key: 'hookTitle', label: sequenceMode === 'three-beat' ? 'Beat 1 · Hook utama' : 'Hook utama' },
    { key: 'hookAccent', label: sequenceMode === 'three-beat' ? 'Beat 1 · Aksen' : 'Hook aksen / italic' },
    ...(sequenceMode === 'three-beat'
      ? [
          { key: 'hookBridge' as keyof BrandCopy, label: 'Beat 2 · Penguat / konflik' },
          { key: 'hookReveal' as keyof BrandCopy, label: 'Beat 3 · Reveal digital gift' },
        ]
      : []),
    { key: 'hookFooter', label: 'Teks kecil di bawah' },
  ];
  const campaignFields: Array<{ key: keyof BrandCopy; label: string; multiline?: boolean }> = [
    { key: 'storyTitle', label: 'Judul cerita' },
    { key: 'storyBody', label: 'Penjelasan singkat', multiline: true },
    { key: 'productName', label: 'Nama produk digital' },
    { key: 'productDetail', label: 'Detail produk' },
    { key: 'cta', label: 'Call to action' },
    { key: 'domain', label: 'Domain / username' },
  ];
  const fields = outputMode === 'hook' ? hookFields : [...hookFields, ...campaignFields];

  return (
    <div className={styles.sectionStack}>
      <div className={styles.introCard}>
        <WandSparkles size={18} />
        <div>
          <strong>Preset hook siap produksi</strong>
          <p>Satu klik mengatur naskah, font, motion, warna, durasi, dan SFX.</p>
        </div>
      </div>
      <div className={styles.hookPresetGrid}>
        {BRAND_HOOK_PRESETS.map((preset) => (
          <button
            type="button"
            key={preset.id}
            className={`${styles.hookPresetCard} ${activeHookPresetId === preset.id ? styles.hookPresetCardActive : ''}`}
            aria-pressed={activeHookPresetId === preset.id}
            onClick={() => applyHookPreset(preset.id)}
          >
            <span>
              <strong>{preset.label}</strong>
              <small>{preset.tone}</small>
            </span>
            <p>{preset.description}</p>
          </button>
        ))}
      </div>
      <div className={styles.divider} />
      {outputMode === 'hook' ? (
        <>
          <Field label="Struktur hook">
            <div className={styles.segmentedPicker}>
              <button
                type="button"
                className={sequenceMode === 'single' ? styles.segmentedActive : ''}
                onClick={() => updateHook('sequenceMode', 'single' as BrandHookSequenceMode)}
              >
                <strong>Single</strong>
                <small>Satu komposisi</small>
              </button>
              <button
                type="button"
                className={sequenceMode === 'three-beat' ? styles.segmentedActive : ''}
                onClick={() => {
                  updateHook('sequenceMode', 'three-beat' as BrandHookSequenceMode);
                  if (timing.hookSeconds < 4.5) updateTiming('hookSeconds', 5.4);
                }}
              >
                <strong>3 Beat</strong>
                <small>Hook → konflik → reveal</small>
              </button>
            </div>
          </Field>
          <div className={styles.divider} />
        </>
      ) : null}
      {fields.map((field) => (
        <Field key={field.key} label={field.label}>
          {field.multiline ? (
            <textarea
              className={styles.textarea}
              value={copy[field.key]}
              rows={4}
              onChange={(event) => updateCopy(field.key, event.target.value)}
            />
          ) : (
            <input
              className={styles.input}
              value={copy[field.key]}
              onChange={(event) => updateCopy(field.key, event.target.value)}
            />
          )}
        </Field>
      ))}
      {outputMode === 'hook' ? (
        <>
          <div className={styles.divider} />
          <div className={styles.twoColumns}>
            <Field label="Gaya tipografi">
              <select
                className={styles.select}
                value={hook.typography}
                onChange={(event) => updateHook('typography', event.target.value as BrandHookTypography)}
              >
                <option value="brand-serif">Cormorant Garamond · Brand</option>
                <option value="classic">Georgia · Editorial lama</option>
                <option value="editorial">Playfair Display · Editorial</option>
                <option value="clean">Inter · Modern clean</option>
                <option value="bold">Inter · Bold / Viral</option>
                <option value="typewriter">IBM Plex Mono · Typewriter</option>
              </select>
            </Field>
            <Field label="Perataan teks">
              <select
                className={styles.select}
                value={hook.alignment}
                onChange={(event) => updateHook('alignment', event.target.value as BrandHookAlignment)}
              >
                <option value="center">Tengah</option>
                <option value="left">Kiri</option>
              </select>
            </Field>
          </div>
          <Field label={`Ukuran teks — ${Math.round(hook.textScale * 100)}%`}>
            <input
              className={styles.slider}
              type="range"
              min={0.72}
              max={1.25}
              step={0.01}
              value={hook.textScale}
              onChange={(event) => updateHook('textScale', Number(event.target.value))}
            />
          </Field>
          <Field label={`Posisi vertikal — ${hook.positionY}%`}>
            <input
              className={styles.slider}
              type="range"
              min={22}
              max={58}
              step={1}
              value={hook.positionY}
              onChange={(event) => updateHook('positionY', Number(event.target.value))}
            />
          </Field>
          <label className={styles.toggleRow}>
            <span>
              <strong>Garis aksen</strong>
              <small>Tampilkan divider dekoratif di bawah hook.</small>
            </span>
            <input
              type="checkbox"
              checked={hook.showDivider}
              onChange={(event) => updateHook('showDivider', event.target.checked)}
            />
          </label>
          <label className={styles.toggleRow}>
            <span>
              <strong>Auto-fit teks</strong>
              <small>Ukuran menyesuaikan otomatis agar hook panjang tidak terpotong.</small>
            </span>
            <input
              type="checkbox"
              checked={hook.autoFit ?? true}
              onChange={(event) => updateHook('autoFit', event.target.checked)}
            />
          </label>
          <label className={styles.toggleRow}>
            <span>
              <strong>Safe-area TikTok / Reels</strong>
              <small>Panduan hanya tampil di preview dan tidak ikut diekspor.</small>
            </span>
            <input
              type="checkbox"
              checked={showSafeArea}
              onChange={(event) => setShowSafeArea(event.target.checked)}
            />
          </label>
        </>
      ) : null}
    </div>
  );
}

function MediaPicker({ slot, title }: { slot: 'heroMedia' | 'detailMedia'; title: string }) {
  const media = useBrandStudioStore((state) => state[slot]);
  const updateMedia = useBrandStudioStore((state) => state.updateMedia);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (media.src.startsWith('blob:')) URL.revokeObjectURL(media.src);
    updateMedia(slot, {
      src: URL.createObjectURL(file),
      kind: file.type.startsWith('video/') ? 'video' : 'image',
      name: file.name,
    });
  }

  return (
    <section className={styles.mediaCard}>
      <div className={styles.mediaCardHeader}>
        <span className={styles.mediaIcon}>
          {media.kind === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}
        </span>
        <div>
          <strong>{title}</strong>
          <p>{media.name}</p>
        </div>
      </div>
      <label className={styles.uploadButton}>
        <Upload size={15} />
        Ganti foto atau video
        <input type="file" accept="image/*,video/*" hidden onChange={handleFile} />
      </label>
      <div className={styles.twoColumns}>
        <Field label="Tampilan">
          <select
            className={styles.select}
            value={media.fit}
            onChange={(event) => updateMedia(slot, { fit: event.target.value as BrandMediaSlot['fit'] })}
          >
            <option value="cover">Penuhi frame</option>
            <option value="contain">Tampilkan utuh</option>
          </select>
        </Field>
        <Field label="Jenis">
          <div className={styles.readonlyValue}>{media.kind === 'video' ? 'Video' : 'Foto'}</div>
        </Field>
      </div>
      <Field label={`Fokus horizontal — ${media.focusX}%`}>
        <input
          className={styles.slider}
          type="range"
          min={0}
          max={100}
          value={media.focusX}
          onChange={(event) => updateMedia(slot, { focusX: Number(event.target.value) })}
        />
      </Field>
      <Field label={`Fokus vertikal — ${media.focusY}%`}>
        <input
          className={styles.slider}
          type="range"
          min={0}
          max={100}
          value={media.focusY}
          onChange={(event) => updateMedia(slot, { focusY: Number(event.target.value) })}
        />
      </Field>
    </section>
  );
}

function HookBackgroundFields() {
  const templateId = useBrandStudioStore((state) => state.templateId);
  const storedBackground = useBrandStudioStore((state) => state.hookBackground);
  const updateHookBackground = useBrandStudioStore((state) => state.updateHookBackground);
  const updateHookBackgroundMedia = useBrandStudioStore((state) => state.updateHookBackgroundMedia);
  const background = storedBackground ?? BRAND_TEMPLATE_LIST.find(
    (template) => template.id === templateId,
  )!.defaults.hookBackground;

  function handleBackground(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (background.media.src.startsWith('blob:')) URL.revokeObjectURL(background.media.src);
    updateHookBackgroundMedia({
      src: URL.createObjectURL(file),
      kind: file.type.startsWith('video/') ? 'video' : 'image',
      name: file.name,
    });
    updateHookBackground({ mode: 'media' });
  }

  const modes: Array<{ id: BrandHookBackgroundMode; label: string; detail: string }> = [
    { id: 'brand', label: 'Brand', detail: 'Tekstur original' },
    { id: 'gradient', label: 'Gradient', detail: 'Dari palet aktif' },
    { id: 'media', label: 'Foto / video', detail: 'Background sendiri' },
  ];

  return (
    <div className={styles.sectionStack}>
      <div className={styles.introCard}>
        <ImageIcon size={18} />
        <div>
          <strong>Visual background hook</strong>
          <p>Gunakan warna brand, gradient, atau footage sendiri tanpa mengubah media WhatsApp.</p>
        </div>
      </div>
      <Field label="Tipe background">
        <div className={styles.backgroundModeGrid}>
          {modes.map((mode) => (
            <button
              type="button"
              key={mode.id}
              className={background.mode === mode.id ? styles.backgroundModeActive : ''}
              onClick={() => updateHookBackground({ mode: mode.id })}
            >
              <strong>{mode.label}</strong>
              <small>{mode.detail}</small>
            </button>
          ))}
        </div>
      </Field>
      {background.mode === 'media' ? (
        <section className={styles.mediaCard}>
          <div className={styles.mediaCardHeader}>
            <span className={styles.mediaIcon}>
              {background.media.kind === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}
            </span>
            <div>
              <strong>Background hook</strong>
              <p>{background.media.name || 'Belum ada media'}</p>
            </div>
          </div>
          <label className={styles.uploadButton}>
            <Upload size={15} />
            Upload foto atau video
            <input type="file" accept="image/*,video/*" hidden onChange={handleBackground} />
          </label>
          <div className={styles.twoColumns}>
            <Field label="Tampilan">
              <select
                className={styles.select}
                value={background.media.fit}
                onChange={(event) => updateHookBackgroundMedia({
                  fit: event.target.value as BrandMediaSlot['fit'],
                })}
              >
                <option value="cover">Penuhi frame</option>
                <option value="contain">Tampilkan utuh</option>
              </select>
            </Field>
            <Field label="Gerakan">
              <select
                className={styles.select}
                value={background.motion}
                onChange={(event) => updateHookBackground({
                  motion: event.target.value as BrandHookBackgroundMotion,
                })}
              >
                <option value="none">Diam</option>
                <option value="slow-zoom">Slow zoom</option>
                <option value="drift">Drift lembut</option>
              </select>
            </Field>
          </div>
          <Field label={`Lapisan warna — ${Math.round(background.overlayOpacity * 100)}%`}>
            <input
              className={styles.slider}
              type="range"
              min={0}
              max={0.9}
              step={0.01}
              value={background.overlayOpacity}
              onChange={(event) => updateHookBackground({ overlayOpacity: Number(event.target.value) })}
            />
          </Field>
          <Field label={`Blur background — ${background.blur}px`}>
            <input
              className={styles.slider}
              type="range"
              min={0}
              max={24}
              step={1}
              value={background.blur}
              onChange={(event) => updateHookBackground({ blur: Number(event.target.value) })}
            />
          </Field>
          <Field label={`Fokus horizontal — ${background.media.focusX}%`}>
            <input
              className={styles.slider}
              type="range"
              min={0}
              max={100}
              value={background.media.focusX}
              onChange={(event) => updateHookBackgroundMedia({ focusX: Number(event.target.value) })}
            />
          </Field>
          <Field label={`Fokus vertikal — ${background.media.focusY}%`}>
            <input
              className={styles.slider}
              type="range"
              min={0}
              max={100}
              value={background.media.focusY}
              onChange={(event) => updateHookBackgroundMedia({ focusY: Number(event.target.value) })}
            />
          </Field>
        </section>
      ) : (
        <div className={styles.infoNote}>
          {background.mode === 'gradient'
            ? 'Gradient otomatis mengikuti warna Background, Kartu media, dan Aksen pada Brand Kit.'
            : 'Tekstur brand tetap ringan agar teks menjadi fokus utama.'}
        </div>
      )}
    </div>
  );
}

function MediaFields() {
  const outputMode = useBrandStudioStore((state) => state.outputMode);
  if (outputMode === 'hook') return <HookBackgroundFields />;

  return (
    <div className={styles.sectionStack}>
      <div className={styles.infoNote}>
        Upload hanya dipakai pada project lokal ini. Foto/video WhatsApp tidak ikut berubah.
      </div>
      <MediaPicker slot="heroMedia" title="Media utama" />
      <MediaPicker slot="detailMedia" title="Media detail" />
    </div>
  );
}

interface SavedBrandKit {
  id: string;
  name: string;
  description: string;
  copy: Pick<BrandCopy, 'eyebrow' | 'hookFooter'>;
  hook: Pick<BrandHookSettingsForKit, 'typography' | 'alignment'>;
  palette: BrandPalette;
}

type BrandHookSettingsForKit = {
  typography: BrandHookTypography;
  alignment: BrandHookAlignment;
};

const SAVED_BRAND_KITS_KEY = 'fya-brand-studio-kits-v1';

function PaletteFields() {
  const palette = useBrandStudioStore((state) => state.palette);
  const copy = useBrandStudioStore((state) => state.copy);
  const hook = useBrandStudioStore((state) => state.hook);
  const updatePalette = useBrandStudioStore((state) => state.updatePalette);
  const updateCopy = useBrandStudioStore((state) => state.updateCopy);
  const updateHook = useBrandStudioStore((state) => state.updateHook);
  const [savedKits, setSavedKits] = useState<SavedBrandKit[]>([]);
  const [kitName, setKitName] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(SAVED_BRAND_KITS_KEY);
        setSavedKits(stored ? JSON.parse(stored) as SavedBrandKit[] : []);
      } catch {
        setSavedKits([]);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  function applyBrandKit(kit: SavedBrandKit) {
    for (const [key, value] of Object.entries(kit.palette)) {
      updatePalette(key as keyof BrandPalette, value);
    }
    updateCopy('eyebrow', kit.copy.eyebrow);
    updateCopy('hookFooter', kit.copy.hookFooter);
    updateHook('typography', kit.hook.typography);
    updateHook('alignment', kit.hook.alignment);
  }

  function saveCurrentKit() {
    const normalizedName = kitName.trim();
    if (!normalizedName) return;
    const nextKit: SavedBrandKit = {
      id: `custom-${Date.now()}`,
      name: normalizedName,
      description: 'Brand Kit tersimpan di browser ini.',
      copy: { eyebrow: copy.eyebrow, hookFooter: copy.hookFooter },
      hook: { typography: hook.typography, alignment: hook.alignment },
      palette: { ...palette },
    };
    const next = [...savedKits, nextKit];
    setSavedKits(next);
    window.localStorage.setItem(SAVED_BRAND_KITS_KEY, JSON.stringify(next));
    setKitName('');
  }

  function deleteSavedKit(id: string) {
    const next = savedKits.filter((kit) => kit.id !== id);
    setSavedKits(next);
    window.localStorage.setItem(SAVED_BRAND_KITS_KEY, JSON.stringify(next));
  }
  // Keep the inspector usable during a stale Fast Refresh where the component
  // updates before the module that exports the presets has been replaced.
  const palettePresets = Array.isArray(BRAND_PALETTE_PRESETS)
    ? BRAND_PALETTE_PRESETS
    : [];
  const isPresetActive = (preset: BrandPalette) =>
    (Object.keys(preset) as Array<keyof BrandPalette>).every(
      (key) => preset[key].toLowerCase() === palette[key].toLowerCase(),
    );
  const entries: Array<{ key: keyof BrandPalette; label: string }> = [
    { key: 'background', label: 'Background' },
    { key: 'surface', label: 'Kartu media' },
    { key: 'text', label: 'Teks utama' },
    { key: 'accent', label: 'Aksen' },
    { key: 'muted', label: 'Teks sekunder' },
  ];

  return (
    <div className={styles.sectionStack}>
      <div className={styles.introCard}>
        <Palette size={18} />
        <div>
          <strong>Palet resmi For you, Always.</strong>
          <p>Disusun dari Chalk White, Obsidian, Onyx, Honey Brown, dan Driftwood Tan.</p>
        </div>
      </div>
      <Field label="Brand Kit siap pakai">
        <div className={styles.brandKitGrid}>
          {BRAND_KIT_PRESETS.map((kit) => (
            <button type="button" key={kit.id} onClick={() => applyBrandKit(kit)}>
              <span className={styles.brandKitDots}>
                <i style={{ backgroundColor: kit.palette.background }} />
                <i style={{ backgroundColor: kit.palette.accent }} />
                <i style={{ backgroundColor: kit.palette.text }} />
              </span>
              <span><strong>{kit.name}</strong><small>{kit.description}</small></span>
            </button>
          ))}
        </div>
      </Field>
      {savedKits.length > 0 ? (
        <Field label="Brand Kit saya">
          <div className={styles.savedKitList}>
            {savedKits.map((kit) => (
              <div key={kit.id}>
                <button type="button" onClick={() => applyBrandKit(kit)}>
                  <span className={styles.brandKitDots}>
                    <i style={{ backgroundColor: kit.palette.background }} />
                    <i style={{ backgroundColor: kit.palette.accent }} />
                    <i style={{ backgroundColor: kit.palette.text }} />
                  </span>
                  <strong>{kit.name}</strong>
                </button>
                <button type="button" aria-label={`Hapus ${kit.name}`} onClick={() => deleteSavedKit(kit.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </Field>
      ) : null}
      <div className={styles.saveKitRow}>
        <input
          className={styles.input}
          value={kitName}
          placeholder="Nama Brand Kit saya"
          onChange={(event) => setKitName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') saveCurrentKit();
          }}
        />
        <button type="button" disabled={!kitName.trim()} onClick={saveCurrentKit}>
          <Save size={14} /> Simpan
        </button>
      </div>
      <div className={styles.infoNote}>
        Menyimpan warna, font, perataan, brand kecil, dan footer untuk dipakai ulang.
      </div>
      <div className={styles.divider} />
      <div className={styles.palettePresetGrid}>
        {palettePresets.map((preset) => (
          <button
            type="button"
            key={preset.id}
            className={`${styles.palettePreset} ${isPresetActive(preset.palette) ? styles.palettePresetActive : ''}`}
            aria-pressed={isPresetActive(preset.palette)}
            onClick={() => {
              for (const [key, value] of Object.entries(preset.palette)) {
                updatePalette(key as keyof BrandPalette, value);
              }
            }}
          >
            <span className={styles.palettePresetColors}>
              {Object.values(preset.palette).map((color, index) => (
                <i key={`${preset.id}-${index}`} style={{ backgroundColor: color }} />
              ))}
            </span>
            <span>
              <strong>{preset.name}</strong>
              <small>{preset.description}</small>
            </span>
          </button>
        ))}
      </div>
      <div className={styles.divider} />
      <div className={styles.palettePreview}>
        {entries.map((entry) => (
          <span key={entry.key} style={{ backgroundColor: palette[entry.key] }} />
        ))}
      </div>
      {entries.map((entry) => (
        <Field key={entry.key} label={entry.label}>
          <div className={styles.colorInputRow}>
            <input
              type="color"
              value={palette[entry.key]}
              onChange={(event) => updatePalette(entry.key, event.target.value)}
            />
            <input
              className={styles.input}
              value={palette[entry.key]}
              onChange={(event) => updatePalette(entry.key, event.target.value)}
            />
          </div>
        </Field>
      ))}
    </div>
  );
}

function TimingFields() {
  const timing = useBrandStudioStore((state) => state.timing);
  const hook = useBrandStudioStore((state) => state.hook);
  const outputMode = useBrandStudioStore((state) => state.outputMode);
  const updateTiming = useBrandStudioStore((state) => state.updateTiming);
  const campaignRows: Array<{ key: keyof BrandTiming; label: string; min: number; max: number }> = [
    {
      key: 'hookSeconds',
      label: hook.sequenceMode === 'three-beat' ? 'Hook 3 beat' : 'Hook awal',
      min: hook.sequenceMode === 'three-beat' ? 4.5 : 2,
      max: 6,
    },
    { key: 'productSeconds', label: 'Product reveal', min: 3, max: 10 },
    { key: 'storySeconds', label: 'Cerita dan benefit', min: 3, max: 9 },
    { key: 'outroSeconds', label: 'CTA akhir', min: 2.5, max: 7 },
  ];
  const rows = outputMode === 'hook' ? [campaignRows[0]] : campaignRows;
  const total = outputMode === 'hook'
    ? timing.hookSeconds
    : Object.values(timing).reduce((sum, value) => sum + value, 0);

  return (
    <div className={styles.sectionStack}>
      <div className={styles.durationSummary}>
        <Clock3 size={19} />
        <div>
          <span>{outputMode === 'hook' ? 'Durasi hook' : 'Total durasi'}</span>
          <strong>{total.toFixed(1)} detik</strong>
        </div>
      </div>
      {rows.map((row, index) => (
        <Field key={row.key} label={`${index + 1}. ${row.label} — ${timing[row.key].toFixed(1)}s`}>
          <input
            className={styles.slider}
            type="range"
            min={row.min}
            max={row.max}
            step={0.1}
            value={timing[row.key]}
            onChange={(event) => updateTiming(row.key, Number(event.target.value))}
          />
        </Field>
      ))}
    </div>
  );
}

function EffectsFields() {
  const hook = useBrandStudioStore((state) => state.hook);
  const audio = useBrandStudioStore((state) => state.audio);
  const outputMode = useBrandStudioStore((state) => state.outputMode);
  const updateHook = useBrandStudioStore((state) => state.updateHook);
  const updateAudio = useBrandStudioStore((state) => state.updateAudio);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const partMotions: BrandHookPartMotions = hook.partMotions ?? {
    eyebrow: hook.motion,
    title: hook.motion,
    accent: hook.motion,
    footer: hook.motion,
  };
  const motionRows: Array<{ key: keyof BrandHookPartMotions; label: string }> = [
    { key: 'eyebrow', label: 'Brand kecil' },
    { key: 'title', label: 'Judul utama' },
    { key: 'accent', label: 'Teks aksen' },
    { key: 'footer', label: 'Footer kecil' },
  ];
  const usesTypewriter = Object.values(partMotions).includes('typewriter');

  useEffect(() => () => {
    previewRef.current?.pause();
    previewRef.current = null;
  }, []);

  function previewSfx() {
    previewRef.current?.pause();
    previewRef.current = null;

    if (audio.transitionSfx === 'none') {
      setIsPreviewing(false);
      return;
    }

    const preview = new window.Audio(`/sounds/sfx/${BRAND_SFX_FILES[audio.transitionSfx]}`);
    preview.volume = audio.transitionSfxVolume;
    preview.onended = () => setIsPreviewing(false);
    preview.onerror = () => setIsPreviewing(false);
    previewRef.current = preview;
    setIsPreviewing(true);
    void preview.play().catch(() => setIsPreviewing(false));
  }

  return (
    <div className={styles.sectionStack}>
      <div className={styles.introCard}>
        <WandSparkles size={18} />
        <div>
          <strong>Efek khusus hook</strong>
          <p>Transisi dan SFX di preview akan sama dengan hasil export.</p>
        </div>
      </div>
      <div className={styles.twoColumns}>
        <Field label="Preset gerak semua teks">
          <select
            className={styles.select}
            value={hook.motion}
            onChange={(event) => {
              const motion = event.target.value as BrandHookMotion;
              updateHook('motion', motion);
              updateHook('partMotions', {
                eyebrow: motion,
                title: motion,
                accent: motion,
                footer: motion,
              });
            }}
          >
            {HOOK_MOTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Transisi keluar">
          <select
            className={styles.select}
            value={hook.exitTransition}
            onChange={(event) => updateHook('exitTransition', event.target.value as BrandHookExit)}
          >
            <option value="none">Tanpa transisi</option>
            <option value="fade">Fade out</option>
            <option value="zoom">Zoom out</option>
            <option value="slide-up">Slide ke atas</option>
          </select>
        </Field>
      </div>
      <div className={styles.motionPartGrid}>
        {motionRows.map((row) => (
          <Field key={row.key} label={row.label}>
            <select
              className={styles.select}
              value={partMotions[row.key]}
              onChange={(event) => updateHook('partMotions', {
                ...partMotions,
                [row.key]: event.target.value as BrandHookMotion,
              })}
            >
              {HOOK_MOTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
        ))}
      </div>
      {usesTypewriter ? (
        <Field label={`Kecepatan mengetik — ${hook.typewriterCps || 20} karakter/detik`}>
          <input
            className={styles.slider}
            type="range"
            min={8}
            max={32}
            step={1}
            value={hook.typewriterCps || 20}
            onChange={(event) => updateHook('typewriterCps', Number(event.target.value))}
          />
        </Field>
      ) : null}
      <Field label={`Durasi transisi keluar — ${hook.transitionSeconds.toFixed(2)}s`}>
        <input
          className={styles.slider}
          type="range"
          min={0.2}
          max={1.2}
          step={0.05}
          value={hook.transitionSeconds}
          onChange={(event) => updateHook('transitionSeconds', Number(event.target.value))}
        />
      </Field>
      <div className={styles.divider} />
      <Field label={outputMode === 'hook' ? 'SFX pembuka hook' : 'SFX pergantian scene'}>
        <select
          className={styles.select}
          value={audio.transitionSfx}
          onChange={(event) => updateAudio({ transitionSfx: event.target.value as BrandTransitionSfx })}
        >
          {BRAND_SFX_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <button
        type="button"
        className={styles.effectPreviewButton}
        disabled={audio.transitionSfx === 'none'}
        onClick={previewSfx}
      >
        <Volume2 size={15} />
        {isPreviewing ? 'Memutar SFX…' : 'Dengarkan SFX'}
      </button>
      <Field label={`Volume SFX — ${Math.round(audio.transitionSfxVolume * 100)}%`}>
        <input
          className={styles.slider}
          type="range"
          min={0}
          max={0.5}
          step={0.01}
          value={audio.transitionSfxVolume}
          onChange={(event) => updateAudio({ transitionSfxVolume: Number(event.target.value) })}
        />
      </Field>
      {outputMode === 'hook' ? (
        <Field label={`SFX mulai pada — ${audio.sfxOffsetSeconds.toFixed(2)}s`}>
          <input
            className={styles.slider}
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={audio.sfxOffsetSeconds}
            onChange={(event) => updateAudio({ sfxOffsetSeconds: Number(event.target.value) })}
          />
        </Field>
      ) : null}
    </div>
  );
}

function AudioFields() {
  const audio = useBrandStudioStore((state) => state.audio);
  const updateAudio = useBrandStudioStore((state) => state.updateAudio);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => () => {
    previewRef.current?.pause();
    previewRef.current = null;
  }, []);

  function handleMusic(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (audio.musicSrc.startsWith('blob:')) URL.revokeObjectURL(audio.musicSrc);
    updateAudio({ musicSrc: URL.createObjectURL(file), musicName: file.name });
  }

  function previewMusic() {
    if (!audio.musicSrc) return;
    if (isPreviewing) {
      previewRef.current?.pause();
      setIsPreviewing(false);
      return;
    }
    const preview = new window.Audio(audio.musicSrc);
    preview.volume = Math.min(1, audio.musicVolume);
    preview.onended = () => setIsPreviewing(false);
    preview.onerror = () => setIsPreviewing(false);
    previewRef.current = preview;
    setIsPreviewing(true);
    void preview.play().catch(() => setIsPreviewing(false));
  }

  const audioPresets = [
    {
      id: 'intimate',
      label: 'Intimate',
      detail: 'Lembut dan emosional',
      settings: { musicVolume: 0.14, musicFadeInSeconds: 1.2, musicFadeOutSeconds: 1.3, duckMusicForSfx: true, musicDuckLevel: 0.32 },
    },
    {
      id: 'cinematic',
      label: 'Cinematic',
      detail: 'Lebih penuh dan dramatis',
      settings: { musicVolume: 0.22, musicFadeInSeconds: 0.7, musicFadeOutSeconds: 1.5, duckMusicForSfx: true, musicDuckLevel: 0.4 },
    },
    {
      id: 'comedy',
      label: 'Comedy',
      detail: 'Cepat dengan ruang untuk punchline',
      settings: { musicVolume: 0.12, musicFadeInSeconds: 0.3, musicFadeOutSeconds: 0.6, duckMusicForSfx: true, musicDuckLevel: 0.22 },
    },
  ] as const;

  return (
    <div className={styles.sectionStack}>
      <div className={styles.introCard}>
        <Music2 size={18} />
        <div>
          <strong>Audio hook yang otomatis seimbang</strong>
          <p>Backsound akan fade dengan halus dan mengecil sementara saat SFX masuk.</p>
        </div>
      </div>
      <Field label="Preset mixing">
        <div className={styles.audioPresetGrid}>
          {audioPresets.map((preset) => (
            <button type="button" key={preset.id} onClick={() => updateAudio(preset.settings)}>
              <strong>{preset.label}</strong>
              <small>{preset.detail}</small>
            </button>
          ))}
        </div>
      </Field>
      <section className={styles.mediaCard}>
        <div className={styles.mediaCardHeader}>
          <span className={styles.mediaIcon}><Music2 size={16} /></span>
          <div>
            <strong>Backsound</strong>
            <p>{audio.musicName || 'Belum ada lagu'}</p>
          </div>
        </div>
        <label className={styles.uploadButton}>
          <Upload size={15} />
          Pilih backsound
          <input type="file" accept="audio/*" hidden onChange={handleMusic} />
        </label>
        {audio.musicSrc ? (
          <div className={styles.twoColumns}>
            <button type="button" className={styles.effectPreviewButton} onClick={previewMusic}>
              {isPreviewing ? <><Volume2 size={14} /> Stop preview</> : <><Play size={14} /> Dengarkan</>}
            </button>
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                previewRef.current?.pause();
                setIsPreviewing(false);
                if (audio.musicSrc.startsWith('blob:')) URL.revokeObjectURL(audio.musicSrc);
                updateAudio({ musicSrc: '', musicName: '' });
              }}
            >
              Hapus backsound
            </button>
          </div>
        ) : null}
      </section>
      <Field label={`Volume backsound — ${Math.round(audio.musicVolume * 100)}%`}>
        <input
          className={styles.slider}
          type="range"
          min={0}
          max={0.5}
          step={0.01}
          value={audio.musicVolume}
          onChange={(event) => updateAudio({ musicVolume: Number(event.target.value) })}
        />
      </Field>
      <Field label={`Musik masuk pada — ${(audio.musicStartSeconds ?? 0).toFixed(1)}s`}>
        <input
          className={styles.slider}
          type="range"
          min={0}
          max={3}
          step={0.1}
          value={audio.musicStartSeconds ?? 0}
          onChange={(event) => updateAudio({ musicStartSeconds: Number(event.target.value) })}
        />
      </Field>
      <div className={styles.twoColumns}>
        <Field label={`Fade masuk — ${(audio.musicFadeInSeconds ?? 0.7).toFixed(1)}s`}>
          <input
            className={styles.slider}
            type="range"
            min={0.1}
            max={3}
            step={0.1}
            value={audio.musicFadeInSeconds ?? 0.7}
            onChange={(event) => updateAudio({ musicFadeInSeconds: Number(event.target.value) })}
          />
        </Field>
        <Field label={`Fade keluar — ${(audio.musicFadeOutSeconds ?? 1.2).toFixed(1)}s`}>
          <input
            className={styles.slider}
            type="range"
            min={0.1}
            max={3}
            step={0.1}
            value={audio.musicFadeOutSeconds ?? 1.2}
            onChange={(event) => updateAudio({ musicFadeOutSeconds: Number(event.target.value) })}
          />
        </Field>
      </div>
      <label className={styles.toggleRow}>
        <span>
          <strong>Ducking otomatis saat SFX</strong>
          <small>Backsound mengecil sesaat supaya efek transisi tetap jelas.</small>
        </span>
        <input
          type="checkbox"
          checked={audio.duckMusicForSfx ?? true}
          onChange={(event) => updateAudio({ duckMusicForSfx: event.target.checked })}
        />
      </label>
      {(audio.duckMusicForSfx ?? true) ? (
        <Field label={`Volume musik saat SFX — ${Math.round((audio.musicDuckLevel ?? 0.42) * 100)}%`}>
          <input
            className={styles.slider}
            type="range"
            min={0.1}
            max={0.8}
            step={0.01}
            value={audio.musicDuckLevel ?? 0.42}
            onChange={(event) => updateAudio({ musicDuckLevel: Number(event.target.value) })}
          />
        </Field>
      ) : null}
      <div className={styles.infoNote}>SFX dan transisi tetap diatur dari menu Efek.</div>
    </div>
  );
}

function TemplateFields() {
  const templateId = useBrandStudioStore((state) => state.templateId);
  const setTemplate = useBrandStudioStore((state) => state.setTemplate);
  return (
    <div className={styles.templateList}>
      {BRAND_TEMPLATE_LIST.map((template) => (
        <button
          type="button"
          key={template.id}
          className={`${styles.templateCard} ${template.id === templateId ? styles.templateCardActive : ''}`}
          onClick={() => setTemplate(template.id)}
        >
          <span className={styles.templateSwatch} style={{ backgroundColor: template.defaults.palette.background }}>
            <span style={{ color: template.defaults.palette.text }}>Aa</span>
            <i style={{ backgroundColor: template.defaults.palette.accent }} />
          </span>
          <span className={styles.templateCopy}>
            <small>{template.badge}</small>
            <strong>{template.name}</strong>
            <span>{template.category}</span>
            <p>{template.description}</p>
          </span>
        </button>
      ))}
    </div>
  );
}

function VariantsFields() {
  const contentGoal = useBrandStudioStore((state) => state.contentGoal);
  const variants = useBrandStudioStore((state) => state.variants);
  const setContentGoal = useBrandStudioStore((state) => state.setContentGoal);
  const generateVariants = useBrandStudioStore((state) => state.generateVariants);
  const toggleVariant = useBrandStudioStore((state) => state.toggleVariant);
  const updateVariantCopy = useBrandStudioStore((state) => state.updateVariantCopy);
  const applyVariant = useBrandStudioStore((state) => state.applyVariant);
  const recommended = getRecommendedVariant(variants);
  const selectedCount = variants.filter((variant) => variant.selected).length;

  return (
    <div className={styles.sectionStack}>
      <div className={styles.introCard}>
        <Layers3 size={18} />
        <div>
          <strong>Satu ide, tiga versi siap tes</strong>
          <p>Studio menyusun versi original, versi cepat, dan versi story reveal dari hook Anda.</p>
        </div>
      </div>

      <div className={styles.variantGoalField}>
        <span className={styles.fieldLabel}>Tujuan utama konten</span>
        <div className={styles.goalGrid}>
          {BRAND_CONTENT_GOALS.map((goal) => (
            <button
              type="button"
              key={goal.id}
              className={contentGoal === goal.id ? styles.goalCardActive : styles.goalCard}
              onClick={() => setContentGoal(goal.id as BrandContentGoal)}
            >
              <strong>{goal.label}</strong>
              <small>{goal.description}</small>
            </button>
          ))}
        </div>
      </div>

      <button type="button" className={styles.generateVariantsButton} onClick={generateVariants}>
        <WandSparkles size={15} />
        {variants.length ? 'Buat ulang variasi dari preview saat ini' : 'Buat 3 variasi A/B/C'}
      </button>

      {recommended ? (
        <div className={styles.recommendationCard}>
          <span><Sparkles size={15} /></span>
          <div>
            <small>REKOMENDASI STUDIO · SKOR {recommended.score}</small>
            <strong>{recommended.label}</strong>
            <p>{recommended.reason}</p>
          </div>
        </div>
      ) : (
        <div className={styles.variantEmptyState}>
          <strong>Belum ada versi pembanding</strong>
          <p>Pilih tujuan konten, lalu buat variasi. Naskah asli tetap aman sebagai versi A.</p>
        </div>
      )}

      {variants.length ? (
        <>
          <div className={styles.variantSelectionSummary}>
            <span>{selectedCount} dari {variants.length} dipilih untuk batch export</span>
            <small>Klik checkbox untuk mengatur antrean.</small>
          </div>
          <div className={styles.variantList}>
            {variants.map((variant) => {
              const isRecommended = recommended?.id === variant.id;
              return (
                <article
                  key={variant.id}
                  className={`${styles.variantCard} ${isRecommended ? styles.variantCardRecommended : ''}`}
                >
                  <header>
                    <label>
                      <input
                        type="checkbox"
                        checked={variant.selected}
                        onChange={() => toggleVariant(variant.id)}
                      />
                      <span>
                        <strong>{variant.label}</strong>
                        <small>{variant.strategy}</small>
                      </span>
                    </label>
                    <b>{variant.score}</b>
                  </header>
                  {isRecommended ? (
                    <div className={styles.recommendedBadge}><CheckCircle2 size={11} /> Pilihan terbaik</div>
                  ) : null}
                  <p>{variant.reason}</p>
                  <label className={styles.variantInput}>
                    <span>Hook utama</span>
                    <textarea
                      value={variant.props.copy.hookTitle}
                      onChange={(event) => updateVariantCopy(variant.id, 'hookTitle', event.target.value)}
                    />
                  </label>
                  <label className={styles.variantInput}>
                    <span>Aksen / lanjutan</span>
                    <textarea
                      value={variant.props.copy.hookAccent}
                      onChange={(event) => updateVariantCopy(variant.id, 'hookAccent', event.target.value)}
                    />
                  </label>
                  {variant.props.hook.sequenceMode === 'three-beat' ? (
                    <details className={styles.variantDetails}>
                      <summary>Edit build-up & reveal</summary>
                      <label className={styles.variantInput}>
                        <span>Build-up</span>
                        <textarea
                          value={variant.props.copy.hookBridge}
                          onChange={(event) => updateVariantCopy(variant.id, 'hookBridge', event.target.value)}
                        />
                      </label>
                      <label className={styles.variantInput}>
                        <span>Reveal</span>
                        <textarea
                          value={variant.props.copy.hookReveal}
                          onChange={(event) => updateVariantCopy(variant.id, 'hookReveal', event.target.value)}
                        />
                      </label>
                    </details>
                  ) : null}
                  <button type="button" onClick={() => applyVariant(variant.id)}>
                    <Play size={13} /> Tampilkan di preview
                  </button>
                </article>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

function ExportFields() {
  const props = getBrandVideoProps();
  const variants = useBrandStudioStore((state) => state.variants);
  const seconds = getBrandDurationInFrames(props) / BRAND_VIDEO_FPS;
  return (
    <div className={styles.sectionStack}>
      <div className={styles.exportSummary}>
        <span>Resolusi</span><strong>1080 × 1920</strong>
        <span>Format</span><strong>MP4 · H.264</strong>
        <span>Rasio</span><strong>9:16</strong>
        <span>Output</span><strong>{props.outputMode === 'hook' ? 'Hook pendek' : 'Campaign lengkap'}</strong>
        <span>Durasi</span><strong>{seconds.toFixed(1)} detik</strong>
        <span>Audio</span><strong>AAC</strong>
      </div>
      <BrandExportButton />
      {props.outputMode === 'hook' && variants.length ? (
        <>
          <div className={styles.divider} />
          <BrandBatchExport />
        </>
      ) : null}
      <p className={styles.exportHint}>
        Export dijalankan langsung di browser. Jangan menutup tab sampai proses selesai.
      </p>
    </div>
  );
}

function InspectorContent({ section }: { section: BrandEditorSection }) {
  if (section === 'templates') return <TemplateFields />;
  if (section === 'template-packs') return <BrandTemplatePackFields />;
  if (section === 'copy') return <CopyFields />;
  if (section === 'effects') return <EffectsFields />;
  if (section === 'media') return <MediaFields />;
  if (section === 'style') return <PaletteFields />;
  if (section === 'timing') return <TimingFields />;
  if (section === 'audio') return <AudioFields />;
  if (section === 'variants') return <VariantsFields />;
  return <ExportFields />;
}

export default function BrandStudio() {
  const state = useBrandStudioStore();
  const visibleSections = state.outputMode === 'hook'
    ? SECTIONS
    : SECTIONS.filter((section) => section.id !== 'variants');
  const activeMeta = visibleSections.find((section) => section.id === state.activeSection) ?? visibleSections[0];
  const ActiveIcon = activeMeta.icon;
  const currentTemplate = BRAND_TEMPLATE_LIST.find((template) => template.id === state.templateId)!;
  const props = getBrandVideoProps();
  const durationInFrames = getBrandDurationInFrames(props);

  function resetCurrentTemplate() {
    if (state.hookBackground?.media.src.startsWith('blob:')) {
      URL.revokeObjectURL(state.hookBackground.media.src);
    }
    if (state.heroMedia.src.startsWith('blob:')) URL.revokeObjectURL(state.heroMedia.src);
    if (state.detailMedia.src.startsWith('blob:')) URL.revokeObjectURL(state.detailMedia.src);
    if (state.audio.musicSrc.startsWith('blob:')) URL.revokeObjectURL(state.audio.musicSrc);
    state.resetTemplate();
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brandIdentity}>
          <span className={styles.brandMark}><Sparkles size={18} /></span>
          <span>
            <strong>FYA Creator Studio</strong>
            <small>{state.outputMode === 'hook' ? 'Hook Maker' : 'Brand Campaign'}</small>
          </span>
        </div>

        <nav className={styles.modeSwitch} aria-label="Pilih studio">
          <Link href="/" className={styles.modeLink}>WhatsApp Story</Link>
          <span className={styles.modeActive}>Brand Studio</span>
        </nav>

        <div className={styles.topActions}>
          <button type="button" onClick={resetCurrentTemplate} title="Reset template">
            <RefreshCw size={15} /> Reset
          </button>
          <button type="button" className={styles.exportShortcut} onClick={() => state.setActiveSection('export')}>
            <Film size={15} /> {state.outputMode === 'hook' ? 'Export Hook' : 'Export MP4'}
          </button>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.navigation}>
          <Link href="/" className={styles.backLink}><ArrowLeft size={15} /> Kembali ke WhatsApp</Link>
          <div className={styles.projectCard}>
            <span>{currentTemplate.badge}</span>
            <strong>{state.outputMode === 'hook' ? state.copy.hookTitle : state.copy.productName}</strong>
            <small>{state.outputMode === 'hook' ? 'Hook video pendek' : currentTemplate.name}</small>
          </div>
          <div className={styles.outputModePicker} aria-label="Jenis output video">
            <button
              type="button"
              className={state.outputMode === 'hook' ? styles.outputModeActive : ''}
              onClick={() => state.setOutputMode('hook')}
            >
              <WandSparkles size={14} />
              <span><strong>Hook Maker</strong><small>2–6 detik</small></span>
            </button>
            <button
              type="button"
              className={state.outputMode === 'campaign' ? styles.outputModeActive : ''}
              onClick={() => state.setOutputMode('campaign')}
            >
              <Film size={14} />
              <span><strong>Full Video</strong><small>Semua scene</small></span>
            </button>
          </div>
          <nav className={styles.sectionNav}>
            {visibleSections.map((section) => {
              const Icon = section.icon;
              const active = state.activeSection === section.id;
              return (
                <button
                  type="button"
                  key={section.id}
                  className={active ? styles.sectionActive : ''}
                  onClick={() => state.setActiveSection(section.id)}
                >
                  <span><Icon size={16} /></span>
                  <div>
                    <strong>{section.label}</strong>
                    <small>{sectionDescription(section.id, state.outputMode)}</small>
                  </div>
                </button>
              );
            })}
          </nav>
          <div className={styles.isolationNote}>
            <span />
            Project Brand Video terpisah dari chat WhatsApp.
          </div>
        </aside>

        <section className={styles.previewArea}>
          <div className={styles.previewHeader}>
            <div>
              <span>LIVE PREVIEW</span>
              <strong>{state.outputMode === 'hook' ? `Hook Maker · ${currentTemplate.name}` : currentTemplate.name}</strong>
            </div>
            <div className={styles.previewBadges}>
              <span>9:16</span>
              <span>{(durationInFrames / BRAND_VIDEO_FPS).toFixed(1)}s</span>
              <span>1080p</span>
            </div>
          </div>
          <div className={styles.previewStage}>
            <div className={styles.playerFrame}>
              <Player
                key={`${state.templateId}-${state.outputMode}`}
                component={BrandVideo}
                inputProps={props}
                durationInFrames={durationInFrames}
                compositionWidth={BRAND_VIDEO_WIDTH}
                compositionHeight={BRAND_VIDEO_HEIGHT}
                fps={BRAND_VIDEO_FPS}
                controls
                loop
                clickToPlay
                style={{ width: '100%', height: '100%' }}
              />
              {state.showSafeArea ? (
                <div className={styles.safeAreaGuide} aria-hidden="true">
                  <span>AREA AMAN TEKS</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className={styles.previewFooter}>
            <span><Play size={14} /> {state.outputMode === 'hook' ? 'Preview ini adalah hasil hook yang akan diekspor.' : 'Gunakan kontrol untuk mengecek seluruh campaign.'}</span>
            <small>Teks dan gaya berubah langsung.</small>
          </div>
        </section>

        <aside className={styles.inspector}>
          <header className={styles.inspectorHeader}>
            <span className={styles.inspectorIcon}><ActiveIcon size={18} /></span>
            <div>
              <span>{state.outputMode === 'hook' ? 'HOOK MAKER' : 'BRAND VIDEO'}</span>
              <h1>{activeMeta.label}</h1>
              <p>{sectionDescription(activeMeta.id, state.outputMode)}</p>
            </div>
          </header>
          <div className={styles.inspectorBody}>
            <InspectorContent section={state.activeSection} />
          </div>
        </aside>
      </div>
    </main>
  );
}

