import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEAM_PASSCODE = process.env.TEAM_PASSCODE ?? 'loves2026';
const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL ?? 'https://wa-templates-worker.aldoramadhan16.workers.dev';

// In-memory fallback storage when worker is not reachable or not deployed yet
const inMemoryTemplates: Record<string, any> = {};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedId = searchParams.get('id');

  // Try fetching from Cloudflare Worker first
  try {
    const res = await fetch(`${WORKER_URL}/templates`, {
      headers: { 'X-Passcode': TEAM_PASSCODE },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      const templates = data.templates ?? {};

      // Merge with in-memory templates
      const merged = { ...inMemoryTemplates, ...templates };

      if (requestedId) {
        const single = merged[requestedId];
        if (!single) {
          return NextResponse.json({ error: 'Preset tidak ditemukan' }, { status: 404 });
        }
        return NextResponse.json({ preset: single });
      }

      return NextResponse.json({ templates: merged });
    }
  } catch (e) {
    console.warn('[GET /api/presets] Worker fetch failed, using in-memory store:', e);
  }

  // Fallback to in-memory templates
  if (requestedId) {
    const single = inMemoryTemplates[requestedId];
    if (!single) {
      return NextResponse.json({ error: 'Preset tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ preset: single });
  }

  return NextResponse.json({ templates: inMemoryTemplates });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Body can be { templates: { ... } } or a single preset object
    if (body.templates) {
      Object.assign(inMemoryTemplates, body.templates);
    } else if (body.id) {
      inMemoryTemplates[body.id] = body;
    }

    // Attempt to push to Cloudflare Worker if available
    try {
      const res = await fetch(`${WORKER_URL}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Passcode': TEAM_PASSCODE,
        },
        body: JSON.stringify({ templates: inMemoryTemplates }),
      });

      if (!res.ok) {
        console.warn('[POST /api/presets] Worker update responded with status:', res.status);
      }
    } catch (e) {
      console.warn('[POST /api/presets] Worker update failed, saved to server memory:', e);
    }

    return NextResponse.json({ success: true, count: Object.keys(inMemoryTemplates).length });
  } catch (e) {
    console.error('[POST /api/presets] Error:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan preset' },
      { status: 500 }
    );
  }
}
