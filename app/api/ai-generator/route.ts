import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

// Built-in smart viral Indonesian story generator fallback
function generateSmartAiStory(scenario: string, count: number, name: string) {
  const s = scenario.toLowerCase();

  let list: { direction: 'incoming' | 'outgoing'; text: string }[] = [];

  if (s.includes('cinta') || s.includes('mantan') || s.includes('drama_cinta')) {
    list = [
      { direction: 'incoming', text: '[sighs] Kamu udah tidur belum? 🥺' },
      { direction: 'outgoing', text: 'Belum. Ada apa malam-malam ngechat?' },
      { direction: 'incoming', text: '[excited] Jujur aku kangen banget sama kamu yang dulu...' },
      { direction: 'outgoing', text: 'Telat, foto profilku berdua sama pacar baru udah keliatan kan? 😌' },
      { direction: 'incoming', text: '[laughing] Eh maaf banget!! Ini aku Siska temen kamu, hp cowokmu ditinggal di meja wkwk 😂' },
      { direction: 'outgoing', text: '[gasp] HAH?! Siska?! Jangan nakut-nakutin jir!! 😭' },
      { direction: 'incoming', text: 'Bercanda ding, ini beneran mantanmu... cuma pengen tes reaksi pacar barumu aja 😎' },
      { direction: 'outgoing', text: 'Parah banget kamu, untung aku ga emosi 🙈' },
      { direction: 'incoming', text: 'Tapi beneran, pacar barumu ganteng juga ya 🫣' },
      { direction: 'outgoing', text: 'Jangan macam-macam ya kak! 😤' },
      { direction: 'incoming', text: 'Wkwk becanda. Yaudah met tidur ya!' },
      { direction: 'outgoing', text: 'Met tidur juga!' },
    ];
  } else if (s.includes('uang') || s.includes('bokap') || s.includes('transfer')) {
    list = [
      { direction: 'outgoing', text: 'Pah/Mah, kado digital 40 ribu worth it ga sih?' },
      { direction: 'incoming', text: '[happy] Kado apa itu nak? Kok murah amat?' },
      { direction: 'outgoing', text: 'Website ucapan anniversary/ultah gitu Pah, ada lagu & foto-fotonya.' },
      { direction: 'incoming', text: 'Oh bagus dong! Beliin buat Mamah sekalian ya.' },
      { direction: 'outgoing', text: 'Siap Pah, tapi transferin dulu 100rb ya buat jajan juga wkwk 🤭' },
      { direction: 'incoming', text: '[laughing] Halah ujung-ujungnya minta uang juga kamu 😂' },
      { direction: 'outgoing', text: 'Hehe makasih Pah! Terbaik emang 🫶' },
      { direction: 'incoming', text: 'Sudah Papah transfer 200rb ya, cek M-Banking.' },
    ];
  } else if (s.includes('twist') || s.includes('plot')) {
    list = [
      { direction: 'incoming', text: 'Bro, tadi aku liat pacarmu di cafe jalan sama cowok lain 😱' },
      { direction: 'outgoing', text: 'Hah?! Ciri-cirinya gimana bro?!' },
      { direction: 'incoming', text: 'Pake baju item, kacamata, bawa mobil Honda Jazz merah.' },
      { direction: 'outgoing', text: 'Lah... itu mah abang kandungnya jir!! 😂' },
      { direction: 'incoming', text: '[gasp] Wkwk anjir suer?! Maaf bro salah sangka 😭' },
      { direction: 'outgoing', text: 'Hampir aja aku emosi wkwk 🤣' },
    ];
  } else if (s.includes('teman') || s.includes('drama_teman')) {
    list = [
      { direction: 'incoming', text: '[sighs] Bro, denger-denger kamu ngomongin aku di belakang ya?' },
      { direction: 'outgoing', text: 'Hah? Ngomongin apa? Siapa yang bilang?' },
      { direction: 'incoming', text: 'Katanya kamu bilang aku anaknya pelit bgt...' },
      { direction: 'outgoing', text: 'Ya emang pelit sih wkwk, tiap nongkrong pesen teh tawar anget doang 🤣' },
      { direction: 'incoming', text: '[laughing] Sialan kamu wkwk! Kan nemenin kamu doang bro 😂' },
      { direction: 'outgoing', text: 'Bercanda elah, aman ga pernah ngomongin aneh-aneh kok 🤝' },
    ];
  } else if (s.includes('rahasia')) {
    list = [
      { direction: 'incoming', text: 'Min, aku tau rahasia terbesarmu 🤫' },
      { direction: 'outgoing', text: '[gasp] Rahasia apa wkwk? Aku ga punya rahasia.' },
      { direction: 'incoming', text: 'Kamu waktu SD pernah ngompol di kelas kan?' },
      { direction: 'outgoing', text: 'ANJIRR KOK KAMU TAU?! Siapa yang cerita?! 😱' },
      { direction: 'incoming', text: '[laughing] Temen sekelasmu SD dulu wkwk, ngakak banget 😂' },
      { direction: 'outgoing', text: 'Plis jgn disebar wkwk, malu bgt 😭' },
    ];
  } else if (s.includes('titip')) {
    list = [
      { direction: 'incoming', text: 'Lagi di mana kak? Nitip seblak dong 🥺' },
      { direction: 'outgoing', text: 'Lagi di kedai seblak nih. Level berapa?' },
      { direction: 'incoming', text: 'Level 5 pake kerupuk, dumpling keju, siomay, plus es teh 😋' },
      { direction: 'outgoing', text: 'Banyak bgt buset, perut kenyang hati senang ya wkwk 🤣' },
      { direction: 'incoming', text: '[happy] Makasih kak! Nanti tak ganti uangnya 🫶' },
      { direction: 'outgoing', text: 'Awas kalo lupa ganti wkwk!' },
    ];
  } else {
    // Komedi / default
    list = [
      { direction: 'incoming', text: '[sighs] Min kado digital 40 ribu itu worth it nggak sih?' },
      { direction: 'outgoing', text: '[excited] Halo Kak! Pastinya dong, udah banyak yang order dan pada sukses bikin pacarnya nangis terharu 🥺✨' },
      { direction: 'incoming', text: '[laughing] Mendang mending buat beli seblak porsi kuli min, 40 ribu mah perut kenyang, hati senang.' },
      { direction: 'outgoing', text: '[gasp] Seblak porsi kuli habis dimakan besoknya mules Kak, lewat gitu aja jadi kenangan di WC 🪠' },
      { direction: 'incoming', text: '[happy] Kalau website memori ini kan abadi Kak. Udah dapet animasi, timer jadian, lagu, galeri foto!' },
      { direction: 'outgoing', text: '[happy] Harganya juga sama persis kayak semangkuk seblak tadi kok.' },
      { direction: 'incoming', text: '[sighs] Tapi pacar saya cowok min...' },
      { direction: 'outgoing', text: 'Cowok juga seneng Kak kalo dikasih perhatian spesial! 🎁' },
    ];
  }

  // Slice to desired count
  return list.slice(0, count);
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, scenario = 'drama_cinta', count = 6, name = 'Sayang ❤️' } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt kosong' }, { status: 400 });
    }

    // Try Gemini API if key is set
    if (GEMINI_KEY && !GEMINI_KEY.startsWith('AQ.')) {
      try {
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

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          if (text) {
            return NextResponse.json({ text });
          }
        }
      } catch (err) {
        console.warn('[AI Generator] Gemini API call failed, using smart fallback:', err);
      }
    }

    // Smart fallback: generate viral Indonesian conversation
    const fallbackList = generateSmartAiStory(scenario, count, name);
    const jsonText = JSON.stringify(fallbackList);

    return NextResponse.json({ text: jsonText });
  } catch (e) {
    console.error('[POST /api/ai-generator] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error saat generate AI' },
      { status: 500 }
    );
  }
}
