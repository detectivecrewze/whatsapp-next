'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Search, Sparkles, Users } from 'lucide-react';
import {
  BRAND_TEMPLATE_PACK_CATEGORIES,
  BRAND_TEMPLATE_PACKS,
  type BrandTemplatePackCategory,
} from '@/lib/brandTemplatePacks';
import { useBrandStudioStore } from '@/store/useBrandStudioStore';
import styles from '@/app/brand/brand.module.css';

type PackFilter = 'all' | BrandTemplatePackCategory;

export default function BrandTemplatePackFields() {
  const [category, setCategory] = useState<PackFilter>('all');
  const [search, setSearch] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [productName, setProductName] = useState('Digital Gift');
  const activeTemplatePackId = useBrandStudioStore((state) => state.activeTemplatePackId);
  const applyTemplatePack = useBrandStudioStore((state) => state.applyTemplatePack);
  const setActiveSection = useBrandStudioStore((state) => state.setActiveSection);

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
      <div className={styles.templatePackIntro}>
        <span><Sparkles size={18} /></span>
        <div>
          <strong>12 cerita siap produksi</strong>
          <p>Setiap pack mengatur naskah, motion, warna, timing, dan SFX tanpa menghapus media atau backsound Anda.</p>
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
        <div className={styles.templatePackApplied}>
          <CheckCircle2 size={15} />
          <div>
            <strong>Template sudah masuk ke preview</strong>
            <small>Media dan musik sebelumnya tetap dipertahankan.</small>
          </div>
          <button type="button" onClick={() => setActiveSection('copy')}>Edit naskah</button>
        </div>
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
                  style={{ background: pack.palette.background, color: pack.palette.text }}
                >
                  <span style={{ color: pack.palette.muted }}>{pack.copy.eyebrow}</span>
                  <strong>{pack.copy.hookTitle.replace('{nama}', recipientName.trim() || 'dia')}</strong>
                  <em style={{ color: pack.palette.accent }}>
                    {pack.copy.hookAccent.replace('{nama}', recipientName.trim() || 'dia')}
                  </em>
                  <i style={{ background: pack.palette.accent }} />
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
