import type { EndTransition, EndTransitionSfx } from '@/types';

export const END_TRANSITION_OPTIONS: ReadonlyArray<{
  id: EndTransition;
  label: string;
  description: string;
}> = [
  { id: 'none', label: 'Tanpa transisi', description: 'Video berhenti seperti biasa' },
  { id: 'fade', label: 'Fade gelap', description: 'Penutup lembut dan aman' },
  { id: 'wipe', label: 'Wipe WhatsApp', description: 'Sapuan hijau dari kanan' },
  { id: 'iris', label: 'Iris', description: 'Lingkaran menutup ke akhir' },
  { id: 'flash', label: 'Flash', description: 'Kilat cepat lalu gelap' },
];

export const END_TRANSITION_SFX_OPTIONS: ReadonlyArray<{
  id: EndTransitionSfx;
  label: string;
  file: string | null;
}> = [
  { id: 'none', label: 'Tanpa SFX', file: null },
  { id: 'whoosh', label: 'Whoosh · halus', file: 'sounds/sfx/whoosh.wav' },
  { id: 'page-turn', label: 'Page Turn · lembut', file: 'sounds/sfx/page-turn.wav' },
  { id: 'mouse-click', label: 'Click · singkat', file: 'sounds/sfx/mouse-click.wav' },
  { id: 'tension-boom', label: 'Boom · dramatis', file: 'sounds/sfx/vine-boom.wav' },
];

export function getEndTransitionSfx(id: EndTransitionSfx | undefined) {
  return END_TRANSITION_SFX_OPTIONS.find((option) => option.id === id);
}
