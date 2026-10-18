/**
 * Cloudflare Worker for WhatsApp Generator (Next.js v2.0)
 * Storage:
 *  - KV: WA_TEMPLATES_KV (Stores template JSON presets)
 *  - R2: AUDIO_BUCKET (Stores voiceovers and persistent Brand Studio media)
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
      'Access-Control-Allow-Headers': 'Content-Type, X-Passcode, X-Team-Passcode, Authorization',
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
        const passcode = request.headers.get('X-Passcode') || request.headers.get('X-Team-Passcode') || url.searchParams.get('passcode');
        if (passcode !== PASSCODE) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const body = await request.json();
        const raw = await env.WA_TEMPLATES_KV.get('templates_data');
        const currentTemplates = raw ? JSON.parse(raw) : {};
        const templates = body.replace === true
          ? (body.templates ?? {})
          : { ...currentTemplates, ...(body.templates ?? {}) };
        await env.WA_TEMPLATES_KV.put('templates_data', JSON.stringify(templates));

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── Brand Studio projects use a separate KV key from WhatsApp presets ──
      if (path === '/brand-presets') {
        const passcode = request.headers.get('X-Passcode') || request.headers.get('X-Team-Passcode') || url.searchParams.get('passcode');
        if (passcode !== PASSCODE) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const raw = await env.WA_TEMPLATES_KV.get('brand_templates_data');
        const projects = raw ? JSON.parse(raw) : {};

        if (method === 'GET') {
          return new Response(JSON.stringify({ projects }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (method === 'POST') {
          const { project } = await request.json();
          if (!project?.id || !project?.name || !project?.data) {
            return new Response(JSON.stringify({ error: 'Data project tidak lengkap' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          projects[project.id] = project;
          await env.WA_TEMPLATES_KV.put('brand_templates_data', JSON.stringify(projects));
          return new Response(JSON.stringify({ success: true, projects }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (method === 'DELETE') {
          const { id } = await request.json();
          if (!id || !projects[id]) {
            return new Response(JSON.stringify({ error: 'Project tidak ditemukan' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          delete projects[id];
          await env.WA_TEMPLATES_KV.put('brand_templates_data', JSON.stringify(projects));
          return new Response(JSON.stringify({ success: true, projects }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Persistent media for Brand Studio projects. Uses the existing R2 binding.
      if (path === '/upload-brand-media' && method === 'POST') {
        const passcode = request.headers.get('X-Passcode') || request.headers.get('X-Team-Passcode') || url.searchParams.get('passcode');
        if (passcode !== PASSCODE) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!env.AUDIO_BUCKET) {
          return new Response(JSON.stringify({ error: 'R2 belum dikonfigurasi untuk menyimpan media Brand Studio' }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
        if (!/^(image|video|audio)\//.test(contentType)) {
          return new Response(JSON.stringify({ error: 'Jenis file media tidak didukung' }), {
            status: 415,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const mediaBuffer = await request.arrayBuffer();
        if (!mediaBuffer.byteLength || mediaBuffer.byteLength > 50 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: 'Ukuran file harus di bawah 50 MB' }), {
            status: mediaBuffer.byteLength ? 413 : 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const extension = contentType.split('/')[1]?.split(';')[0]?.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'bin';
        const filename = `brand_${Date.now()}_${crypto.randomUUID()}.${extension}`;
        await env.AUDIO_BUCKET.put(filename, mediaBuffer, { httpMetadata: { contentType } });
        return new Response(JSON.stringify({ url: `${url.origin}/brand-media/${filename}`, key: filename }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/brand-media/') && method === 'GET') {
        const filename = path.slice('/brand-media/'.length);
        if (!/^[a-z0-9_-]+\.[a-z0-9]+$/i.test(filename) || !env.AUDIO_BUCKET) {
          return new Response('Media not found', { status: 404, headers: corsHeaders });
        }
        const object = await env.AUDIO_BUCKET.get(filename);
        if (!object) return new Response('Media not found', { status: 404, headers: corsHeaders });
        return new Response(object.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }

      // ── POST /upload-audio (Upload MP3 to R2) ───────────────────────────
      if (path === '/upload-audio' && method === 'POST') {
        const passcode = request.headers.get('X-Passcode') || request.headers.get('X-Team-Passcode') || url.searchParams.get('passcode');
        if (passcode !== PASSCODE) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const audioBuffer = await request.arrayBuffer();
        if (!audioBuffer || audioBuffer.byteLength === 0) {
          return new Response(JSON.stringify({ error: 'Audio data is empty' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const filename = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`;

        if (!env.AUDIO_BUCKET) {
          return new Response(JSON.stringify({ error: 'AUDIO_BUCKET R2 belum dikonfigurasi' }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await env.AUDIO_BUCKET.put(filename, audioBuffer, {
          httpMetadata: { contentType: 'audio/mpeg' },
        });

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
