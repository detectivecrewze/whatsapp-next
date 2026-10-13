import { TtsRequest } from '@/types';
import { cleanSpeechText } from './speech';

/**
 * Generate TTS audio via Next.js API Route (server-side, no CORS issues).
 * Returns a Blob URL for playback.
 */
export async function generateTtsBlob(req: TtsRequest): Promise<string> {
  const cleanText = cleanSpeechText(req.text);
  if (!cleanText.trim()) throw new Error('Teks kosong, tidak bisa generate audio');

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...req, text: cleanText }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS gagal (${res.status}): ${err}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Upload MP3 Blob to Cloudflare R2 via API Route.
 * Returns CDN URL.
 */
export async function uploadAudioBlob(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();

  const res = await fetch('/api/upload-audio', {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'audio/mpeg' },
    body: arrayBuffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload audio gagal (${res.status}): ${err}`);
  }

  const data = await res.json();
  if (!data.url) throw new Error('Cloud tidak mengembalikan URL audio.');
  return data.url as string;
}

export function isTemporaryAudioUrl(url: string): boolean {
  return url.startsWith('blob:') || url.startsWith('data:');
}

/** Persist one temporary browser audio source and keep cloud URLs unchanged. */
export async function persistAudioSourceForCloud(source?: string | null): Promise<string | null> {
  if (!source) return null;
  if (!isTemporaryAudioUrl(source)) return source;

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error('Audio sementara sudah kedaluwarsa. Upload ulang backsound lalu simpan lagi.');
  }

  return uploadAudioBlob(await response.blob());
}

/**
 * Upload URL audio browser sementara sebelum project disimpan ke cloud.
 * Entri ID dan index yang menunjuk MP3 sama hanya akan diunggah satu kali.
 */
export async function persistAudioMapForCloud(
  audioMap: Record<string | number, string> = {},
): Promise<Record<string, string>> {
  const persisted: Record<string, string> = {};
  const uploadedBySource = new Map<string, string>();

  for (const [key, source] of Object.entries(audioMap)) {
    if (!source || !isTemporaryAudioUrl(source)) {
      if (source) persisted[key] = source;
      continue;
    }

    let cloudUrl = uploadedBySource.get(source);
    if (!cloudUrl) {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error('Audio sementara sudah kedaluwarsa. Buat ulang voice over lalu simpan lagi.');
      }
      cloudUrl = await uploadAudioBlob(await response.blob());
      uploadedBySource.set(source, cloudUrl);
    }
    persisted[key] = cloudUrl;
  }

  return persisted;
}
