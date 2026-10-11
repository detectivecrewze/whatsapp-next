'use client';

import { create } from 'zustand';
import { EditorState, Message, TtsProvider, DEFAULT_EDITOR_STATE } from '@/types';
import { getMessageSpeakableText } from '@/lib/speech';

function normalizeTtsAudioMap(
  messages: Message[],
  audioMap: Record<string | number, string> = {},
) {
  const normalized: Record<string, string> = {};

  // Keep only audio belonging to current bubbles, and migrate old cloud
  // presets that stored audio by array index.
  messages.forEach((message, index) => {
    const source = audioMap[message.id] || audioMap[index] || audioMap[String(index)];
    if (source) normalized[message.id] = source;
  });

  return normalized;
}

interface EditorStore extends EditorState {
  // Contact / profile actions
  setName: (name: string) => void;
  setPfp: (pfp: string | null) => void;
  setPhoneOs: (os: 'ios' | 'android') => void;
  setChatType: (type: 'personal' | 'group') => void;
  setGroupSubtitle: (subtitle: string) => void;
  setBatteryLevel: (level: number) => void;
  setCustomTime: (time: string) => void;
  setUseCustomTime: (use: boolean) => void;

  // Background actions
  setBgType: (type: 'default' | 'color' | 'image') => void;
  setBgColor: (color: string) => void;
  setBubbleColor: (color: string) => void;
  setBgImage: (img: string | null) => void;

