import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL ?? 'https://wa-templates-worker.aldoramadhan16.workers.dev';

export async function POST(req: NextRequest) {
  try {
    const audioBuffer = await req.arrayBuffer();

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Audio data kosong' }, { status: 400 });
    }

    // Upload to Cloudflare Worker (which proxies to R2)
    const res = await fetch(`${WORKER_URL}/upload-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
      },
      body: audioBuffer,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[upload-audio] Worker error:', err);
      return NextResponse.json(
        { error: `Upload gagal (${res.status}): ${err}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('[POST /api/upload-audio] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error saat upload audio' },
      { status: 500 }
    );
  }
}
