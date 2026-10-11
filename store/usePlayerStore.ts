'use client';

import { create } from 'zustand';
import { useEditorStore } from './useEditorStore';
import type { Message } from '@/types';
import { getSfxDefinition, getSfxVolume } from '@/lib/sfx';
import { getMessageSpeakableText } from '@/lib/speech';

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

let animationTimer: ReturnType<typeof setTimeout> | null = null;
let resolveAnimationWait: (() => void) | null = null;
let playbackRunId = 0;
let cancelActiveTts: (() => void) | null = null;
let customSfxStopTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (animationTimer) {
    clearTimeout(animationTimer);
    animationTimer = null;
  }

  // Release an async sequence that is waiting on a cancelled timeout so it
  // can observe its stale run id and exit without leaking in the background.
  const resolve = resolveAnimationWait;
  resolveAnimationWait = null;
  resolve?.();
}

function waitForDelay(duration: number): Promise<void> {
  return new Promise((resolve) => {
    resolveAnimationWait = resolve;
    animationTimer = setTimeout(() => {
      animationTimer = null;
      resolveAnimationWait = null;
      resolve();
    }, duration);
  });
}

function cancelCurrentPlayback() {
  clearTimer();

  if (customSfxStopTimer) {
    clearTimeout(customSfxStopTimer);
    customSfxStopTimer = null;
  }

  const cancelTts = cancelActiveTts;
  cancelActiveTts = null;
  cancelTts?.();

  for (const audio of [_sfxInAudioEl, _sfxOutAudioEl, _customSfxAudioEl]) {
    if (!audio) continue;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {}
  }
}

// ── iOS Safari Audio Unlock ─────────────────────────────────────────────────
// iOS Safari blocks audio elements that are created outside a user gesture.
// Solution: pre-create shared HTMLAudioElements during user gesture (Start button click),
// then REUSE them for subsequent TTS & SFX playback.
let _ttsAudioEl: HTMLAudioElement | null = null;
let _sfxInAudioEl: HTMLAudioElement | null = null;
let _sfxOutAudioEl: HTMLAudioElement | null = null;
let _customSfxAudioEl: HTMLAudioElement | null = null;

/**
 * Call this ONCE during a user gesture (e.g. Start button click) to
 * pre-create and unlock shared TTS & SFX audio elements for iOS Safari / Mobile.
 * Exported so PreviewClient.tsx & StudioPlayerControl.tsx can call it.
 */
export function initTtsAudio(): void {
  if (typeof window === 'undefined') return;

  // 1. TTS Singleton Audio
  if (!_ttsAudioEl) {
    _ttsAudioEl = new Audio('/sounds/notification.mp3');
    _ttsAudioEl.preload = 'auto';
    _ttsAudioEl.volume = 0.001;
    const unlockAudio = _ttsAudioEl;
    const unlockSource = unlockAudio.src;
    unlockAudio.play()
      .then(() => {
        // The real voice may already have replaced the silent unlock source.
        // Never let this delayed callback pause that newer playback.
        if (unlockAudio.src === unlockSource && !cancelActiveTts) {
          unlockAudio.pause();
          unlockAudio.currentTime = 0;
        }
        unlockAudio.volume = 1.0;
      })
      .catch(() => {});
  }

  // 2. SFX Incoming Singleton Audio
  if (!_sfxInAudioEl) {
    _sfxInAudioEl = new Audio('/sounds/notification.mp3');
    _sfxInAudioEl.preload = 'auto';
    _sfxInAudioEl.volume = 0.001;
    _sfxInAudioEl.play()
      .then(() => {
        _sfxInAudioEl!.pause();
        _sfxInAudioEl!.currentTime = 0;
        _sfxInAudioEl!.volume = 0.85;
      })
      .catch(() => {});
  }

  // 3. SFX Outgoing Singleton Audio
  if (!_sfxOutAudioEl) {
    _sfxOutAudioEl = new Audio('/sounds/sfx-out.mp3');
    _sfxOutAudioEl.preload = 'auto';
    _sfxOutAudioEl.volume = 0.001;
    _sfxOutAudioEl.play()
      .then(() => {
        _sfxOutAudioEl!.pause();
        _sfxOutAudioEl!.currentTime = 0;
        _sfxOutAudioEl!.volume = 0.85;
      })
      .catch(() => {});
  }

  // 4. Story SFX Singleton Audio
  if (!_customSfxAudioEl) {
    _customSfxAudioEl = new Audio('/sounds/sfx/ding.wav');
    _customSfxAudioEl.preload = 'auto';
    _customSfxAudioEl.volume = 0.001;
    const unlockAudio = _customSfxAudioEl;
    const unlockSource = unlockAudio.src;
    unlockAudio.play()
      .then(() => {
        if (unlockAudio.src === unlockSource) {
          unlockAudio.pause();
          unlockAudio.currentTime = 0;
        }
        unlockAudio.volume = 0.22;
      })
      .catch(() => {});
  }
}

