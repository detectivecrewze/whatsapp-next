import type { CloudPreset, EditorState } from '@/types';

export const CURRENT_CLOUD_PRESET_VERSION = 2;

export function isLegacyCloudPreset(preset: Pick<CloudPreset, 'schemaVersion'>): boolean {
  return (preset.schemaVersion ?? 1) < CURRENT_CLOUD_PRESET_VERSION;
}

/**
 * Version 2 introduced a status-bar clock driven by each bubble's timestamp.
 * Older projects could persist the former fixed clock, so disable that legacy
 * override while leaving explicitly configured clocks in new projects intact.
 */
export function migrateCloudPresetData(
  data: Partial<EditorState>,
  schemaVersion?: number,
): Partial<EditorState> {
  if ((schemaVersion ?? 1) >= CURRENT_CLOUD_PRESET_VERSION) return data;

  return {
    ...data,
    useCustomTime: false,
  };
}
