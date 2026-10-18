'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Cloud, Download, Loader2, Pencil, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { newId } from '@/lib/utils';
import { getBrandVideoProps, useBrandStudioStore } from '@/store/useBrandStudioStore';
import type { BrandCloudPreset, BrandVideoProps } from '@/types/brand';
import styles from '@/app/brand/brand.module.css';

type BrandProjectsResponse = { projects?: Record<string, BrandCloudPreset>; error?: string };

async function responseJson(response: Response): Promise<BrandProjectsResponse> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Permintaan gagal (${response.status})`);
  return data;
}

async function uploadTemporaryMedia(source: string, cache: Map<string, string>) {
  if (!source.startsWith('blob:') && !source.startsWith('data:')) return source;
  const existing = cache.get(source);
  if (existing) return existing;

  const blobResponse = await fetch(source);
  if (!blobResponse.ok) throw new Error('Media lokal tidak bisa dibaca untuk disimpan.');
  const blob = await blobResponse.blob();
  if (!blob.type.startsWith('image/') && !blob.type.startsWith('video/') && !blob.type.startsWith('audio/')) {
    throw new Error('Format media tidak didukung untuk cloud save.');
  }
  if (blob.size > 50 * 1024 * 1024) throw new Error('Media lebih dari 50 MB; kompres file lalu simpan kembali.');

  const response = await fetch('/api/upload-brand-media', {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'application/octet-stream' },
    body: blob,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Upload media ke cloud gagal.');
  cache.set(source, result.url);
  return result.url as string;
}

async function persistProjectMedia(data: BrandVideoProps): Promise<BrandVideoProps> {
  const cache = new Map<string, string>();
  const next = structuredClone(data);
  next.hookBackground.media.src = await uploadTemporaryMedia(next.hookBackground.media.src, cache);
  next.heroMedia.src = await uploadTemporaryMedia(next.heroMedia.src, cache);
  next.detailMedia.src = await uploadTemporaryMedia(next.detailMedia.src, cache);
  next.audio.musicSrc = await uploadTemporaryMedia(next.audio.musicSrc, cache);
  return next;
}

function formatUpdatedAt(value: number) {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function currentTimestamp() {
  return Date.now();
}

export default function BrandCloudSection() {
  const [projects, setProjects] = useState<Record<string, BrandCloudPreset>>({});
  const activeId = useBrandStudioStore((state) => state.activeCloudProjectId);
  const setActiveId = useBrandStudioStore((state) => state.setActiveCloudProjectId);
  const [saveName, setSaveName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/brand-presets', { cache: 'no-store' });
      const data = await responseJson(response);
      setProjects(data.projects ?? {});
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Project cloud gagal dimuat.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void refreshProjects(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [refreshProjects]);

  async function saveProject(asNew: boolean) {
    const current = activeId ? projects[activeId] : null;
    const name = (asNew ? saveName : current?.name || saveName).trim();
    if (!name) {
      setError('Beri nama project sebelum menyimpan.');
      return;
    }

    setIsSaving(true);
    setError('');
    setNotice('Menyiapkan media dan menyimpan project…');
    try {
      const data = await persistProjectMedia(getBrandVideoProps());
      const editorState = useBrandStudioStore.getState();
      const id = !asNew && current ? current.id : newId('brand');
      const project: BrandCloudPreset = {
        id,
        name,
        updatedAt: currentTimestamp(),
        schemaVersion: 1,
        data,
        contentGoal: editorState.contentGoal,
        activeTemplatePackId: editorState.activeTemplatePackId,
        activeHookPresetId: editorState.activeHookPresetId,
        showSafeArea: editorState.showSafeArea,
      };
      const response = await fetch('/api/brand-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      const result = await responseJson(response);
      setProjects(result.projects ?? { ...projects, [id]: project });
      setActiveId(id);
      setSaveName('');
      setNotice(`“${name}” tersimpan di cloud.`);
    } catch (caughtError) {
      setNotice('');
      setError(caughtError instanceof Error ? caughtError.message : 'Gagal menyimpan project.');
    } finally {
      setIsSaving(false);
    }
  }

  function loadProject(project: BrandCloudPreset) {
    useBrandStudioStore.setState({
      ...project.data,
      contentGoal: project.contentGoal ?? 'retention',
      activeTemplatePackId: project.activeTemplatePackId ?? null,
      activeHookPresetId: project.activeHookPresetId ?? null,
      showSafeArea: project.showSafeArea ?? false,
      activeSection: 'copy',
      activeCloudProjectId: project.id,
      variants: [],
    });
    setActiveId(project.id);
    setNotice(`“${project.name}” dimuat. Lanjutkan edit, lalu tekan Simpan perubahan.`);
    setError('');
  }

  async function renameProject(project: BrandCloudPreset) {
    const name = editingName.trim();
    if (!name || name === project.name) {
      setEditingId(null);
      return;
    }
    const renamed = { ...project, name, updatedAt: currentTimestamp() };
    try {
      const response = await fetch('/api/brand-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: renamed }),
      });
      const result = await responseJson(response);
      setProjects(result.projects ?? { ...projects, [project.id]: renamed });
      setEditingId(null);
      setNotice('Nama project diperbarui.');
      setError('');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Gagal mengganti nama project.');
    }
  }

  async function deleteProject(project: BrandCloudPreset) {
    if (!window.confirm(`Hapus project “${project.name}” dari cloud?`)) return;
    try {
      const response = await fetch('/api/brand-presets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: project.id }),
      });
      const result = await responseJson(response);
      setProjects(result.projects ?? {});
      if (activeId === project.id) setActiveId(null);
      setNotice(`“${project.name}” dihapus dari cloud.`);
      setError('');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Gagal menghapus project.');
    }
  }

  const orderedProjects = Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className={styles.sectionStack}>
      <section className={styles.brandCloudHero}>
        <span><Cloud size={19} /></span>
        <div>
          <strong>Project Brand Studio tersimpan di cloud</strong>
          <p>Simpan seluruh teks, beat, visual, timing, audio, dan GIF. Buka lagi kapan saja untuk melanjutkan edit.</p>
        </div>
      </section>

      <section className={styles.mediaCard}>
        <div className={styles.brandCloudSectionTitle}>
          <div><strong>{activeId && projects[activeId] ? 'Project yang sedang dibuka' : 'Simpan sebagai project baru'}</strong>
            <small>{activeId && projects[activeId] ? projects[activeId].name : 'Beri nama agar mudah ditemukan nanti.'}</small>
          </div>
          {activeId ? <span className={styles.brandCloudActiveBadge}>Aktif</span> : null}
        </div>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Nama project baru / salinan</span>
          <input className={styles.input} value={saveName} onChange={(event) => setSaveName(event.target.value)} placeholder="Contoh: Anniversary Nadin · versi 2" />
        </label>

        <div className={styles.brandCloudActions}>
          {activeId && projects[activeId] ? (
            <button type="button" className={styles.brandCloudPrimary} disabled={isSaving} onClick={() => void saveProject(false)}>
              {isSaving ? <Loader2 size={14} className={styles.brandCloudSpinner} /> : <Save size={14} />} Simpan perubahan
            </button>
          ) : null}
          <button type="button" className={styles.brandCloudSecondary} disabled={isSaving || !saveName.trim()} onClick={() => void saveProject(true)}>
            {isSaving ? <Loader2 size={14} className={styles.brandCloudSpinner} /> : <Cloud size={14} />} Simpan sebagai baru
          </button>
        </div>
        <p className={styles.brandCloudFootnote}>File gambar, video, atau backsound yang masih lokal akan ikut diunggah saat disimpan (maksimal 50 MB per file).</p>
      </section>

      <section className={styles.mediaCard}>
        <div className={styles.brandCloudSectionTitle}>
          <div><strong>Project cloud</strong><small>{orderedProjects.length} project tersimpan</small></div>
          <button type="button" className={styles.clearButton} onClick={() => void refreshProjects()} disabled={isLoading} title="Muat ulang daftar">
            {isLoading ? <Loader2 size={14} className={styles.brandCloudSpinner} /> : <RefreshCw size={14} />}
          </button>
        </div>

        {error ? <p className={styles.brandCloudError}>{error}</p> : null}
        {notice ? <p className={styles.brandCloudNotice}>{notice}</p> : null}
        {isLoading ? <div className={styles.brandCloudEmpty}><Loader2 size={18} className={styles.brandCloudSpinner} /> Memuat project…</div> : null}
        {!isLoading && orderedProjects.length === 0 ? (
          <div className={styles.brandCloudEmpty}><Cloud size={20} /><span>Belum ada project tersimpan. Simpan project pertama di atas.</span></div>
        ) : null}
        <div className={styles.brandCloudList}>
          {orderedProjects.map((project) => (
            <article key={project.id} className={`${styles.brandCloudProject} ${activeId === project.id ? styles.brandCloudProjectActive : ''}`}>
              <div className={styles.brandCloudProjectInfo}>
                {editingId === project.id ? (
                  <div className={styles.brandCloudRename}>
                    <input className={styles.input} value={editingName} autoFocus onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void renameProject(project); if (event.key === 'Escape') setEditingId(null); }} />
                    <button type="button" onClick={() => void renameProject(project)} aria-label="Simpan nama"><Check size={14} /></button>
                    <button type="button" onClick={() => setEditingId(null)} aria-label="Batal"><X size={14} /></button>
                  </div>
                ) : <strong title={project.name}>{project.name}</strong>}
                <small>{project.data.outputMode === 'hook' ? 'Hook Maker' : 'Full Video'} · {project.data.templateId} · {formatUpdatedAt(project.updatedAt)}</small>
              </div>
              <div className={styles.brandCloudProjectActions}>
                <button type="button" onClick={() => loadProject(project)} title="Muat project"><Download size={14} /> Buka</button>
                <button type="button" onClick={() => { setEditingId(project.id); setEditingName(project.name); }} title="Ganti nama"><Pencil size={14} /></button>
                <button type="button" onClick={() => void deleteProject(project)} title="Hapus project"><Trash2 size={14} /></button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
