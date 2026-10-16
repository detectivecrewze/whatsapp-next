'use client';

import { create } from 'zustand';
import {
  BRAND_HOOK_PRESETS,
  BRAND_TEMPLATES,
  cloneBrandProps,
} from '@/lib/brandTemplates';
import type {
  BrandAudioSettings,
  BrandCopy,
  BrandHookBackgroundSettings,
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
  activeHookPresetId: string | null;
  showSafeArea: boolean;
  setActiveSection: (section: BrandEditorSection) => void;
  setShowSafeArea: (showSafeArea: boolean) => void;
  setOutputMode: (outputMode: BrandOutputMode) => void;
  setTemplate: (templateId: BrandTemplateId) => void;
  applyHookPreset: (presetId: string) => void;
  updateCopy: (key: keyof BrandCopy, value: string) => void;
  updateHook: <K extends keyof BrandHookSettings>(key: K, value: BrandHookSettings[K]) => void;
  updatePalette: (key: keyof BrandPalette, value: string) => void;
  updateHookBackground: (updates: Partial<BrandHookBackgroundSettings>) => void;
  updateHookBackgroundMedia: (updates: Partial<BrandMediaSlot>) => void;
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
  activeHookPresetId: null,
  showSafeArea: false,
  setActiveSection: (activeSection) => set({ activeSection }),
  setShowSafeArea: (showSafeArea) => set({ showSafeArea }),
  setOutputMode: (outputMode) => set({ outputMode, activeSection: 'copy' }),
  setTemplate: (templateId) => {
    const outputMode = get().outputMode;
    set({
      ...cloneBrandProps(BRAND_TEMPLATES[templateId].defaults),
      outputMode,
      activeSection: 'copy',
      activeHookPresetId: null,
    });
  },
  applyHookPreset: (presetId) => {
    const preset = BRAND_HOOK_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;
    set((state) => ({
      copy: { ...state.copy, ...preset.copy },
      hook: {
        ...state.hook,
        ...preset.hook,
        partMotions: {
          ...(state.hook.partMotions ?? {
            eyebrow: state.hook.motion,
            title: state.hook.motion,
            accent: state.hook.motion,
            footer: state.hook.motion,
          }),
          ...(preset.hook.partMotions ?? {}),
        },
      },
      palette: { ...preset.palette },
      timing: { ...state.timing, hookSeconds: preset.hookSeconds },
      audio: { ...state.audio, ...preset.audio },
      activeHookPresetId: preset.id,
      activeSection: 'copy',
    }));
  },
  updateCopy: (key, value) =>
    set((state) => ({ copy: { ...state.copy, [key]: value }, activeHookPresetId: null })),
  updateHook: (key, value) =>
    set((state) => ({ hook: { ...state.hook, [key]: value }, activeHookPresetId: null })),
  updatePalette: (key, value) =>
    set((state) => ({ palette: { ...state.palette, [key]: value }, activeHookPresetId: null })),
  updateHookBackground: (updates) =>
    set((state) => ({
      hookBackground: {
        ...(state.hookBackground ?? BRAND_TEMPLATES[state.templateId].defaults.hookBackground),
        ...updates,
      },
    })),
  updateHookBackgroundMedia: (updates) =>
    set((state) => ({
      hookBackground: {
        ...(state.hookBackground ?? BRAND_TEMPLATES[state.templateId].defaults.hookBackground),
        media: {
          ...(state.hookBackground?.media ?? BRAND_TEMPLATES[state.templateId].defaults.hookBackground.media),
          ...updates,
        },
      },
    })),
  updateMedia: (slot, updates) =>
    set((state) => ({ [slot]: { ...state[slot], ...updates } })),
  updateTiming: (key, value) =>
    set((state) => ({ timing: { ...state.timing, [key]: value } })),
  updateAudio: (updates) =>
    set((state) => ({ audio: { ...state.audio, ...updates }, activeHookPresetId: null })),
  resetTemplate: () => {
    const { templateId, outputMode } = get();
    set({
      ...cloneBrandProps(BRAND_TEMPLATES[templateId].defaults),
      outputMode,
      activeHookPresetId: null,
    });
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
    hookBackground: state.hookBackground ?? BRAND_TEMPLATES[state.templateId].defaults.hookBackground,
    heroMedia: state.heroMedia,
    detailMedia: state.detailMedia,
    timing: state.timing,
    audio: state.audio,
  };
}

