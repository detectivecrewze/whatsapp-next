import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Server-side Gemini API key fallback (optional - user can provide their own in UI)
const GEMINI_KEY = process.env.GEMINI_API_KEY ?? '';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt kosong' }, { status: 400 });
    }

    if (!GEMINI_KEY) {
      return NextResponse.json(
        { error: 'Gemini API Key tidak dikonfigurasi di server. Masukkan API Key kamu di panel AI Generator.' },
        { status: 503 }
      );
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[AI Generator] Gemini error:', text);
      return NextResponse.json(
        { error: `Gemini error (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return NextResponse.json({ text });
  } catch (e) {
    console.error('[POST /api/ai-generator] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error saat generate AI' },
      { status: 500 }
    );
  }
}
