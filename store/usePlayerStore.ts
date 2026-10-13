'use client';

import { create } from 'zustand';
import { useEditorStore } from './useEditorStore';
import type { Message } from '@/types';
import { getSfxDefinition, getSfxVolume } from '@/lib/sfx';
import { getMessageSpeakableText } from '@/lib/speech';
import { getMessageHoldMs } from '@/lib/messageTiming';

interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  visibleCount: number; // -1 = Edit mode (show all), 0..N = Playback step
  isTyping: boolean;
  isVoicePlaying: boolean;
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
let bgmSfxDuckTimer: ReturnType<typeof setTimeout> | null = null;
let isBgmVoiceDucked = false;
let isBgmSfxDucked = false;

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

  if (bgmSfxDuckTimer) {
    clearTimeout(bgmSfxDuckTimer);
    bgmSfxDuckTimer = null;
  }
  isBgmVoiceDucked = false;
  isBgmSfxDucked = false;

  const cancelTts = cancelActiveTts;
  cancelActiveTts = null;
  cancelTts?.();
  stopBackgroundMusic();

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
let _bgmAudioEl: HTMLAudioElement | null = null;
let _bgmRampTimer: ReturnType<typeof setInterval> | null = null;

function clearBgmRamp() {
  if (_bgmRampTimer) {
    clearInterval(_bgmRampTimer);
    _bgmRampTimer = null;
  }
}

function rampBgmVolume(target: number, durationMs: number, onDone?: () => void) {
  const audio = _bgmAudioEl;
  if (!audio) return;
  clearBgmRamp();

  const safeTarget = Math.max(0, Math.min(1, target));
  if (durationMs <= 0) {
    audio.volume = safeTarget;
    onDone?.();
    return;
  }

  const startedAt = Date.now();
  const initialVolume = audio.volume;
  _bgmRampTimer = setInterval(() => {
    const progress = Math.min(1, (Date.now() - startedAt) / durationMs);
    audio.volume = initialVolume + (safeTarget - initialVolume) * progress;
    if (progress >= 1) {
      clearBgmRamp();
      onDone?.();
    }
  }, 40);
}

function refreshBackgroundMusicMix() {
  const state = useEditorStore.getState();
  if (!_bgmAudioEl || !state.enableBgm) return;

  let multiplier = 1;
  if (state.bgmDucking && isBgmVoiceDucked) {
    multiplier = Math.min(multiplier, state.bgmDuckVolume);
  }
  if (state.bgmDucking && isBgmSfxDucked) {
    // SFX is short and should read clearly, so the music drops further than
    // it does underneath spoken dialogue.
    multiplier = Math.min(multiplier, Math.min(0.12, state.bgmDuckVolume * 0.5));
  }

  const target = state.bgmVolume * multiplier;
  rampBgmVolume(target, 180);
}

function setBackgroundMusicVoiceDucked(isDucked: boolean) {
  isBgmVoiceDucked = isDucked;
  refreshBackgroundMusicMix();
}

function duckBackgroundMusicForSfx(durationMs: number) {
  if (bgmSfxDuckTimer) clearTimeout(bgmSfxDuckTimer);
  isBgmSfxDucked = true;
  refreshBackgroundMusicMix();
  bgmSfxDuckTimer = setTimeout(() => {
    bgmSfxDuckTimer = null;
    isBgmSfxDucked = false;
    refreshBackgroundMusicMix();
  }, durationMs);
}

function stopBackgroundMusic(useFade = true) {
  const audio = _bgmAudioEl;
  if (!audio) return;
  isBgmVoiceDucked = false;
  isBgmSfxDucked = false;
  if (bgmSfxDuckTimer) {
    clearTimeout(bgmSfxDuckTimer);
    bgmSfxDuckTimer = null;
  }
  const fadeMs = useFade ? Math.max(0, useEditorStore.getState().bgmFadeOut) * 1000 : 0;

  rampBgmVolume(0, fadeMs, () => {
    audio.pause();
    audio.currentTime = 0;
  });
}

