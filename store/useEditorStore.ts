'use client';

import { create } from 'zustand';
import { EditorState, Message, TtsProvider, DEFAULT_EDITOR_STATE } from '@/types';

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
  setElevenModel: (model: string) => void;
  setTtsVoiceIn: (id: string) => void;
  setTtsVoiceOut: (id: string) => void;
  setTtsStability: (v: number) => void;
  setTtsStyle: (v: number) => void;
  setTtsSpeed: (v: number) => void;
  setAudioMapEntry: (idx: number, url: string) => void;
  clearAudioMap: () => void;

  // Header
  setHeaderStatus: (status: 'online' | 'typing' | 'custom') => void;
  setHeaderStatusText: (text: string) => void;
  setPinnedMessage: (msg: string) => void;
  setUnreadCount: (n: number) => void;

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
  setBgImage: (bgImage) => set({ bgImage }),

  // Messages
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  deleteMessage: (id) =>
    set((state) => ({ messages: state.messages.filter((m) => m.id !== id) })),
  reorderMessages: (messages) => set({ messages }),
  reverseAllDirections: () =>
    set((state) => ({
      messages: state.messages.map((m) => ({
        ...m,
        direction: m.direction === 'incoming' ? 'outgoing' : 'incoming',
      })),
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
  setElevenModel: (elevenModel) => set({ elevenModel }),
  setTtsVoiceIn: (ttsVoiceIn) => set({ ttsVoiceIn }),
  setTtsVoiceOut: (ttsVoiceOut) => set({ ttsVoiceOut }),
  setTtsStability: (ttsStability) => set({ ttsStability }),
  setTtsStyle: (ttsStyle) => set({ ttsStyle }),
  setTtsSpeed: (ttsSpeed) => set({ ttsSpeed }),
  setAudioMapEntry: (idx, url) =>
    set((state) => ({ ttsAudioMap: { ...state.ttsAudioMap, [idx]: url } })),
  clearAudioMap: () => set({ ttsAudioMap: {} }),

  // Header
  setHeaderStatus: (headerStatus) => set({ headerStatus }),
  setHeaderStatusText: (headerStatusText) => set({ headerStatusText }),
  setPinnedMessage: (pinnedMessage) => set({ pinnedMessage }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),

  // Bulk
  applyPayload: (payload) => set((state) => ({ ...state, ...payload })),
  resetToDefault: () => set(DEFAULT_EDITOR_STATE),
}));
