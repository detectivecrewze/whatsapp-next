'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Player } from '@remotion/player';
import {
  AlignCenter,
  AlignLeft,
  ArrowLeft,
  Download,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { LetterHookVideo, type LetterHookProps } from '@/remotion/brand/LetterHookVideo';
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
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Hitung durasi otomatis berdasarkan panjang teks */
function autoDuration(p: LetterHookProps): number {
  const brandVal = p.brandTag ?? p.signature ?? '';
  const totalChars = (p.label?.length ?? 0) + (p.line1?.length ?? 0) + (p.highlight?.length ?? 0) + (brandVal.length ?? 0);
  return Math.min(12, Math.max(5, Math.round((totalChars * 0.045 + 2.5) * 2) / 2));
}

function downloadFile(blob: Blob, label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'surat-kehidupan';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pba-${slug}.mp4`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LetterHookStudio() {
  const [props, setProps] = useState<LetterHookProps>(initialProps);
  const [durationOverride, setDurationOverride] = useState<number | null>(null);
  const didRestore = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  // Durasi efektif: pakai override jika ada, atau hitung otomatis
  const effectiveDuration = durationOverride ?? autoDuration(props);
  const durationInFrames = Math.max(FPS, Math.round(effectiveDuration * FPS));
  const propsWithDuration: LetterHookProps = { ...props, durationSeconds: effectiveDuration };

  // ── Restore dari localStorage ──
  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const savedProps = JSON.parse(saved) as Partial<LetterHookProps> & { durationOverride?: number };
          const rawTag = savedProps.brandTag ?? savedProps.signature;
          const brandTag = (!rawTag || rawTag.startsWith('—')) ? 'surat kehidupan' : rawTag;
          setProps((current) => ({
            ...current,
            ...savedProps,
            brandTag,
            brandStyle: savedProps.brandStyle ?? 'line',
            brandPlacement: savedProps.brandPlacement ?? 'bottom',
            alignment: savedProps.alignment ?? 'center',
          }));
          if (savedProps.durationOverride != null) setDurationOverride(savedProps.durationOverride);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      didRestore.current = true;
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  // ── Auto-save ke localStorage ──
  useEffect(() => {
    if (didRestore.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...props, durationOverride }));
    }
  }, [props, durationOverride]);

  function update<K extends keyof LetterHookProps>(key: K, value: LetterHookProps[K]) {
    setProps((current) => ({ ...current, [key]: value }));
  }

  function selectBg(option: (typeof BG_OPTIONS)[number]) {
    setProps((current) => ({ ...current, background: option.value }));
  }

  function selectAccent(option: (typeof ACCENT_OPTIONS)[number]) {
    setProps((current) => ({ ...current, accentColor: option.value, mutedColor: option.muted }));
  }

  // ── Export MP4 ──
  async function exportVideo() {
    if (exporting) return;
    setExporting(true);
    setProgress(0);
    setStatus('Memeriksa dukungan export…');
    try {
      const { canRenderMediaOnWeb, renderMediaOnWeb } = await import('@remotion/web-renderer');
      const support = await canRenderMediaOnWeb({ container: 'mp4', videoCodec: 'h264', muted: true, width: 1080, height: 1920 });
      if (!support.canRender) {
        const issue = support.issues.find((entry) => entry.severity === 'error');
        throw new Error(issue?.message || 'Browser belum mendukung export MP4. Coba Chrome atau Edge terbaru.');
      }
      setStatus('Membuat MP4 HD…');
      const result = await renderMediaOnWeb({
        licenseKey: 'free-license',
        composition: {
          id: 'FYALetterHook',
          component: LetterHookVideo,
          durationInFrames,
          fps: FPS,
          width: 1080,
          height: 1920,
          calculateMetadata: null,
          defaultProps: propsWithDuration,
        },
        inputProps: propsWithDuration,
        container: 'mp4',
        videoCodec: 'h264',
        muted: true,
        videoBitrate: 12_000_000,
        hardwareAcceleration: 'prefer-hardware',
        pageResponsiveness: 'medium',
        delayRenderTimeoutInMilliseconds: 120_000,
        onProgress: ({ progress: next }) => setProgress(Math.round(Math.min(1, Math.max(0, next)) * 100)),
      });
      downloadFile(await result.getBlob(), props.line1 || props.label || 'surat-kehidupan');
      setProgress(100);
      setStatus('MP4 HD berhasil dibuat.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Export video gagal.');
    } finally {
      setExporting(false);
    }
  }

  function reset() {
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
          <button type="button" className={styles.reset} onClick={reset}><RotateCcw size={14} /> Reset</button>
          <button type="button" className={styles.export} onClick={() => void exportVideo()} disabled={exporting}>
            {exporting ? <Loader2 size={15} className={styles.spin} /> : <Download size={15} />}
            {exporting ? `Export ${progress}%` : 'Export MP4 HD'}
          </button>
        </div>
      </header>

      <div className={styles.workspace}>
        {/* ── EDITOR PANEL ── */}
        <section className={styles.editor}>
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
              <div><span>02 · WARNA &amp; LATAR</span><h2>Warna background &amp; sorotan</h2></div>
            </div>

            {/* Pilihan Warna Background */}
            <div className={styles.colorGroup}>
              <span className={styles.colorGroupLabel}>Warna Latar Belakang (Background)</span>
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

            {/* Pilihan Warna Sorotan */}
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

            <p className={styles.tabHint}>Warna label dan brand mark menyesuaikan otomatis agar kontras tetap tajam.</p>
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
              <strong>Surat Kehidupan · {activeBg.name} · {activeAlignment === 'left' ? 'Rata Kiri' : 'Rata Tengah'} · {activeBrandPlacement === 'bottom' ? 'Watermark Bawah' : 'Di Bawah Teks'}</strong>
            </div>
            <small>9:16 · 1080p · {effectiveDuration.toFixed(1)}s</small>
          </div>
          <div className={styles.playerStage}>
            <div className={styles.playerFrame}>
              <Player
                key={`${props.accentColor}-${props.background}-${props.brandStyle}-${activeBrandPlacement}-${activeAlignment}-${effectiveDuration}`}
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
