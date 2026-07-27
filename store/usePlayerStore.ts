'use client';

import { create } from 'zustand';
import { useEditorStore } from './useEditorStore';

interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  visibleCount: number; // -1 = Edit mode (show all), 0..N = Playback step
  isTyping: boolean;
  activeMsgId: string | null;
  playbackSpeed: number; // 1, 1.25, 1.5, 2

  // Actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
}

let animationTimer: NodeJS.Timeout | null = null;

function clearTimer() {
  if (animationTimer) {
    clearTimeout(animationTimer);
    animationTimer = null;
  }
}

// ── Sound Effects Playback ──────────────────────────────────────────────────
function playSfx(direction: 'incoming' | 'outgoing') {
  const state = useEditorStore.getState();

  if (direction === 'incoming' && state.useSoundIn === false) return;
  if (direction === 'outgoing' && state.useSoundOut === false) return;

  try {
    const src = direction === 'incoming' ? '/sounds/notification.mp3' : '/sounds/sfx-out.mp3';
    const audio = new Audio(src);
    audio.volume = 0.85;
    audio.play().catch(() => {});
  } catch (e) {
    console.warn('[SFX] Audio play error:', e);
  }
}

// ── TTS Voiceover Playback ──────────────────────────────────────────────────
function playTtsAudio(msgId: string) {
  const state = useEditorStore.getState();
  if (!state.enableTts) return;

  const audioMap = state.ttsAudioMap as Record<string, string> | undefined;
  const audioUrl = audioMap?.[msgId];
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('[TTS] Audio play error:', e);
    }
  }
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  isPlaying: false,
  isPaused: false,
  visibleCount: -1,
  isTyping: false,
  activeMsgId: null,
  playbackSpeed: 1,

  setSpeed: (playbackSpeed) => set({ playbackSpeed }),

  pause: () => {
    clearTimer();
    set({ isPaused: true });
    useEditorStore.getState().setActiveHeaderStatusOverride(null);
  },

  stop: () => {
    clearTimer();
    set({
      isPlaying: false,
      isPaused: false,
      visibleCount: -1,
      isTyping: false,
      activeMsgId: null,
    });
    useEditorStore.getState().setActiveHeaderStatusOverride(null);
  },

  play: () => {
    clearTimer();

    const editorState = useEditorStore.getState();
    const messages = editorState.messages;

    if (!messages || messages.length === 0) return;

    const speed = get().playbackSpeed;

    // Reset to start of sequence
    set({
      isPlaying: true,
      isPaused: false,
      visibleCount: 0,
      isTyping: false,
      activeMsgId: null,
    });

    let currentIdx = 0;

    const playNextStep = () => {
      const state = useEditorStore.getState();
      const currentMessages = state.messages;

      if (currentIdx >= currentMessages.length) {
        // Animation finished
        set({ isPlaying: false, isPaused: false, visibleCount: -1, isTyping: false, activeMsgId: null });
        state.setActiveHeaderStatusOverride(null);
        return;
      }

      const msg = currentMessages[currentIdx];
      const isIncoming = msg.direction === 'incoming';
      const shouldType = isIncoming && state.useTyping;

      const holdDuration = (msg.customHoldMs || state.holdMs) / speed;
      const replyDelayDuration = (state.replyDelay || 1200) / speed;

      if (shouldType) {
        // Phase 1: Typing indicator
        set({
          isTyping: true,
          activeMsgId: null,
        });
        state.setActiveHeaderStatusOverride('typing');

        animationTimer = setTimeout(() => {
          // Phase 2: Show message
          currentIdx++;
          set({
            visibleCount: currentIdx,
            isTyping: false,
            activeMsgId: msg.id,
          });
          state.setActiveHeaderStatusOverride(null);

          // Play Sound Effect & TTS
          playSfx(msg.direction);
          playTtsAudio(msg.id);

          // Schedule next step after hold duration
          animationTimer = setTimeout(playNextStep, holdDuration);
        }, replyDelayDuration);
      } else {
        // Direct show message without typing delay
        currentIdx++;
        set({
          visibleCount: currentIdx,
          isTyping: false,
          activeMsgId: msg.id,
        });

        // Play Sound Effect & TTS
        playSfx(msg.direction);
        playTtsAudio(msg.id);

        animationTimer = setTimeout(playNextStep, holdDuration);
      }
    };

    // Start sequence
    playNextStep();
  },
}));
