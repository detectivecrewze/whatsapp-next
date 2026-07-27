'use client';

import { create } from 'zustand';
import { CloudPreset } from '@/types';

const WORKER_URL = 'https://wa-templates-worker.aldoramadhan16.workers.dev';
const PASSCODE = 'loves2026';

interface CloudStore {
  templates: Record<string, CloudPreset>;
  activeId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveId: (id: string | null) => void;
  fetchTemplates: () => Promise<void>;
  saveTemplate: (id: string, preset: CloudPreset) => Promise<void>;
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
      const res = await fetch('/api/presets', {
        headers: { 'X-Team-Passcode': PASSCODE },
      });
      if (!res.ok) throw new Error('Gagal memuat preset dari cloud');
      const data = await res.json();
      set({ templates: data.templates ?? {} });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  saveTemplate: async (id, preset) => {
    const { templates } = get();
    const newTemplates = { ...templates, [id]: preset };
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Team-Passcode': PASSCODE,
        },
        body: JSON.stringify({ templates: newTemplates }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan preset ke cloud');
      set({ templates: newTemplates, activeId: id });
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTemplate: async (id) => {
    const { templates } = get();
    const newTemplates = { ...templates };
    delete newTemplates[id];
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Team-Passcode': PASSCODE,
        },
        body: JSON.stringify({ templates: newTemplates }),
      });
      if (!res.ok) throw new Error('Gagal menghapus preset');
      set({ templates: newTemplates, activeId: null });
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
}));
