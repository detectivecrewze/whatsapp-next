'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Player } from '@remotion/player';
import {
  AlignCenter,
  AlignLeft,
  ArrowLeft,
  CheckCircle2,
  Download,
  Film,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-react';
import { LetterHookVideo, type LetterHookProps } from '@/remotion/brand/LetterHookVideo';
import {
  clearBgMediaFromIndexedDB,
  loadBgMediaFromIndexedDB,
  saveBgMediaToIndexedDB,
} from '@/lib/letterHookMediaStorage';
import {
  assertLetterHookRenderSupport,
  downloadLetterHookVideo,
  letterHookFileName,
  renderLetterHookVideo,
} from '@/lib/renderLetterHookVideo';
import styles from '@/app/brand/letter-hook.module.css';

const FPS = 30;
const STORAGE_KEY = 'fya-letter-hook-v2';

// ─── Background color presets ────────────────────────────────────────────────

const BG_OPTIONS: Array<{ id: string; name: string; value: string; desc: string }> = [
  { id: 'navy',      name: 'Midnight Navy',  value: '#0b1628', desc: 'Biru malam puitis' },
  { id: 'charcoal',  name: 'Obsidian Black', value: '#101216', desc: 'Hitam pekat netral' },
  { id: 'burgundy',  name: 'Deep Burgundy',  value: '#1c0f16', desc: 'Plum anggur gelap' },
  { id: 'forest',    name: 'Forest Emerald', value: '#0c1713', desc: 'Hijau lumut malam' },
  { id: 'espresso',  name: 'Dark Espresso',  value: '#18110e', desc: 'Coklat kopi gelap' },
  { id: 'twilight',  name: 'Slate Twilight', value: '#0e1820', desc: 'Abu kabut malam' },
];

// ─── Accent color presets ────────────────────────────────────────────────────

const ACCENT_OPTIONS: Array<{ id: string; name: string; value: string; muted: string }> = [
  { id: 'blue',  name: 'Biru Terang',   value: '#4a9eff', muted: '#8899b8' },
  { id: 'gold',  name: 'Emas Pucat',    value: '#d4b896', muted: '#9e9284' },
  { id: 'rose',  name: 'Rose Hangat',   value: '#e8a0a8', muted: '#a08888' },
  { id: 'sage',  name: 'Sage Lembut',   value: '#8abba8', muted: '#7a9a90' },
];

// ─── Brand mark style presets ────────────────────────────────────────────────

const BRAND_STYLE_OPTIONS: Array<{ id: NonNullable<LetterHookProps['brandStyle']>; name: string; preview: string }> = [
  { id: 'line',    name: 'Garis Halus', preview: '── SURAT ──' },
  { id: 'minimal', name: 'Aksen ✦',    preview: '✦ SURAT' },
  { id: 'bracket', name: 'Archival',    preview: '[ SURAT ]' },
  { id: 'clean',   name: 'Polos',       preview: 'SURAT' },
];

// ─── Brand mark placement presets ────────────────────────────────────────────

const BRAND_PLACEMENT_OPTIONS: Array<{ id: NonNullable<LetterHookProps['brandPlacement']>; name: string; desc: string }> = [
  { id: 'bottom', name: 'Bawah Layar (Watermark)', desc: 'Terpisah lega, di zona aman TikTok' },
  { id: 'flow',   name: 'Di Bawah Teks',          desc: 'Mengalir di bawah kutipan dengan jeda lega' },
];

// ─── Default props ────────────────────────────────────────────────────────────

const initialProps: LetterHookProps = {
  label: 'A THOUGHT AT 2 AM',
  line1: 'Pernah nggak, merasa tidak pantas\npada orang yang paling kamu sayang?',
  highlight: 'Justru pada orang yang paling kamu sayang.',
  brandTag: 'surat kehidupan',
  brandStyle: 'line',
  brandPlacement: 'bottom',
  alignment: 'center',
  background: BG_OPTIONS[0].value,
  ink: '#f3ece4',
  accentColor: ACCENT_OPTIONS[0].value,
  mutedColor: ACCENT_OPTIONS[0].muted,
  durationSeconds: 7,
  bgMode: 'color',
  bgMedia: {
    src: '',
    name: '',
    kind: 'image',
    fit: 'cover',
    blur: 8,
    overlayOpacity: 0.65,
    overlayColor: BG_OPTIONS[0].value,
    motion: 'slow-zoom',
    focusX: 50,
    focusY: 50,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Hitung durasi otomatis berdasarkan panjang teks */
function autoDuration(p: LetterHookProps): number {
  const brandVal = p.brandTag ?? p.signature ?? '';
  const totalChars = (p.label?.length ?? 0) + (p.line1?.length ?? 0) + (p.highlight?.length ?? 0) + (brandVal.length ?? 0);
  return Math.min(12, Math.max(5, Math.round((totalChars * 0.045 + 2.5) * 2) / 2));
}

type ExportStatus = 'idle' | 'checking' | 'rendering' | 'done' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────

export default function LetterHookStudio() {
  const [props, setProps] = useState<LetterHookProps>(initialProps);
  const [durationOverride, setDurationOverride] = useState<number | null>(null);
  const didRestore = useRef(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  // Durasi efektif: pakai override jika ada, atau hitung otomatis
  const effectiveDuration = durationOverride ?? autoDuration(props);
  const durationInFrames = Math.max(FPS, Math.round(effectiveDuration * FPS));
  const propsWithDuration: LetterHookProps = { ...props, durationSeconds: effectiveDuration };

  // ── Restore dari localStorage & IndexedDB ──
  useEffect(() => {
    let active = true;
    const restore = window.setTimeout(async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        let restoredBgMode: 'color' | 'media' = 'color';
        let restoredBgMedia = initialProps.bgMedia;

        if (saved) {
          const savedProps = JSON.parse(saved) as Partial<LetterHookProps> & { durationOverride?: number };
          const rawTag = savedProps.brandTag ?? savedProps.signature;
          const brandTag = (!rawTag || rawTag.startsWith('—')) ? 'surat kehidupan' : rawTag;
          restoredBgMode = savedProps.bgMode ?? 'color';
          restoredBgMedia = {
            ...initialProps.bgMedia!,
            ...(savedProps.bgMedia || {}),
            src: '',
          };

          if (active) {
            setProps((current) => ({
              ...current,
              ...savedProps,
              brandTag,
              brandStyle: savedProps.brandStyle ?? 'line',
              brandPlacement: savedProps.brandPlacement ?? 'bottom',
              alignment: savedProps.alignment ?? 'center',
              bgMode: restoredBgMode,
              bgMedia: restoredBgMedia,
            }));
            if (savedProps.durationOverride != null) setDurationOverride(savedProps.durationOverride);
          }
        }

        // Hydrate file media dari IndexedDB jika ada
        const stored = await loadBgMediaFromIndexedDB();
        if (stored && active) {
          const url = URL.createObjectURL(stored.blob);
          setProps((current) => ({
            ...current,
            bgMedia: {
              ...(current.bgMedia || initialProps.bgMedia!),
              src: url,
              name: stored.name,
              kind: stored.kind,
            },
          }));
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      didRestore.current = true;
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(restore);
    };
  }, []);

  // ── Auto-save ke localStorage (tanpa blob URL agar aman dari batas 5MB) ──
  useEffect(() => {
    if (didRestore.current) {
      const toSave = {
        ...props,
        durationOverride,
        bgMedia: props.bgMedia
          ? {
              ...props.bgMedia,
              src: '', // disimpan di IndexedDB
            }
          : undefined,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [props, durationOverride]);

  function update<K extends keyof LetterHookProps>(key: K, value: LetterHookProps[K]) {
    setProps((current) => ({ ...current, [key]: value }));
  }

  function selectBg(option: (typeof BG_OPTIONS)[number]) {
    setProps((current) => ({
      ...current,
      background: option.value,
      bgMedia: current.bgMedia
        ? { ...current.bgMedia, overlayColor: option.value }
        : undefined,
    }));
  }

  function selectAccent(option: (typeof ACCENT_OPTIONS)[number]) {
    setProps((current) => ({ ...current, accentColor: option.value, mutedColor: option.muted }));
  }

  function updateBgMode(mode: 'color' | 'media') {
    setProps((current) => ({ ...current, bgMode: mode }));
  }

  function updateBgMedia<K extends keyof NonNullable<LetterHookProps['bgMedia']>>(
    key: K,
    val: NonNullable<LetterHookProps['bgMedia']>[K],
  ) {
    setProps((current) => ({
      ...current,
      bgMedia: {
        ...(current.bgMedia || initialProps.bgMedia!),
        [key]: val,
      },
    }));
  }

  async function handleMediaUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (props.bgMedia?.src && props.bgMedia.src.startsWith('blob:')) {
      URL.revokeObjectURL(props.bgMedia.src);
    }

    const objectUrl = URL.createObjectURL(file);
    const kind: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';

    // Simpan ke IndexedDB agar tetap ada saat browser di-refresh
    await saveBgMediaToIndexedDB(file, file.name, kind);

    setProps((current) => ({
      ...current,
      bgMode: 'media',
      bgMedia: {
        ...(current.bgMedia || initialProps.bgMedia!),
        src: objectUrl,
        name: file.name,
        kind,
      },
    }));
    setStatus(`Media "${file.name}" berhasil dipasang.`);
  }

  async function handleRemoveMedia() {
    if (props.bgMedia?.src && props.bgMedia.src.startsWith('blob:')) {
      URL.revokeObjectURL(props.bgMedia.src);
    }
    await clearBgMediaFromIndexedDB();
    setProps((current) => ({
      ...current,
      bgMode: 'color',
      bgMedia: {
        ...(current.bgMedia || initialProps.bgMedia!),
        src: '',
        name: '',
      },
    }));
    setStatus('Background dikembalikan ke warna polos.');
  }

  // ── Export MP4 ──
  async function exportVideo() {
    if (exportStatus === 'checking' || exportStatus === 'rendering') return;
    setExportStatus('checking');
    setExportProgress(0);
    setExportError(null);
    setExportSuccess(null);
    setStatus('Memeriksa dukungan export browser…');

    try {
      await assertLetterHookRenderSupport();
      setExportStatus('rendering');
      setStatus('Sedang rendering video MP4 HD…');

      const blob = await renderLetterHookVideo(propsWithDuration, durationInFrames, (p) => {
        setExportProgress(p);
      });

      downloadLetterHookVideo(blob, propsWithDuration);
      setExportProgress(100);
      setExportStatus('done');
      const fileName = letterHookFileName(propsWithDuration);
      setExportSuccess(`Video "${fileName}" berhasil dibuat dan diunduh.`);
      setStatus('MP4 HD berhasil dibuat.');
    } catch (caughtError) {
      setExportStatus('error');
      const message = caughtError instanceof Error ? caughtError.message : 'Export video gagal.';
      setExportError(message);
      setStatus(message);
    }
  }

  async function reset() {
    if (props.bgMedia?.src && props.bgMedia.src.startsWith('blob:')) {
      URL.revokeObjectURL(props.bgMedia.src);
    }
    await clearBgMediaFromIndexedDB();
    setProps(initialProps);
    setDurationOverride(null);
    setStatus('Desain dikembalikan ke contoh awal.');
  }

  // Cari preset yang aktif
  const activeBg = BG_OPTIONS.find((b) => b.value === props.background) ?? BG_OPTIONS[0];
  const activeAccent = ACCENT_OPTIONS.find((o) => o.value === props.accentColor) ?? ACCENT_OPTIONS[0];
  const activeBrandStyle = props.brandStyle || 'line';
  const activeBrandPlacement = props.brandPlacement || 'bottom';
  const activeAlignment = props.alignment || 'center';
  const activeBgMode = props.bgMode || 'color';
  const activeBgMedia = props.bgMedia || initialProps.bgMedia!;

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/brand" className={styles.back}><ArrowLeft size={16} /> Brand Studio</Link>
        <div className={styles.title}>
          <Sparkles size={17} />
          <span>
            <strong>Surat Kehidupan</strong>
            <small>HOOK MAKER · AKUN PBA</small>
          </span>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.reset}
            onClick={reset}
            disabled={exportStatus === 'checking' || exportStatus === 'rendering'}
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            type="button"
            className={styles.export}
            onClick={() => void exportVideo()}
            disabled={exportStatus === 'checking' || exportStatus === 'rendering'}
          >
            {exportStatus === 'checking' ? (
              <>
                <Loader2 size={15} className={styles.spin} />
                <span>Memeriksa…</span>
              </>
            ) : exportStatus === 'rendering' ? (
              <>
                <Loader2 size={15} className={styles.spin} />
                <span>Export {exportProgress}%</span>
              </>
            ) : exportStatus === 'done' ? (
              <>
                <CheckCircle2 size={15} />
                <span>Export Lagi</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Export MP4 HD</span>
              </>
            )}
          </button>
        </div>

        {/* Topbar progress line during rendering */}
        {exportStatus === 'rendering' ? (
          <div className={styles.topProgressBar}>
            <div
              className={styles.topProgressIndicator}
              style={{ width: `${Math.max(4, exportProgress)}%` }}
            />
          </div>
        ) : null}
      </header>

      <div className={styles.workspace}>
        {/* ── EDITOR PANEL ── */}
        <section className={styles.editor}>
          {/* Error Alert Banner */}
          {exportError ? (
            <div className={styles.alertBannerError}>
              <TriangleAlert size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: 2 }}>Export Video Gagal</strong>
                <span>{exportError}</span>
              </div>
              <button
                type="button"
                className={styles.alertCloseBtn}
                onClick={() => setExportError(null)}
                title="Tutup pesan"
              >
                <X size={14} />
              </button>
            </div>
          ) : null}

          {/* Success Banner */}
          {exportSuccess ? (
            <div className={styles.alertBannerSuccess}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: 2 }}>Export Berhasil!</strong>
                <span>{exportSuccess}</span>
              </div>
              <button
                type="button"
                className={styles.alertCloseBtn}
                onClick={() => setExportSuccess(null)}
                title="Tutup pesan"
              >
                <X size={14} />
              </button>
            </div>
          ) : null}

          <div className={styles.intro}>
            <div>
              <h1>Hook Quotes · Akun PBA</h1>
              <p>Ketik teks, preview otomatis. Pilih perataan teks di tengah atau rata kiri seperti brand editorial.</p>
            </div>
          </div>

          {/* ── TEKS HOOK ── */}
          <section className={styles.textSection}>
            <div className={styles.sectionHeading}>
              <div><span>01 · TEKS &amp; TATA LETAK</span><h2>Isi teks &amp; perataan</h2></div>
              <Save size={15} className={styles.savedIcon} />
            </div>

            {/* Pilihan Perataan Teks (Alignment) */}
            <div className={styles.alignmentRow}>
              <span>Perataan Teks:</span>
              <div className={styles.alignmentSegment}>
                <button
                  type="button"
                  className={`${styles.alignBtn} ${activeAlignment === 'center' ? styles.alignBtnActive : ''}`}
                  onClick={() => update('alignment', 'center')}
                  title="Rata Tengah"
                >
                  <AlignCenter size={14} />
                  <span>Rata Tengah</span>
                </button>
                <button
                  type="button"
                  className={`${styles.alignBtn} ${activeAlignment === 'left' ? styles.alignBtnActive : ''}`}
                  onClick={() => update('alignment', 'left')}
                  title="Rata Kiri"
                >
                  <AlignLeft size={14} />
                  <span>Rata Kiri</span>
                </button>
              </div>
            </div>

            <label className={styles.field}>
              Label kecil atas <span className={styles.fieldHint}>(opsional, ALL CAPS otomatis)</span>
              <input
                value={props.label}
                onChange={(e) => update('label', e.target.value)}
                placeholder="A THOUGHT AT 2 AM"
                maxLength={64}
              />
            </label>

            <label className={styles.field}>
              Kalimat utama
              <textarea
                rows={3}
                value={props.line1}
                onChange={(e) => update('line1', e.target.value)}
                placeholder="Pernah nggak, merasa tidak pantas…"
                maxLength={200}
              />
            </label>

            <label className={styles.field}>
              Kalimat yang disorot <span className={styles.fieldHint}>(muncul setelah kalimat utama)</span>
              <textarea
                rows={2}
                value={props.highlight}
                onChange={(e) => update('highlight', e.target.value)}
                placeholder="Justru pada orang yang paling kamu sayang."
                maxLength={140}
              />
            </label>

            <label className={styles.field}>
              Brand Mark / Identitas Akun <span className={styles.fieldHint}>(opsional, misal: surat kehidupan)</span>
              <input
                value={props.brandTag ?? props.signature ?? ''}
                onChange={(e) => {
                  update('brandTag', e.target.value);
                  update('signature', e.target.value);
                }}
                placeholder="surat kehidupan"
                maxLength={50}
              />
            </label>

            {/* Pilihan Gaya Brand Mark */}
            <div className={styles.brandStyleRow}>
              <span>Tampilan Brand Mark:</span>
              <div className={styles.brandStyleSegment}>
                {BRAND_STYLE_OPTIONS.map((styleOpt) => (
                  <button
                    type="button"
                    key={styleOpt.id}
                    className={`${styles.brandStyleBtn} ${activeBrandStyle === styleOpt.id ? styles.brandStyleBtnActive : ''}`}
                    onClick={() => update('brandStyle', styleOpt.id)}
                  >
                    <span>{styleOpt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pilihan Posisi Brand Mark */}
            <div className={styles.brandPlacementRow}>
              <span>Posisi Brand Mark:</span>
              <div className={styles.brandPlacementSegment}>
                {BRAND_PLACEMENT_OPTIONS.map((posOpt) => (
                  <button
                    type="button"
                    key={posOpt.id}
                    className={`${styles.placementBtn} ${activeBrandPlacement === posOpt.id ? styles.placementBtnActive : ''}`}
                    onClick={() => update('brandPlacement', posOpt.id)}
                    title={posOpt.desc}
                  >
                    <span>{posOpt.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── WARNA & LATAR ── */}
          <section className={styles.themeSection}>
            <div className={styles.sectionHeading}>
              <div><span>02 · WARNA &amp; LATAR</span><h2>Latar belakang &amp; sorotan</h2></div>
            </div>

            {/* Switcher Tipe Background: Warna Solid vs Foto / Movie Media */}
            <div className={styles.bgModeSegment}>
              <button
                type="button"
                className={`${styles.bgModeBtn} ${activeBgMode === 'color' ? styles.bgModeBtnActive : ''}`}
                onClick={() => updateBgMode('color')}
              >
                <span>🎨 Warna Solid</span>
              </button>
              <button
                type="button"
                className={`${styles.bgModeBtn} ${activeBgMode === 'media' ? styles.bgModeBtnActive : ''}`}
                onClick={() => updateBgMode('media')}
              >
                <Film size={14} />
                <span>Foto / Movie Media</span>
              </button>
            </div>

            {/* Jika Mode Warna Solid: Pilihan Warna Background Preset */}
            {activeBgMode === 'color' ? (
              <div className={styles.colorGroup}>
                <span className={styles.colorGroupLabel}>Pilihan Warna Latar (Background)</span>
                <div className={styles.bgGrid}>
                  {BG_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      className={`${styles.bgCard} ${activeBg.id === opt.id ? styles.bgCardActive : ''}`}
                      onClick={() => selectBg(opt)}
                      aria-pressed={activeBg.id === opt.id}
                      title={opt.desc}
                    >
                      <span className={styles.bgSwatch} style={{ background: opt.value }} />
                      <div className={styles.bgInfo}>
                        <strong>{opt.name}</strong>
                        <small>{opt.desc}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Jika Mode Media: Panel Upload & Kontrol Visual Movie/Photo */
              <div className={styles.mediaCard}>
                <div className={styles.mediaCardHeader}>
                  <div className={styles.mediaIconBadge}>
                    {activeBgMedia.kind === 'video' ? <Film size={16} /> : <ImageIcon size={16} />}
                  </div>
                  <div className={styles.mediaHeaderInfo}>
                    <strong>{activeBgMedia.name || 'Belum ada media'}</strong>
                    <small>
                      {activeBgMedia.src
                        ? `${activeBgMedia.kind === 'video' ? 'Video' : 'Foto'} terpasang`
                        : 'Upload foto adegan film, screenshot, atau foto aesthetic'}
                    </small>
                  </div>
                </div>

                {activeBgMedia.src ? (
                  <div className={styles.mediaActionsRow}>
                    <label className={styles.mediaUploadBtn}>
                      <Upload size={14} />
                      Ganti Foto / Video
                      <input
                        type="file"
                        accept="image/*,video/*"
                        hidden
                        onChange={handleMediaUpload}
                      />
                    </label>
                    <button
                      type="button"
                      className={styles.mediaDeleteBtn}
                      onClick={handleRemoveMedia}
                      title="Hapus media background"
                    >
                      <Trash2 size={13} />
                      Hapus
                    </button>
                  </div>
                ) : (
                  <label className={styles.mediaUploadBtn} style={{ minHeight: 46 }}>
                    <Upload size={16} />
                    Pilih Foto / Movie Screenshot
                    <input
                      type="file"
                      accept="image/*,video/*"
                      hidden
                      onChange={handleMediaUpload}
                    />
                  </label>
                )}

                {/* Pengaturan Visual Efek Foto/Video */}
                {activeBgMedia.src ? (
                  <div className={styles.mediaSettingsStack}>

                    {/* 1. Blur Slider & Quick Chips */}
                    <div className={styles.settingItem}>
                      <div className={styles.settingLabelRow}>
                        <span>Blur Background</span>
                        <span className={styles.settingValueBadge}>{activeBgMedia.blur ?? 8}px</span>
                      </div>
                      <input
                        className={styles.sliderControl}
                        type="range"
                        min={0}
                        max={30}
                        step={1}
                        value={activeBgMedia.blur ?? 8}
                        onChange={(e) => updateBgMedia('blur', Number(e.target.value))}
                      />
                      <div className={styles.quickChipsRow}>
                        {[
                          { label: '0px (Jernih)', val: 0 },
                          { label: '6px (Halus)', val: 6 },
                          { label: '12px (Sinematik)', val: 12 },
                          { label: '20px (Pekat)', val: 20 },
                        ].map((chip) => (
                          <button
                            type="button"
                            key={chip.val}
                            className={`${styles.chipBtn} ${activeBgMedia.blur === chip.val ? styles.chipBtnActive : ''}`}
                            onClick={() => updateBgMedia('blur', chip.val)}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Overlay Opacity Slider & Quick Chips */}
                    <div className={styles.settingItem}>
                      <div className={styles.settingLabelRow}>
                        <span>Lapisan Gelap (Dim / Kontras Teks)</span>
                        <span className={styles.settingValueBadge}>
                          {Math.round((activeBgMedia.overlayOpacity ?? 0.65) * 100)}%
                        </span>
                      </div>
                      <input
                        className={styles.sliderControl}
                        type="range"
                        min={0.10}
                        max={0.95}
                        step={0.05}
                        value={activeBgMedia.overlayOpacity ?? 0.65}
                        onChange={(e) => updateBgMedia('overlayOpacity', Number(e.target.value))}
                      />
                      <div className={styles.quickChipsRow}>
                        {[
                          { label: '45% (Terang)', val: 0.45 },
                          { label: '65% (Seimbang)', val: 0.65 },
                          { label: '85% (Fokus Teks)', val: 0.85 },
                        ].map((chip) => (
                          <button
                            type="button"
                            key={chip.val}
                            className={`${styles.chipBtn} ${Math.abs((activeBgMedia.overlayOpacity ?? 0.65) - chip.val) < 0.02 ? styles.chipBtnActive : ''}`}
                            onClick={() => updateBgMedia('overlayOpacity', chip.val)}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Gerakan Sinematik & Tampilan Fit */}
                    <div className={styles.twoColsRow}>
                      <div className={styles.settingItem}>
                        <div className={styles.settingLabelRow}>
                          <span>Gerakan (Motion)</span>
                        </div>
                        <select
                          className={styles.selectInput}
                          value={activeBgMedia.motion || 'slow-zoom'}
                          onChange={(e) => updateBgMedia('motion', e.target.value as any)}
                        >
                          <option value="slow-zoom">Slow Zoom (Sinematik)</option>
                          <option value="drift">Drift (Panning)</option>
                          <option value="none">Diam (Static)</option>
                        </select>
                      </div>

                      <div className={styles.settingItem}>
                        <div className={styles.settingLabelRow}>
                          <span>Tampilan Media</span>
                        </div>
                        <select
                          className={styles.selectInput}
                          value={activeBgMedia.fit || 'cover'}
                          onChange={(e) => updateBgMedia('fit', e.target.value as any)}
                        >
                          <option value="cover">Penuhi Layar (Cover)</option>
                          <option value="contain">Tampilkan Utuh (Fit)</option>
                        </select>
                      </div>
                    </div>

                    {/* 4. Posisi Fokus Vertikal (Y) & Horizontal (X) */}
                    <div className={styles.twoColsRow}>
                      <div className={styles.settingItem}>
                        <div className={styles.settingLabelRow}>
                          <span>Fokus Vertikal (Y)</span>
                          <span className={styles.settingValueBadge}>{activeBgMedia.focusY ?? 50}%</span>
                        </div>
                        <input
                          className={styles.sliderControl}
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={activeBgMedia.focusY ?? 50}
                          onChange={(e) => updateBgMedia('focusY', Number(e.target.value))}
                        />
                      </div>

                      <div className={styles.settingItem}>
                        <div className={styles.settingLabelRow}>
                          <span>Fokus Horizontal (X)</span>
                          <span className={styles.settingValueBadge}>{activeBgMedia.focusX ?? 50}%</span>
                        </div>
                        <input
                          className={styles.sliderControl}
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={activeBgMedia.focusX ?? 50}
                          onChange={(e) => updateBgMedia('focusX', Number(e.target.value))}
                        />
                      </div>
                    </div>

                  </div>
                ) : null}
              </div>
            )}

            {/* Pilihan Warna Sorotan (Highlight) */}
            <div className={styles.colorGroup}>
              <span className={styles.colorGroupLabel}>Warna Kalimat Sorotan (Highlight)</span>
              <div className={styles.accentGrid}>
                {ACCENT_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    className={`${styles.accentCard} ${activeAccent.id === opt.id ? styles.accentActive : ''}`}
                    onClick={() => selectAccent(opt)}
                    aria-pressed={activeAccent.id === opt.id}
                  >
                    <span className={styles.accentDot} style={{ background: opt.value }} />
                    <span>{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className={styles.tabHint}>
              {activeBgMode === 'media'
                ? 'Tip: Naikkan blur dan kegelapan lapisan jika teks adegan film bertabrakan dengan gambar terang.'
                : 'Warna label dan brand mark menyesuaikan otomatis agar kontras tetap tajam.'}
            </p>
          </section>

          {/* ── TEMPO / DURASI ── */}
          <section className={styles.settingsSection}>
            <div className={styles.sectionHeading}>
              <div><span>03 · DURASI</span><h2>Atur panjang video</h2></div>
              {durationOverride !== null && (
                <button
                  type="button"
                  className={styles.resetDuration}
                  onClick={() => setDurationOverride(null)}
                  title="Kembali ke durasi otomatis"
                >
                  Otomatis
                </button>
              )}
            </div>
            <label className={styles.field}>
              Durasi · {effectiveDuration.toFixed(1)} detik
              {durationOverride === null && (
                <span className={styles.fieldHint}> (dihitung otomatis dari panjang teks)</span>
              )}
              <input
                className={styles.range}
                type="range"
                min="4"
                max="14"
                step="0.5"
                value={effectiveDuration}
                onChange={(e) => setDurationOverride(Number(e.target.value))}
              />
            </label>
          </section>

          <div className={styles.note}>
            <span>✓</span>Perubahan tersimpan otomatis di browser ini dan terpisah dari Brand Studio.
          </div>
        </section>

        {/* ── PREVIEW PANEL ── */}
        <section className={styles.preview}>
          <div className={styles.previewHeader}>
            <div>
              <span>PREVIEW VIDEO</span>
              <strong>
                Surat Kehidupan · {activeBgMode === 'media' ? (activeBgMedia.name ? `Movie Media (${activeBgMedia.name})` : 'Foto Background') : activeBg.name} · {activeAlignment === 'left' ? 'Rata Kiri' : 'Rata Tengah'} · {activeBrandPlacement === 'bottom' ? 'Watermark' : 'Flow'}
              </strong>
            </div>
            <small>9:16 · 1080p · {effectiveDuration.toFixed(1)}s</small>
          </div>
          <div className={styles.playerStage}>
            <div className={styles.playerFrame}>
              <Player
                key={`${props.accentColor}-${props.background}-${props.brandStyle}-${activeBrandPlacement}-${activeAlignment}-${effectiveDuration}-${activeBgMode}-${activeBgMedia.src}-${activeBgMedia.blur}-${activeBgMedia.overlayOpacity}-${activeBgMedia.motion}-${activeBgMedia.focusX}-${activeBgMedia.focusY}-${activeBgMedia.fit}`}
                component={LetterHookVideo}
                inputProps={propsWithDuration}
                durationInFrames={durationInFrames}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={FPS}
                controls
                loop
                clickToPlay
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
          <div className={styles.previewFooter}>
            <span>Preview = hasil export. Nama file dari kalimat utama.</span>
            {status
              ? <small className={status.startsWith('MP4') ? styles.success : ''}>{status}</small>
              : <small>Perubahan tersimpan otomatis.</small>
            }
          </div>
        </section>
      </div>
    </main>
  );
}
