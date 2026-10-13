import type { Message } from '@/types';
import { getMessageHoldMs } from '@/lib/messageTiming';
import { VIDEO_FPS } from './videoTypes';

const INTRO_FRAMES = Math.round(VIDEO_FPS * 0.5);
const OUTRO_FRAMES = Math.round(VIDEO_FPS * 1.25);

export type TimelineEvent = {
  message: Message;
  index: number;
  typingStartFrame: number;
  revealFrame: number;
  voiceEndFrame: number;
  endFrame: number;
};

type TimelineInput = {
  messages: Message[];
  holdMs: number;
  imageHoldMs: number;
  replyDelay: number;
  useTyping: boolean;
  enableTts?: boolean;
  ttsSpeed?: number;
  voiceDurationsMs?: Record<string, number>;
};

export function buildVideoTimeline({
  messages,
  holdMs,
  imageHoldMs,
  replyDelay,
  useTyping,
  enableTts,
  ttsSpeed = 1,
  voiceDurationsMs,
}: TimelineInput): TimelineEvent[] {
  let cursor = INTRO_FRAMES;

  return messages.map((message, index) => {
    const typingFrames =
      message.direction === 'incoming' && useTyping
        ? Math.max(1, Math.round((replyDelay / 1000) * VIDEO_FPS))
        : 0;
    const voiceDurationMs = voiceDurationsMs?.[message.id] ?? 0;
    const hasVoice = Boolean(enableTts && voiceDurationMs > 0);
    const messageHoldMs = getMessageHoldMs({
      message,
      holdMs,
      imageHoldMs,
      hasVoice,
    });
    const holdFrames = Math.max(
      1,
      Math.round((messageHoldMs / 1000) * VIDEO_FPS)
    );
    const playbackRate = Math.max(0.5, ttsSpeed);
    const voiceFrames = enableTts
      ? Math.max(0, Math.ceil(((voiceDurationMs / playbackRate) / 1000) * VIDEO_FPS))
      : 0;
    const typingStartFrame = cursor;
    const revealFrame = cursor + typingFrames;
    const voiceEndFrame = revealFrame + voiceFrames;
    const endFrame = voiceEndFrame + holdFrames;

    cursor = endFrame;

    return {
      message,
      index,
      typingStartFrame,
      revealFrame,
      voiceEndFrame,
      endFrame,
    };
  });
}

export function getVideoDurationInFrames(input: TimelineInput): number {
  const timeline = buildVideoTimeline(input);
  const lastFrame = timeline.at(-1)?.endFrame ?? INTRO_FRAMES;
  return Math.max(VIDEO_FPS * 2, lastFrame + OUTRO_FRAMES);
}

export function getTimelineState(frame: number, timeline: TimelineEvent[]) {
  let visibleCount = 0;
  let activeEvent: TimelineEvent | null = null;
  let typingEvent: TimelineEvent | null = null;

  for (const event of timeline) {
    if (frame >= event.revealFrame) {
      visibleCount = event.index + 1;
    }

    if (frame >= event.revealFrame && frame < event.endFrame) {
      activeEvent = event;
    }

    if (frame >= event.typingStartFrame && frame < event.revealFrame) {
      typingEvent = event;
    }
  }

  return { visibleCount, activeEvent, typingEvent };
}

