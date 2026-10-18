import type {
  BrandAudioSettings,
  BrandContentGoal,
  BrandCopy,
  BrandHookSettings,
  BrandPalette,
} from '@/types/brand';

export type BrandTemplatePackCategory =
  | 'romance'
  | 'comedy'
  | 'special'
  | 'group'
  | 'horror'
  | 'soft-sell';

export interface BrandTemplatePackDefinition {
  id: string;
  name: string;
  category: BrandTemplatePackCategory;
  categoryLabel: string;
  description: string;
  badge: string;
  format: 'Hook Maker';
  beats: 1 | 3;
  tags: string[];
  goal: BrandContentGoal;
  copy: Pick<
    BrandCopy,
    'eyebrow' | 'hookTitle' | 'hookAccent' | 'hookBridge' | 'hookReveal' | 'hookFooter'
  > & Partial<Pick<BrandCopy, 'hookBridgeAccent' | 'hookRevealAccent'>>;
  hook: Partial<BrandHookSettings>;
  palette: BrandPalette;
  audio: Pick<
    BrandAudioSettings,
    'transitionSfx' | 'transitionSfxVolume' | 'sfxOffsetSeconds'
  >;
  hookSeconds: number;
}

export const BRAND_TEMPLATE_PACK_CATEGORIES: Array<{
  id: 'all' | BrandTemplatePackCategory;
  label: string;
}> = [
  { id: 'all', label: 'Semua' },
  { id: 'romance', label: 'Romantis' },
  { id: 'comedy', label: 'Komedi' },
  { id: 'special', label: 'Momen spesial' },
  { id: 'group', label: 'Group' },
  { id: 'horror', label: 'Horror' },
  { id: 'soft-sell', label: 'Soft selling' },
];

const softPalette: BrandPalette = {
  background: '#FAF7F2',
  surface: '#E8D9CB',
  text: '#1D1816',
  accent: '#A67C52',
  muted: '#78665B',
};

const pinkPalette: BrandPalette = {
  background: '#FFF4F5',
  surface: '#F4D8DA',
  text: '#41292B',
  accent: '#B8646F',
  muted: '#8C6D6D',
};

const boldPalette: BrandPalette = {
  background: '#F8E84E',
  surface: '#FFFFFF',
  text: '#151515',
  accent: '#EB4D3D',
  muted: '#5F5624',
};

const nightPalette: BrandPalette = {
  background: '#121619',
  surface: '#253038',
  text: '#F7F3EE',
  accent: '#9CC7B8',
  muted: '#A2AFAB',
};

const celebrationPalette: BrandPalette = {
  background: '#FFF8E8',
  surface: '#E8F4ED',
  text: '#342D29',
  accent: '#D47773',
  muted: '#85766E',
};

const groupPalette: BrandPalette = {
  background: '#EFF5FF',
  surface: '#D7E5F8',
  text: '#192B46',
  accent: '#4C77B8',
  muted: '#68778E',
};