  // Message actions
  addMessage: (msg: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  reorderMessages: (messages: Message[]) => void;
  reverseAllDirections: () => void;

  // Video settings
  setHoldMs: (ms: number) => void;
  setReplyDelay: (ms: number) => void;
  setUseTyping: (v: boolean) => void;
  setUseSoundIn: (v: boolean) => void;
  setUseSoundOut: (v: boolean) => void;

  // Zoom
  setAutoZoom: (v: boolean) => void;
  setZoomScale: (v: number) => void;
  setZoomSpeed: (v: number) => void;

  // TTS
  setEnableTts: (v: boolean) => void;
  setTtsProvider: (provider: TtsProvider) => void;
  setElevenKey: (key: string) => void;
  setQwenKey: (key: string) => void;
  setElevenModel: (model: string) => void;
  setTtsVoiceIn: (id: string) => void;
  setTtsVoiceOut: (id: string) => void;
  setTtsStability: (v: number) => void;
  setTtsStyle: (v: number) => void;
  setTtsSpeed: (v: number) => void;
  setAudioMapEntry: (key: string | number, url: string) => void;
  removeAudioMapEntry: (messageId: string) => void;
  clearAudioMap: () => void;

  // Header
  setHeaderStatus: (status: 'online' | 'typing' | 'custom') => void;
  setHeaderStatusText: (text: string) => void;
  setActiveHeaderStatusOverride: (status: 'online' | 'typing' | 'custom' | null) => void;
  setPinnedMessage: (msg: string) => void;
  setUnreadCount: (n: number) => void;
  setDateBadge: (text: string) => void;

  // Bulk
  applyPayload: (payload: Partial<EditorState>) => void;
  resetToDefault: () => void;
}

export const useEditorStore = create<EditorStore>()((set) => ({
  ...DEFAULT_EDITOR_STATE,

  // Contact
  setName: (name) => set({ name }),
  setPfp: (pfp) => set({ pfp }),
  setPhoneOs: (phoneOs) => set({ phoneOs }),
  setChatType: (chatType) => set({ chatType }),
  setGroupSubtitle: (groupSubtitle) => set({ groupSubtitle }),
  setBatteryLevel: (batteryLevel) => set({ batteryLevel }),
  setCustomTime: (customTime) => set({ customTime }),
  setUseCustomTime: (useCustomTime) => set({ useCustomTime }),

  // Background
  setBgType: (bgType) => set({ bgType }),
  setBgColor: (bgColor) => set({ bgColor }),
  setBubbleColor: (bubbleColor) => set({ bubbleColor }),
  setBgImage: (bgImage) => set({ bgImage }),

  // Messages
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  updateMessage: (id, updates) =>
    set((state) => {
      const current = state.messages.find((message) => message.id === id);
      if (!current) return state;

      const nextMessage = { ...current, ...updates };
      const messages = state.messages.map((message) => (message.id === id ? nextMessage : message));
      const speechChanged =
        getMessageSpeakableText(current) !== getMessageSpeakableText(nextMessage) ||
        current.direction !== nextMessage.direction;

      if (!speechChanged) return { messages };

      const ttsAudioMap = normalizeTtsAudioMap(state.messages, state.ttsAudioMap);
      delete ttsAudioMap[id];
      return { messages, ttsAudioMap };
    }),
  deleteMessage: (id) =>
    set((state) => {
      const ttsAudioMap = normalizeTtsAudioMap(state.messages, state.ttsAudioMap);
      delete ttsAudioMap[id];
      return { messages: state.messages.filter((message) => message.id !== id), ttsAudioMap };
    }),
  reorderMessages: (messages) =>
    set((state) => ({
      messages,
      ttsAudioMap: normalizeTtsAudioMap(state.messages, state.ttsAudioMap),
    })),
  reverseAllDirections: () =>
    set((state) => ({
      messages: state.messages.map((m) => ({
        ...m,
        direction: m.direction === 'incoming' ? 'outgoing' : 'incoming',
      })),
      // Incoming/outgoing may use different voices, so every swapped bubble
      // needs new audio.
      ttsAudioMap: {},
    })),

  // Video settings
  setHoldMs: (holdMs) => set({ holdMs }),
  setReplyDelay: (replyDelay) => set({ replyDelay }),
  setUseTyping: (useTyping) => set({ useTyping }),
  setUseSoundIn: (useSoundIn) => set({ useSoundIn }),
  setUseSoundOut: (useSoundOut) => set({ useSoundOut }),

  // Zoom
  setAutoZoom: (autoZoom) => set({ autoZoom }),
  setZoomScale: (zoomScale) => set({ zoomScale }),
  setZoomSpeed: (zoomSpeed) => set({ zoomSpeed }),

  // TTS
  setEnableTts: (enableTts) => set({ enableTts }),
  setTtsProvider: (ttsProvider) => set({ ttsProvider }),
  setElevenKey: (elevenKey) => set({ elevenKey }),
  setQwenKey: (qwenKey) => set({ qwenKey }),
  setElevenModel: (elevenModel) => set({ elevenModel }),
  setTtsVoiceIn: (ttsVoiceIn) => set({ ttsVoiceIn }),
  setTtsVoiceOut: (ttsVoiceOut) => set({ ttsVoiceOut }),
  setTtsStability: (ttsStability) => set({ ttsStability }),
  setTtsStyle: (ttsStyle) => set({ ttsStyle }),
  setTtsSpeed: (ttsSpeed) => set({ ttsSpeed }),
  setAudioMapEntry: (key: string | number, url: string) =>
    set((state) => ({
      ttsAudioMap: { ...normalizeTtsAudioMap(state.messages, state.ttsAudioMap), [key]: url },
    })),
  removeAudioMapEntry: (messageId) =>
    set((state) => {
      const ttsAudioMap = normalizeTtsAudioMap(state.messages, state.ttsAudioMap);
      delete ttsAudioMap[messageId];
      return { ttsAudioMap };
    }),
  clearAudioMap: () => set({ ttsAudioMap: {} }),

  // Header
  setHeaderStatus: (headerStatus) => set({ headerStatus }),
  setHeaderStatusText: (headerStatusText) => set({ headerStatusText }),
  setActiveHeaderStatusOverride: (activeHeaderStatusOverride) => set({ activeHeaderStatusOverride }),
  setPinnedMessage: (pinnedMessage) => set({ pinnedMessage }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setDateBadge: (dateBadge) => set({ dateBadge }),

  // Bulk
  applyPayload: (payload) =>
    set((state) => {
      const messages = payload.messages ?? state.messages;
      const sourceAudioMap = payload.ttsAudioMap ?? state.ttsAudioMap;
      return {
        ...state,
        ...payload,
        ttsAudioMap: normalizeTtsAudioMap(messages, sourceAudioMap),
      };
    }),
  resetToDefault: () => set(DEFAULT_EDITOR_STATE),
}));
