'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Music2,
  Pause,
  Play,
  ShieldCheck,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { isTemporaryAudioUrl, uploadAudioBlob } from '@/lib/tts';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function BacksoundSection() {
  const {
    enableBgm,
    bgmUrl,
    bgmName,
    bgmVolume,
    bgmPitchSemitones,
    bgmStartAt,
    bgmFadeIn,
    bgmFadeOut,
    bgmLoop,
    bgmDucking,
    bgmDuckVolume,
    setEnableBgm,
    setBgmUrl,
    setBgmName,
    setBgmVolume,
    setBgmPitchSemitones,
    setBgmStartAt,
    setBgmFadeIn,
    setBgmFadeOut,
    setBgmLoop,
    setBgmDucking,
    setBgmDuckVolume,
  } = useEditorStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => () => {
    const audio = previewAudioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  }, []);

  useEffect(() => usePlayerStore.subscribe((state, previousState) => {
    if (!state.isPlaying || previousState.isPlaying) return;
    const audio = previewAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      previewAudioRef.current = null;
      setIsPreviewing(false);
    }
  }), []);

  function stopPreview() {
    const audio = previewAudioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute('src');
      audio.load();
    }
    previewAudioRef.current = null;
    setIsPreviewing(false);
  }

  async function togglePreview() {
    if (!bgmUrl) return;
    if (usePlayerStore.getState().isPlaying) {
      setError('Hentikan Putar Animasi dulu sebelum mendengarkan backsound secara terpisah.');
      return;
    }
    if (isPreviewing) {
      stopPreview();
      return;
    }

    stopPreview();
    setError(null);
    const audio = new Audio(bgmUrl);
    audio.preload = 'auto';
    audio.loop = bgmLoop;
    audio.volume = Math.max(0, Math.min(1, bgmVolume));
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = Math.min(Math.max(0, bgmStartAt), Math.max(0, audio.duration - 0.05));
      }
    };
    audio.onended = () => {
      previewAudioRef.current = null;
      setIsPreviewing(false);
    };
    audio.onerror = () => {
      previewAudioRef.current = null;
      setIsPreviewing(false);
      setError('Backsound tidak bisa diputar. Coba upload ulang file audionya.');
    };
    previewAudioRef.current = audio;
    setIsPreviewing(true);

    try {
      await audio.play();
    } catch {
      stopPreview();
      setError('Browser gagal memutar backsound. Coba klik play sekali lagi.');
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Pilih file audio MP3, WAV, M4A, AAC, atau OGG.');
      return;
    }
    if (file.size > MAX_AUDIO_SIZE) {
      setError(`File terlalu besar (${formatBytes(file.size)}). Maksimal 25 MB.`);
      return;
    }

    stopPreview();
    if (bgmUrl?.startsWith('blob:')) URL.revokeObjectURL(bgmUrl);

    const localUrl = URL.createObjectURL(file);
    setBgmUrl(localUrl);
    setBgmName(file.name);
    setEnableBgm(true);
    setFileSize(file.size);
    setError(null);
    setNotice('Backsound siap dipakai untuk preview lokal. Menyimpan ke cloud…');
    setIsUploading(true);

    try {
      const cloudUrl = await uploadAudioBlob(file);
      if (useEditorStore.getState().bgmUrl === localUrl) {
        setBgmUrl(cloudUrl);
        URL.revokeObjectURL(localUrl);
        setNotice('Backsound tersimpan di cloud dan siap ikut preset.');
      }
    } catch (caughtError) {
      setNotice(null);
      setError(
        caughtError instanceof Error
          ? `${caughtError.message} Audio tetap bisa dipakai di sesi ini.`
          : 'Upload cloud gagal. Audio tetap bisa dipakai di sesi ini.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  function removeBacksound() {
    stopPreview();
    if (bgmUrl?.startsWith('blob:')) URL.revokeObjectURL(bgmUrl);
    setEnableBgm(false);
    setBgmUrl(null);
    setBgmName('');
    setFileSize(null);
    setError(null);
    setNotice(null);
  }

  const sourceIsTemporary = Boolean(bgmUrl && isTemporaryAudioUrl(bgmUrl));
  const signedPitch = bgmPitchSemitones > 0 ? `+${bgmPitchSemitones}` : String(bgmPitchSemitones);

  return (
    <div className="flex flex-col gap-4 pb-3">
      <section
        className="overflow-hidden rounded-2xl border"
        style={{ background: 'linear-gradient(145deg, rgba(83,189,235,0.09), rgba(37,211,102,0.035))', borderColor: 'rgba(83,189,235,0.25)' }}
      >
        <div className="flex items-start gap-3 border-b p-3.5" style={{ borderColor: 'rgba(83,189,235,0.16)' }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(83,189,235,0.13)', color: '#53bdeb' }}>
            <Music2 size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold" style={{ color: 'var(--wa-text)' }}>Musik latar video</p>
            <p className="mt-0.5 text-[9.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
              Loop sepanjang cerita dan otomatis mengecil saat voice-over berbicara.
            </p>
          </div>
          <label className="toggle shrink-0">
            <input type="checkbox" checked={enableBgm} disabled={!bgmUrl} onChange={(event) => setEnableBgm(event.target.checked)} />
            <span className="toggle-track" /><span className="toggle-thumb" />
          </label>
        </div>

        <div className="p-3.5">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/ogg"
            onChange={handleUpload}
          />

          {!bgmUrl ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 transition-opacity hover:opacity-80"
              style={{ borderColor: 'rgba(83,189,235,0.34)', color: '#53bdeb', background: 'rgba(83,189,235,0.04)' }}
            >
              <Upload size={21} />
              <span className="text-[11.5px] font-semibold">Upload backsound</span>
              <span className="text-[8.5px]" style={{ color: 'var(--wa-text-muted)' }}>MP3, WAV, M4A, AAC, OGG · maksimal 25 MB</span>
            </button>
          ) : (
            <div className="rounded-xl border p-3" style={{ borderColor: enableBgm ? 'rgba(37,211,102,0.4)' : 'var(--ui-border)', background: 'var(--ui-card)' }}>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => void togglePreview()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'var(--wa-green)', color: '#06120b' }}
                  aria-label={isPreviewing ? 'Hentikan backsound' : 'Putar backsound'}
                >
                  {isPreviewing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold" style={{ color: 'var(--wa-text)' }}>{bgmName || 'Backsound'}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[8.5px]" style={{ color: sourceIsTemporary ? '#fbbf24' : 'var(--wa-green)' }}>
                    {isUploading ? <CloudUpload size={10} /> : sourceIsTemporary ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                    {isUploading ? 'Mengunggah ke cloud…' : sourceIsTemporary ? 'Tersimpan lokal sementara' : 'Tersimpan di cloud'}
                    {fileSize ? ` · ${formatBytes(fileSize)}` : ''}
                  </p>
                </div>
                <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg border px-2 py-1.5 text-[8.5px] font-semibold" style={{ borderColor: 'var(--ui-border)', color: '#53bdeb' }}>Ganti</button>
                <button type="button" onClick={removeBacksound} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--ui-border)', color: '#fca5a5' }} aria-label="Hapus backsound"><Trash2 size={12} /></button>
              </div>
            </div>
          )}
        </div>
      </section>

      {bgmUrl ? (
        <>
          <section className="rounded-2xl border p-3.5" style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 size={14} style={{ color: 'var(--wa-green)' }} />
                <label className="section-label mb-0">Volume backsound</label>
              </div>
              <strong className="text-[11px]" style={{ color: 'var(--wa-green)' }}>{Math.round(bgmVolume * 100)}%</strong>
            </div>
            <input
              type="range"
              className="slider w-full"
              min={0}
              max={0.5}
              step={0.01}
              value={bgmVolume}
              onChange={(event) => {
                const value = Number(event.target.value);
                setBgmVolume(value);
                if (previewAudioRef.current) previewAudioRef.current.volume = value;
              }}
            />
            <div className="mt-1 flex justify-between text-[8px]" style={{ color: 'var(--wa-text-muted)' }}><span>0%</span><span>Aman 15–22%</span><span>50%</span></div>
          </section>

          <section className="rounded-2xl border p-3.5" style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <label className="section-label mb-0">Smart audio priority</label>
                <p className="mt-1 text-[9px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>Urutan otomatis: voice, SFX, lalu backsound.</p>
              </div>
              <label className="toggle shrink-0">
                <input type="checkbox" checked={bgmDucking} onChange={(event) => setBgmDucking(event.target.checked)} />
                <span className="toggle-track" /><span className="toggle-thumb" />
              </label>
            </div>
            {bgmDucking ? (
              <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--ui-border)' }}>
                <div className="mb-2 flex justify-between text-[9px]"><span style={{ color: 'var(--wa-text-muted)' }}>Volume saat voice aktif</span><strong style={{ color: 'var(--wa-green)' }}>{Math.round(bgmDuckVolume * 100)}%</strong></div>
                <input type="range" className="slider w-full" min={0.1} max={0.6} step={0.05} value={bgmDuckVolume} onChange={(event) => setBgmDuckVolume(Number(event.target.value))} />
                <p className="mt-1.5 text-[8px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
                  Persentase ini dihitung dari volume backsound. Saat SFX aktif, musik otomatis turun lebih jauh agar efek tetap terdengar bersih.
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border p-3.5" style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}>
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <label className="section-label mb-0">Pitch / karakter musik</label>
                <strong className="text-[11px]" style={{ color: '#53bdeb' }}>{signedPitch} semitone</strong>
              </div>
              <input type="range" className="slider mt-2 w-full" min={-4} max={4} step={1} value={bgmPitchSemitones} onChange={(event) => setBgmPitchSemitones(Number(event.target.value))} />
              <div className="mt-1 flex justify-between text-[8px]" style={{ color: 'var(--wa-text-muted)' }}><span>Lebih rendah</span><span>Original</span><span>Lebih tinggi</span></div>
              <p className="mt-2 rounded-lg px-2.5 py-2 text-[8.5px] leading-relaxed" style={{ background: 'rgba(83,189,235,0.07)', color: 'var(--wa-text-muted)' }}>
                Pitch tanpa mengubah tempo diterapkan pada hasil MP4. Preview tombol play memakai suara asli browser.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t pt-3" style={{ borderColor: 'var(--ui-border)' }}>
              <label className="text-[8px]" style={{ color: 'var(--wa-text-muted)' }}>Mulai dari
                <input type="number" className="input mt-1 px-2 py-1.5 text-[10px]" min={0} max={600} step={0.5} value={bgmStartAt} onChange={(event) => setBgmStartAt(Math.max(0, Number(event.target.value)))} />
              </label>
              <label className="text-[8px]" style={{ color: 'var(--wa-text-muted)' }}>Fade in
                <input type="number" className="input mt-1 px-2 py-1.5 text-[10px]" min={0} max={10} step={0.25} value={bgmFadeIn} onChange={(event) => setBgmFadeIn(Math.max(0, Number(event.target.value)))} />
              </label>
              <label className="text-[8px]" style={{ color: 'var(--wa-text-muted)' }}>Fade out
                <input type="number" className="input mt-1 px-2 py-1.5 text-[10px]" min={0} max={10} step={0.25} value={bgmFadeOut} onChange={(event) => setBgmFadeOut(Math.max(0, Number(event.target.value)))} />
              </label>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--ui-border)' }}>
              <span className="text-[9px]" style={{ color: 'var(--wa-text)' }}>Ulangi lagu sampai video selesai</span>
              <label className="toggle shrink-0"><input type="checkbox" checked={bgmLoop} onChange={(event) => setBgmLoop(event.target.checked)} /><span className="toggle-track" /><span className="toggle-thumb" /></label>
            </div>
          </section>

          <section className="flex items-start gap-2 rounded-xl border p-3" style={{ background: 'rgba(251,191,36,0.055)', borderColor: 'rgba(251,191,36,0.2)' }}>
            <ShieldCheck size={14} className="mt-0.5 shrink-0" style={{ color: '#fbbf24' }} />
            <p className="text-[8.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
              Mengubah pitch bukan jaminan lolos klaim hak cipta. Gunakan musik milik sendiri, royalty-free, atau audio yang lisensinya mengizinkan penggunaan komersial.
            </p>
          </section>
        </>
      ) : null}

      {notice ? <div className="rounded-xl px-3 py-2 text-[9px]" style={{ background: 'rgba(37,211,102,0.08)', color: 'var(--wa-green)' }}>{notice}</div> : null}
      {error ? <div className="flex items-start gap-2 rounded-xl px-3 py-2 text-[9px] text-red-300" style={{ background: 'rgba(239,68,68,0.09)' }}><AlertCircle size={12} className="mt-0.5 shrink-0" />{error}</div> : null}
    </div>
  );
}
