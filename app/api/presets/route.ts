import { NextRequest, NextResponse } from 'next/server';

const TEAM_PASSCODE = process.env.TEAM_PASSCODE ?? 'loves2026';
const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL ?? 'https://wa-templates-worker.aldoramadhan16.workers.dev';

function checkPasscode(req: NextRequest): boolean {
  const passcode = req.headers.get('X-Team-Passcode');
  return passcode === TEAM_PASSCODE;
}

export async function GET(req: NextRequest) {
  if (!checkPasscode(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${WORKER_URL}/templates`, {
      headers: { 'X-Passcode': TEAM_PASSCODE },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Worker error: ${text}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('[GET /api/presets] Error:', e);
    return NextResponse.json(
      { error: 'Gagal memuat preset dari cloud' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!checkPasscode(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const res = await fetch(`${WORKER_URL}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Passcode': TEAM_PASSCODE,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Worker error: ${text}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[POST /api/presets] Error:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan preset ke cloud' },
      { status: 500 }
    );
  }
}
