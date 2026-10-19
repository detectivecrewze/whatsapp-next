import {
  AbsoluteFill,
  Easing,
  interpolate,
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
  /** Brand mark / nama akun TikTok (menggantikan tanda tangan personal) */
  brandTag?: string;
  /** @deprecated backward compat */
  signature?: string;
  /** Gaya visual brand mark: 'line' | 'minimal' | 'bracket' */
  brandStyle?: 'line' | 'minimal' | 'bracket';
  /** Warna latar */
  background: string;
  /** Warna teks utama — default krem */
  ink: string;
  /** Warna kalimat sorotan — bisa biru terang, emas, dll */
  accentColor: string;
  /** Warna label & brand tag (muted) */
  mutedColor: string;
  /** Durasi total video dalam detik */
  durationSeconds: number;
}

// ─── Font ────────────────────────────────────────────────────────────────────

const serif = '"Cormorant Garamond", "Garamond", Georgia, serif';

// ─── Layer animation helper ───────────────────────────────────────────────────

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

  // Timing — setiap layer muncul berurutan dengan jeda puitis
  const labelStart     = Math.round(fps * 0.25);
  const line1Start     = Math.round(fps * 0.85);
  const highlightStart = Math.round(fps * 1.55);
  const brandStart     = Math.round(fps * 2.25);
  const fadeFrames     = 20; // ~0.67 detik @ 30fps

  const label     = useLayerReveal(frame, fps, labelStart, fadeFrames);
  const line1Anim = useLayerReveal(frame, fps, line1Start, fadeFrames);
  const hl        = useLayerReveal(frame, fps, highlightStart, fadeFrames);
  const brandAnim = useLayerReveal(frame, fps, brandStart, fadeFrames);

  // Gentle vignette pulse setelah semua elemen hadir
  const allDone = brandStart + fadeFrames;
  const vignetteOpacity = interpolate(
    frame,
    [allDone, allDone + fps * 0.5],
    [0, 0.18],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const bg         = props.background || '#0b1628';
  const ink        = props.ink        || '#f3ece4';
  const accent     = props.accentColor || '#4a9eff';
  const muted      = props.mutedColor  || '#8899b8';
  const brandText  = props.brandTag ?? props.signature;
  const brandStyle = props.brandStyle || 'line';

  // ── Safe zone: konten di tengah-atas, ~22% bawah + ~12% kanan bebas
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

      {/* Vignette edge gelap tambahan */}
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
              marginBottom: 48,
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
              marginBottom: props.highlight ? 44 : (brandText ? 42 : 0),
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
              marginBottom: brandText ? 44 : 0,
            } as React.CSSProperties}
          >
            {props.highlight}
          </div>
        ) : null}

        {/* Layer 4 — Brand Mark Minimalist (tanpa kotak / button kapsul) */}
        {brandText ? (
          <div
            style={{
              opacity: brandAnim.opacity,
              transform: `translateY(${brandAnim.translateY}px)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%',
              userSelect: 'none',
            }}
          >
            {/* Style 1: Garis Halus (Editorial Bookend) */}
            {brandStyle === 'line' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 16,
                  maxWidth: '90%',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${muted}50)`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: serif,
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: '0.26em',
                    wordSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: muted,
                    fontVariantNumeric: 'lining-nums',
                  }}
                >
                  {brandText}
                </span>
                <div
                  style={{
                    width: 36,
                    height: 1,
                    background: `linear-gradient(90deg, ${muted}50, transparent)`,
                    flexShrink: 0,
                  }}
                />
              </div>
            )}

            {/* Style 2: Whisper Star / Minimal Imprint */}
            {brandStyle === 'minimal' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    color: accent,
                    fontSize: 14,
                    opacity: 0.85,
                    transform: 'translateY(-1px)',
                  }}
                >
                  ✦
                </span>
                <span
                  style={{
                    fontFamily: serif,
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: '0.26em',
                    wordSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: muted,
                    fontVariantNumeric: 'lining-nums',
                  }}
                >
                  {brandText}
                </span>
              </div>
            )}

            {/* Style 3: Archival Frame [ ] */}
            {brandStyle === 'bracket' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: serif,
                    fontSize: 21,
                    color: `${muted}70`,
                    fontWeight: 300,
                    transform: 'translateY(-1px)',
                  }}
                >
                  [
                </span>
                <span
                  style={{
                    fontFamily: serif,
                    fontSize: 21,
                    fontWeight: 500,
                    letterSpacing: '0.24em',
                    wordSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: muted,
                    fontVariantNumeric: 'lining-nums',
                  }}
                >
                  {brandText}
                </span>
                <span
                  style={{
                    fontFamily: serif,
                    fontSize: 21,
                    color: `${muted}70`,
                    fontWeight: 300,
                    transform: 'translateY(-1px)',
                  }}
                >
                  ]
                </span>
              </div>
            )}
          </div>
        ) : null}

      </div>

      {/* Subtle noise texture */}
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
