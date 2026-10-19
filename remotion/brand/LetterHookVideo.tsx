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
  /** Gaya visual brand mark: 'line' | 'minimal' | 'bracket' | 'clean' */
  brandStyle?: 'line' | 'minimal' | 'bracket' | 'clean';
  /** Posisi penempatan brand mark: 'bottom' (bawah layar) | 'flow' (di bawah teks) */
  brandPlacement?: 'bottom' | 'flow';
  /** Perataan teks: 'center' | 'left' */
  alignment?: 'center' | 'left';
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

  const bg             = props.background || '#0b1628';
  const ink            = props.ink        || '#f3ece4';
  const accent         = props.accentColor || '#4a9eff';
  const muted          = props.mutedColor  || '#8899b8';
  const brandText      = props.brandTag ?? props.signature;
  const brandStyle     = props.brandStyle || 'line';
  const brandPlacement = props.brandPlacement || 'bottom';
  const isLeft         = props.alignment === 'left';
  const textAlign      = isLeft ? 'left' : 'center';

  // ── Safe zone untuk Blok Quote Utama (fokus tengah-atas layar)
  const quoteStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12%',
    left: isLeft ? '10%' : '8%',
    right: isLeft ? '14%' : '12%',
    bottom: brandPlacement === 'bottom' ? '28%' : '22%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: isLeft ? 'flex-start' : 'center',
    justifyContent: 'center',
    textAlign,
    gap: 0,
  };

  // ── Safe zone untuk Brand Watermark bawah layar (terpisah lega dari quote)
  const brandWatermarkStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '22%', // ~420px dari bawah kanvas 1920 (tepat di atas UI caption TikTok)
    left: isLeft ? '10%' : '8%',
    right: isLeft ? '14%' : '12%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: isLeft ? 'flex-start' : 'center',
    textAlign,
    opacity: brandAnim.opacity,
    transform: `translateY(${brandAnim.translateY}px)`,
    userSelect: 'none',
  };

  // ── Render Brand Mark Content
  const renderBrandMark = () => {
    if (!brandText) return null;

    if (brandStyle === 'line') {
      return isLeft ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 28, height: 1, background: `${muted}55`, flexShrink: 0 }} />
          <span
            style={{
              fontFamily: serif,
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: '0.28em',
              wordSpacing: '0.35em',
              textTransform: 'uppercase',
              color: muted,
              fontVariantNumeric: 'lining-nums',
            }}
          >
            {brandText}
          </span>
        </div>
      ) : (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 26, height: 1, background: `linear-gradient(90deg, transparent, ${muted}55)`, flexShrink: 0 }} />
          <span
            style={{
              fontFamily: serif,
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: '0.28em',
              wordSpacing: '0.35em',
              textTransform: 'uppercase',
              color: muted,
              fontVariantNumeric: 'lining-nums',
            }}
          >
            {brandText}
          </span>
          <div style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${muted}55, transparent)`, flexShrink: 0 }} />
        </div>
      );
    }

    if (brandStyle === 'minimal') {
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: accent, fontSize: 13, opacity: 0.85, transform: 'translateY(-1px)' }}>✦</span>
          <span
            style={{
              fontFamily: serif,
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: '0.28em',
              wordSpacing: '0.35em',
              textTransform: 'uppercase',
              color: muted,
              fontVariantNumeric: 'lining-nums',
            }}
          >
            {brandText}
          </span>
        </div>
      );
    }

    if (brandStyle === 'bracket') {
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: serif, fontSize: 19, color: `${muted}60`, fontWeight: 300, transform: 'translateY(-1px)' }}>[</span>
          <span
            style={{
              fontFamily: serif,
              fontSize: 19,
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
          <span style={{ fontFamily: serif, fontSize: 19, color: `${muted}60`, fontWeight: 300, transform: 'translateY(-1px)' }}>]</span>
        </div>
      );
    }

    if (brandStyle === 'clean') {
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: serif,
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: '0.32em',
              wordSpacing: '0.4em',
              textTransform: 'uppercase',
              color: muted,
              fontVariantNumeric: 'lining-nums',
              opacity: 0.9,
            }}
          >
            {brandText}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>

      {/* Subtle radial vignette — memberikan kedalaman tanpa gangguan */}
      <AbsoluteFill
        style={{
          background: isLeft
            ? `radial-gradient(ellipse at 42% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)`
            : `radial-gradient(ellipse at 50% 45%, transparent 42%, rgba(0,0,0,0.55) 100%)`,
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

      {/* ── Blok Quote Utama ── */}
      <div style={quoteStyle}>

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
              textAlign,
              alignSelf: isLeft ? 'flex-start' : 'center',
              marginBottom: 52,
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
              textAlign,
              alignSelf: isLeft ? 'flex-start' : 'center',
              textWrap: 'balance',
              whiteSpace: 'pre-wrap',
              marginBottom: props.highlight ? 44 : 0,
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
              textAlign,
              alignSelf: isLeft ? 'flex-start' : 'center',
              textWrap: 'balance',
              whiteSpace: 'pre-wrap',
              marginBottom: brandPlacement === 'flow' && brandText ? 84 : 0,
            } as React.CSSProperties}
          >
            {props.highlight}
          </div>
        ) : null}

        {/* Jika mode 'flow': brand mark tampil di bawah quote dengan jeda 84px yang lega */}
        {brandPlacement === 'flow' && brandText ? (
          <div
            style={{
              opacity: brandAnim.opacity,
              transform: `translateY(${brandAnim.translateY}px)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: isLeft ? 'flex-start' : 'center',
              textAlign,
              width: '100%',
              userSelect: 'none',
            }}
          >
            {renderBrandMark()}
          </div>
        ) : null}

      </div>

      {/* Jika mode 'bottom' (Default): brand watermark anchored di zona bawah aman TikTok, terpisah sangat lega dari quote */}
      {brandPlacement === 'bottom' && brandText ? (
        <div style={brandWatermarkStyle}>
          {renderBrandMark()}
        </div>
      ) : null}

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
