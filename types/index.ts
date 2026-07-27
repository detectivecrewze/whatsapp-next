// ============================================================
// TYPES — WhatsApp Dark Mode Content Generator (Next.js v2.0)
// ============================================================

export type MessageType =
  | 'text'
  | 'image'
  | 'view_once'
  | 'voice_note'
  | 'notification'
  | 'transfer'
  | 'contact'
  | 'location'
  | 'deleted';

export type MessageDirection = 'incoming' | 'outgoing';
export type PhoneOs = 'ios' | 'android';
export type ChatType = 'personal' | 'group';
export type BgType = 'default' | 'color' | 'image';
export type TtsProvider = 'elevenlabs' | 'free_neural';
export type HeaderStatus = 'online' | 'typing' | 'custom';

export interface Message {
  id: string;
  type: MessageType;
  direction: MessageDirection;
  text?: string;
  caption?: string;
  imageData?: string;       // base64 or CDN URL
  audioDataUrl?: string;    // Pre-rendered TTS CDN URL
  time?: string;
  senderName?: string;      // For group chat badge
  senderColor?: string;
  customHoldMs?: number;
  waveform?: number[];      // Array 0-100 for VN waveform
  duration?: string;        // Voice note duration display
}

export interface EditorState {
  // Contact / Profile
  name: string;
  pfp: string | null;
  phoneOs: PhoneOs;
  chatType: ChatType;
  groupSubtitle: string;
  batteryLevel: number;
  customTime: string;
  useCustomTime: boolean;

  // Wallpaper / Background
  bgType: BgType;
  bgColor: string;
  bgImage: string | null;

  // Messages
  messages: Message[];

  // Video / Animation settings
  holdMs: number;
  replyDelay: number;
  useTyping: boolean;
  useSoundIn: boolean;
  useSoundOut: boolean;

  // Auto-zoom camera
  autoZoom: boolean;
  zoomScale: number;
  zoomSpeed: number;

  // TTS / Voice Over
  enableTts: boolean;
  ttsProvider: TtsProvider;
  elevenKey: string;
  elevenModel: string;
  ttsVoiceIn: string;
  ttsVoiceOut: string;
  ttsStability: number;
  ttsStyle: number;
  ttsSpeed: number;
  ttsAudioMap: Record<number, string>; // CDN URLs per message index

  // Header / UI
  headerStatus: HeaderStatus;
  headerStatusText: string;
  activeHeaderStatusOverride?: HeaderStatus | null; // Smart status override during animation
  pinnedMessage: string;
  unreadCount: number;
}

export interface CloudPreset {
  id: string;
  name: string;
  updatedAt: number;
  data: Partial<EditorState>;
}

export interface TtsRequest {
  text: string;
  provider: TtsProvider;
  voiceId: string;
  apiKey: string;
  model?: string;
  stability?: number;
  style?: number;
  speed?: number;
}

export interface UploadAudioResponse {
  url: string;
  key: string;
}

export interface PresetsResponse {
  templates: Record<string, CloudPreset>;
}

// Default voices for ElevenLabs
export const ELEVENLABS_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Incoming - Wanita)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Incoming - Pria)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Incoming - Pria)' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Outgoing - Pria)' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam (Outgoing - Pria)' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Outgoing - Wanita)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Outgoing - Wanita)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (Neutral - Pria)' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy (Neutral - Wanita)' },
  { id: 'custom', name: '🔧 Custom Voice ID...' },
] as const;

export const ELEVENLABS_MODELS = [
  { id: 'eleven_v3', name: 'ElevenLabs v3 (Ultra Realist) ⭐' },
  { id: 'eleven_multilingual_v2', name: 'Multilingual v2 (Stabil)' },
  { id: 'eleven_turbo_v2_5', name: 'Turbo v2.5 (Cepat)' },
  { id: 'eleven_flash_v2_5', name: 'Flash v2.5 (Tercepat)' },
] as const;

export const DEFAULT_EDITOR_STATE: EditorState = {
  name: 'Sayang ❤️',
  pfp: null,
  phoneOs: 'ios',
  chatType: 'personal',
  groupSubtitle: '',
  batteryLevel: 82,
  customTime: '09:41',
  useCustomTime: false,
  bgType: 'default',
  bgColor: '#0a1014',
  bgImage: null,
  messages: [
    {
      id: 'msg-1',
      type: 'text',
      direction: 'incoming',
      text: 'Halo! 👋 Ini adalah preview WhatsApp Generator kamu.',
      time: '09:41',
    },
    {
      id: 'msg-2',
      type: 'text',
      direction: 'outgoing',
      text: 'Wah keren banget! Ayo kita buat konten viral 🔥',
      time: '09:42',
    },
  ],
  holdMs: 2500,
  replyDelay: 1200,
  useTyping: true,
  useSoundIn: true,
  useSoundOut: true,
  autoZoom: true,
  zoomScale: 1.08,
  zoomSpeed: 0.4,
  enableTts: false,
  ttsProvider: 'elevenlabs',
  elevenKey: 'sk_dd3ed95fa937222315a2a3d3aaa40b40caabe67f2fafc50f',
  elevenModel: 'eleven_v3',
  ttsVoiceIn: 'EXAVITQu4vr4xnSDxMaL',
  ttsVoiceOut: 'pNInz6obpgDQGcFmaJgB',
  ttsStability: 0.25,
  ttsStyle: 0.5,
  ttsSpeed: 1.0,
  ttsAudioMap: {},
  headerStatus: 'online',
  headerStatusText: '',
  pinnedMessage: '',
  unreadCount: 0,
};
