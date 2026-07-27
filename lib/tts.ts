import { TtsRequest } from '@/types';
import { stripAudioTags } from './utils';

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL ?? 'https://wa-templates-worker.aldoramadhan16.workers.dev';

/**
 * Generate TTS audio via Next.js API Route (server-side, no CORS issues).
 * Returns a Blob URL for playback.
 */
export async function generateTtsBlob(req: TtsRequest): Promise<string> {
  const cleanText = stripAudioTags(req.text);
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
    headers: { 'Content-Type': 'audio/mpeg' },
    body: arrayBuffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload audio gagal (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.url as string;
}
