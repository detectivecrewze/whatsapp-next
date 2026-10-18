import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEAM_PASSCODE = process.env.TEAM_PASSCODE ?? 'loves2026';
const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL ?? 'https://wa-templates-worker.aldoramadhan16.workers.dev';
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || 'application/octet-stream';
    if (!/^(image|video|audio)\//.test(contentType)) {
      return NextResponse.json({ error: 'File harus berupa gambar, video, atau audio.' }, { status: 415 });
    }
    const buffer = await req.arrayBuffer();
    if (!buffer.byteLength || buffer.byteLength > MAX_MEDIA_BYTES) {
      return NextResponse.json({ error: 'Ukuran media maksimal 50 MB.' }, { status: buffer.byteLength ? 413 : 400 });
    }
    const response = await fetch(`${WORKER_URL}/upload-brand-media?passcode=${encodeURIComponent(TEAM_PASSCODE)}`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'X-Passcode': TEAM_PASSCODE,
        'X-Team-Passcode': TEAM_PASSCODE,
      },
      body: buffer,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ error: payload.error || `Upload cloud gagal (${response.status}).` }, { status: response.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[POST /api/upload-brand-media] Upload failed:', error);
    return NextResponse.json({ error: 'Media tidak berhasil diunggah ke cloud.' }, { status: 502 });
  }
}
