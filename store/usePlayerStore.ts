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

        animationTimer = setTimeout(playNextStep, holdDuration);
      }
    };

    // Start sequence
    playNextStep();
  },
}));
