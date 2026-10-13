import type { Message } from '@/types';

export function isVisualMessage(message: Pick<Message, 'type'>): boolean {
  return message.type === 'image' || message.type === 'view_once';
}

export function getMessageHoldMs({
  message,
  holdMs,
  imageHoldMs,
  hasVoice = false,
}: {
  message: Pick<Message, 'type' | 'customHoldMs'>;
  holdMs: number;
  imageHoldMs: number;
  hasVoice?: boolean;
}): number {
  if (message.customHoldMs != null) return message.customHoldMs;

  // Voice-over already keeps a bubble on screen for its full duration. The
  // longer visual hold is a fallback for silent photos and view-once media.
  if (isVisualMessage(message) && !hasVoice) return imageHoldMs;

  return holdMs;
}
