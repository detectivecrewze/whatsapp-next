import type {
  BrandAudioSettings,
  BrandCopy,
  BrandHookSettings,
  BrandPalette,
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
        hookBridge: 'Bukan sekadar pesan yang lewat.',
        hookReveal: 'Jadikan perasaanmu sebuah digital gift.',
        hookFooter: 'DIGITAL ATELIER',
        storyTitle: 'Bukan sekadar hadiah.',
        storyBody: 'Satu ruang digital berisi kata, foto, dan kenangan yang bisa dia buka kapan saja.',
        productName: 'Digital Gift — Letter Edition',
        productDetail: 'Dibuat personal, dikirim lewat link.',
        cta: 'Buat versimu untuk dia',
        domain: 'for-you-always.my.id',
      },
      hook: {
        typography: 'brand-serif',
        motion: 'soft',
        partMotions: {
          eyebrow: 'fade',
          title: 'soft',
          accent: 'word-reveal',
          footer: 'fade',
        },
        sequenceMode: 'single',
        exitTransition: 'fade',
        transitionSeconds: 0.55,
        alignment: 'center',
        textScale: 1,
        positionY: 33,
        showDivider: true,
        autoFit: true,
        typewriterCps: 20,
      },
      palette: {
        background: '#FAF7F2',
        surface: '#E8D9CB',
        text: '#1D1816',
        accent: '#A67C52',
        muted: '#78665B',
      },
      hookBackground: {
        mode: 'brand',
        media: {
          src: '/brand-studio/letter-open.webp',
          kind: 'image',
          name: 'Digital letter background',
          fit: 'cover',
          focusX: 50,
          focusY: 50,
        },
        overlayOpacity: 0.58,
        blur: 0,
        motion: 'slow-zoom',
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
        musicStartSeconds: 0,
        musicFadeInSeconds: 0.7,
        musicFadeOutSeconds: 1.2,
        duckMusicForSfx: true,
        musicDuckLevel: 0.42,
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
        hookBridge: 'Kadomu jangan cuma berhenti di bungkus.',
        hookReveal: 'Bikin ucapan digital yang benar-benar personal.',
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
        partMotions: {
          eyebrow: 'fade',
          title: 'pop',
          accent: 'pop',
          footer: 'soft',
        },
        sequenceMode: 'single',
        exitTransition: 'zoom',
        transitionSeconds: 0.5,
        alignment: 'center',
        textScale: 1,
        positionY: 34,
        showDivider: true,
        autoFit: true,
        typewriterCps: 22,
      },
      palette: {
        background: '#fff9ef',
        surface: '#e9f4ef',
        text: '#3f2c26',
        accent: '#d47773',
        muted: '#8c756a',
      },
      hookBackground: {
        mode: 'brand',
        media: {
          src: '/brand-studio/retro-cake.mp4',
          kind: 'video',
          name: 'Birthday motion background',
          fit: 'cover',
          focusX: 50,
          focusY: 50,
        },
        overlayOpacity: 0.54,
        blur: 0,
        motion: 'slow-zoom',
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
        musicStartSeconds: 0,
        musicFadeInSeconds: 0.45,
        musicFadeOutSeconds: 0.8,
        duckMusicForSfx: true,
        musicDuckLevel: 0.38,
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
        hookBridge: 'Ternyata kita sudah melewati banyak hal.',
        hookReveal: 'Simpan perjalanannya dalam satu digital gift.',
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
        partMotions: {
          eyebrow: 'fade',
          title: 'slide',
          accent: 'soft',
          footer: 'fade',
        },
        sequenceMode: 'single',
        exitTransition: 'slide-up',
        transitionSeconds: 0.6,
        alignment: 'left',
        textScale: 1,
        positionY: 32,
        showDivider: true,
        autoFit: true,
        typewriterCps: 19,
      },
      palette: {
        background: '#f7f0e8',
        surface: '#eadfd2',
        text: '#392d29',
        accent: '#9b6a50',
        muted: '#89766d',
      },
      hookBackground: {
        mode: 'brand',
        media: {
          src: '/brand-studio/atlas-first-date-warm.mp4',
          kind: 'video',
          name: 'Warm memory background',
          fit: 'cover',
          focusX: 50,
          focusY: 50,
        },
        overlayOpacity: 0.62,
        blur: 0,
        motion: 'drift',
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
        musicStartSeconds: 0,
        musicFadeInSeconds: 0.8,
        musicFadeOutSeconds: 1.2,
        duckMusicForSfx: true,
        musicDuckLevel: 0.44,
        transitionSfx: 'page-turn',
        transitionSfxVolume: 0.24,
        sfxOffsetSeconds: 0.2,
      },
    },
  },
};

