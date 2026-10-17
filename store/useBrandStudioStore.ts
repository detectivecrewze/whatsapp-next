'use client';

import { create } from 'zustand';
import {
  BRAND_HOOK_PRESETS,
  BRAND_TEMPLATES,
  cloneBrandProps,
} from '@/lib/brandTemplates';
import { generateBrandHookVariants } from '@/lib/brandVariants';
import {
  BRAND_TEMPLATE_PACKS,
  personalizeTemplatePackCopy,
} from '@/lib/brandTemplatePacks';
import type {
  BrandAudioSettings,
  BrandContentGoal,
  BrandCopy,
  BrandHookBackgroundSettings,
  BrandHookSettings,
  BrandHookVariant,
  BrandMediaSlot,
  BrandOutputMode,
  BrandPalette,
  BrandTemplateId,
  BrandTiming,
  BrandVideoProps,
} from '@/types/brand';

export type BrandEditorSection =
  | 'templates'
  | 'template-packs'
  | 'copy'
  | 'effects'
  | 'media'
  | 'style'
  | 'timing'
  | 'audio'
  | 'variants'
  | 'export';

interface BrandStudioStore extends BrandVideoProps {
  activeSection: BrandEditorSection;
  activeHookPresetId: string | null;
  activeTemplatePackId: string | null;
  showSafeArea: boolean;
  contentGoal: BrandContentGoal;
  variants: BrandHookVariant[];
  setActiveSection: (section: BrandEditorSection) => void;
  setShowSafeArea: (showSafeArea: boolean) => void;
  setOutputMode: (outputMode: BrandOutputMode) => void;
  setTemplate: (templateId: BrandTemplateId) => void;
  applyHookPreset: (presetId: string) => void;
  applyTemplatePack: (
    packId: string,
    personalization: { recipientName: string; productName: string },
  ) => void;
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
  setContentGoal: (contentGoal: BrandContentGoal) => void;
  generateVariants: () => void;
  toggleVariant: (variantId: BrandHookVariant['id']) => void;
  updateVariantCopy: (
    variantId: BrandHookVariant['id'],
    key: keyof Pick<
      BrandCopy,
      | 'hookTitle'
      | 'hookAccent'
      | 'hookBridge'
      | 'hookBridgeAccent'
      | 'hookReveal'
      | 'hookRevealAccent'
    >,
    value: string,
  ) => void;
  applyVariant: (variantId: BrandHookVariant['id']) => void;
  resetTemplate: () => void;
}

const initial = cloneBrandProps(BRAND_TEMPLATES.editorial.defaults);

export const useBrandStudioStore = create<BrandStudioStore>()((set, get) => ({
  ...initial,
  activeSection: 'templates',
  activeHookPresetId: null,
  activeTemplatePackId: null,
  showSafeArea: false,
  contentGoal: 'retention',
  variants: [],
  setActiveSection: (activeSection) => set({ activeSection }),
  setShowSafeArea: (showSafeArea) => set({ showSafeArea }),
  setOutputMode: (outputMode) => set({
    outputMode,
    activeSection: 'copy',
    variants: [],
    activeTemplatePackId: null,
  }),
  setTemplate: (templateId) => {
    const outputMode = get().outputMode;
    set({
      ...cloneBrandProps(BRAND_TEMPLATES[templateId].defaults),
      outputMode,
      activeSection: 'copy',
      activeHookPresetId: null,
      activeTemplatePackId: null,
      variants: [],
    });
  },
  applyHookPreset: (presetId) => {
    const preset = BRAND_HOOK_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;
    set((state) => ({
      copy: {
        ...state.copy,
        hookBridgeAccent: '',
        hookRevealAccent: '',
        ...preset.copy,
      },
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
      activeTemplatePackId: null,
      activeSection: 'copy',
      variants: [],
    }));
  },
  applyTemplatePack: (packId, personalization) => {
    const pack = BRAND_TEMPLATE_PACKS.find((entry) => entry.id === packId);
    if (!pack) return;
    const personalizedCopy = personalizeTemplatePackCopy(
      pack.copy,
      personalization.recipientName,
      personalization.productName,
    );
    set((state) => ({
      outputMode: 'hook',
      copy: {
        ...state.copy,
        hookBridgeAccent: '',
        hookRevealAccent: '',
        ...personalizedCopy,
        productName: personalization.productName.trim() || state.copy.productName,
      },
      hook: {
        ...state.hook,
        ...pack.hook,
        partMotions: {
          ...state.hook.partMotions,
          ...(pack.hook.partMotions ?? {}),
        },
      },
      palette: { ...pack.palette },
      timing: { ...state.timing, hookSeconds: pack.hookSeconds },
      audio: { ...state.audio, ...pack.audio },
      contentGoal: pack.goal,
      activeHookPresetId: null,
      activeTemplatePackId: pack.id,
      variants: [],
    }));
  },
  updateCopy: (key, value) =>
    set((state) => ({
      copy: { ...state.copy, [key]: value },
      activeHookPresetId: null,
      activeTemplatePackId: null,
      variants: [],
    })),
  updateHook: (key, value) =>
    set((state) => ({
      hook: { ...state.hook, [key]: value },
      activeHookPresetId: null,
      activeTemplatePackId: null,
      variants: [],
    })),
  updatePalette: (key, value) =>
    set((state) => ({
      palette: { ...state.palette, [key]: value },
      activeHookPresetId: null,
      activeTemplatePackId: null,
      variants: [],
    })),
  updateHookBackground: (updates) =>
    set((state) => ({
      hookBackground: {
        ...(state.hookBackground ?? BRAND_TEMPLATES[state.templateId].defaults.hookBackground),
        ...updates,
      },
      variants: [],
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
      variants: [],
    })),
  updateMedia: (slot, updates) =>
    set((state) => ({ [slot]: { ...state[slot], ...updates }, variants: [] })),
  updateTiming: (key, value) =>
    set((state) => ({
      timing: { ...state.timing, [key]: value },
      activeTemplatePackId: null,
      variants: [],
    })),
  updateAudio: (updates) =>
    set((state) => ({
      audio: { ...state.audio, ...updates },
      activeHookPresetId: null,
      activeTemplatePackId: null,
      variants: [],
    })),
  setContentGoal: (contentGoal) => set({ contentGoal, variants: [] }),
  generateVariants: () => {
    const state = get();
    set({ variants: generateBrandHookVariants(getBrandVideoProps(), state.contentGoal) });
  },
  toggleVariant: (variantId) =>
    set((state) => ({
      variants: state.variants.map((variant) =>
        variant.id === variantId ? { ...variant, selected: !variant.selected } : variant,
      ),
    })),
  updateVariantCopy: (variantId, key, value) =>
    set((state) => ({
      variants: state.variants.map((variant) =>
        variant.id === variantId
          ? { ...variant, props: { ...variant.props, copy: { ...variant.props.copy, [key]: value } } }
          : variant,
      ),
    })),
  applyVariant: (variantId) => {
    const variant = get().variants.find((entry) => entry.id === variantId);
    if (!variant) return;
    const next = cloneBrandProps(variant.props);
    set({
      ...next,
      activeHookPresetId: null,
      activeTemplatePackId: null,
    });
  },
  resetTemplate: () => {
    const { templateId, outputMode } = get();
    set({
      ...cloneBrandProps(BRAND_TEMPLATES[templateId].defaults),
      outputMode,
      activeHookPresetId: null,
      activeTemplatePackId: null,
      variants: [],
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

