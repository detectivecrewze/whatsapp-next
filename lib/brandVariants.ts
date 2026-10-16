import { cloneBrandProps } from '@/lib/brandTemplates';
import type {
  BrandContentGoal,
  BrandHookVariant,
  BrandTransitionSfx,
  BrandVideoProps,
} from '@/types/brand';

export const BRAND_CONTENT_GOALS: Array<{
  id: BrandContentGoal;
  label: string;
  description: string;
}> = [
  { id: 'retention', label: 'Tahan scroll', description: 'Cepat, jelas, dan langsung menarik perhatian.' },
  { id: 'emotion', label: 'Bikin baper', description: 'Memberi ruang untuk build-up dan rasa personal.' },
  { id: 'conversion', label: 'Dorong klik', description: 'Reveal produk digital lebih cepat dan jelas.' },
  { id: 'comedy', label: 'Komedi', description: 'Tempo punchy dengan kejutan yang ringan.' },
];

const GOAL_COPY: Record<BrandContentGoal, { bridge: string; footer: string }> = {
  retention: { bridge: 'Tunggu sampai bagian akhirnya.', footer: 'DON’T SCROLL YET.' },
  emotion: { bridge: 'Karena beberapa perasaan tidak cukup dikirim lewat chat.', footer: 'MADE FOR SOMEONE SPECIAL.' },
  conversion: { bridge: 'Bisa dipersonalisasi dan langsung dikirim lewat link.', footer: 'YOUR DIGITAL GIFT IS READY.' },
  comedy: { bridge: 'Plot twist-nya bukan yang kamu kira.', footer: 'WAIT FOR THE REVEAL.' },
};

const GOAL_SFX: Record<BrandContentGoal, BrandTransitionSfx> = {
  retention: 'switch',
  emotion: 'page-turn',
  conversion: 'ding',
  comedy: 'record-scratch',
};

function withoutEndPunctuation(value: string) {
  return value.trim().replace(/[.!?,;:]+$/g, '');
}

function scoreVariant(props: BrandVideoProps, goal: BrandContentGoal, kind: 'control' | 'fast' | 'story') {
  let score = 72;
  if (props.copy.hookTitle.trim()) score += 4;
  if (props.copy.hookAccent.trim()) score += 4;
  if (props.hook.autoFit) score += 3;
  if (props.audio.transitionSfx !== 'none') score += 3;

  if (goal === 'retention' && kind === 'fast') score += 12;
  if (goal === 'emotion' && kind === 'story') score += 12;
  if (goal === 'conversion' && kind === 'story') score += 10;
  if (goal === 'comedy' && kind === 'fast') score += 11;
  if (kind === 'control') score += 2;

  return Math.min(98, score);
}

export function generateBrandHookVariants(
  source: BrandVideoProps,
  goal: BrandContentGoal,
): BrandHookVariant[] {
  const control = cloneBrandProps(source);
  control.outputMode = 'hook';

  const fast = cloneBrandProps(source);
  fast.outputMode = 'hook';
  fast.hook.sequenceMode = 'single';
  fast.hook.typography = goal === 'emotion' ? 'editorial' : 'bold';
  fast.hook.motion = goal === 'emotion' ? 'soft' : 'pop';
  fast.hook.partMotions = {
    eyebrow: 'fade',
    title: goal === 'comedy' ? 'pop' : 'slide',
    accent: goal === 'emotion' ? 'word-reveal' : 'pop',
    footer: 'fade',
  };
  fast.hook.exitTransition = goal === 'comedy' ? 'zoom' : 'fade';
  fast.hook.transitionSeconds = 0.35;
  fast.hook.textScale = Math.min(1.12, Math.max(1, source.hook.textScale));
  fast.timing.hookSeconds = goal === 'emotion' ? 4 : 3.2;
  fast.audio.transitionSfx = GOAL_SFX[goal];
  fast.audio.transitionSfxVolume = 0.2;
  fast.copy.hookFooter = GOAL_COPY[goal].footer;
  if (goal === 'comedy') {
    fast.copy.hookTitle = `Plot twist: ${withoutEndPunctuation(source.copy.hookTitle)}`;
  }

  const story = cloneBrandProps(source);
  story.outputMode = 'hook';
  story.hook.sequenceMode = 'three-beat';
  story.hook.typography = goal === 'comedy' ? 'clean' : 'brand-serif';
  story.hook.motion = 'cinematic';
  story.hook.partMotions = {
    eyebrow: 'fade',
    title: goal === 'comedy' ? 'pop' : 'soft',
    accent: 'word-reveal',
    footer: 'fade',
  };
  story.hook.exitTransition = goal === 'conversion' ? 'slide-up' : 'fade';
  story.hook.transitionSeconds = 0.65;
  story.timing.hookSeconds = goal === 'retention' ? 4.8 : 5.6;
  story.copy.hookBridge = source.copy.hookBridge.trim() || GOAL_COPY[goal].bridge;
  story.copy.hookReveal = source.copy.hookReveal.trim()
    || (source.copy.productName.trim()
      ? `Jadi aku membuat ${source.copy.productName} ini untukmu.`
      : 'Jadi aku membuat digital gift ini untukmu.');
  story.audio.transitionSfx = goal === 'comedy' ? 'vine-boom' : GOAL_SFX[goal];
  story.audio.transitionSfxVolume = 0.2;

  const variants: BrandHookVariant[] = [
    {
      id: 'variant-a',
      label: 'A · Original',
      strategy: 'Kontrol aman',
      reason: 'Menjaga versi yang sudah Anda susun sebagai pembanding.',
      score: scoreVariant(control, goal, 'control'),
      selected: true,
      props: control,
    },
    {
      id: 'variant-b',
      label: 'B · Scroll Stopper',
      strategy: 'Cepat & punchy',
      reason: goal === 'emotion'
        ? 'Tetap lembut, tetapi pesan utama muncul lebih cepat.'
        : 'Durasi dipadatkan agar penonton cepat menangkap hook.',
      score: scoreVariant(fast, goal, 'fast'),
      selected: true,
      props: fast,
    },
    {
      id: 'variant-c',
      label: 'C · Story Reveal',
      strategy: 'Build-up 3 bagian',
      reason: goal === 'conversion'
        ? 'Masalah, alasan, lalu produk digital muncul sebagai solusi.'
        : 'Memberi build-up sebelum reveal supaya akhir terasa lebih kuat.',
      score: scoreVariant(story, goal, 'story'),
      selected: true,
      props: story,
    },
  ];

  return variants;
}

export function getRecommendedVariant(variants: BrandHookVariant[]) {
  return variants.reduce<BrandHookVariant | null>(
    (best, variant) => (!best || variant.score > best.score ? variant : best),
    null,
  );
}
