import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LetterHookProps extends Record<string, unknown> {
  /** "A THOUGHT AT 2 AM" — ketik biasa, tracked-out otomatis lewat CSS */
  label: string;
  /** Kalimat utama (boleh multi-baris, pisah pakai \n) */
  line1: string;
  /** Kalimat yang disorot — muncul setelah line1 selesai */
  highlight: string;
  /** Tanda tangan kecil opsional */
  signature: string;
  /** Warna latar — default navy gelap */
  background: string;
  /** Warna teks utama — default krem */
  ink: string;
  /** Warna kalimat sorotan — bisa biru terang atau emas */
  accentColor: string;
  /** Warna label & signature (muted) */
  mutedColor: string;
  /** Durasi total video dalam detik */
  durationSeconds: number;
}

// ─── Font ────────────────────────────────────────────────────────────────────

const serif = '"Cormorant Garamond", "Garamond", Georgia, serif';

// ─── Layer animation helper ───────────────────────────────────────────────────

/**
 * Menghitung opacity + translateY untuk reveal tiap layer.
 * `startFrame` = frame mulai muncul, `fadeFrames` = durasi fade-in.
 */
function useLayerReveal(
  frame: number,
  fps: number,
  startFrame: number,
  fadeFrames = 18,
) {
  const opacity = interpolate(frame, [startFrame, startFrame + fadeFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const translateY = interpolate(frame, [startFrame, startFrame + fadeFrames], [22, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  return { opacity, translateY };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LetterHookVideo(props: LetterHookProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timing — setiap layer muncul berurutan dengan jeda ~0.6-0.8 detik
  const labelStart   = Math.round(fps * 0.25);
  const line1Start   = Math.round(fps * 0.85);
  const highlightStart = Math.round(fps * 1.55);
  const sigStart     = Math.round(fps * 2.25);
  const fadeFrames   = 20; // ~0.67 detik @ 30fps

  const label     = useLayerReveal(frame, fps, labelStart, fadeFrames);
  const line1Anim = useLayerReveal(frame, fps, line1Start, fadeFrames);
  const hl        = useLayerReveal(frame, fps, highlightStart, fadeFrames);
  const sig       = useLayerReveal(frame, fps, sigStart, fadeFrames);

  // Gentle vignette pulse setelah semuanya muncul (opsional)
  const allDone = sigStart + fadeFrames;
  const vignetteOpacity = interpolate(
    frame,
    [allDone, allDone + fps * 0.5],
    [0, 0.18],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const bg     = props.background || '#0b1628';
  const ink    = props.ink        || '#f3ece4';
  const accent = props.accentColor || '#4a9eff';
  const muted  = props.mutedColor  || '#8899b8';

  // ── Safe zone: konten di tengah-atas, ~22% bawah + ~8% sisi kanan kosong
  // 1080x1920: safe zone top ~12%, bottom ~22%, left ~7%, right ~12%
  const safeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10%',
    left: '7%',
    right: '12%',
    bottom: '22%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  };

  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>

      {/* Subtle radial vignette — memberikan kedalaman tanpa gangguan */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, transparent 42%, rgba(0,0,0,0.55) 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Vignette edge gelap tambahan setelah semua layer muncul */}
      <AbsoluteFill
        style={{
          opacity: vignetteOpacity,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Konten utama dalam safe zone ── */}
      <div style={safeStyle}>

        {/* Layer 1 — Label kecil (ALL CAPS, tracked-out, lining nums) */}
        {props.label ? (
          <div
            style={{
              opacity: label.opacity,
              transform: `translateY(${label.translateY}px)`,
              fontFamily: serif,
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '0.22em',
              wordSpacing: '0.4em',
              fontVariantNumeric: 'lining-nums',
              color: muted,
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: 64,
            }}
          >
            {props.label}
          </div>
        ) : null}

        {/* Layer 2 — Kalimat utama (italic serif, besar) */}
        {props.line1 ? (
          <div
            style={{
              opacity: line1Anim.opacity,
              transform: `translateY(${line1Anim.translateY}px)`,
              fontFamily: serif,
              fontSize: 72,
              fontStyle: 'italic',
              fontWeight: 400,
              lineHeight: 1.38,
              color: ink,
              textAlign: 'center',
              textWrap: 'balance',
              whiteSpace: 'pre-wrap',
              marginBottom: props.highlight ? 52 : 0,
            } as React.CSSProperties}
          >
            {props.line1}
          </div>
        ) : null}

        {/* Layer 3 — Kalimat sorotan (accent color, sedikit lebih kecil) */}
        {props.highlight ? (
          <div
            style={{
              opacity: hl.opacity,
              transform: `translateY(${hl.translateY}px)`,
              fontFamily: serif,
              fontSize: 62,
              fontStyle: 'italic',
              fontWeight: 600,
              lineHeight: 1.4,
              color: accent,
              textAlign: 'center',
              textWrap: 'balance',
              whiteSpace: 'pre-wrap',
              marginBottom: props.signature ? 56 : 0,
            } as React.CSSProperties}
          >
            {props.highlight}
          </div>
        ) : null}

        {/* Layer 4 — Tanda tangan kecil (opsional) */}
        {props.signature ? (
          <div
            style={{
              opacity: sig.opacity,
              transform: `translateY(${sig.translateY}px)`,
              fontFamily: serif,
              fontSize: 32,
              fontStyle: 'italic',
              fontWeight: 400,
              color: muted,
              textAlign: 'center',
              letterSpacing: '0.03em',
            }}
          >
            {props.signature}
          </div>
        ) : null}

      </div>

      {/* Subtle noise texture — memberikan tekstur tanpa mengganggu */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.055,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      >
        <filter id="pba-noise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#pba-noise)" fill="white" />
      </svg>

    </AbsoluteFill>
  );
}