// ── Sound Effects Playback ──────────────────────────────────────────────────
function playSfx(direction: 'incoming' | 'outgoing', message: Message) {
  const state = useEditorStore.getState();
  const playDefaultSound = direction === 'incoming' ? state.useSoundIn !== false : state.useSoundOut !== false;

  if (playDefaultSound) try {
    const sfxAudio = direction === 'incoming' ? _sfxInAudioEl : _sfxOutAudioEl;
    if (sfxAudio) {
      sfxAudio.currentTime = 0;
      sfxAudio.volume = 0.85;
      sfxAudio.play().catch((err) => {
        console.warn('[SFX] Pre-unlocked audio play failed, trying fallback:', err);
        const src = direction === 'incoming' ? '/sounds/notification.mp3' : '/sounds/sfx-out.mp3';
        const fallback = new Audio(src);
        fallback.volume = 0.85;
        fallback.play().catch(() => {});
      });
    } else {
      const src = direction === 'incoming' ? '/sounds/notification.mp3' : '/sounds/sfx-out.mp3';
      const audio = new Audio(src);
      audio.volume = 0.85;
      audio.play().catch(() => {});
    }
  } catch (e) {
    console.warn('[SFX] Audio play error:', e);
  }

  const customSfx = getSfxDefinition(message.sfxId);
  if (!customSfx) return;

  try {
    const source = `/${customSfx.file}`;
    const volume = getSfxVolume(message.sfxVolume);
    const audio = _customSfxAudioEl ?? new Audio(source);
    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume;
    if (audio.src !== new URL(source, window.location.origin).href) {
      audio.src = source;
      audio.load();
    }
    audio.play().catch(() => {
      const fallback = new Audio(source);
      fallback.volume = volume;
      fallback.play().catch(() => {});
    });
    if (customSfxStopTimer) clearTimeout(customSfxStopTimer);
    customSfxStopTimer = setTimeout(() => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
      customSfxStopTimer = null;
    }, 3000);
  } catch (error) {
    console.warn('[Story SFX] Audio play error:', error);
  }
}

