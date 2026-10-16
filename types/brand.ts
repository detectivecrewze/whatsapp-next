export type BrandTemplateId = 'editorial' | 'birthday' | 'anniversary';
export type BrandOutputMode = 'hook' | 'campaign';
export type BrandHookTypography =
  | 'brand-serif'
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

export type BrandMediaKind = 'image' | 'video';
export type BrandMediaFit = 'cover' | 'contain';
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

export interface BrandCopy {
  eyebrow: string;
  hookTitle: string;
  hookAccent: string;
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
  exitTransition: BrandHookExit;
  transitionSeconds: number;
  alignment: BrandHookAlignment;
  textScale: number;
  positionY: number;
  showDivider: boolean;
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
  heroMedia: BrandMediaSlot;
  detailMedia: BrandMediaSlot;
  timing: BrandTiming;
  audio: BrandAudioSettings;
}

export interface BrandTemplateDefinition {
  id: BrandTemplateId;
  name: string;
  category: string;
  description: string;
  badge: string;
  defaults: BrandVideoProps;
}