export const BRAND_TEMPLATE_LIST = Object.values(BRAND_TEMPLATES);

export const BRAND_PALETTE_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  palette: BrandPalette;
}> = [
  {
    id: 'chalk-editorial',
    name: 'Chalk Editorial',
    description: 'Palet utama brand · terang dan premium',
    palette: {
      background: '#FAF7F2',
      surface: '#E8D9CB',
      text: '#1D1816',
      accent: '#A67C52',
      muted: '#78665B',
    },
  },
  {
    id: 'obsidian-night',
    name: 'Obsidian Night',
    description: 'Gelap, romantis, dan cinematic',
    palette: {
      background: '#1D1816',
      surface: '#382A24',
      text: '#FAF7F2',
      accent: '#CDAB8F',
      muted: '#B9A392',
    },
  },
  {
    id: 'onyx-boutique',
    name: 'Onyx Boutique',
    description: 'Hangat, dewasa, dan sophisticated',
    palette: {
      background: '#382A24',
      surface: '#4A3931',
      text: '#FAF7F2',
      accent: '#CDAB8F',
      muted: '#C6AE9A',
    },
  },
  {
    id: 'honey-letter',
    name: 'Honey Letter',
    description: 'Nostalgic dengan nuansa surat lama',
    palette: {
      background: '#A67C52',
      surface: '#CDAB8F',
      text: '#1D1816',
      accent: '#FAF7F2',
      muted: '#382A24',
    },
  },
  {
    id: 'driftwood-soft',
    name: 'Driftwood Soft',
    description: 'Lembut dan sentimental untuk hadiah',
    palette: {
      background: '#CDAB8F',
      surface: '#E5D2C1',
      text: '#1D1816',
      accent: '#382A24',
      muted: '#6F5649',
    },
  },
];

export interface BrandKitPreset {
  id: string;
  name: string;
  description: string;
  copy: Pick<BrandCopy, 'eyebrow' | 'hookFooter'>;
  hook: Pick<BrandHookSettings, 'typography' | 'alignment'>;
  palette: BrandPalette;
}

export const BRAND_KIT_PRESETS: BrandKitPreset[] = [
  {
    id: 'fya-signature',
    name: 'FYA Signature',
    description: 'Editorial hangat untuk digital letter dan soft selling.',
    copy: { eyebrow: 'FOR YOU. ALWAYS.', hookFooter: 'DIGITAL ATELIER' },
    hook: { typography: 'brand-serif', alignment: 'center' },
    palette: BRAND_PALETTE_PRESETS[0].palette,
  },
  {
    id: 'romance-studio',
    name: 'Romance Studio',
    description: 'Lembut, personal, dan cocok untuk momen romantis.',
    copy: { eyebrow: 'MADE WITH LOVE', hookFooter: 'A DIGITAL GIFT FOR YOU' },
    hook: { typography: 'editorial', alignment: 'center' },
    palette: {
      background: '#F8ECE9',
      surface: '#EBD0CC',
      text: '#402B2B',
      accent: '#B8646F',
      muted: '#8C6D6D',
    },
  },
  {
    id: 'bold-social',
    name: 'Bold Social',
    description: 'Kontras kuat untuk komedi, tren, dan hook cepat.',
    copy: { eyebrow: 'WAIT FOR IT.', hookFooter: 'DIGITAL GIFT REVEAL' },
    hook: { typography: 'bold', alignment: 'center' },
    palette: {
      background: '#F4E64C',
      surface: '#FFFFFF',
      text: '#161616',
      accent: '#E9503E',
      muted: '#5A5222',
    },
  },
  {
    id: 'midnight-letter',
    name: 'Midnight Letter',
    description: 'Cinematic gelap untuk LDR, apology, dan cerita emosional.',
    copy: { eyebrow: 'A LETTER AFTER MIDNIGHT', hookFooter: 'READ WHEN YOU ARE READY' },
    hook: { typography: 'classic', alignment: 'left' },
    palette: BRAND_PALETTE_PRESETS[1].palette,
  },
];

