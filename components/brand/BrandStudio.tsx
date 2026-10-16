'use client';

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { Player } from '@remotion/player';
import {
  ArrowLeft,
  Clock3,
  Download,
  Film,
  Image as ImageIcon,
  LayoutTemplate,
  Music2,
  Palette,
  Play,
  RefreshCw,
  Sparkles,
  Type,
  Upload,
  Video,
  Volume2,
  WandSparkles,
} from 'lucide-react';
import {
  BRAND_HOOK_VARIANTS,
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
  BrandHookAlignment,
  BrandHookExit,
  BrandHookMotion,
  BrandHookTypography,
  BrandMediaSlot,
  BrandOutputMode,
  BrandPalette,
  BrandTiming,
  BrandTransitionSfx,
} from '@/types/brand';
import BrandExportButton from './BrandExportButton';
import styles from '@/app/brand/brand.module.css';

const SECTIONS: Array<{
  id: BrandEditorSection;
  label: string;
  description: string;
  icon: typeof LayoutTemplate;
}> = [
  { id: 'templates', label: 'Template', description: 'Pilih gaya campaign', icon: LayoutTemplate },
  { id: 'copy', label: 'Naskah', description: 'Hook, cerita, dan CTA', icon: Type },
  { id: 'effects', label: 'Efek', description: 'Transisi dan SFX', icon: WandSparkles },
  { id: 'media', label: 'Media', description: 'Foto atau video produk', icon: ImageIcon },
  { id: 'style', label: 'Warna', description: 'Palet visual brand', icon: Palette },
  { id: 'timing', label: 'Timing', description: 'Durasi setiap scene', icon: Clock3 },
  { id: 'audio', label: 'Audio', description: 'Backsound dan SFX', icon: Music2 },
  { id: 'export', label: 'Export', description: 'Render MP4 vertikal', icon: Download },
];

function sectionDescription(section: BrandEditorSection, outputMode: BrandOutputMode) {
  if (outputMode === 'campaign') {
    return SECTIONS.find((entry) => entry.id === section)?.description ?? '';
  }

  if (section === 'templates') return 'Pilih gaya visual hook';
  if (section === 'copy') return 'Teks, tipografi, dan animasi';
  if (section === 'effects') return 'Transisi masuk, keluar, dan SFX';
  if (section === 'style') return 'Warna hook sesuai brand';
  if (section === 'timing') return 'Durasi klip pembuka';
  if (section === 'audio') return 'Backsound dan SFX pembuka';
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
  const outputMode = useBrandStudioStore((state) => state.outputMode);
  const updateCopy = useBrandStudioStore((state) => state.updateCopy);
  const updateHook = useBrandStudioStore((state) => state.updateHook);
  const hookFields: Array<{ key: keyof BrandCopy; label: string; multiline?: boolean }> = [
    { key: 'eyebrow', label: 'Brand kecil di atas' },
    { key: 'hookTitle', label: 'Hook utama' },
    { key: 'hookAccent', label: 'Hook aksen / italic' },
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
          <strong>Variasi hook siap pakai</strong>
          <p>Pilih inspirasi, lalu edit lagi supaya sesuai produknya.</p>
        </div>
      </div>
      <div className={styles.hookGrid}>
        {BRAND_HOOK_VARIANTS.map((variant) => (
          <button
            type="button"
            key={variant.label}
            className={styles.hookChip}
            onClick={() => {
              updateCopy('hookTitle', variant.title);
              updateCopy('hookAccent', variant.accent);
            }}
          >
            {variant.label}
          </button>
        ))}
      </div>
      <div className={styles.divider} />
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
                <option value="editorial">Editorial</option>
                <option value="bold">Bold / Viral</option>
                <option value="clean">Clean</option>
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

function MediaFields() {
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

function PaletteFields() {
  const palette = useBrandStudioStore((state) => state.palette);
  const updatePalette = useBrandStudioStore((state) => state.updatePalette);
  const entries: Array<{ key: keyof BrandPalette; label: string }> = [
    { key: 'background', label: 'Background' },
    { key: 'surface', label: 'Kartu media' },
    { key: 'text', label: 'Teks utama' },
    { key: 'accent', label: 'Aksen' },
    { key: 'muted', label: 'Teks sekunder' },
  ];

  return (
    <div className={styles.sectionStack}>
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
  const outputMode = useBrandStudioStore((state) => state.outputMode);
  const updateTiming = useBrandStudioStore((state) => state.updateTiming);
  const campaignRows: Array<{ key: keyof BrandTiming; label: string; min: number; max: number }> = [
    { key: 'hookSeconds', label: 'Hook awal', min: 2, max: 6 },
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
        <Field label="Transisi masuk">
          <select
            className={styles.select}
            value={hook.motion}
            onChange={(event) => updateHook('motion', event.target.value as BrandHookMotion)}
          >
            <option value="fade">Fade</option>
            <option value="soft">Soft rise</option>
            <option value="pop">Pop</option>
            <option value="slide">Slide</option>
            <option value="blur">Blur reveal</option>
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

  function handleMusic(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (audio.musicSrc.startsWith('blob:')) URL.revokeObjectURL(audio.musicSrc);
    updateAudio({ musicSrc: URL.createObjectURL(file), musicName: file.name });
  }

  return (
    <div className={styles.sectionStack}>
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
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              if (audio.musicSrc.startsWith('blob:')) URL.revokeObjectURL(audio.musicSrc);
              updateAudio({ musicSrc: '', musicName: '' });
            }}
          >
            Hapus backsound
          </button>
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
      <div className={styles.infoNote}>SFX dan transisi sekarang tersedia di menu Efek.</div>
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

function ExportFields() {
  const props = getBrandVideoProps();
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
      <p className={styles.exportHint}>
        Export dijalankan langsung di browser. Jangan menutup tab sampai proses selesai.
      </p>
    </div>
  );
}

function InspectorContent({ section }: { section: BrandEditorSection }) {
  if (section === 'templates') return <TemplateFields />;
  if (section === 'copy') return <CopyFields />;
  if (section === 'effects') return <EffectsFields />;
  if (section === 'media') return <MediaFields />;
  if (section === 'style') return <PaletteFields />;
  if (section === 'timing') return <TimingFields />;
  if (section === 'audio') return <AudioFields />;
  return <ExportFields />;
}

export default function BrandStudio() {
  const state = useBrandStudioStore();
  const visibleSections = state.outputMode === 'hook'
    ? SECTIONS.filter((section) => section.id !== 'media')
    : SECTIONS;
  const activeMeta = visibleSections.find((section) => section.id === state.activeSection) ?? visibleSections[0];
  const ActiveIcon = activeMeta.icon;
  const currentTemplate = BRAND_TEMPLATE_LIST.find((template) => template.id === state.templateId)!;
  const props = getBrandVideoProps();
  const durationInFrames = getBrandDurationInFrames(props);

  function resetCurrentTemplate() {
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

