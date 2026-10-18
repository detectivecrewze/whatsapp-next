'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, PencilLine, Search, Sparkles, Users } from 'lucide-react';
import {
  BRAND_TEMPLATE_PACK_CATEGORIES,
  BRAND_TEMPLATE_PACKS,
  type BrandTemplatePackCategory,
} from '@/lib/brandTemplatePacks';
import { BRAND_TEMPLATE_LIST } from '@/lib/brandTemplates';
import { useBrandStudioStore } from '@/store/useBrandStudioStore';
import {
  BRAND_BEAT_MAX_SECONDS,
  BRAND_BEAT_MIN_SECONDS,
  resolveBrandHookBeatDurations,
  resolveBrandHookEnabledBeats,
} from '@/lib/brandBeatTiming';
import type { BrandCopy } from '@/types/brand';
import styles from '@/app/brand/brand.module.css';

type PackFilter = 'all' | BrandTemplatePackCategory;

export default function BrandTemplatePackFields() {
  const [category, setCategory] = useState<PackFilter>('all');
  const [search, setSearch] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [productName, setProductName] = useState('Digital Gift');
  const activeTemplatePackId = useBrandStudioStore((state) => state.activeTemplatePackId);
  const templateId = useBrandStudioStore((state) => state.templateId);
  const copy = useBrandStudioStore((state) => state.copy);
  const hook = useBrandStudioStore((state) => state.hook);
  const timing = useBrandStudioStore((state) => state.timing);
  const palette = useBrandStudioStore((state) => state.palette);
  const applyTemplatePack = useBrandStudioStore((state) => state.applyTemplatePack);
  const applyVisualTemplate = useBrandStudioStore((state) => state.applyVisualTemplate);
  const updateCopy = useBrandStudioStore((state) => state.updateCopy);
  const updateBeatDuration = useBrandStudioStore((state) => state.updateBeatDuration);
  const setBeatEnabled = useBrandStudioStore((state) => state.setBeatEnabled);
  const setActiveSection = useBrandStudioStore((state) => state.setActiveSection);
  const beatDurations = resolveBrandHookBeatDurations(hook.beatDurations, timing.hookSeconds);
  const enabledBeats = resolveBrandHookEnabledBeats(hook.enabledBeats);
  const editableBeats: Array<{
    label: string;
    mainKey: keyof BrandCopy;
    accentKey: keyof BrandCopy;
  }> = [
    { label: 'Beat 1 · Hook', mainKey: 'hookTitle', accentKey: 'hookAccent' },
    { label: 'Beat 2 · Build-up', mainKey: 'hookBridge', accentKey: 'hookBridgeAccent' },
    { label: 'Beat 3 · Reveal', mainKey: 'hookReveal', accentKey: 'hookRevealAccent' },
  ];

  const filteredPacks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return BRAND_TEMPLATE_PACKS.filter((pack) => {
      const matchesCategory = category === 'all' || pack.category === category;
      if (!matchesCategory) return false;
      if (!normalizedSearch) return true;
      const searchable = [
        pack.name,
        pack.categoryLabel,
        pack.description,
        pack.badge,
        ...pack.tags,
      ].join(' ').toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [category, search]);

  return (
    <div className={styles.sectionStack}>
      <div className={styles.templatePackVisualPicker}>
        <div className={styles.templatePackVisualPickerHeading}>
          <span>1</span>
          <div>
            <strong>Pilih visual video</strong>
            <small>Warna, font, motion, dan background berubah. Cerita serta durasi Template Pack tetap aman.</small>
          </div>
        </div>
        <div className={styles.templatePackVisualList}>
          {BRAND_TEMPLATE_LIST.map((template) => {
            const active = template.id === templateId;
            return (
              <button
                type="button"
                key={template.id}
                className={`${styles.templatePackVisualOption} ${active ? styles.templatePackVisualOptionActive : ''}`}
                onClick={() => applyVisualTemplate(template.id)}
              >
                <span
                  className={styles.templatePackVisualSwatch}
                  style={{ background: template.defaults.palette.background }}
                >
                  <i style={{ color: template.defaults.palette.text }}>Aa</i>
                  <b style={{ background: template.defaults.palette.accent }} />
                </span>
                <span>
                  <strong>{template.name}</strong>
                  <small>{template.category}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className={styles.templatePackIntro}>
        <span><Sparkles size={18} /></span>
        <div>
          <strong>2. Pilih cerita siap produksi</strong>
          <p>Setiap pack mengatur naskah, struktur 3 beat, durasi, dan SFX tanpa menimpa visual yang kamu pilih di atas.</p>
        </div>
      </div>

      <div className={styles.templatePersonalization}>
        <div className={styles.templatePersonalizationHeading}>
          <Users size={15} />
          <span>
            <strong>Personalisasi sebelum dipakai</strong>
            <small>Boleh dikosongkan dan tetap bisa diedit dari menu Naskah.</small>
          </span>
        </div>
        <label>
          <span>Nama penerima</span>
          <input
            value={recipientName}
            placeholder="Contoh: Nadin"
            onChange={(event) => setRecipientName(event.target.value)}
          />
        </label>
        <label>
          <span>Nama produk</span>
          <input
            value={productName}
            placeholder="Contoh: Anniversary Mixtape"
            onChange={(event) => setProductName(event.target.value)}
          />
        </label>
      </div>

      {activeTemplatePackId ? (
        <>
          <div className={styles.templatePackApplied}>
            <CheckCircle2 size={15} />
            <div>
              <strong>Template sudah masuk ke preview</strong>
              <small>Teks dan durasi sekarang bebas kamu ubah.</small>
            </div>
            <button type="button" onClick={() => setActiveSection('copy')}>Editor lengkap</button>
          </div>
          <details className={styles.templatePackQuickEditor} open>
            <summary>
              <span><PencilLine size={14} /></span>
              <div>
                <strong>Edit teks & durasi</strong>
                <small>Perubahan langsung terlihat di preview dan ikut saat export.</small>
              </div>
            </summary>
            <div className={styles.templatePackQuickEditorBody}>
              {editableBeats.map((beat, index) => {
                const isOptionalBeat = index > 0;
                const isEnabled = enabledBeats[index];

                return (
                <section
                  className={`${styles.templatePackBeatEditor} ${!isEnabled ? styles.templatePackBeatEditorDisabled : ''}`}
                  key={beat.label}
                >
                  <header>
                    <strong>{beat.label}</strong>
                    {isOptionalBeat ? (
                      <label className={styles.templatePackBeatToggle}>
                        <span>Aktif</span>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          aria-label={`Aktifkan ${beat.label}`}
                          onChange={(event) => setBeatEnabled(index as 1 | 2, event.target.checked)}
                        />
                      </label>
                    ) : (
                      <span>Wajib</span>
                    )}
                  </header>
                  {!isEnabled ? <p className={styles.templatePackBeatOffNote}>Dimatikan · tidak tampil dan tidak memakai durasi.</p> : null}
                  <label>
                    <span>Teks utama</span>
                    <textarea
                      rows={2}
                      value={copy[beat.mainKey] ?? ''}
                      disabled={!isEnabled}
                      onChange={(event) => updateCopy(beat.mainKey, event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Highlight warna · opsional</span>
                    <textarea
                      rows={2}
                      value={copy[beat.accentKey] ?? ''}
                      disabled={!isEnabled}
                      onChange={(event) => updateCopy(beat.accentKey, event.target.value)}
                    />
                  </label>
                  <label className={styles.templatePackBeatDuration}>
                    <span><Clock3 size={12} /> Lama tampil</span>
                    <input
                      className={styles.slider}
                      type="range"
                      min={BRAND_BEAT_MIN_SECONDS}
                      max={BRAND_BEAT_MAX_SECONDS}
                      step={0.1}
                      value={beatDurations[index]}
                      disabled={!isEnabled}
                      onChange={(event) => updateBeatDuration(index as 0 | 1 | 2, Number(event.target.value))}
                    />
                  </label>
                </section>
                );
              })}
              <div className={styles.templatePackDurationTotal}>
                <span>Total durasi hook</span>
                <strong>{timing.hookSeconds.toFixed(1)} detik</strong>
              </div>
            </div>
          </details>
        </>
      ) : null}

      <label className={styles.templatePackSearch}>
        <Search size={14} />
        <input
          value={search}
          placeholder="Cari LDR, wisuda, komedi…"
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <div className={styles.templatePackFilters}>
        {BRAND_TEMPLATE_PACK_CATEGORIES.map((entry) => (
          <button
            type="button"
            key={entry.id}
            className={category === entry.id ? styles.templatePackFilterActive : ''}
            onClick={() => setCategory(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className={styles.templatePackCount}>
        <strong>{filteredPacks.length} template</strong>
        <span>Pilih satu untuk melihat hasilnya di preview.</span>
      </div>

      {filteredPacks.length ? (
        <div className={styles.templatePackList}>
          {filteredPacks.map((pack) => {
            const active = activeTemplatePackId === pack.id;
            return (
              <article
                key={pack.id}
                className={`${styles.templatePackCard} ${active ? styles.templatePackCardActive : ''}`}
              >
                <div
                  className={styles.templatePackVisual}
                  style={{ background: palette.background, color: palette.text }}
                >
                  <span style={{ color: palette.muted }}>{pack.copy.eyebrow}</span>
                  <strong>{pack.copy.hookTitle.replace('{nama}', recipientName.trim() || 'dia')}</strong>
                  <em style={{ color: palette.accent }}>
                    {pack.copy.hookAccent.replace('{nama}', recipientName.trim() || 'dia')}
                  </em>
                  <i style={{ background: palette.accent }} />
                </div>
                <div className={styles.templatePackBody}>
                  <header>
                    <span>{pack.categoryLabel}</span>
                    <small>{pack.beats} beat · {pack.format}</small>
                  </header>
                  <strong>{pack.name}</strong>
                  <p>{pack.description}</p>
                  <div className={styles.templatePackTags}>
                    {pack.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <button
                    type="button"
                    onClick={() => applyTemplatePack(pack.id, { recipientName, productName })}
                  >
                    {active ? <CheckCircle2 size={13} /> : <Sparkles size={13} />}
                    {active ? 'Sudah dipakai' : 'Gunakan template'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.templatePackEmpty}>
          <strong>Template tidak ditemukan</strong>
          <p>Coba kata lain atau pilih kategori Semua.</p>
        </div>
      )}
    </div>
  );
}
