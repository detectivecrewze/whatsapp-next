'use client';

import { create } from 'zustand';
import {
  BRAND_TEMPLATES,
  cloneBrandProps,
} from '@/lib/brandTemplates';
import type {
  BrandAudioSettings,
  BrandCopy,
  BrandMediaSlot,
  BrandPalette,
  BrandTemplateId,
  BrandTiming,
  BrandVideoProps,
} from '@/types/brand';

export type BrandEditorSection =
  | 'templates'
  | 'copy'
  | 'media'
  | 'style'
  | 'timing'
  | 'audio'
  | 'export';

interface BrandStudioStore extends BrandVideoProps {
  activeSection: BrandEditorSection;
  setActiveSection: (section: BrandEditorSection) => void;
  setTemplate: (templateId: BrandTemplateId) => void;
  updateCopy: (key: keyof BrandCopy, value: string) => void;
  updatePalette: (key: keyof BrandPalette, value: string) => void;
  updateMedia: (
    slot: 'heroMedia' | 'detailMedia',
    updates: Partial<BrandMediaSlot>,
  ) => void;
  updateTiming: (key: keyof BrandTiming, value: number) => void;
  updateAudio: (updates: Partial<BrandAudioSettings>) => void;
  resetTemplate: () => void;
}

const initial = cloneBrandProps(BRAND_TEMPLATES.editorial.defaults);

export const useBrandStudioStore = create<BrandStudioStore>()((set, get) => ({
  ...initial,
  activeSection: 'templates',
  setActiveSection: (activeSection) => set({ activeSection }),
  setTemplate: (templateId) =>
    set({
      ...cloneBrandProps(BRAND_TEMPLATES[templateId].defaults),
      activeSection: 'copy',
    }),
  updateCopy: (key, value) =>
    set((state) => ({ copy: { ...state.copy, [key]: value } })),
  updatePalette: (key, value) =>
    set((state) => ({ palette: { ...state.palette, [key]: value } })),
  updateMedia: (slot, updates) =>
    set((state) => ({ [slot]: { ...state[slot], ...updates } })),
  updateTiming: (key, value) =>
    set((state) => ({ timing: { ...state.timing, [key]: value } })),
  updateAudio: (updates) =>
    set((state) => ({ audio: { ...state.audio, ...updates } })),
  resetTemplate: () => {
    const templateId = get().templateId;
    set({ ...cloneBrandProps(BRAND_TEMPLATES[templateId].defaults) });
  },
}));

export function getBrandVideoProps(): BrandVideoProps {
  const state = useBrandStudioStore.getState();
  return {
    templateId: state.templateId,
    copy: state.copy,
    palette: state.palette,
    heroMedia: state.heroMedia,
    detailMedia: state.detailMedia,
    timing: state.timing,
    audio: state.audio,
  };
}

