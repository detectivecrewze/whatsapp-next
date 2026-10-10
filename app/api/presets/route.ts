import { NextRequest, NextResponse } from 'next/server';
import type { CloudPreset } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEAM_PASSCODE = process.env.TEAM_PASSCODE ?? 'loves2026';
const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL ?? 'https://wa-templates-worker.aldoramadhan16.workers.dev';

const localTemplatesCache: Record<string, CloudPreset> = {};

const workerHeaders = {
  'X-Passcode': TEAM_PASSCODE,
  'X-Team-Passcode': TEAM_PASSCODE,
};

function replaceLocalCache(templates: Record<string, CloudPreset>) {
  for (const id of Object.keys(localTemplatesCache)) delete localTemplatesCache[id];
  Object.assign(localTemplatesCache, templates);
}

async function readWorkerTemplates(): Promise<Record<string, CloudPreset>> {
  const response = await fetch(`${WORKER_URL}/templates?passcode=${encodeURIComponent(TEAM_PASSCODE)}`, {
    headers: workerHeaders,
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`Cloudflare Worker GET ${response.status}`);

  const data = await response.json();
  return data.templates ?? data ?? {};
}

async function writeWorkerTemplates(templates: Record<string, CloudPreset>) {
  // Worker versi lama menimpa satu nilai KV. Kirim koleksi lengkap supaya
  // menambah satu project tidak pernah menghapus project sebelumnya.
  const response = await fetch(`${WORKER_URL}/templates?passcode=${encodeURIComponent(TEAM_PASSCODE)}`, {
    method: 'POST',
    headers: {
      ...workerHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ templates, replace: true }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Cloudflare Worker POST ${response.status}: ${detail.slice(0, 200)}`);
  }
}

export async function GET(req: NextRequest) {
  const requestedId = new URL(req.url).searchParams.get('id');

  try {
    replaceLocalCache(await readWorkerTemplates());
  } catch (error) {
    console.warn('[GET /api/presets] Cloud unavailable, using server cache:', error);
  }

  if (requestedId) {
    const preset = localTemplatesCache[requestedId];
    if (!preset) return NextResponse.json({ error: 'Preset tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ preset });
  }

  return NextResponse.json({ templates: { ...localTemplatesCache } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let remoteTemplates: Record<string, CloudPreset>;

    try {
      remoteTemplates = await readWorkerTemplates();
    } catch (error) {
      console.warn('[POST /api/presets] Could not hydrate remote collection:', error);
      remoteTemplates = { ...localTemplatesCache };
    }

    const incoming: Record<string, CloudPreset> = body.templates
      ?? (body.id ? { [body.id]: body as CloudPreset } : {});
    const updatedTemplates = { ...remoteTemplates, ...incoming };

    await writeWorkerTemplates(updatedTemplates);
    replaceLocalCache(updatedTemplates);

    return NextResponse.json({ success: true, templates: updatedTemplates });
  } catch (error) {
    console.error('[POST /api/presets] Cloud save failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menyimpan preset' },
      { status: 502 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id ?? new URL(req.url).searchParams.get('id') ?? '');
    if (!id) return NextResponse.json({ error: 'ID preset wajib diisi' }, { status: 400 });

    let remoteTemplates: Record<string, CloudPreset>;
    try {
      remoteTemplates = await readWorkerTemplates();
    } catch {
      remoteTemplates = { ...localTemplatesCache };
    }

    delete remoteTemplates[id];
    await writeWorkerTemplates(remoteTemplates);
    replaceLocalCache(remoteTemplates);

    return NextResponse.json({ success: true, templates: remoteTemplates });
  } catch (error) {
    console.error('[DELETE /api/presets] Cloud delete failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menghapus preset' },
      { status: 502 },
    );
  }
}
