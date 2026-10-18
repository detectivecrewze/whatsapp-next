export type BrandTemplateId = 'editorial' | 'birthday' | 'anniversary';
export type BrandOutputMode = 'hook' | 'campaign';
export type BrandHookTypography =
  | 'brand-serif'
  | 'classic'
  | 'editorial'
  | 'bold'
  | 'clean'
  | 'typewriter';
export type BrandHookMotion =
  | 'fade'
  | 'soft'
  | 'pop'
  | 'slide'
  | 'blur'
  | 'typewriter'
  | 'word-reveal'
  | 'cinematic';
export type BrandHookExit = 'none' | 'fade' | 'zoom' | 'slide-up';
export type BrandHookAlignment = 'left' | 'center';
export type BrandHookSequenceMode = 'single' | 'three-beat';
export type BrandHookBeatDurations = [number, number, number];
export type BrandHookEnabledBeats = [boolean, boolean, boolean];
export type BrandContentGoal = 'retention' | 'emotion' | 'conversion' | 'comedy';

export interface BrandHookPartMotions {
  eyebrow: BrandHookMotion;
  title: BrandHookMotion;
  accent: BrandHookMotion;
  footer: BrandHookMotion;
}

export type BrandMediaKind = 'image' | 'video';
export type BrandMediaFit = 'cover' | 'contain';
export type BrandHookBackgroundMode = 'brand' | 'gradient' | 'media';
export type BrandHookBackgroundMotion = 'none' | 'slow-zoom' | 'drift';
export type BrandTransitionSfx =
  | 'none'
  | 'whoosh'
  | 'whip'
  | 'page-turn'
  | 'switch'
  | 'ding'
  | 'shutter-modern'
  | 'bruh'
  | 'vine-boom'
  | 'record-scratch'
  | 'romance-meme'
  | 'anime-wow'
  | 'yippee'
  | 'dramatic-boomer'
  | 'bone-crack';

export interface BrandMediaSlot {
  src: string;
  kind: BrandMediaKind;
  name: string;
  fit: BrandMediaFit;
  focusX: number;
  focusY: number;
}

export interface BrandHookBackgroundSettings {
  mode: BrandHookBackgroundMode;
  media: BrandMediaSlot;
  overlayOpacity: number;
  blur: number;
  motion: BrandHookBackgroundMotion;
}

export interface BrandCopy {
  eyebrow: string;
  hookTitle: string;
  hookAccent: string;
  hookBridge: string;
  hookBridgeAccent: string;
  hookReveal: string;
  hookRevealAccent: string;
  hookFooter: string;
  storyTitle: string;
  storyBody: string;
  productName: string;
  productDetail: string;
  cta: string;
  domain: string;
}

export interface BrandHookSettings {
  typography: BrandHookTypography;
  motion: BrandHookMotion;
  partMotions: BrandHookPartMotions;
  sequenceMode: BrandHookSequenceMode;
  beatDurations: BrandHookBeatDurations;
  enabledBeats: BrandHookEnabledBeats;
  exitTransition: BrandHookExit;
  transitionSeconds: number;
  alignment: BrandHookAlignment;
  textScale: number;
  positionY: number;
  showDivider: boolean;
  autoFit: boolean;
  typewriterCps: number;
}

export interface BrandPalette {
  background: string;
  surface: string;
  text: string;
  accent: string;
  muted: string;
}

export interface BrandTiming {
  hookSeconds: number;
  productSeconds: number;
  storySeconds: number;
  outroSeconds: number;
}

export interface BrandAudioSettings {
  musicSrc: string;
  musicName: string;
  musicVolume: number;
  musicStartSeconds: number;
  musicFadeInSeconds: number;
  musicFadeOutSeconds: number;
  duckMusicForSfx: boolean;
  musicDuckLevel: number;
  transitionSfx: BrandTransitionSfx;
  transitionSfxVolume: number;
  sfxOffsetSeconds: number;
}

export interface BrandVideoProps extends Record<string, unknown> {
  outputMode: BrandOutputMode;
  templateId: BrandTemplateId;
  copy: BrandCopy;
  hook: BrandHookSettings;
  palette: BrandPalette;
  hookBackground: BrandHookBackgroundSettings;
  heroMedia: BrandMediaSlot;
  detailMedia: BrandMediaSlot;
  timing: BrandTiming;
  audio: BrandAudioSettings;
  gifOverlays?: BrandGifOverlayItem[];
}

export interface BrandCloudPreset {
  id: string;
  name: string;
  updatedAt: number;
  schemaVersion: 1;
  data: BrandVideoProps;
  contentGoal?: BrandContentGoal;
  activeTemplatePackId?: string | null;
  activeHookPresetId?: string | null;
  showSafeArea?: boolean;
}

export type BrandGifPositionPreset =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface BrandGifOverlayItem {
  id: string;
  url: string;
  label?: string;
  enabled: boolean;
  preset: BrandGifPositionPreset;
  offsetX: number; // percentage -50 to +50
  offsetY: number; // percentage -50 to +50
  width: number; // in pixels (e.g. 80 to 600, default 260)
  rotation: number; // in degrees (-180 to 180, default 0)
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  startAtSeconds?: number;
  opacity: number; // 0.1 to 1.0 (default 1)
  scope: 'hook' | 'always'; // 'hook' = only in hook scene, 'always' = throughout entire video
}

export interface BrandHookVariant {
  id: 'variant-a' | 'variant-b' | 'variant-c';
  label: string;
  strategy: string;
  reason: string;
  score: number;
  selected: boolean;
  props: BrandVideoProps;
}

export interface BrandTemplateDefinition {
  id: BrandTemplateId;
  name: string;
  category: string;
  description: string;
  badge: string;
  defaults: BrandVideoProps;
}

