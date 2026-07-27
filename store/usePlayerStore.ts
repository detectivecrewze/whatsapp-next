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

// ── iOS Safari Audio Unlock ─────────────────────────────────────────────────
// iOS Safari blocks audio elements that are created outside a user gesture.
// Solution: create ONE singleton HTMLAudioElement during the user gesture (Start button click),
// then REUSE it for all subsequent TTS playback by changing .src.
// This keeps the audio element in an "unlocked" state throughout the session.
let _ttsAudioEl: HTMLAudioElement | null = null;

/**
 * Call this ONCE during a user gesture (e.g. Start button click) to
 * pre-create and unlock the shared TTS audio element for iOS Safari.
 * Exported so PreviewClient.tsx can call it from handleStart().
 */
export function initTtsAudio(): void {
  if (typeof window === 'undefined') return;
  if (_ttsAudioEl) return; // already initialized

  _ttsAudioEl = new Audio();
  _ttsAudioEl.preload = 'auto';

  // Play a silent audio immediately to unlock on iOS
  _ttsAudioEl.src = '/sounds/notification.mp3';
  _ttsAudioEl.volume = 0.001;
  _ttsAudioEl.play()
    .then(() => {
      _ttsAudioEl!.pause();
      _ttsAudioEl!.currentTime = 0;
      _ttsAudioEl!.volume = 1.0;
    })
    .catch(() => {
      // Unlock failed — will attempt normally during playback
    });
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
// Uses the singleton audio element so iOS Safari keeps audio unlocked.
// Resolves when audio ends, errors, or stalls too long.
function playTtsAudio(msgId: string, msgIndex?: number): Promise<void> {
  return new Promise((resolve) => {
    const state = useEditorStore.getState();
    if (!state.enableTts) return resolve();

    const audioMap = state.ttsAudioMap as Record<string, string> | undefined;
    const audioUrl =
      audioMap?.[msgId] ??
      (msgIndex !== undefined
        ? (audioMap?.[msgIndex] ?? audioMap?.[String(msgIndex)])
        : undefined);

    if (!audioUrl) return resolve();

    try {
      // ── Use singleton element (iOS-safe) or fall back to new Audio ──────
      const audio = _ttsAudioEl ?? new Audio();

      let stalledTimer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('stalled', onStalled);
        if (stalledTimer) clearTimeout(stalledTimer);
      };

      const onEnded = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); resolve(); };
      const onStalled = () => {
        // If stalled for 6s, give up and continue
        stalledTimer = setTimeout(() => { cleanup(); resolve(); }, 6000);
      };

      audio.addEventListener('ended', onEnded, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.addEventListener('stalled', onStalled, { once: true });

      // Change src on the existing element and replay
      audio.volume = 1.0;
      audio.src = audioUrl;
      audio.load(); // required after changing src
      audio.play().catch(() => {
        cleanup();
        resolve();
      });
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

    // Stop the singleton TTS audio immediately
    if (_ttsAudioEl) {
      try {
        _ttsAudioEl.pause();
        _ttsAudioEl.currentTime = 0;
      } catch {}
    }

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
        await playTtsAudio(msg.id, currentIdx - 1);
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
        await playTtsAudio(msg.id, currentIdx - 1);
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
