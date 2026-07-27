/**
 * Cloudflare Worker for WhatsApp Generator (Next.js v2.0)
 * Storage:
 *  - KV: WA_TEMPLATES_KV (Stores template JSON presets)
 *  - R2: AUDIO_BUCKET (Stores rendered MP3 voiceovers)
 */

const PASSCODE = 'loves2026';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Passcode, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ── GET /templates ──────────────────────────────────────────────────
      if (path === '/templates' && method === 'GET') {
        const raw = await env.WA_TEMPLATES_KV.get('templates_data');
        const templates = raw ? JSON.parse(raw) : {};
        return new Response(JSON.stringify({ templates }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── POST /templates ─────────────────────────────────────────────────
      if (path === '/templates' && method === 'POST') {
        const passcode = request.headers.get('X-Passcode');
        if (passcode !== PASSCODE) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const body = await request.json();
        const templates = body.templates ?? {};
        await env.WA_TEMPLATES_KV.put('templates_data', JSON.stringify(templates));

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── POST /upload-audio (Upload MP3 to R2) ───────────────────────────
      if (path === '/upload-audio' && method === 'POST') {
        const audioBuffer = await request.arrayBuffer();
        if (!audioBuffer || audioBuffer.byteLength === 0) {
          return new Response(JSON.stringify({ error: 'Audio data is empty' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const filename = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`;

        // Store in Cloudflare R2 bucket
        if (env.AUDIO_BUCKET) {
          await env.AUDIO_BUCKET.put(filename, audioBuffer, {
            httpMetadata: { contentType: 'audio/mpeg' },
          });
        }

        // Return CDN URL
        const cdnUrl = `${url.origin}/audio/${filename}`;
        return new Response(JSON.stringify({ url: cdnUrl, key: filename }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── GET /audio/:filename (Serve audio from R2) ──────────────────────
      if (path.startsWith('/audio/') && method === 'GET') {
        const filename = path.replace('/audio/', '');
        if (env.AUDIO_BUCKET) {
          const object = await env.AUDIO_BUCKET.get(filename);
          if (object) {
            return new Response(object.body, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=31536000',
              },
            });
          }
        }
        return new Response('Audio not found', { status: 404 });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
