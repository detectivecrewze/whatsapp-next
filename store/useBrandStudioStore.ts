'use client';

import { create } from 'zustand';
import {
  BRAND_TEMPLATES,
  cloneBrandProps,
} from '@/lib/brandTemplates';
import type {
  BrandAudioSettings,
  BrandCopy,
  BrandHookSettings,
  BrandMediaSlot,
  BrandOutputMode,
  BrandPalette,
  BrandTemplateId,
  BrandTiming,
  BrandVideoProps,
} from '@/types/brand';

export type BrandEditorSection =
  | 'templates'
  | 'copy'
  | 'effects'
  | 'media'
  | 'style'
  | 'timing'
  | 'audio'
  | 'export';

interface BrandStudioStore extends BrandVideoProps {
  activeSection: BrandEditorSection;
  setActiveSection: (section: BrandEditorSection) => void;
  setOutputMode: (outputMode: BrandOutputMode) => void;
  setTemplate: (templateId: BrandTemplateId) => void;
  updateCopy: (key: keyof BrandCopy, value: string) => void;
  updateHook: <K extends keyof BrandHookSettings>(key: K, value: BrandHookSettings[K]) => void;
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
  setOutputMode: (outputMode) => set({ outputMode, activeSection: 'copy' }),
  setTemplate: (templateId) => {
    const outputMode = get().outputMode;
    set({
      ...cloneBrandProps(BRAND_TEMPLATES[templateId].defaults),
      outputMode,
      activeSection: 'copy',
    });
  },
  updateCopy: (key, value) =>
    set((state) => ({ copy: { ...state.copy, [key]: value } })),
  updateHook: (key, value) =>
    set((state) => ({ hook: { ...state.hook, [key]: value } })),
  updatePalette: (key, value) =>
    set((state) => ({ palette: { ...state.palette, [key]: value } })),
  updateMedia: (slot, updates) =>
    set((state) => ({ [slot]: { ...state[slot], ...updates } })),
  updateTiming: (key, value) =>
    set((state) => ({ timing: { ...state.timing, [key]: value } })),
  updateAudio: (updates) =>
    set((state) => ({ audio: { ...state.audio, ...updates } })),
  resetTemplate: () => {
    const { templateId, outputMode } = get();
    set({ ...cloneBrandProps(BRAND_TEMPLATES[templateId].defaults), outputMode });
  },
}));

export function getBrandVideoProps(): BrandVideoProps {
  const state = useBrandStudioStore.getState();
  return {
    outputMode: state.outputMode,
    templateId: state.templateId,
    copy: state.copy,
    hook: state.hook,
    palette: state.palette,
    heroMedia: state.heroMedia,
    detailMedia: state.detailMedia,
    timing: state.timing,
    audio: state.audio,
  };
}

