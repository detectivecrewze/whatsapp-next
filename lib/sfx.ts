import type { SfxId } from '@/types';

export type SfxCategory = 'Horror & tegang' | 'Komedi' | 'Drama & transisi';

export type SfxDefinition = {
  id: SfxId;
  label: string;
  description: string;
  category: SfxCategory;
  file: string;
};

export const SFX_LIBRARY: readonly SfxDefinition[] = [
  { id: 'horror-sting', label: 'Horror Sting', description: 'Tusukan dramatis untuk reveal menyeramkan', category: 'Horror & tegang', file: 'sounds/sfx/dramatic-boomer.wav' },
  { id: 'eerie-hit', label: 'Eerie Hit', description: 'Aksen ganjil untuk pesan yang bikin curiga', category: 'Horror & tegang', file: 'sounds/sfx/fah.wav' },
  { id: 'bone-crack', label: 'Bone Crack', description: 'Retakan keras untuk shock moment', category: 'Horror & tegang', file: 'sounds/sfx/bone-crack.wav' },
  { id: 'tension-boom', label: 'Tension Boom', description: 'Impact berat untuk plot twist', category: 'Horror & tegang', file: 'sounds/sfx/vine-boom.wav' },
  { id: 'camera-shutter', label: 'Kamera Tua', description: 'Cocok untuk foto, CCTV, atau bukti visual', category: 'Horror & tegang', file: 'sounds/sfx/shutter-old.wav' },
  { id: 'whip-hit', label: 'Whip Hit', description: 'Aksen tajam untuk ancaman mendadak', category: 'Horror & tegang', file: 'sounds/sfx/whip.wav' },
  { id: 'light-switch', label: 'Lampu Dimatikan', description: 'Klik sakelar untuk adegan gelap atau mati lampu', category: 'Horror & tegang', file: 'sounds/sfx/switch.wav' },
  { id: 'modern-shutter', label: 'Kamera Modern', description: 'Foto bukti, selfie misterius, atau CCTV', category: 'Horror & tegang', file: 'sounds/sfx/shutter-modern.wav' },
  { id: 'horror-scream', label: 'Horror Scream', description: 'Jeritan untuk puncak jumpscare', category: 'Horror & tegang', file: 'sounds/sfx/wilhelm-scream.wav' },
  { id: 'creepy-notification', label: 'Creepy Notification', description: 'Notifikasi asing di momen sunyi', category: 'Horror & tegang', file: 'sounds/sfx/snapchat-notification.wav' },
  { id: 'mystery-reveal', label: 'Mystery Reveal', description: 'Pengungkapan teori atau identitas misterius', category: 'Horror & tegang', file: 'sounds/sfx/illuminati-confirmed.wav' },
  { id: 'panic-triggered', label: 'Panic Triggered', description: 'Tensi naik cepat dan suasana kacau', category: 'Horror & tegang', file: 'sounds/sfx/triggered.wav' },
  { id: 'glitch-loading', label: 'Glitch / Loading', description: 'Gangguan sinyal, CCTV, atau chat tersendat', category: 'Horror & tegang', file: 'sounds/sfx/loading-lag.wav' },
  { id: 'record-scratch', label: 'Record Scratch', description: 'Berhenti mendadak atau twist kocak', category: 'Komedi', file: 'sounds/sfx/record-scratch.wav' },
  { id: 'ding', label: 'Ding', description: 'Punchline ringan atau ide muncul', category: 'Komedi', file: 'sounds/sfx/ding.wav' },
  { id: 'bruh', label: 'Bruh', description: 'Reaksi absurd atau memalukan', category: 'Komedi', file: 'sounds/sfx/bruh.wav' },
  { id: 'comedy-fail', label: 'Comedy Fail', description: 'Punchline gagal total', category: 'Komedi', file: 'sounds/sfx/spongebob-fail.wav' },
  { id: 'anime-wow', label: 'Anime Wow', description: 'Kejutan lucu dan berlebihan', category: 'Komedi', file: 'sounds/sfx/anime-wow.wav' },
  { id: 'yippee', label: 'Yippee', description: 'Momen senang atau kemenangan kecil', category: 'Komedi', file: 'sounds/sfx/yippee.wav' },
  { id: 'xp-error', label: 'Windows Error', description: 'Kesalahan konyol atau respons tidak masuk akal', category: 'Komedi', file: 'sounds/sfx/windows-xp-error.wav' },
  { id: 'hell-nah', label: 'Hell Nah', description: 'Reaksi menolak sesuatu yang absurd', category: 'Komedi', file: 'sounds/sfx/omg-hell-nah.wav' },
  { id: 'price-fail', label: 'Big Fail', description: 'Kegagalan besar di akhir punchline', category: 'Komedi', file: 'sounds/sfx/price-is-right-fail.wav' },
  { id: 'oh-my-god', label: 'Oh My God', description: 'Reaksi kaget yang berlebihan', category: 'Komedi', file: 'sounds/sfx/oh-my-god-vine.wav' },
  { id: 'game-hurt', label: 'Game Hurt', description: 'Kena mental atau tersakiti secara lucu', category: 'Komedi', file: 'sounds/sfx/minecraft-hurt.wav' },
  { id: 'quack', label: 'Quack', description: 'Aksen random untuk humor absurd', category: 'Komedi', file: 'sounds/sfx/mac-quack.wav' },
  { id: 'skedaddle', label: 'Skedaddle', description: 'Kabur cepat atau menghilang dari masalah', category: 'Komedi', file: 'sounds/sfx/skedaddle.wav' },
  { id: 'confused-what', label: 'Confused What', description: 'Reaksi bingung pada pesan yang aneh', category: 'Komedi', file: 'sounds/sfx/sanctuary-guardian-what.wav' },
  { id: 'nelly-ahh', label: 'Nelly Ahh', description: 'Reaction singkat untuk punchline receh', category: 'Komedi', file: 'sounds/sfx/nelly-ahh.wav' },
  { id: 'whoosh', label: 'Whoosh', description: 'Reveal produk atau perpindahan fokus', category: 'Drama & transisi', file: 'sounds/sfx/whoosh.wav' },
  { id: 'page-turn', label: 'Page Turn', description: 'Membuka pesan, surat, atau cerita baru', category: 'Drama & transisi', file: 'sounds/sfx/page-turn.wav' },
  { id: 'mouse-click', label: 'Mouse Click', description: 'Klik link, tombol, atau membuka halaman', category: 'Drama & transisi', file: 'sounds/sfx/mouse-click.wav' },
  { id: 'romance', label: 'Romance', description: 'Reveal romantis atau momen manis', category: 'Drama & transisi', file: 'sounds/sfx/romance-meme.wav' },
] as const;

const SFX_BY_ID = new Map<SfxId, SfxDefinition>(
  SFX_LIBRARY.map((item) => [item.id, item]),
);

export function normalizeSfxId(value: unknown): SfxId | undefined {
  if (typeof value !== 'string') return undefined;
  return SFX_BY_ID.has(value as SfxId) ? (value as SfxId) : undefined;
}

export function getSfxDefinition(id?: SfxId | null): SfxDefinition | undefined {
  return id ? SFX_BY_ID.get(id) : undefined;
}

export function getSfxVolume(value?: number): number {
  const resolved = typeof value === 'number' ? value : 0.22;
  // Migrate the original feature default without changing deliberate slider values.
  const migrated = Math.abs(resolved - 0.72) < 0.001 ? 0.22 : resolved;
  return Math.max(0, Math.min(1, migrated));
}

export const SFX_AI_IDS = SFX_LIBRARY.map((item) => item.id).join(', ');
