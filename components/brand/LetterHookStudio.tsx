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
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-react';
import { LetterHookVideo, type LetterHookProps } from '@/remotion/brand/LetterHookVideo';
import { ELEVENLABS_MODELS, ELEVENLABS_VOICES } from '@/types';
import {
  clearBgMediaFromIndexedDB,
  clearLetterHookVoiceFromIndexedDB,
  loadBgMediaFromIndexedDB,
  loadLetterHookVoiceFromIndexedDB,
  saveBgMediaToIndexedDB,
  saveLetterHookVoiceToIndexedDB,
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
  textEffect: 'fade-up',
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
  return Math.min(10, Math.max(4, Math.round((totalChars * 0.045 + 2.5) * 2) / 2));
}

type ExportStatus = 'idle' | 'checking' | 'rendering' | 'done' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────

export default function LetterHookStudio() {
  const [props, setProps] = useState<LetterHookProps>(initialProps);
  const [studioTab, setStudioTab] = useState<'visual' | 'voice'>('visual');
  const [durationOverride, setDurationOverride] = useState<number | null>(null);
  const [voiceClipDuration, setVoiceClipDuration] = useState<number | null>(null);
  const didRestore = useRef(false);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const [quotePrompt, setQuotePrompt] = useState('Tentang seseorang yang terlihat baik-baik saja, padahal masih belajar menerima kehilangan.');
  const [quoteTone, setQuoteTone] = useState('Melankolis dan reflektif');
  const [scriptGenerating, setScriptGenerating] = useState(false);
  const [scriptError, setScriptError] = useState('');
  const [elevenKey, setElevenKey] = useState('');
  const [showElevenKey, setShowElevenKey] = useState(false);
  const [elevenVoiceId, setElevenVoiceId] = useState<string>('EXAVITQu4vr4xnSDxMaL');
  const [elevenModel, setElevenModel] = useState<string>('eleven_v4');
  const [voiceTextOverride, setVoiceTextOverride] = useState<string | null>(null);
  const [voiceSrc, setVoiceSrc] = useState('');
  const [voiceGeneratedText, setVoiceGeneratedText] = useState('');
  const [voiceGenerating, setVoiceGenerating] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const voiceText = voiceTextOverride ?? [props.line1, props.highlight].map((part) => part.trim()).filter(Boolean).join(' ');
  const voiceIsCurrent = Boolean(voiceSrc && voiceGeneratedText === voiceText.trim());
  // Jika voice cocok dengan teks saat ini, durasi klip mengikuti metadata audio yang sebenarnya.
  const effectiveDuration = voiceIsCurrent && voiceClipDuration
    ? voiceClipDuration
    : durationOverride ?? autoDuration(props);
  // Round upward to the next frame so the final audio samples are never clipped.
  const durationInFrames = Math.max(FPS, Math.ceil(effectiveDuration * FPS - 0.001));
  const propsWithDuration: LetterHookProps = {
    ...props,
    durationSeconds: effectiveDuration,
    voiceSrc: voiceIsCurrent ? voiceSrc : undefined,
    voiceVolume: 1,
  };

  function readAudioDuration(src: string): Promise<number | null> {
    return new Promise((resolve) => {
      const audio = new Audio();
      let settled = false;
      const finish = (duration: number | null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        audio.onloadedmetadata = null;
        audio.onerror = null;
        resolve(duration);
      };
      const timeout = window.setTimeout(() => finish(null), 10000);
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null);
      audio.onerror = () => finish(null);
      audio.src = src;
    });
  }

  // ── Restore dari localStorage & IndexedDB ──
  useEffect(() => {
    let active = true;
    const restore = window.setTimeout(async () => {
      try {
        const savedKey = localStorage.getItem('wa_elevenlabs_api_key');
        if (savedKey && active) setElevenKey(savedKey);
        const saved = localStorage.getItem(STORAGE_KEY);
        let restoredBgMode: 'color' | 'media' = 'color';
        let restoredBgMedia = initialProps.bgMedia;

        if (saved) {
          const savedProps = JSON.parse(saved) as Partial<LetterHookProps> & {
            durationOverride?: number;
            quotePrompt?: string;
            quoteTone?: string;
            elevenVoiceId?: string;
            elevenModel?: string;
            voiceTextOverride?: string | null;
          };
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
            if (savedProps.quotePrompt) setQuotePrompt(savedProps.quotePrompt);
            if (savedProps.quoteTone) setQuoteTone(savedProps.quoteTone);
            if (savedProps.elevenVoiceId) setElevenVoiceId(savedProps.elevenVoiceId);
            if (savedProps.elevenModel) setElevenModel(savedProps.elevenModel);
            setVoiceTextOverride(savedProps.voiceTextOverride ?? null);
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

        const storedVoice = await loadLetterHookVoiceFromIndexedDB();
        if (storedVoice && active) {
          const restoredVoiceSrc = URL.createObjectURL(storedVoice.blob);
          setVoiceSrc(restoredVoiceSrc);
          setVoiceClipDuration(storedVoice.durationSeconds ?? await readAudioDuration(restoredVoiceSrc));
          setVoiceGeneratedText(storedVoice.text);
          setElevenVoiceId(storedVoice.voiceId);
          setElevenModel(storedVoice.model);
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

  useEffect(() => () => {
    const audio = voiceAudioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    voiceAudioRef.current = null;
  }, []);

  // ── Auto-save ke localStorage (tanpa blob URL agar aman dari batas 5MB) ──
  useEffect(() => {
    if (didRestore.current) {
      const toSave = {
        ...props,
        durationOverride,
        quotePrompt,
        quoteTone,
        elevenVoiceId,
        elevenModel,
        voiceTextOverride,
        bgMedia: props.bgMedia
          ? {
              ...props.bgMedia,
              src: '', // disimpan di IndexedDB
            }
          : undefined,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [props, durationOverride, quotePrompt, quoteTone, elevenVoiceId, elevenModel, voiceTextOverride]);

  function update<K extends keyof LetterHookProps>(key: K, value: LetterHookProps[K]) {
    setProps((current) => ({ ...current, [key]: value }));
    if (key === 'line1' || key === 'highlight') setVoiceTextOverride(null);
  }

  async function generateQuoteScript() {
    if (scriptGenerating) return;
    setScriptGenerating(true);
    setScriptError('');
    try {
      const response = await fetch('/api/ai-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'brand_quote', prompt: quotePrompt, tone: quoteTone, provider: 'google' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Generate naskah gagal (' + response.status + ').');
      if (typeof result.line1 !== 'string' || !result.line1.trim()) throw new Error('AI belum menghasilkan kutipan yang bisa dipakai. Coba lagi.');
      setProps((current) => ({
        ...current,
        label: typeof result.label === 'string' ? result.label : '',
        line1: result.line1,
        highlight: typeof result.highlight === 'string' ? result.highlight : '',
      }));
      setVoiceTextOverride(typeof result.voiceText === 'string' ? result.voiceText : null);
      setDurationOverride(null);
      setScriptError('Naskah siap. Kamu masih bisa mengedit teks di tab Editor.');
    } catch (error) {
      setScriptError(error instanceof Error ? error.message : 'Generate naskah gagal.');
    } finally {
      setScriptGenerating(false);
    }
  }

  async function generateQuoteVoice() {
    if (voiceGenerating) return;
    if (!elevenKey.trim()) {
      setVoiceError('Masukkan ElevenLabs API key terlebih dahulu. Key disimpan lokal di browser ini.');
      return;
    }
    const text = voiceText.trim();
    if (!text) {
      setVoiceError('Isi kalimat utama atau highlight sebelum membuat voice.');
      return;
    }
    setVoiceGenerating(true);
    setVoiceError('');
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, provider: 'elevenlabs', voiceId: elevenVoiceId, apiKey: elevenKey.trim(), model: elevenModel, stability: 0.45, style: 0.35, speed: 1 }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(detail.error || 'Generate voice gagal (' + response.status + ').');
      }
      const blob = await response.blob();
      const nextSrc = URL.createObjectURL(blob);
      const clipDuration = await readAudioDuration(nextSrc);
      voiceAudioRef.current?.pause();
      voiceAudioRef.current = null;
      setVoicePlaying(false);
      setVoiceSrc(nextSrc);
      setVoiceGeneratedText(text);
      setVoiceClipDuration(clipDuration);
      await saveLetterHookVoiceToIndexedDB(blob, text, elevenVoiceId, elevenModel, clipDuration ?? undefined);
    } catch (error) {
      setVoiceError(error instanceof Error ? error.message : 'Generate voice gagal.');
    } finally {
      setVoiceGenerating(false);
    }
  }

  async function toggleVoicePlayback() {
    if (!voiceIsCurrent) {
      setVoiceError('Voice belum sesuai dengan teks saat ini. Buat ulang voice agar cocok.');
      return;
    }
    const current = voiceAudioRef.current;
    if (current && !current.paused) {
      current.pause();
      setVoicePlaying(false);
      return;
    }
    const audio = new Audio(voiceSrc);
    audio.onended = () => setVoicePlaying(false);
    audio.onerror = () => {
      setVoicePlaying(false);
      setVoiceError('Audio tidak dapat diputar. Coba buat ulang voice.');
    };
    voiceAudioRef.current = audio;
    try {
      await audio.play();
      setVoicePlaying(true);
      setVoiceError('');
    } catch {
      setVoicePlaying(false);
      setVoiceError('Browser gagal memutar voice. Coba klik play sekali lagi.');
    }
  }

  async function removeQuoteVoice() {
    voiceAudioRef.current?.pause();
    voiceAudioRef.current = null;
    if (voiceSrc.startsWith('blob:')) URL.revokeObjectURL(voiceSrc);
    setVoiceSrc('');
    setVoiceClipDuration(null);
    setVoiceGeneratedText('');
    setVoicePlaying(false);
    await clearLetterHookVoiceFromIndexedDB();
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
    if (voiceSrc && !voiceIsCurrent) {
      setExportError('Voice yang tersimpan belum sesuai dengan teks terbaru. Buka tab Naskah & Voice dan buat ulang voice sebelum export.');
      setExportStatus('error');
      return;
    }
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
    await removeQuoteVoice();
    setProps(initialProps);
    setDurationOverride(null);
    setQuotePrompt('Tentang seseorang yang terlihat baik-baik saja, padahal masih belajar menerima kehilangan.');
    setQuoteTone('Melankolis dan reflektif');
    setElevenVoiceId('EXAVITQu4vr4xnSDxMaL');
    setElevenModel('eleven_v4');
    setVoiceTextOverride(null);
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

          <div className={styles.studioTabs} role="tablist" aria-label="Mode editor surat">
            <button type="button" role="tab" aria-selected={studioTab === 'visual'} className={studioTab === 'visual' ? styles.studioTabActive : ''} onClick={() => setStudioTab('visual')}>
              Editor Visual
            </button>
            <button type="button" role="tab" aria-selected={studioTab === 'voice'} className={studioTab === 'voice' ? styles.studioTabActive : ''} onClick={() => setStudioTab('voice')}>
              <Mic size={13} /> Naskah &amp; Voice
            </button>
          </div>

          {studioTab === 'visual' ? (
            <>

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
                          onChange={(e) => updateBgMedia('motion', e.target.value as NonNullable<LetterHookProps['bgMedia']>['motion'])}
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
                          onChange={(e) => updateBgMedia('fit', e.target.value as NonNullable<LetterHookProps['bgMedia']>['fit'])}
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
              {voiceIsCurrent && voiceClipDuration ? (
                <span className={styles.fieldHint}> (mengikuti durasi voice-over)</span>
              ) : durationOverride === null && (
                <span className={styles.fieldHint}> (dihitung otomatis dari panjang teks)</span>
              )}
              <input
                className={styles.range}
                type="range"
                min="4"
                max={Math.max(10, Math.ceil(effectiveDuration * 2) / 2)}
                step="0.5"
                value={effectiveDuration}
                onChange={(e) => setDurationOverride(Number(e.target.value))}
                disabled={voiceIsCurrent && Boolean(voiceClipDuration)}
              />
            </label>
            <label className={styles.field}>
              Efek kemunculan teks
              <select
                value={props.textEffect ?? 'fade-up'}
                onChange={(event) => update('textEffect', event.target.value as NonNullable<LetterHookProps['textEffect']>)}
              >
                <option value="fade-up">Fade naik · lembut</option>
                <option value="fade">Fade · sederhana</option>
                <option value="typewriter">Typewriting · huruf demi huruf</option>
                <option value="word-by-word">Kata demi kata</option>
              </select>
              <small className={styles.voiceHelp}>Typewriting dan kata demi kata berjalan bertahap sepanjang durasi voice-over.</small>
            </label>
          </section>

          <div className={styles.note}>
            <span>✓</span>Perubahan tersimpan otomatis di browser ini dan terpisah dari Brand Studio.
          </div>
            </>
          ) : (
            <section className={styles.voiceTabPanel}>
              <div className={styles.sectionHeading}>
                <div><span>AI · KUTIPAN PERSONAL</span><h2>Buat naskah video quote</h2></div>
                <Sparkles size={16} className={styles.savedIcon} />
              </div>
              <p className={styles.voiceIntro}>AI akan menulis kutipan original yang pendek dan enak dibacakan—tanpa promosi atau reveal produk. Setelah dibuat, teks tetap bisa kamu ubah di tab Editor Visual.</p>

              <label className={styles.field}>
                Arah / tema kutipan
                <textarea rows={3} value={quotePrompt} onChange={(event) => setQuotePrompt(event.target.value)} maxLength={500} placeholder="Contoh: belajar merelakan seseorang tanpa membenci kenangannya" />
              </label>
              <label className={styles.field}>
                Nuansa
                <select value={quoteTone} onChange={(event) => setQuoteTone(event.target.value)}>
                  <option>Melankolis dan reflektif</option>
                  <option>Jujur dan relatable</option>
                  <option>Tenang dan menyembuhkan</option>
                  <option>Romantis, sedikit getir</option>
                  <option>Kesepian dan larut malam</option>
                </select>
              </label>
              <button type="button" className={styles.generateScriptButton} onClick={() => void generateQuoteScript()} disabled={scriptGenerating || !quotePrompt.trim()}>
                {scriptGenerating ? <Loader2 size={15} className={styles.spin} /> : <Sparkles size={15} />}
                {scriptGenerating ? 'Menulis kutipan…' : 'Generate naskah otomatis'}
              </button>
              {scriptError ? <div className={`${styles.voiceNotice} ${scriptError.startsWith('Naskah siap') ? styles.voiceNoticeSuccess : ''}`}>{scriptError}</div> : null}

              <div className={styles.voiceDivider} />
              <div className={styles.sectionHeading}>
                <div><span>ELEVENLABS · TEXT TO SPEECH</span><h2>Jadikan kutipan sebagai voice</h2></div>
                {voiceIsCurrent ? <CheckCircle2 size={16} className={styles.savedIcon} /> : <Mic size={16} className={styles.savedIcon} />}
              </div>
              <label className={styles.field}>
                Teks yang dibacakan
                <textarea rows={4} value={voiceText} onChange={(event) => setVoiceTextOverride(event.target.value)} maxLength={380} placeholder="Naskah voice akan mengikuti kalimat utama dan highlight." />
                <small className={styles.voiceHelp}>Default mengikuti kalimat utama + highlight. Mengubah teks di tab Editor Visual akan menyelaraskannya lagi.</small>
              </label>

              <label className={styles.field}>
                ElevenLabs API key
                <div className={styles.voiceKeyRow}>
                  <input type={showElevenKey ? 'text' : 'password'} value={elevenKey} onChange={(event) => {
                    const value = event.target.value;
                    setElevenKey(value);
                    try { localStorage.setItem('wa_elevenlabs_api_key', value); } catch {}
                  }} placeholder="Masukkan API key ElevenLabs" autoComplete="off" spellCheck={false} />
                  <button type="button" onClick={() => setShowElevenKey((shown) => !shown)} aria-label={showElevenKey ? 'Sembunyikan API key' : 'Tampilkan API key'}>
                    {showElevenKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <small className={styles.voiceHelp}>Key disimpan lokal di browser dan dikirim hanya saat meminta audio ke server.</small>
              </label>

              <div className={styles.voiceOptions}>
                <label className={styles.field}>Model suara
                  <select value={elevenModel} onChange={(event) => setElevenModel(event.target.value)}>
                    {ELEVENLABS_MODELS.filter((model) => ['eleven_v4', 'eleven_v4_turbo', 'eleven_v3', 'eleven_multilingual_v2'].includes(model.id)).map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
                  </select>
                </label>
                <label className={styles.field}>Karakter suara
                  <select value={elevenVoiceId} onChange={(event) => setElevenVoiceId(event.target.value)}>
                    {ELEVENLABS_VOICES.map((voice) => <option key={voice.id} value={voice.id}>{voice.name}</option>)}
                  </select>
                </label>
              </div>
              <p className={styles.voiceHelp}>Suara bawaan ElevenLabs memiliki karakter aksen asal masing-masing. Hasil Bahasa Indonesia bisa berbeda tergantung pilihan voice.</p>

              <div className={styles.voiceActionRow}>
                <button type="button" className={styles.generateScriptButton} onClick={() => void generateQuoteVoice()} disabled={voiceGenerating || !voiceText.trim()}>
                  {voiceGenerating ? <Loader2 size={15} className={styles.spin} /> : voiceIsCurrent ? <RefreshCw size={14} /> : <Mic size={15} />}
                  {voiceGenerating ? 'Membuat voice…' : voiceIsCurrent ? 'Generate ulang voice' : 'Generate voice'}
                </button>
                {voiceIsCurrent ? (
                  <>
                    <button type="button" className={styles.voiceIconButton} onClick={() => void toggleVoicePlayback()} aria-label={voicePlaying ? 'Jeda voice' : 'Putar voice'}>
                      {voicePlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button type="button" className={styles.voiceRemoveButton} onClick={() => void removeQuoteVoice()} title="Hapus voice"><Trash2 size={14} /></button>
                  </>
                ) : null}
              </div>
              {voiceSrc && !voiceIsCurrent ? <div className={styles.voiceNotice}>Teks berubah sejak voice dibuat. Generate ulang agar voice yang terdengar dan masuk ke export sesuai.</div> : null}
              {voiceError ? <div className={styles.voiceNotice}>{voiceError}</div> : null}
              {voiceIsCurrent ? <div className={`${styles.voiceNotice} ${styles.voiceNoticeSuccess}`}>Voice siap{voiceClipDuration ? ` · ${voiceClipDuration.toFixed(1)} detik` : ''}. Durasi video mengikuti audio ini; voice juga masuk ke preview dan MP4.</div> : null}
            </section>
          )}
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
                key={`${props.accentColor}-${props.background}-${props.brandStyle}-${activeBrandPlacement}-${activeAlignment}-${props.textEffect}-${activeBgMode}-${activeBgMedia.src}-${activeBgMedia.blur}-${activeBgMedia.overlayOpacity}-${activeBgMedia.motion}-${activeBgMedia.focusX}-${activeBgMedia.focusY}-${activeBgMedia.fit}-${propsWithDuration.voiceSrc ?? ''}`}
                component={LetterHookVideo}
                inputProps={propsWithDuration}
                durationInFrames={durationInFrames}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={FPS}
                controls
                loop
                clickToPlay
                spaceKeyToPlayOrPause={false}
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
