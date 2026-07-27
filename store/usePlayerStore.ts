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
// Returns a Promise that resolves ONLY when the TTS audio finishes playing.
// Resolves immediately if TTS is disabled or no audio URL found for this message.
function playTtsAudio(msgId: string, speed: number, msgIndex?: number): Promise<void> {
  return new Promise((resolve) => {
    const state = useEditorStore.getState();
    if (!state.enableTts) return resolve();

    const audioMap = state.ttsAudioMap as Record<string, string> | undefined;
    const audioUrl =
      audioMap?.[msgId] ??
      (msgIndex !== undefined ? (audioMap?.[msgIndex] ?? audioMap?.[String(msgIndex)]) : undefined);

    if (!audioUrl) return resolve();

    try {
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      // NOTE: Do NOT set audio.playbackRate here.
      // ElevenLabs bakes `speed` into the audio file at generation time.
      // Applying playbackRate on top would cause double-speed effect.

      audio.addEventListener('ended', () => resolve(), { once: true });
      audio.addEventListener('error', () => resolve(), { once: true });
      audio.addEventListener('stalled', () => {
        setTimeout(resolve, 5000);
      }, { once: true });

      audio.play().catch(() => resolve());
    } catch {
      resolve();
    }
  });
}

// Guard flag: set to false by stop() to cancel in-flight async playback
let isRunning = false;

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
    isRunning = false;
    set({ isPaused: true });
    useEditorStore.getState().setActiveHeaderStatusOverride(null);
  },

  stop: () => {
    clearTimer();
    isRunning = false; // cancel any in-flight async sequence
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
    isRunning = false; // cancel previous run if any

    const editorState = useEditorStore.getState();
    const messages = editorState.messages;

    if (!messages || messages.length === 0) return;

    const speed = get().playbackSpeed;

    // Mark new run as active
    isRunning = true;

    // Reset to start of sequence
    set({
      isPlaying: true,
      isPaused: false,
      visibleCount: 0,
      isTyping: false,
      activeMsgId: null,
    });

    let currentIdx = 0;

    const playNextStep = async () => {
      // Bail if stop() was called
      if (!isRunning) return;

      const state = useEditorStore.getState();
      const currentMessages = state.messages;

      if (currentIdx >= currentMessages.length) {
        // ── Animation finished ──────────────────────────────────────────────
        isRunning = false;
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
        // ── Phase 1: Show typing indicator ───────────────────────────────
        set({ isTyping: true, activeMsgId: null });
        state.setActiveHeaderStatusOverride('typing');

        await new Promise<void>((r) => { animationTimer = setTimeout(r, replyDelayDuration); });
        if (!isRunning) return;

        // ── Phase 2: Show message ─────────────────────────────────────────
        currentIdx++;
        set({ visibleCount: currentIdx, isTyping: false, activeMsgId: msg.id });
        state.setActiveHeaderStatusOverride(null);

        // SFX fires immediately (non-blocking)
        playSfx(msg.direction);

        // TTS: wait for voice to finish before proceeding
        await playTtsAudio(msg.id, speed, currentIdx - 1);
        if (!isRunning) return;

        // Hold pause after audio ends (configured per-message or global)
        await new Promise<void>((r) => { animationTimer = setTimeout(r, holdDuration); });
      } else {
        // ── Direct show (no typing indicator) ────────────────────────────
        currentIdx++;
        set({ visibleCount: currentIdx, isTyping: false, activeMsgId: msg.id });

        // SFX fires immediately (non-blocking)
        playSfx(msg.direction);

        // TTS: wait for voice to finish before proceeding
        await playTtsAudio(msg.id, speed, currentIdx - 1);
        if (!isRunning) return;

        // Hold pause after audio ends
        await new Promise<void>((r) => { animationTimer = setTimeout(r, holdDuration); });
      }

      if (!isRunning) return;
      playNextStep();
    };

    // Start sequence
    playNextStep();
  },
}));
