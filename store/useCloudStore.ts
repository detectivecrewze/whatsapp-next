'use client';

import { create } from 'zustand';
import { CloudPreset } from '@/types';

const PASSCODE = 'loves2026';
const LOCAL_STORAGE_KEY = 'wa_cloud_presets';

function readLocalTemplates(): Record<string, CloudPreset> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLocalTemplates(templates: Record<string, CloudPreset>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates));
  } catch {}
}

async function readError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));
  return data.error || fallback;
}

interface CloudStore {
  templates: Record<string, CloudPreset>;
  activeId: string | null;
  isLoading: boolean;
  error: string | null;
  setActiveId: (id: string | null) => void;
  fetchTemplates: () => Promise<void>;
  saveTemplate: (id: string, preset: CloudPreset) => Promise<void>;
  renameTemplate: (id: string, name: string) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useCloudStore = create<CloudStore>()((set, get) => ({
  templates: {},
  activeId: null,
  isLoading: false,
  error: null,

  setActiveId: (id) => set({ activeId: id }),

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/presets', {
        headers: { 'X-Team-Passcode': PASSCODE },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(await readError(response, 'Gagal memuat project dari cloud'));
      const data = await response.json();
      // Pertahankan cadangan browser jika worker lama pernah menimpa sebagian
      // koleksi. Versi cloud tetap menang bila ID yang sama sudah diperbarui.
      const templates = { ...readLocalTemplates(), ...(data.templates ?? {}) };
      writeLocalTemplates(templates);
      set({ templates });
    } catch (error) {
      const localTemplates = readLocalTemplates();
      set({
        templates: Object.keys(localTemplates).length ? localTemplates : get().templates,
        error: `${(error as Error).message}. Menampilkan cadangan browser jika tersedia.`,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  saveTemplate: async (id, preset) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Team-Passcode': PASSCODE,
        },
        body: JSON.stringify({ templates: { [id]: preset } }),
      });
      if (!response.ok) throw new Error(await readError(response, 'Gagal menyimpan project ke cloud'));

      const data = await response.json();
      const templates = data.templates ?? { ...get().templates, [id]: preset };
      writeLocalTemplates(templates);
      set({ templates, activeId: id });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  renameTemplate: async (id, name) => {
    const current = get().templates[id];
    if (!current) throw new Error('Project tidak ditemukan.');
    const renamed = { ...current, name: name.trim(), updatedAt: Date.now() };
    await get().saveTemplate(id, renamed);
  },

  deleteTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/presets', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Team-Passcode': PASSCODE,
        },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error(await readError(response, 'Gagal menghapus project'));

      const data = await response.json();
      const templates = data.templates ?? {};
      writeLocalTemplates(templates);
      set((state) => ({
        templates,
        activeId: state.activeId === id ? null : state.activeId,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
