import type { BrandHookBeatDurations, BrandHookEnabledBeats } from '@/types/brand';

export const BRAND_BEAT_MIN_SECONDS = 0.8;
export const BRAND_BEAT_MAX_SECONDS = 4;

const roundTenths = (value: number) => Math.round(value * 10) / 10;

export function splitBrandHookBeatDurations(totalSeconds: number): BrandHookBeatDurations {
  const safeTotal = Math.max(BRAND_BEAT_MIN_SECONDS * 3, roundTenths(totalSeconds));
  const shared = Math.max(BRAND_BEAT_MIN_SECONDS, Math.floor((safeTotal / 3) * 10) / 10);
  return [shared, shared, roundTenths(safeTotal - shared * 2)];
}

export function resolveBrandHookBeatDurations(
  durations: BrandHookBeatDurations | undefined,
  totalSeconds: number,
): BrandHookBeatDurations {
  if (
    !durations ||
    durations.length !== 3 ||
    durations.some((value) => !Number.isFinite(value) || value <= 0)
  ) {
    return splitBrandHookBeatDurations(totalSeconds);
  }

  return durations.map((value) => roundTenths(value)) as BrandHookBeatDurations;
}

// Beat pertama selalu menjadi hook utama. Save lama yang belum memiliki
// properti ini tetap dibaca sebagai tiga beat aktif agar kompatibel.
export function resolveBrandHookEnabledBeats(
  enabledBeats: BrandHookEnabledBeats | undefined,
): BrandHookEnabledBeats {
  return [true, enabledBeats?.[1] !== false, enabledBeats?.[2] !== false];
}

export function sumBrandHookBeatDurations(durations: BrandHookBeatDurations) {
  return roundTenths(durations.reduce((sum, value) => sum + value, 0));
}

export function sumActiveBrandHookBeatDurations(
  durations: BrandHookBeatDurations,
  enabledBeats: BrandHookEnabledBeats,
) {
  return roundTenths(
    durations.reduce((sum, value, index) => sum + (enabledBeats[index] ? value : 0), 0),
  );
}
