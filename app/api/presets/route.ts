import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEAM_PASSCODE = process.env.TEAM_PASSCODE ?? 'loves2026';
const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL ?? 'https://wa-templates-worker.aldoramadhan16.workers.dev';

// In-memory local cache/fallback
const localTemplatesCache: Record<string, any> = {};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedId = searchParams.get('id');

  try {
    // Call existing Cloudflare Worker with X-Team-Passcode header & passcode param
    const workerRes = await fetch(`${WORKER_URL}/templates?passcode=${encodeURIComponent(TEAM_PASSCODE)}`, {
      headers: {
        'X-Team-Passcode': TEAM_PASSCODE,
      },
      cache: 'no-store',
    });

    if (workerRes.ok) {
      const data = await workerRes.json();
      // Worker returns { templates: { [id]: preset, ... } } or { [id]: preset }
      const remoteTemplates = data.templates ?? data ?? {};

      // Sync into local cache
      Object.assign(localTemplatesCache, remoteTemplates);

      if (requestedId) {
        const single = localTemplatesCache[requestedId];
        if (!single) {
          return NextResponse.json({ error: 'Preset tidak ditemukan' }, { status: 404 });
        }
        return NextResponse.json({ preset: single });
      }

      return NextResponse.json({ templates: localTemplatesCache });
    } else {
      console.warn('[GET /api/presets] Worker returned HTTP status:', workerRes.status);
    }
  } catch (e) {
    console.warn('[GET /api/presets] Cloudflare Worker fetch failed, using local cache:', e);
  }

  // Fallback to local cache
  if (requestedId) {
    const single = localTemplatesCache[requestedId];
    if (!single) {
      return NextResponse.json({ error: 'Preset tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ preset: single });
  }

  return NextResponse.json({ templates: localTemplatesCache });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Body can be { templates: { [id]: preset } } or { id, name, data }
    let updatedTemplates = { ...localTemplatesCache };

    if (body.templates) {
      updatedTemplates = { ...updatedTemplates, ...body.templates };
    } else if (body.id) {
      updatedTemplates[body.id] = body;
    }

    // Save to local cache
    Object.assign(localTemplatesCache, updatedTemplates);

    // Save to existing Cloudflare Worker KV using X-Team-Passcode header
    try {
      const workerRes = await fetch(`${WORKER_URL}/templates?passcode=${encodeURIComponent(TEAM_PASSCODE)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Team-Passcode': TEAM_PASSCODE,
        },
        body: JSON.stringify({ templates: updatedTemplates }),
      });

      if (!workerRes.ok) {
        const errText = await workerRes.text();
        console.warn('[POST /api/presets] Worker update failed:', workerRes.status, errText);
      } else {
        console.log('✅ Preset saved to Cloudflare Worker KV successfully!');
      }
    } catch (err) {
      console.warn('[POST /api/presets] Failed connecting to Worker, saved to local cache:', err);
    }

    return NextResponse.json({ success: true, templates: updatedTemplates });
  } catch (e) {
    console.error('[POST /api/presets] Error:', e);
    return NextResponse.json(
      { error: 'Gagal menyimpan preset' },
      { status: 500 }
    );
  }
}
