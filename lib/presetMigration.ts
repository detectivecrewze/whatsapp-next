import type { CloudPreset, EditorState } from '@/types';

export const CURRENT_CLOUD_PRESET_VERSION = 4;

export function isLegacyCloudPreset(preset: Pick<CloudPreset, 'schemaVersion'>): boolean {
  return (preset.schemaVersion ?? 1) < CURRENT_CLOUD_PRESET_VERSION;
}

/**
 * Version 2 introduced the chat-driven status-bar clock, version 3 adds
 * background music, and version 4 adds a separate hold for silent images.
 * Explicit defaults stop older projects from inheriting settings from
 * whichever project was open immediately before them.
 */
export function migrateCloudPresetData(
  data: Partial<EditorState>,
  schemaVersion?: number,
): Partial<EditorState> {
  const sourceVersion = schemaVersion ?? 1;
  if (sourceVersion >= CURRENT_CLOUD_PRESET_VERSION) return data;

  return {
    ...data,
    ...(sourceVersion < 2 ? { useCustomTime: false } : {}),
    ...(sourceVersion < 3 ? {
      enableBgm: false,
      bgmUrl: null,
      bgmName: '',
      bgmVolume: 0.18,
      bgmPitchSemitones: 0,
      bgmStartAt: 0,
      bgmFadeIn: 1,
      bgmFadeOut: 1.25,
      bgmLoop: true,
      bgmDucking: true,
      bgmDuckVolume: 0.25,
    } : {}),
    imageHoldMs: data.imageHoldMs ?? 4000,
  };
}