export interface BrandHookPreset {
  id: string;
  label: string;
  tone: string;
  description: string;
  copy: Pick<
    BrandCopy,
    'hookTitle' | 'hookAccent' | 'hookBridge' | 'hookReveal' | 'hookFooter'
  >;
  hook: Partial<BrandHookSettings>;
  palette: BrandPalette;
  audio: Pick<
    BrandAudioSettings,
    'transitionSfx' | 'transitionSfxVolume' | 'sfxOffsetSeconds'
  >;
  hookSeconds: number;
}

export const BRAND_HOOK_PRESETS: BrandHookPreset[] = [
  {
    id: 'romantic-letter',
    label: 'Romantis',
    tone: 'Lembut · Personal',
    description: 'Hook emosional yang berakhir pada digital letter.',
    copy: {
      hookTitle: 'Ada yang ingin aku bilang,',
      hookAccent: 'tapi chat terasa terlalu biasa.',
      hookBridge: 'Beberapa perasaan layak disimpan lebih lama.',
      hookReveal: 'Jadi aku membuat digital gift ini untukmu.',
      hookFooter: 'FOR YOU, ALWAYS.',
    },
    hook: {
      typography: 'brand-serif',
      motion: 'soft',
      partMotions: { eyebrow: 'fade', title: 'soft', accent: 'word-reveal', footer: 'fade' },
      sequenceMode: 'three-beat',
      alignment: 'center',
      autoFit: true,
    },
    palette: {
      background: '#FAF7F2',
      surface: '#E8D9CB',
      text: '#1D1816',
      accent: '#A67C52',
      muted: '#78665B',
    },
    audio: { transitionSfx: 'page-turn', transitionSfxVolume: 0.2, sfxOffsetSeconds: 0.1 },
    hookSeconds: 5.4,
  },
  {
    id: 'birthday-surprise',
    label: 'Ulang tahun',
    tone: 'Playful · Manis',
    description: 'Pembuka cepat untuk kejutan ulang tahun digital.',
    copy: {
      hookTitle: 'Kadomu sudah siap?',
      hookAccent: 'Jangan jawab “belum”.',
      hookBridge: 'Tahun ini bikin sesuatu yang benar-benar dia.',
      hookReveal: 'Ucapan, foto, dan kejutan dalam satu digital gift.',
      hookFooter: 'BIRTHDAY EDITION',
    },
    hook: {
      typography: 'bold',
      motion: 'pop',
      partMotions: { eyebrow: 'fade', title: 'pop', accent: 'pop', footer: 'soft' },
      sequenceMode: 'three-beat',
      alignment: 'center',
      autoFit: true,
    },
    palette: {
      background: '#FFF9EF',
      surface: '#E9F4EF',
      text: '#3F2C26',
      accent: '#D47773',
      muted: '#8C756A',
    },
    audio: { transitionSfx: 'ding', transitionSfxVolume: 0.22, sfxOffsetSeconds: 0.1 },
    hookSeconds: 5.1,
  },
  {
    id: 'ldr-message',
    label: 'LDR',
    tone: 'Rindu · Hangat',
    description: 'Cerita jarak jauh dengan reveal yang tidak memaksa.',
    copy: {
      hookTitle: 'Jarak memang jauh,',
      hookAccent: 'tapi aku masih menyimpan semuanya.',
      hookBridge: 'Foto, suara, dan cerita kecil kita.',
      hookReveal: 'Sekarang semuanya ada dalam digital gift ini.',
      hookFooter: 'CLOSER THAN DISTANCE',
    },
    hook: {
      typography: 'editorial',
      motion: 'cinematic',
      partMotions: { eyebrow: 'fade', title: 'cinematic', accent: 'soft', footer: 'fade' },
      sequenceMode: 'three-beat',
      alignment: 'center',
      autoFit: true,
    },
    palette: {
      background: '#1D1816',
      surface: '#382A24',
      text: '#FAF7F2',
      accent: '#CDAB8F',
      muted: '#B9A392',
    },
    audio: { transitionSfx: 'whoosh', transitionSfxVolume: 0.18, sfxOffsetSeconds: 0.2 },
    hookSeconds: 5.7,
  },
  {
    id: 'apology-letter',
    label: 'Minta maaf',
    tone: 'Tulus · Tenang',
    description: 'Hook permintaan maaf yang terasa dewasa dan natural.',
    copy: {
      hookTitle: 'Aku tahu kata “maaf”',
      hookAccent: 'tidak langsung memperbaiki semuanya.',
      hookBridge: 'Tapi aku ingin menjelaskannya dengan sungguh-sungguh.',
      hookReveal: 'Aku menulis semuanya di digital letter ini.',
      hookFooter: 'A LETTER FOR YOU',
    },
    hook: {
      typography: 'classic',
      motion: 'fade',
      partMotions: { eyebrow: 'fade', title: 'fade', accent: 'typewriter', footer: 'fade' },
      sequenceMode: 'three-beat',
      alignment: 'center',
      autoFit: true,
      typewriterCps: 24,
    },
    palette: {
      background: '#CDAB8F',
      surface: '#E5D2C1',
      text: '#1D1816',
      accent: '#382A24',
      muted: '#6F5649',
    },
    audio: { transitionSfx: 'page-turn', transitionSfxVolume: 0.16, sfxOffsetSeconds: 0.15 },
    hookSeconds: 6,
  },
  {
    id: 'graduation-circle',
    label: 'Wisuda',
    tone: 'Circle wish · Bangga',
    description: 'Teman-teman menyiapkan kumpulan ucapan digital.',
    copy: {
      hookTitle: 'Satu teman akhirnya wisuda,',
      hookAccent: 'satu circle langsung sibuk.',
      hookBridge: 'Bukan cari buket—kami mengumpulkan semua ucapan.',
      hookReveal: 'Lalu menjadikannya satu circle wish digital.',
      hookFooter: 'GRADUATION WISHES',
    },
    hook: {
      typography: 'clean',
      motion: 'word-reveal',
      partMotions: { eyebrow: 'fade', title: 'word-reveal', accent: 'pop', footer: 'soft' },
      sequenceMode: 'three-beat',
      alignment: 'left',
      autoFit: true,
    },
    palette: {
      background: '#FAF7F2',
      surface: '#E8D9CB',
      text: '#1D1816',
      accent: '#A67C52',
      muted: '#78665B',
    },
    audio: { transitionSfx: 'shutter-modern', transitionSfxVolume: 0.2, sfxOffsetSeconds: 0.1 },
    hookSeconds: 5.7,
  },
  {
    id: 'absurd-romance',
    label: 'Bucin absurd',
    tone: 'Komedi · Viral',
    description: 'Setup receh yang tetap masuk ke reveal produk digital.',
    copy: {
      hookTitle: 'Dia bilang aku kurang romantis.',
      hookAccent: 'Aku panik selama 3 menit.',
      hookBridge: 'Beli bunga? Layu. Kirim chat? Tenggelam.',
      hookReveal: 'Akhirnya aku bikin digital gift. Aman.',
      hookFooter: 'PANIC, BUT MAKE IT ROMANTIC',
    },
    hook: {
      typography: 'bold',
      motion: 'pop',
      partMotions: { eyebrow: 'slide', title: 'pop', accent: 'word-reveal', footer: 'pop' },
      sequenceMode: 'three-beat',
      alignment: 'center',
      autoFit: true,
    },
    palette: {
      background: '#382A24',
      surface: '#4A3931',
      text: '#FAF7F2',
      accent: '#CDAB8F',
      muted: '#C6AE9A',
    },
    audio: { transitionSfx: 'record-scratch', transitionSfxVolume: 0.22, sfxOffsetSeconds: 0.1 },
    hookSeconds: 5.4,
  },
  {
    id: 'soft-selling',
    label: 'Soft selling',
    tone: 'Premium · Minimal',
    description: 'Hook satu layar untuk memperkenalkan digital gift.',
    copy: {
      hookTitle: 'Hadiah terbaik tidak selalu',
      hookAccent: 'datang dalam sebuah kotak.',
      hookBridge: 'Ia bisa berisi kata, foto, dan kenangan.',
      hookReveal: 'Digital gift yang dibuat khusus untuk dia.',
      hookFooter: 'DIGITAL ATELIER',
    },
    hook: {
      typography: 'brand-serif',
      motion: 'soft',
      partMotions: { eyebrow: 'fade', title: 'soft', accent: 'word-reveal', footer: 'fade' },
      sequenceMode: 'single',
      alignment: 'center',
      autoFit: true,
    },
    palette: {
      background: '#FAF7F2',
      surface: '#E8D9CB',
      text: '#1D1816',
      accent: '#A67C52',
      muted: '#78665B',
    },
    audio: { transitionSfx: 'whoosh', transitionSfxVolume: 0.18, sfxOffsetSeconds: 0.2 },
    hookSeconds: 3.8,
  },
];

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

