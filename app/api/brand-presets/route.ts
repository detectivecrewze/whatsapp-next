import { NextRequest, NextResponse } from 'next/server';
import type { BrandCloudPreset } from '@/types/brand';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEAM_PASSCODE = process.env.TEAM_PASSCODE ?? 'loves2026';
const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL ?? 'https://wa-templates-worker.aldoramadhan16.workers.dev';

function workerHeaders() {
  return {
    'X-Passcode': TEAM_PASSCODE,
    'X-Team-Passcode': TEAM_PASSCODE,
    'Content-Type': 'application/json',
  };
}

async function proxyWorker(method: 'GET' | 'POST' | 'DELETE', body?: { project?: BrandCloudPreset; id?: string }) {
  const response = await fetch(`${WORKER_URL}/brand-presets?passcode=${encodeURIComponent(TEAM_PASSCODE)}`, {
    method,
    headers: workerHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(
      { error: payload.error || `Cloud Worker merespons ${response.status}` },
      { status: response.status },
    );
  }
  return NextResponse.json(payload);
}

export async function GET() {
  try {
    return await proxyWorker('GET');
  } catch (error) {
    console.error('[GET /api/brand-presets] Cloud unavailable:', error);
    return NextResponse.json({ error: 'Cloud Brand Studio tidak dapat dihubungi.' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.project?.id || !body.project?.name || !body.project?.data) {
      return NextResponse.json({ error: 'Data project tidak lengkap.' }, { status: 400 });
    }
    return await proxyWorker('POST', { project: body.project as BrandCloudPreset });
  } catch (error) {
    console.error('[POST /api/brand-presets] Cloud save failed:', error);
    return NextResponse.json({ error: 'Gagal menyimpan project Brand Studio ke cloud.' }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID project wajib diisi.' }, { status: 400 });
    return await proxyWorker('DELETE', { id: String(id) });
  } catch (error) {
    console.error('[DELETE /api/brand-presets] Cloud delete failed:', error);
    return NextResponse.json({ error: 'Gagal menghapus project Brand Studio.' }, { status: 502 });
  }
}
