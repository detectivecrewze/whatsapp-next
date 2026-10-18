import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Parameter url wajib diisi' }, { status: 400 });
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'Protokol URL tidak valid' }, { status: 400 });
    }

    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Prefer the animated GIF rendition from CDNs such as Tenor. Asking
        // for WebP/AVIF can return a format that Remotion's GIF decoder cannot
        // synchronize to the composition frame.
        Accept: 'image/gif, */*;q=0.1',
      },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Gagal mengambil gambar dari sumber (${upstream.status})` },
        { status: upstream.status },
      );
    }

    const buffer = await upstream.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isGif =
      bytes.length >= 6 &&
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) &&
      bytes[5] === 0x61;
    const upstreamContentType = upstream.headers.get('content-type') || '';
    // @remotion/gif validates the response MIME type before decoding. Some CDN
    // endpoints serve valid GIF bytes with a generic or incorrect MIME header.
    const contentType = isGif ? 'image/gif' : upstreamContentType || 'application/octet-stream';

    if (!isGif) {
      return NextResponse.json(
        { error: 'URL tersebut tidak berisi file GIF yang valid. Gunakan direct link file .gif.' },
        { status: 415 },
      );
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses media';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