// ── TTS Voiceover Playback ──────────────────────────────────────────────────
// Uses the singleton audio element so iOS Safari keeps audio unlocked.
// Resolves when audio ends, errors, or stalls too long.
function playTtsAudio(message: Message, msgIndex?: number): Promise<void> {
  return new Promise((resolve) => {
    const state = useEditorStore.getState();
    if (!state.enableTts || !getMessageSpeakableText(message)) return resolve();

    const audioMap = state.ttsAudioMap as Record<string, string> | undefined;
    const audioUrl =
      audioMap?.[message.id] ??
      (msgIndex !== undefined
        ? (audioMap?.[msgIndex] ?? audioMap?.[String(msgIndex)])
        : undefined);

    if (!audioUrl) return resolve();

    try {
      // ── Use singleton element (iOS-safe) or fall back to new Audio ──────
      const audio = _ttsAudioEl ?? new Audio();

      let stalledTimer: ReturnType<typeof setTimeout> | null = null;
      let settled = false;

      const cleanup = () => {
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('stalled', onStalled);
        if (stalledTimer) clearTimeout(stalledTimer);
      };

      const finish = (stopAudio = false) => {
        if (settled) return;
        settled = true;
        cleanup();

        if (stopAudio) {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch {}
        }

        if (cancelActiveTts === cancel) cancelActiveTts = null;
        resolve();
      };

      const cancel = () => finish(true);
      const onEnded = () => finish();
      const onError = () => finish();
      const onStalled = () => {
        // If stalled for 6s, give up and continue
        stalledTimer = setTimeout(() => finish(true), 6000);
      };

      // There must only ever be one voice promise controlling the preview.
      // Resolve and detach callbacks from an older run before starting this one.
      const cancelPreviousTts = cancelActiveTts;
      cancelActiveTts = cancel;
      cancelPreviousTts?.();

      audio.addEventListener('ended', onEnded, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.addEventListener('stalled', onStalled, { once: true });

      // Change src on the existing element and replay
      audio.volume = 1.0;
      const targetSpeed = Math.max(0.5, Math.min(2, state.ttsSpeed || 1));
      audio.preservesPitch = true;
      audio.playbackRate = targetSpeed;
      audio.src = audioUrl;
      audio.load(); // required after changing src
      audio.play().catch(() => {
        finish();
      });
    } catch {
      resolve();
    }
  });
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
    playbackRunId += 1;
    cancelCurrentPlayback();
    set({ isPlaying: false, isPaused: true, isTyping: false, activeMsgId: null });
    useEditorStore.getState().setActiveHeaderStatusOverride(null);
  },

  stop: () => {
    playbackRunId += 1;
    cancelCurrentPlayback();

    // Stop the singleton TTS audio immediately
    if (_ttsAudioEl) {
      try {
        _ttsAudioEl.pause();
        _ttsAudioEl.currentTime = 0;
      } catch {}
    }
    for (const audio of [_sfxInAudioEl, _sfxOutAudioEl, _customSfxAudioEl]) {
      if (!audio) continue;
      try {
        audio.pause();
        audio.currentTime = 0;
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
    cancelCurrentPlayback();
    const runId = ++playbackRunId;
    initTtsAudio(); // Ensure all iOS audio elements (TTS & SFX) are initialized & unlocked

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

    const playNextStep = async () => {
      // Every Play click owns one run. Old async callbacks may still wake up
      // after cloud audio finishes buffering, but may never mutate this run.
      if (runId !== playbackRunId) return;

      const state = useEditorStore.getState();
      const currentMessages = state.messages;

      if (currentIdx >= currentMessages.length) {
        // ── Animation finished ──────────────────────────────────────────────
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

        await waitForDelay(replyDelayDuration);
        if (runId !== playbackRunId) return;

        // ── Phase 2: Show message ─────────────────────────────────────────
        currentIdx++;
        set({ visibleCount: currentIdx, isTyping: false, activeMsgId: msg.id });
        state.setActiveHeaderStatusOverride(null);

        // SFX fires immediately (non-blocking)
        playSfx(msg.direction, msg);

        // TTS: wait for voice to finish before proceeding
        await playTtsAudio(msg, currentIdx - 1);
        if (runId !== playbackRunId) return;

        // Hold pause after audio ends (configured per-message or global)
        await waitForDelay(holdDuration);
      } else {
        // ── Direct show (no typing indicator) ────────────────────────────
        currentIdx++;
        set({ visibleCount: currentIdx, isTyping: false, activeMsgId: msg.id });

        // SFX fires immediately (non-blocking)
        playSfx(msg.direction, msg);

        // TTS: wait for voice to finish before proceeding
        await playTtsAudio(msg, currentIdx - 1);
        if (runId !== playbackRunId) return;

        // Hold pause after audio ends
        await waitForDelay(holdDuration);
      }

      if (runId !== playbackRunId) return;
      void playNextStep();
    };

    // Start sequence
    void playNextStep();
  },
}));
