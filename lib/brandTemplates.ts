import type {
  BrandTemplateDefinition,
  BrandTemplateId,
  BrandVideoProps,
} from '@/types/brand';

export const BRAND_VIDEO_FPS = 30;
export const BRAND_VIDEO_WIDTH = 1080;
export const BRAND_VIDEO_HEIGHT = 1920;

export const BRAND_TEMPLATES: Record<BrandTemplateId, BrandTemplateDefinition> = {
  editorial: {
    id: 'editorial',
    name: 'Editorial Gift',
    category: 'Romantis · Soft selling',
    description: 'Hook tipografi yang tenang, dilanjutkan reveal produk digital.',
    badge: 'FYA SIGNATURE',
    defaults: {
      outputMode: 'hook',
      templateId: 'editorial',
      copy: {
        eyebrow: 'FOR YOU. ALWAYS.',
        hookTitle: 'Ada banyak cara bilang,',
        hookAccent: '“kamu berarti buatku.”',
        hookFooter: 'DIGITAL ATELIER',
        storyTitle: 'Bukan sekadar hadiah.',
        storyBody: 'Satu ruang digital berisi kata, foto, dan kenangan yang bisa dia buka kapan saja.',
        productName: 'Digital Gift — Letter Edition',
        productDetail: 'Dibuat personal, dikirim lewat link.',
        cta: 'Buat versimu untuk dia',
        domain: 'for-you-always.my.id',
      },
      hook: {
        typography: 'editorial',
        motion: 'soft',
        exitTransition: 'fade',
        transitionSeconds: 0.55,
        alignment: 'center',
        textScale: 1,
        positionY: 33,
        showDivider: true,
      },
      palette: {
        background: '#fbf7f2',
        surface: '#f1e8dc',
        text: '#382a24',
        accent: '#a75d67',
        muted: '#8d776b',
      },
      heroMedia: {
        src: '/brand-studio/letter-closed.webp',
        kind: 'image',
        name: 'Letter Edition',
        fit: 'contain',
        focusX: 50,
        focusY: 50,
      },
      detailMedia: {
        src: '/brand-studio/letter-open.webp',
        kind: 'image',
        name: 'Letter dibuka',
        fit: 'contain',
        focusX: 50,
        focusY: 50,
      },
      timing: { hookSeconds: 3.6, productSeconds: 5.4, storySeconds: 4.8, outroSeconds: 4 },
      audio: {
        musicSrc: '',
        musicName: '',
        musicVolume: 0.18,
        transitionSfx: 'whoosh',
        transitionSfxVolume: 0.24,
        sfxOffsetSeconds: 0.2,
      },
    },
  },
  birthday: {
    id: 'birthday',
    name: 'Birthday Reveal',
    category: 'Ulang tahun · Playful',
    description: 'Hook yang ringan dengan panggung produk bergaya birthday card.',
    badge: 'BIRTHDAY EDITION',
    defaults: {
      outputMode: 'hook',
      templateId: 'birthday',
      copy: {
        eyebrow: 'FOR YOU. ALWAYS.',
        hookTitle: 'Ulang tahunnya',
        hookAccent: 'sebentar lagi?',
        hookFooter: 'BIRTHDAY EDITION',
        storyTitle: 'Ucapan yang terasa benar-benar dia.',
        storyBody: 'Gabungkan pesan, foto favorit, dan kejutan kecil dalam satu digital gift.',
        productName: 'Birthday Digital Gift',
        productDetail: 'Personal, manis, dan siap dibagikan.',
        cta: 'Siapkan kejutan ulang tahunnya',
        domain: 'for-you-always.my.id',
      },
      hook: {
        typography: 'bold',
        motion: 'pop',
        exitTransition: 'zoom',
        transitionSeconds: 0.5,
        alignment: 'center',
        textScale: 1,
        positionY: 34,
        showDivider: true,
      },
      palette: {
        background: '#fff9ef',
        surface: '#e9f4ef',
        text: '#3f2c26',
        accent: '#d47773',
        muted: '#8c756a',
      },
      heroMedia: {
        src: '/brand-studio/retro-cake.mp4',
        kind: 'video',
        name: 'Retro birthday card',
        fit: 'cover',
        focusX: 50,
        focusY: 50,
      },
      detailMedia: {
        src: '/brand-studio/letter-open.webp',
        kind: 'image',
        name: 'Ucapan personal',
        fit: 'contain',
        focusX: 50,
        focusY: 50,
      },
      timing: { hookSeconds: 3.2, productSeconds: 5.6, storySeconds: 4.8, outroSeconds: 4 },
      audio: {
        musicSrc: '',
        musicName: '',
        musicVolume: 0.18,
        transitionSfx: 'ding',
        transitionSfxVolume: 0.24,
        sfxOffsetSeconds: 0.2,
      },
    },
  },
  anniversary: {
    id: 'anniversary',
    name: 'Anniversary Story',
    category: 'Anniversary · Memories',
    description: 'Cerita hangat dengan footage kenangan dan CTA yang elegan.',
    badge: 'ANNIVERSARY EDITION',
    defaults: {
      outputMode: 'hook',
      templateId: 'anniversary',
      copy: {
        eyebrow: 'FOR YOU. ALWAYS.',
        hookTitle: 'Masih ingat,',
        hookAccent: 'awal cerita kita?',
        hookFooter: 'OUR STORY',
        storyTitle: 'Ternyata sudah sejauh ini.',
        storyBody: 'Simpan perjalanan kalian menjadi hadiah digital yang tetap terasa personal.',
        productName: 'Our Journey',
        productDetail: 'Tempat, foto, dan cerita dalam satu halaman.',
        cta: 'Rayakan cerita kalian',
        domain: 'for-you-always.my.id',
      },
      hook: {
        typography: 'clean',
        motion: 'slide',
        exitTransition: 'slide-up',
        transitionSeconds: 0.6,
        alignment: 'left',
        textScale: 1,
        positionY: 32,
        showDivider: true,
      },
      palette: {
        background: '#f7f0e8',
        surface: '#eadfd2',
        text: '#392d29',
        accent: '#9b6a50',
        muted: '#89766d',
      },
      heroMedia: {
        src: '/brand-studio/atlas-first-date-warm.mp4',
        kind: 'video',
        name: 'First date memory',
        fit: 'cover',
        focusX: 50,
        focusY: 50,
      },
      detailMedia: {
        src: '/brand-studio/letter-closed.webp',
        kind: 'image',
        name: 'Memory letter',
        fit: 'contain',
        focusX: 50,
        focusY: 50,
      },
      timing: { hookSeconds: 3.8, productSeconds: 5.8, storySeconds: 5, outroSeconds: 4.2 },
      audio: {
        musicSrc: '',
        musicName: '',
        musicVolume: 0.18,
        transitionSfx: 'page-turn',
        transitionSfxVolume: 0.24,
        sfxOffsetSeconds: 0.2,
      },
    },
  },
};

