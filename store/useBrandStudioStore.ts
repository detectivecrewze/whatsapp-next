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
import {
  BRAND_BEAT_MAX_SECONDS,
  BRAND_BEAT_MIN_SECONDS,
  resolveBrandHookBeatDurations,
  resolveBrandHookEnabledBeats,
  splitBrandHookBeatDurations,
  sumActiveBrandHookBeatDurations,
} from '@/lib/brandBeatTiming';
import type {
  BrandAudioSettings,
  BrandContentGoal,
  BrandCopy,
  BrandGifOverlayItem,
  BrandHookBackgroundSettings,
  BrandHookBeatDurations,
  BrandHookEnabledBeats,
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
  | 'cloud-projects'
  | 'template-packs'
  | 'copy'
  | 'effects'
  | 'media'
  | 'stickers'
  | 'style'
  | 'timing'
  | 'audio'
  | 'variants'
  | 'export';

interface BrandStudioStore extends BrandVideoProps {
  activeSection: BrandEditorSection;
  activeCloudProjectId: string | null;
  activeHookPresetId: string | null;
  activeTemplatePackId: string | null;
  showSafeArea: boolean;
  contentGoal: BrandContentGoal;
  variants: BrandHookVariant[];
  setActiveSection: (section: BrandEditorSection) => void;
  setActiveCloudProjectId: (id: string | null) => void;
  setShowSafeArea: (showSafeArea: boolean) => void;
  setOutputMode: (outputMode: BrandOutputMode) => void;
  setTemplate: (templateId: BrandTemplateId) => void;
  applyVisualTemplate: (templateId: BrandTemplateId) => void;
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
  updateBeatDuration: (index: 0 | 1 | 2, value: number) => void;
  setBeatEnabled: (index: 1 | 2, enabled: boolean) => void;
  updateAudio: (updates: Partial<BrandAudioSettings>) => void;
  gifOverlays: BrandGifOverlayItem[];
  addGifOverlay: (item?: Partial<BrandGifOverlayItem>) => void;
  updateGifOverlay: (id: string, updates: Partial<BrandGifOverlayItem>) => void;
  removeGifOverlay: (id: string) => void;
  toggleGifOverlay: (id: string) => void;
  matchGifOverlayLayout: (id: string) => void;
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
  gifOverlays: [],
  activeSection: 'templates',
  activeCloudProjectId: null,
  activeHookPresetId: null,
  activeTemplatePackId: null,
  showSafeArea: false,
  contentGoal: 'retention',
  variants: [],
  setActiveSection: (activeSection) => set({ activeSection }),
  setActiveCloudProjectId: (activeCloudProjectId) => set({ activeCloudProjectId }),
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
  applyVisualTemplate: (templateId) => {
    const visual = BRAND_TEMPLATES[templateId].defaults;
    set((state) => ({
      templateId,
      palette: { ...visual.palette },
      hookBackground: cloneBrandProps(visual).hookBackground,
      hook: {
        ...visual.hook,
        sequenceMode: state.hook.sequenceMode,
        beatDurations: state.hook.beatDurations,
        enabledBeats: resolveBrandHookEnabledBeats(state.hook.enabledBeats),
      },
      activeHookPresetId: null,
      variants: [],
    }));
  },
  applyHookPreset: (presetId) => {
    const preset = BRAND_HOOK_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;
    const beatDurations = splitBrandHookBeatDurations(preset.hookSeconds);
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
        beatDurations,
        enabledBeats: [true, true, true],
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
    const beatDurations = splitBrandHookBeatDurations(pack.hookSeconds);
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
        sequenceMode: pack.hook.sequenceMode ?? state.hook.sequenceMode,
        beatDurations,
        enabledBeats: [true, true, true],
      },
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
  updateBeatDuration: (index, value) =>
    set((state) => {
      const current = resolveBrandHookBeatDurations(
        state.hook.beatDurations,
        state.timing.hookSeconds,
      );
      const next = [...current] as BrandHookBeatDurations;
      next[index] = Math.min(
        BRAND_BEAT_MAX_SECONDS,
        Math.max(BRAND_BEAT_MIN_SECONDS, Math.round(value * 10) / 10),
      );

      return {
        hook: { ...state.hook, beatDurations: next },
        timing: {
          ...state.timing,
          hookSeconds: sumActiveBrandHookBeatDurations(
            next,
            resolveBrandHookEnabledBeats(state.hook.enabledBeats),
          ),
        },
        activeHookPresetId: null,
        variants: [],
      };
    }),
  setBeatEnabled: (index, enabled) =>
    set((state) => {
      const durations = resolveBrandHookBeatDurations(
        state.hook.beatDurations,
        state.timing.hookSeconds,
      );
      const current = resolveBrandHookEnabledBeats(state.hook.enabledBeats);
      const next = [...current] as BrandHookEnabledBeats;
      next[index] = enabled;

      return {
        hook: { ...state.hook, enabledBeats: next },
        timing: {
          ...state.timing,
          hookSeconds: sumActiveBrandHookBeatDurations(durations, next),
        },
        activeHookPresetId: null,
        variants: [],
      };
    }),
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
  addGifOverlay: (item) =>
    set((state) => {
      const newId = `gif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newItem: BrandGifOverlayItem = {
        id: newId,
        url: item?.url || '',
        label: item?.label || 'GIF Sticker',
        enabled: item?.enabled ?? true,
        preset: item?.preset || 'top-right',
        offsetX: item?.offsetX ?? 0,
        offsetY: item?.offsetY ?? 0,
        width: item?.width ?? 260,
        rotation: item?.rotation ?? 0,
        flipHorizontal: item?.flipHorizontal ?? false,
        flipVertical: item?.flipVertical ?? false,
        startAtSeconds: item?.startAtSeconds ?? Math.min(0.8 + (state.gifOverlays?.length ?? 0) * 0.55, 3.5),
        opacity: item?.opacity ?? 1,
        scope: item?.scope || 'hook',
      };
      return { gifOverlays: [...(state.gifOverlays ?? []), newItem] };
    }),
  updateGifOverlay: (id, updates) =>
    set((state) => ({
      gifOverlays: (state.gifOverlays ?? []).map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry,
      ),
    })),
  removeGifOverlay: (id) =>
    set((state) => ({
      gifOverlays: (state.gifOverlays ?? []).filter((entry) => entry.id !== id),
    })),
  toggleGifOverlay: (id) =>
    set((state) => ({
      gifOverlays: (state.gifOverlays ?? []).map((entry) =>
        entry.id === id ? { ...entry, enabled: !entry.enabled } : entry,
      ),
    })),
  matchGifOverlayLayout: (id) =>
    set((state) => {
      const reference = (state.gifOverlays ?? []).find((entry) => entry.id === id);
      if (!reference) return {};
      return {
        gifOverlays: (state.gifOverlays ?? []).map((entry) =>
          entry.id === id
            ? entry
            : {
                ...entry,
                preset: reference.preset,
                offsetX: reference.offsetX,
                offsetY: reference.offsetY,
                width: reference.width,
              },
        ),
      };
    }),
  resetTemplate: () => {
    const { templateId, outputMode } = get();
    set({
      ...cloneBrandProps(BRAND_TEMPLATES[templateId].defaults),
      gifOverlays: [],
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
    gifOverlays: state.gifOverlays ?? [],
  };
}

