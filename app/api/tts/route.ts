import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';
const GOOGLE_TTS_BASE = 'https://translate.google.com/translate_tts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      provider,
      voiceId,
      apiKey,
      model = 'eleven_v3',
      stability = 0.25,
      style = 0.5,
      speed = 1.0,
    } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Teks kosong' }, { status: 400 });
    }

    // ── ElevenLabs ──────────────────────────────────────────────
    if (provider === 'elevenlabs') {
      const activeKey = apiKey?.trim() || process.env.ELEVENLABS_API_KEY || '';
      if (!activeKey) {
        return NextResponse.json({ error: 'API Key ElevenLabs tidak dikonfigurasi' }, { status: 400 });
      }

      const res = await fetch(`${ELEVEN_BASE}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': activeKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: {
            stability,
            similarity_boost: 0.75,
            style,
            speed,                  // ← was missing! now forwarded to ElevenLabs
            use_speaker_boost: true,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('[TTS/ElevenLabs] Error:', err);
        return NextResponse.json(
          { error: `ElevenLabs error (${res.status}): ${err}` },
          { status: res.status }
        );
      }

      const audioBuffer = await res.arrayBuffer();
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(audioBuffer.byteLength),
          'Cache-Control': 'no-store',
        },
      });
    }

    // ── Free Neural (Google TTS Proxy) ───────────────────────────
    if (provider === 'free_neural') {
      const lang = 'id';
      const truncated = text.slice(0, 200); // Google TTS limit
      const url = new URL(GOOGLE_TTS_BASE);
      url.searchParams.set('ie', 'UTF-8');
      url.searchParams.set('q', truncated);
      url.searchParams.set('tl', lang);
      url.searchParams.set('client', 'tw-ob');
      url.searchParams.set('ttsspeed', String(speed));

      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Google TTS error (${res.status})` },
          { status: res.status }
        );
      }

      const audioBuffer = await res.arrayBuffer();
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(audioBuffer.byteLength),
          'Cache-Control': 'no-store',
        },
      });
    }

    // ── Qwen CosyVoice (Aliyun DashScope) ──────────────────────────
    if (provider === 'qwen_cosyvoice') {
      const activeKey = apiKey?.trim() || process.env.QWEN_API_KEY || '';
      if (!activeKey) {
        return NextResponse.json({ error: 'API Key Qwen/DashScope tidak dikonfigurasi. Silakan masukan di input field.' }, { status: 400 });
      }

      // Try DashScope Audio Synthesis endpoints (qwen-audio-3.0-tts-flash / cosyvoice-v1)
      const targetModel = model || 'qwen-audio-3.0-tts-flash';
      const endpoints = [
        'https://dashscope-intl.aliyuncs.com/api/v1/services/audio/audio-synthesis/synthesis',
        'https://dashscope-intl.aliyuncs.com/api/v1/services/audio/tts/generation',
      ];

      let lastError = '';
      for (const qwenTtsUrl of endpoints) {
        try {
          const res = await fetch(qwenTtsUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${activeKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: targetModel,
              input: {
                text,
              },
              parameters: {
                voice: voiceId || 'cherry',
                sample_rate: 22050,
                format: 'mp3',
              },
            }),
          });

          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const json = await res.json();
              const audioUrl = json.output?.audio_url || json.output?.url;
              if (audioUrl) {
                const fetchAudio = await fetch(audioUrl);
                const buf = await fetchAudio.arrayBuffer();
                return new NextResponse(buf, {
                  status: 200,
                  headers: {
                    'Content-Type': 'audio/mpeg',
                    'Content-Length': String(buf.byteLength),
                    'Cache-Control': 'no-store',
                  },
                });
              }
            }

            const audioBuffer = await res.arrayBuffer();
            return new NextResponse(audioBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': String(audioBuffer.byteLength),
                'Cache-Control': 'no-store',
              },
            });
          }

          lastError = await res.text();
        } catch (err: any) {
          lastError = err.message || String(err);
        }
      }

      console.warn('[TTS/Qwen] Qwen API call failed, falling back to Free Neural TTS:', lastError);
      
      // Seamless Fallback to Free Neural TTS
      const truncated = text.slice(0, 200);
      const url = new URL(GOOGLE_TTS_BASE);
      url.searchParams.set('ie', 'UTF-8');
      url.searchParams.set('q', truncated);
      url.searchParams.set('tl', 'id');
      url.searchParams.set('client', 'tw-ob');
      url.searchParams.set('ttsspeed', String(speed));

      const fallbackRes = await fetch(url.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      });

      if (fallbackRes.ok) {
        const audioBuffer = await fallbackRes.arrayBuffer();
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': String(audioBuffer.byteLength),
            'Cache-Control': 'no-store',
          },
        });
      }

      return NextResponse.json(
        { error: `Qwen TTS Error: ${lastError.slice(0, 220)}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Provider tidak valid' }, { status: 400 });
  } catch (e) {
    console.error('[POST /api/tts] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error saat generate TTS' },
      { status: 500 }
    );
  }
}