export const BRAND_TEMPLATE_PACKS: BrandTemplatePackDefinition[] = [
  {
    id: 'ngambek-perhatian',
    name: 'Ngambek Kurang Perhatian',
    category: 'romance',
    categoryLabel: 'Romantis',
    description: 'Konflik kecil yang jelas, lalu ditutup dengan gesture digital yang personal.',
    badge: 'RELATIONSHIP',
    format: 'Hook Maker',
    beats: 3,
    tags: ['Bucin', 'Konflik jelas', 'Voice-friendly'],
    goal: 'emotion',
    copy: {
      eyebrow: 'A LITTLE REMINDER',
      hookTitle: '{nama} ngambek karena aku terlalu sibuk,',
      hookAccent: 'dan chat “maaf” saja rasanya kurang.',
      hookBridge: 'Jadi kali ini aku berhenti cari alasan.',
      hookReveal: 'Aku bikin {produk} yang bisa dibuka kapan pun {nama} butuh aku.',
      hookFooter: 'FOR YOU, ALWAYS.',
    },
    hook: {
      typography: 'brand-serif',
      motion: 'soft',
      sequenceMode: 'three-beat',
      partMotions: { eyebrow: 'fade', title: 'soft', accent: 'word-reveal', footer: 'fade' },
      exitTransition: 'fade',
      transitionSeconds: 0.6,
      alignment: 'center',
      autoFit: true,
    },
    palette: pinkPalette,
    audio: { transitionSfx: 'page-turn', transitionSfxVolume: 0.18, sfxOffsetSeconds: 0.1 },
    hookSeconds: 5.6,
  },
  {
    id: 'ldr-midnight',
    name: 'LDR Tengah Malam',
    category: 'romance',
    categoryLabel: 'Romantis',
    description: 'Hook tenang untuk pasangan jauh yang kesulitan menyampaikan rasa lewat chat.',
    badge: 'LDR STORY',
    format: 'Hook Maker',
    beats: 3,
    tags: ['LDR', 'Emosional', 'Cinematic'],
    goal: 'emotion',
    copy: {
      eyebrow: 'MILES APART, STILL CLOSE',
      hookTitle: 'Jam segini aku biasanya cuma bilang,',
      hookAccent: '“jangan lupa istirahat ya, {nama}.”',
      hookBridge: 'Padahal ada banyak hal yang tidak muat dalam satu chat.',
      hookReveal: 'Jadi semuanya aku simpan di {produk} ini.',
      hookFooter: 'OPEN WHEN YOU MISS ME.',
    },
    hook: {
      typography: 'classic',
      motion: 'cinematic',
      sequenceMode: 'three-beat',
      partMotions: { eyebrow: 'fade', title: 'blur', accent: 'word-reveal', footer: 'fade' },
      exitTransition: 'fade',
      transitionSeconds: 0.75,
      alignment: 'left',
      autoFit: true,
    },
    palette: nightPalette,
    audio: { transitionSfx: 'whoosh', transitionSfxVolume: 0.14, sfxOffsetSeconds: 0.2 },
    hookSeconds: 5.8,
  },
  {
    id: 'apology-soft',
    name: 'Minta Maaf Tanpa Maksa',
    category: 'romance',
    categoryLabel: 'Romantis',
    description: 'Mengakui kesalahan lebih dulu, kemudian memberi ruang kepada penerima.',
    badge: 'APOLOGY LETTER',
    format: 'Hook Maker',
    beats: 3,
    tags: ['Minta maaf', 'Natural', 'Closure'],
    goal: 'emotion',
    copy: {
      eyebrow: 'NO EXCUSES THIS TIME',
      hookTitle: 'Aku tahu yang bikin {nama} kecewa,',
      hookAccent: 'bukan cuma satu kejadian kemarin.',
      hookBridge: 'Aku tidak minta semuanya langsung baik-baik saja.',
      hookReveal: 'Aku cuma ingin jujur lewat {produk} ini. Buka saat kamu siap.',
      hookFooter: 'TAKE ALL THE TIME YOU NEED.',
    },
    hook: {
      typography: 'editorial',
      motion: 'soft',
      sequenceMode: 'three-beat',
      partMotions: { eyebrow: 'fade', title: 'soft', accent: 'typewriter', footer: 'fade' },
      exitTransition: 'fade',
      transitionSeconds: 0.7,
      alignment: 'left',
      autoFit: true,
    },
    palette: softPalette,
    audio: { transitionSfx: 'page-turn', transitionSfxVolume: 0.15, sfxOffsetSeconds: 0.2 },
    hookSeconds: 6,
  },
  {
    id: 'terserah-ujian',
    name: '“Terserah” Ujian Nasional',
    category: 'comedy',
    categoryLabel: 'Komedi',
    description: 'Masalah receh pasangan dibuat seperti ujian hidup, lalu masuk ke reveal.',
    badge: 'ABSURD COMEDY',
    format: 'Hook Maker',
    beats: 3,
    tags: ['Bucin', 'Absurd', 'Punchy'],
    goal: 'comedy',
    copy: {
      eyebrow: 'PERTANYAAN PALING SULIT',
      hookTitle: '{nama} bilang “terserah”,',
      hookAccent: 'tapi semua jawabanku ternyata salah.',
      hookBridge: 'Pilihan A: diam. Pilihan B: pindah kewarganegaraan.',
      hookReveal: 'Aku pilih C: kirim {produk} sebelum situasinya makin nasional.',
      hookFooter: 'DO NOT TRY THIS AT HOME.',
    },
    hook: {
      typography: 'bold',
      motion: 'pop',
      sequenceMode: 'three-beat',
      partMotions: { eyebrow: 'fade', title: 'pop', accent: 'slide', footer: 'pop' },
      exitTransition: 'zoom',
      transitionSeconds: 0.35,
      alignment: 'center',
      autoFit: true,
    },
    palette: boldPalette,
    audio: { transitionSfx: 'vine-boom', transitionSfxVolume: 0.2, sfxOffsetSeconds: 0.05 },
    hookSeconds: 5.2,
  },
  {
    id: 'salah-kirim',
    name: 'Salah Kirim, Benar Sayang',
    category: 'comedy',
    categoryLabel: 'Komedi',
    description: 'Hook salah kirim yang cepat dan ringan untuk menuju link kejutan.',
    badge: 'CHAT COMEDY',
    format: 'Hook Maker',
    beats: 3,
    tags: ['Salah kirim', 'Cepat', 'Viral'],
    goal: 'retention',
    copy: {
      eyebrow: 'WRONG CHAT. RIGHT PERSON.',
      hookTitle: 'Aku tidak sengaja kirim link ke {nama},',
      hookAccent: 'padahal kejutannya belum siap.',
      hookBridge: 'Pesannya sudah dibaca. Harga diriku ikut terbaca.',
      hookReveal: 'Untung yang terbuka adalah {produk}, bukan riwayat pencarianku.',
      hookFooter: 'MISSION FAILED SUCCESSFULLY.',
    },
    hook: {
      typography: 'clean',
      motion: 'slide',
      sequenceMode: 'three-beat',
      partMotions: { eyebrow: 'fade', title: 'slide', accent: 'pop', footer: 'fade' },
      exitTransition: 'slide-up',
      transitionSeconds: 0.4,
      alignment: 'left',
      autoFit: true,
    },
    palette: celebrationPalette,
    audio: { transitionSfx: 'record-scratch', transitionSfxVolume: 0.18, sfxOffsetSeconds: 0.08 },
    hookSeconds: 5.1,
  },
  {
    id: 'dikira-selingkuh',
    name: 'Dikira Selingkuh',
    category: 'comedy',
    categoryLabel: 'Komedi',
    description: 'Kesalahpahaman dramatis yang berakhir pada kejutan digital gift.',
    badge: 'PLOT TWIST',
    format: 'Hook Maker',
    beats: 3,
    tags: ['Drama receh', 'Plot twist', 'Reveal'],
    goal: 'comedy',
    copy: {
      eyebrow: 'THIS LOOKS SUSPICIOUS',
      hookTitle: '{nama} lihat aku senyum sendiri ke HP,',
      hookAccent: 'dan langsung menyiapkan 47 pertanyaan.',
      hookBridge: 'Aku memang menyembunyikan sesuatu sejak semalam.',
      hookReveal: 'Bukan orang lain. Cuma {produk} yang aku siapkan buat {nama}.',
      hookFooter: 'CASE CLOSED.',
    },
    hook: {
      typography: 'bold',
      motion: 'cinematic',
      sequenceMode: 'three-beat',
      partMotions: { eyebrow: 'fade', title: 'cinematic', accent: 'pop', footer: 'fade' },
      exitTransition: 'zoom',
      transitionSeconds: 0.45,
      alignment: 'center',
      autoFit: true,
    },
    palette: nightPalette,
    audio: { transitionSfx: 'dramatic-boomer', transitionSfxVolume: 0.2, sfxOffsetSeconds: 0.05 },
    hookSeconds: 5.4,
  },
  {
    id: 'birthday-link',
    name: 'Birthday Link Surprise',
    category: 'special',
    categoryLabel: 'Momen spesial',
    description: 'Pembuka ulang tahun singkat dengan kejutan yang langsung terasa personal.',
    badge: 'BIRTHDAY',
    format: 'Hook Maker',
    beats: 3,
    tags: ['Birthday', 'Playful', 'Gift reveal'],
    goal: 'conversion',
    copy: {
      eyebrow: 'ONE LINK. MANY MEMORIES.',
      hookTitle: 'Ulang tahun {nama} tinggal sebentar lagi,',
      hookAccent: 'dan ucapan biasa terasa terlalu biasa.',
      hookBridge: 'Jadi foto, pesan, dan kejutan kecilnya aku kumpulkan.',
      hookReveal: 'Semuanya ada di {produk} yang dibuat khusus untuk {nama}.',
      hookFooter: 'HAPPY BIRTHDAY EDITION.',
    },
    hook: {
      typography: 'bold',
      motion: 'pop',
      sequenceMode: 'three-beat',
      partMotions: { eyebrow: 'fade', title: 'pop', accent: 'word-reveal', footer: 'soft' },
      exitTransition: 'slide-up',
      transitionSeconds: 0.45,
      alignment: 'center',
      autoFit: true,
    },
    palette: celebrationPalette,
    audio: { transitionSfx: 'ding', transitionSfxVolume: 0.2, sfxOffsetSeconds: 0.08 },
    hookSeconds: 5.4,
  },
  {
    id: 'anniversary-capsule',
    name: 'Anniversary Time Capsule',
    category: 'special',
    categoryLabel: 'Momen spesial',
    description: 'Hook nostalgia untuk merangkum perjalanan hubungan tanpa terasa berlebihan.',
    badge: 'ANNIVERSARY',
    format: 'Hook Maker',
    beats: 3,
    tags: ['Anniversary', 'Kenangan', 'Premium'],
    goal: 'emotion',
    copy: {
      eyebrow: 'ANOTHER YEAR WITH YOU',
      hookTitle: 'Ternyata kita sudah melewati banyak hal,',
      hookAccent: 'yang dulu cuma tersimpan di galeri.',
      hookBridge: 'Aku ingin {nama} bisa membukanya lagi kapan saja.',
      hookReveal: 'Jadi semua kenangan itu aku jadikan {produk}.',
      hookFooter: 'OUR LITTLE TIME CAPSULE.',
    },
    hook: {
      typography: 'brand-serif',
      motion: 'cinematic',
      sequenceMode: 'three-beat',
      partMotions: { eyebrow: 'fade', title: 'soft', accent: 'word-reveal', footer: 'fade' },
      exitTransition: 'fade',
      transitionSeconds: 0.75,
      alignment: 'center',
      autoFit: true,
    },
    palette: softPalette,
    audio: { transitionSfx: 'page-turn', transitionSfxVolume: 0.16, sfxOffsetSeconds: 0.15 },
    hookSeconds: 5.8,
  },
  {
    id: 'graduation-circle',
    name: 'Wisuda Circle Wish',
    category: 'group',
    categoryLabel: 'Group',
    description: 'Teman-teman mengumpulkan ucapan dan foto menjadi hadiah wisuda digital.',
    badge: 'GROUP WISH',
    format: 'Hook Maker',
    beats: 3,
    tags: ['Wisuda', 'Circle', 'Group reveal'],
    goal: 'conversion',
    copy: {
      eyebrow: 'THE GROUP CHAT HAD A PLAN',
      hookTitle: '{nama} akhirnya wisuda,',
      hookAccent: 'dan satu ucapan dari kami jelas tidak cukup.',
      hookBridge: 'Satu circle diam-diam mengumpulkan pesan, foto, dan doa.',
      hookReveal: 'Sekarang semuanya hidup di satu {produk} untuk {nama}.',
      hookFooter: 'FROM ALL OF US, FOR YOU.',
    },
    hook: {
      typography: 'editorial',
      motion: 'soft',
      sequenceMode: 'three-beat',
      partMotions: { eyebrow: 'fade', title: 'slide', accent: 'word-reveal', footer: 'fade' },
      exitTransition: 'slide-up',
      transitionSeconds: 0.55,
      alignment: 'center',
      autoFit: true,
    },
    palette: groupPalette,
    audio: { transitionSfx: 'yippee', transitionSfxVolume: 0.18, sfxOffsetSeconds: 0.08 },
    hookSeconds: 5.7,
  },
  {
    id: 'farewell-team',
    name: 'Farewell Team Card',
    category: 'group',
    categoryLabel: 'Group',
    description: 'Perpisahan teman atau rekan kerja dengan ucapan kolektif yang hangat.',
    badge: 'FAREWELL',
    format: 'Hook Maker',
    beats: 3,
    tags: ['Perpisahan', 'Team', 'Collective gift'],
    goal: 'emotion',
    copy: {
      eyebrow: 'NOT A GOODBYE',
      hookTitle: 'Besok kursi {nama} mungkin sudah kosong,',
      hookAccent: 'tapi cerita kita jelas belum selesai.',
      hookBridge: 'Semua orang punya satu hal yang ingin disampaikan.',
      hookReveal: 'Kami mengumpulkannya dalam {produk} yang bisa dibawa ke mana saja.',
      hookFooter: 'FROM THE WHOLE TEAM.',
    },
    hook: {
      typography: 'classic',
      motion: 'soft',
      sequenceMode: 'three-beat',
      partMotions: { eyebrow: 'fade', title: 'soft', accent: 'typewriter', footer: 'fade' },
      exitTransition: 'fade',
      transitionSeconds: 0.7,
      alignment: 'left',
      autoFit: true,
    },
    palette: groupPalette,
    audio: { transitionSfx: 'page-turn', transitionSfxVolume: 0.14, sfxOffsetSeconds: 0.18 },
    hookSeconds: 5.9,
  },
  {
    id: 'midnight-link',
    name: 'Link Tengah Malam',
    category: 'horror',
    categoryLabel: 'Horror',
    description: 'Build-up misterius yang aman untuk mengantar penonton ke reveal digital.',
    badge: 'MYSTERY REVEAL',
    format: 'Hook Maker',
    beats: 3,
    tags: ['Horror ringan', 'Mystery', 'Retention'],
    goal: 'retention',
    copy: {
      eyebrow: '00:03 — UNKNOWN MESSAGE',
      hookTitle: 'Tengah malam {nama} menerima satu link,',
      hookAccent: 'tanpa nama pengirim dan tanpa penjelasan.',
      hookBridge: 'Di dalamnya ada semua foto yang seharusnya sudah terlupakan.',
      hookReveal: 'Ternyata itu {produk} yang diam-diam disiapkan seseorang.',
      hookFooter: 'WOULD YOU OPEN IT?',
    },
    hook: {
      typography: 'typewriter',
      motion: 'blur',
      sequenceMode: 'three-beat',
      partMotions: { eyebrow: 'typewriter', title: 'blur', accent: 'typewriter', footer: 'fade' },
      exitTransition: 'zoom',
      transitionSeconds: 0.6,
      alignment: 'left',
      autoFit: true,
      typewriterCps: 18,
    },
    palette: nightPalette,
    audio: { transitionSfx: 'dramatic-boomer', transitionSfxVolume: 0.18, sfxOffsetSeconds: 0.15 },
    hookSeconds: 6,
  },
  {
    id: 'not-just-link',
    name: 'Bukan Cuma Link',
    category: 'soft-sell',
    categoryLabel: 'Soft selling',
    description: 'Menjelaskan nilai digital gift dengan bahasa sederhana dan tidak memaksa.',
    badge: 'PRODUCT VALUE',
    format: 'Hook Maker',
    beats: 3,
    tags: ['Edukasi', 'Product value', 'Soft CTA'],
    goal: 'conversion',
    copy: {
      eyebrow: 'MORE THAN A MESSAGE',
      hookTitle: 'Kelihatannya memang cuma satu link,',
      hookAccent: 'sampai {nama} membukanya.',
      hookBridge: 'Di dalamnya ada pesan, foto,',
      hookBridgeAccent: 'dan momen yang dibuat personal.',
      hookReveal: 'Itulah kenapa {produk} terasa seperti hadiah,',
      hookRevealAccent: 'bukan sekadar halaman.',
      hookFooter: 'MADE PERSONAL. SENT INSTANTLY.',
    },
    hook: {
      typography: 'brand-serif',
      motion: 'soft',
      sequenceMode: 'three-beat',
      partMotions: { eyebrow: 'fade', title: 'soft', accent: 'word-reveal', footer: 'fade' },
      exitTransition: 'slide-up',
      transitionSeconds: 0.55,
      alignment: 'center',
      autoFit: true,
    },
    palette: softPalette,
    audio: { transitionSfx: 'ding', transitionSfxVolume: 0.16, sfxOffsetSeconds: 0.12 },
    hookSeconds: 5.5,
  },
];

export function personalizeTemplatePackCopy(
  copy: BrandTemplatePackDefinition['copy'],
  recipientName: string,
  productName: string,
) {
  const replacements = {
    nama: recipientName.trim() || 'dia',
    produk: productName.trim() || 'digital gift',
  };

  return Object.fromEntries(
    Object.entries(copy).map(([key, value]) => [
      key,
      value.replaceAll('{nama}', replacements.nama).replaceAll('{produk}', replacements.produk),
    ]),
  ) as BrandTemplatePackDefinition['copy'];
}
