'use client';

import type { ChangeEvent, ReactNode } from 'react';
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
  WandSparkles,
} from 'lucide-react';
import {
  BRAND_HOOK_VARIANTS,
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
import type { BrandCopy, BrandMediaSlot, BrandPalette, BrandTiming } from '@/types/brand';
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
  { id: 'media', label: 'Media', description: 'Foto atau video produk', icon: ImageIcon },
  { id: 'style', label: 'Warna', description: 'Palet visual brand', icon: Palette },
  { id: 'timing', label: 'Timing', description: 'Durasi setiap scene', icon: Clock3 },
  { id: 'audio', label: 'Audio', description: 'Backsound dan SFX', icon: Music2 },
  { id: 'export', label: 'Export', description: 'Render MP4 vertikal', icon: Download },
];

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
  const updateCopy = useBrandStudioStore((state) => state.updateCopy);
  const fields: Array<{ key: keyof BrandCopy; label: string; multiline?: boolean }> = [
    { key: 'eyebrow', label: 'Brand kecil di atas' },
    { key: 'hookTitle', label: 'Hook utama' },
    { key: 'hookAccent', label: 'Hook aksen / italic' },
    { key: 'storyTitle', label: 'Judul cerita' },
    { key: 'storyBody', label: 'Penjelasan singkat', multiline: true },
    { key: 'productName', label: 'Nama produk digital' },
    { key: 'productDetail', label: 'Detail produk' },
    { key: 'cta', label: 'Call to action' },
    { key: 'domain', label: 'Domain / username' },
  ];

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
  const updateTiming = useBrandStudioStore((state) => state.updateTiming);
  const rows: Array<{ key: keyof BrandTiming; label: string; min: number; max: number }> = [
    { key: 'hookSeconds', label: 'Hook awal', min: 2, max: 6 },
    { key: 'productSeconds', label: 'Product reveal', min: 3, max: 10 },
    { key: 'storySeconds', label: 'Cerita dan benefit', min: 3, max: 9 },
    { key: 'outroSeconds', label: 'CTA akhir', min: 2.5, max: 7 },
  ];
  const total = Object.values(timing).reduce((sum, value) => sum + value, 0);

  return (
    <div className={styles.sectionStack}>
      <div className={styles.durationSummary}>
        <Clock3 size={19} />
        <div>
          <span>Total durasi</span>
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
      <Field label="SFX pergantian scene">
        <select
          className={styles.select}
          value={audio.transitionSfx}
          onChange={(event) => updateAudio({ transitionSfx: event.target.value as typeof audio.transitionSfx })}
        >
          <option value="none">Tanpa SFX</option>
          <option value="whoosh">Soft whoosh</option>
          <option value="page-turn">Page turn</option>
          <option value="ding">Soft ding</option>
        </select>
      </Field>
      <Field label={`Volume SFX — ${Math.round(audio.transitionSfxVolume * 100)}%`}>
        <input
          className={styles.slider}
          type="range"
          min={0}
          max={0.4}
          step={0.01}
          value={audio.transitionSfxVolume}
          onChange={(event) => updateAudio({ transitionSfxVolume: Number(event.target.value) })}
        />
      </Field>
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
  if (section === 'media') return <MediaFields />;
  if (section === 'style') return <PaletteFields />;
  if (section === 'timing') return <TimingFields />;
  if (section === 'audio') return <AudioFields />;
  return <ExportFields />;
}

export default function BrandStudio() {
  const state = useBrandStudioStore();
  const activeMeta = SECTIONS.find((section) => section.id === state.activeSection) ?? SECTIONS[0];
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
            <small>Brand Video</small>
          </span>
        </div>

        <nav className={styles.modeSwitch} aria-label="Pilih studio">
          <Link href="/" className={styles.modeLink}>WhatsApp Story</Link>
          <span className={styles.modeActive}>Brand Video</span>
        </nav>

        <div className={styles.topActions}>
          <button type="button" onClick={resetCurrentTemplate} title="Reset template">
            <RefreshCw size={15} /> Reset
          </button>
          <button type="button" className={styles.exportShortcut} onClick={() => state.setActiveSection('export')}>
            <Film size={15} /> Export MP4
          </button>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.navigation}>
          <Link href="/" className={styles.backLink}><ArrowLeft size={15} /> Kembali ke WhatsApp</Link>
          <div className={styles.projectCard}>
            <span>{currentTemplate.badge}</span>
            <strong>{state.copy.productName}</strong>
            <small>{currentTemplate.name}</small>
          </div>
          <nav className={styles.sectionNav}>
            {SECTIONS.map((section) => {
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
                    <small>{section.description}</small>
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
              <strong>{currentTemplate.name}</strong>
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
                key={state.templateId}
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
            <span><Play size={14} /> Gunakan kontrol di preview untuk mengecek timing dan audio.</span>
            <small>Perubahan langsung diterapkan.</small>
          </div>
        </section>

        <aside className={styles.inspector}>
          <header className={styles.inspectorHeader}>
            <span className={styles.inspectorIcon}><ActiveIcon size={18} /></span>
            <div>
              <span>BRAND VIDEO</span>
              <h1>{activeMeta.label}</h1>
              <p>{activeMeta.description}</p>
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