function startBackgroundMusic() {
  const state = useEditorStore.getState();
  if (!state.enableBgm || !state.bgmUrl) return;

  clearBgmRamp();
  const audio = _bgmAudioEl ?? new Audio();
  _bgmAudioEl = audio;
  audio.pause();
  audio.loop = state.bgmLoop;
  audio.preservesPitch = true;
  audio.playbackRate = 1;
  audio.volume = state.bgmFadeIn > 0 ? 0 : state.bgmVolume;

  const targetSource = new URL(state.bgmUrl, window.location.origin).href;
  if (audio.src !== targetSource) {
    audio.src = state.bgmUrl;
    audio.load();
  }
  audio.onloadedmetadata = () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.min(Math.max(0, state.bgmStartAt), Math.max(0, audio.duration - 0.05));
    }
  };

  void audio.play().then(() => {
    rampBgmVolume(state.bgmVolume, Math.max(0, state.bgmFadeIn) * 1000);
  }).catch((error) => {
    console.warn('[Backsound] Browser playback failed:', error);
  });
}

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
function playSfx(direction: 'incoming' | 'outgoing', message: Message, voiceWillPlay: boolean) {
  const state = useEditorStore.getState();
  const playDefaultSound = direction === 'incoming' ? state.useSoundIn !== false : state.useSoundOut !== false;
  const customSfx = getSfxDefinition(message.sfxId);

  if (playDefaultSound || customSfx) {
    duckBackgroundMusicForSfx(customSfx ? 3000 : 700);
  }

  if (playDefaultSound) try {
    const sfxAudio = direction === 'incoming' ? _sfxInAudioEl : _sfxOutAudioEl;
    const notificationVolume = voiceWillPlay ? 0.15 : 0.25;
    if (sfxAudio) {
      sfxAudio.currentTime = 0;
      sfxAudio.volume = notificationVolume;
      sfxAudio.play().catch((err) => {
        console.warn('[SFX] Pre-unlocked audio play failed, trying fallback:', err);
        const src = direction === 'incoming' ? '/sounds/notification.mp3' : '/sounds/sfx-out.mp3';
        const fallback = new Audio(src);
        fallback.volume = notificationVolume;
        fallback.play().catch(() => {});
      });
    } else {
      const src = direction === 'incoming' ? '/sounds/notification.mp3' : '/sounds/sfx-out.mp3';
      const audio = new Audio(src);
      audio.volume = notificationVolume;
      audio.play().catch(() => {});
    }
  } catch (e) {
    console.warn('[SFX] Audio play error:', e);
  }

  if (!customSfx) return;

  try {
    const source = `/${customSfx.file}`;
    const volume = getSfxVolume(message.sfxVolume) * (voiceWillPlay ? 0.65 : 1);
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

function hasPlayableTts(message: Message, msgIndex: number): boolean {
  const state = useEditorStore.getState();
  if (!state.enableTts || !getMessageSpeakableText(message)) return false;

  const audioMap = state.ttsAudioMap as Record<string, string>;
  return Boolean(
    message.audioDataUrl ||
    audioMap[message.id] ||
    audioMap[msgIndex] ||
    audioMap[String(msgIndex)],
  );
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  isPlaying: false,
  isPaused: false,
  visibleCount: -1,
  isTyping: false,
  isVoicePlaying: false,
  activeMsgId: null,
  playbackSpeed: 1,

  setSpeed: (playbackSpeed) => set({ playbackSpeed }),

  pause: () => {
    playbackRunId += 1;
    cancelCurrentPlayback();
    set({ isPlaying: false, isPaused: true, isTyping: false, isVoicePlaying: false, activeMsgId: null });
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
      isVoicePlaying: false,
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
      isVoicePlaying: false,
      activeMsgId: null,
    });
    startBackgroundMusic();

    let currentIdx = 0;

    const playNextStep = async () => {
      // Every Play click owns one run. Old async callbacks may still wake up
      // after cloud audio finishes buffering, but may never mutate this run.
      if (runId !== playbackRunId) return;

      const state = useEditorStore.getState();
      const currentMessages = state.messages;

      if (currentIdx >= currentMessages.length) {
        // ── Animation finished ──────────────────────────────────────────────
        set({ isPlaying: false, isPaused: false, visibleCount: -1, isTyping: false, isVoicePlaying: false, activeMsgId: null });
        stopBackgroundMusic();
        state.setActiveHeaderStatusOverride(null);
        return;
      }

      const msg = currentMessages[currentIdx];
      const isIncoming = msg.direction === 'incoming';
      const shouldType = isIncoming && state.useTyping;

      const voiceWillPlay = hasPlayableTts(msg, currentIdx);
      const holdDuration = getMessageHoldMs({
        message: msg,
        holdMs: state.holdMs,
        imageHoldMs: state.imageHoldMs,
        hasVoice: voiceWillPlay,
      }) / speed;
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

        // SFX fires immediately (non-blocking), but is mixed under voice.
        playSfx(msg.direction, msg, voiceWillPlay);

        // TTS: wait for voice to finish before proceeding
        if (voiceWillPlay) {
          set({ isVoicePlaying: true });
          setBackgroundMusicVoiceDucked(true);
        }
        await playTtsAudio(msg, currentIdx - 1);
        if (runId !== playbackRunId) return;
        if (voiceWillPlay) {
          set({ isVoicePlaying: false });
          setBackgroundMusicVoiceDucked(false);
        }

        // Hold pause after audio ends (configured per-message or global)
        await waitForDelay(holdDuration);
      } else {
        // ── Direct show (no typing indicator) ────────────────────────────
        currentIdx++;
        set({ visibleCount: currentIdx, isTyping: false, activeMsgId: msg.id });

        // SFX fires immediately (non-blocking), but is mixed under voice.
        playSfx(msg.direction, msg, voiceWillPlay);

        // TTS: wait for voice to finish before proceeding
        if (voiceWillPlay) {
          set({ isVoicePlaying: true });
          setBackgroundMusicVoiceDucked(true);
        }
        await playTtsAudio(msg, currentIdx - 1);
        if (runId !== playbackRunId) return;
        if (voiceWillPlay) {
          set({ isVoicePlaying: false });
          setBackgroundMusicVoiceDucked(false);
        }

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
