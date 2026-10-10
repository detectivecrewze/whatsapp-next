import type { EditorState } from '@/types';

export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;

export type WhatsAppVideoProps = Pick<
  EditorState,
  | 'name'
  | 'pfp'
  | 'phoneOs'
  | 'chatType'
  | 'groupSubtitle'
  | 'batteryLevel'
  | 'customTime'
  | 'useCustomTime'
  | 'bgType'
  | 'bgColor'
  | 'bubbleColor'
  | 'bgImage'
  | 'messages'
  | 'holdMs'
  | 'replyDelay'
  | 'useTyping'
  | 'useSoundIn'
  | 'useSoundOut'
  | 'autoZoom'
  | 'zoomScale'
  | 'zoomSpeed'
  | 'enableTts'
  | 'ttsAudioMap'
  | 'ttsSpeed'
  | 'headerStatus'
  | 'headerStatusText'
  | 'pinnedMessage'
  | 'unreadCount'
  | 'dateBadge'
> & {
  voiceDurationsMs?: Record<string, number>;
};