export const BRAND_TEMPLATE_LIST = Object.values(BRAND_TEMPLATES);

export const BRAND_HOOK_VARIANTS = [
  { label: 'Romantis', title: 'Ada banyak cara bilang,', accent: '“kamu berarti buatku.”' },
  { label: 'Ulang tahun', title: 'Bukan cuma bertambah usia,', accent: 'ada cerita yang ikut tumbuh.' },
  { label: 'LDR', title: 'Jarak boleh jauh,', accent: 'tapi perasaanku tetap sampai.' },
  { label: 'Minta maaf', title: 'Kadang kata “maaf”', accent: 'butuh cara yang lebih tulus.' },
  { label: 'Soft selling', title: 'Hadiah terbaik tidak selalu', accent: 'datang dalam sebuah kotak.' },
  { label: 'Anniversary', title: 'Kita tidak hanya menghitung tahun,', accent: 'kita menyimpan ceritanya.' },
] as const;

export const BRAND_SFX_FILES = {
  whoosh: 'whoosh.wav',
  whip: 'whip.wav',
  'page-turn': 'page-turn.wav',
  switch: 'switch.wav',
  ding: 'ding.wav',
  'shutter-modern': 'shutter-modern.wav',
  bruh: 'bruh.wav',
  'vine-boom': 'vine-boom.wav',
  'record-scratch': 'record-scratch.wav',
  'romance-meme': 'romance-meme.wav',
  'anime-wow': 'anime-wow.wav',
  yippee: 'yippee.wav',
  'dramatic-boomer': 'dramatic-boomer.wav',
  'bone-crack': 'bone-crack.wav',
} as const;

export const BRAND_SFX_GROUPS = [
  {
    label: 'Transisi',
    options: [
      { id: 'none', label: 'Tanpa SFX' },
      { id: 'whoosh', label: 'Soft whoosh' },
      { id: 'whip', label: 'Fast whip' },
      { id: 'page-turn', label: 'Page turn' },
      { id: 'switch', label: 'Soft switch' },
      { id: 'ding', label: 'Soft ding' },
      { id: 'shutter-modern', label: 'Camera shutter' },
    ],
  },
  {
    label: 'Komedi / Viral',
    options: [
      { id: 'bruh', label: 'Bruh' },
      { id: 'vine-boom', label: 'Vine boom' },
      { id: 'record-scratch', label: 'Record scratch' },
      { id: 'romance-meme', label: 'Romance meme' },
      { id: 'anime-wow', label: 'Anime wow' },
      { id: 'yippee', label: 'Yippee' },
    ],
  },
  {
    label: 'Dramatis / Horror',
    options: [
      { id: 'dramatic-boomer', label: 'Dramatic boom' },
      { id: 'bone-crack', label: 'Bone crack' },
    ],
  },
] as const;

export function cloneBrandProps(props: BrandVideoProps): BrandVideoProps {
  return JSON.parse(JSON.stringify(props)) as BrandVideoProps;
}

export function getBrandDurationInFrames(
  props: Pick<BrandVideoProps, 'outputMode' | 'timing'>,
  fps = BRAND_VIDEO_FPS,
) {
  if (props.outputMode === 'hook') {
    return Math.max(1, Math.round(props.timing.hookSeconds * fps));
  }

  const totalSeconds =
    props.timing.hookSeconds +
    props.timing.productSeconds +
    props.timing.storySeconds +
    props.timing.outroSeconds;
  return Math.max(1, Math.round(totalSeconds * fps));
}

