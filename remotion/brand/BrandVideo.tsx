import type { ReactNode } from 'react';
import { Audio, Video } from '@remotion/media';
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { BRAND_SFX_FILES } from '@/lib/brandTemplates';
import type {
  BrandHookExit,
  BrandHookMotion,
  BrandHookTypography,
  BrandMediaSlot,
  BrandTemplateId,
  BrandVideoProps,
} from '@/types/brand';

const serif = 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif';
const editorialSerif = 'var(--font-playfair), "Playfair Display", Georgia, serif';
const classicSerif = 'Georgia, Cambria, "Times New Roman", serif';
const sans = 'var(--font-inter), Inter, Arial, Helvetica, sans-serif';
const mono = 'var(--font-ibm-plex-mono), "IBM Plex Mono", "Courier New", monospace';

function hookFont(typography: BrandHookTypography) {
  if (typography === 'classic') return classicSerif;
  if (typography === 'editorial') return editorialSerif;
  if (typography === 'typewriter') return mono;
  if (typography === 'brand-serif') return serif;
  return sans;
}

function TypewriterText({
  text,
  frame,
  fps,
  startFrame,
  charactersPerSecond,
  showCursor,
}: {
  text: string;
  frame: number;
  fps: number;
  startFrame: number;
  charactersPerSecond: number;
  showCursor: boolean;
}) {
  const visibleCharacters = Math.min(
    text.length,
    Math.max(0, Math.floor(((frame - startFrame) / fps) * charactersPerSecond)),
  );
  const cursorVisible = showCursor && frame >= startFrame && Math.floor(frame / 8) % 2 === 0;

  return (
    <>
      {text.slice(0, visibleCharacters)}
      {cursorVisible ? <span style={{ opacity: 0.72 }}>▌</span> : null}
    </>
  );
}

function WordRevealText({
  text,
  frame,
  startFrame,
}: {
  text: string;
  frame: number;
  startFrame: number;
}) {
  return (
    <>
      {text.split(/\s+/).map((word, index) => {
        const wordStart = startFrame + index * 4;
        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: 'inline-block',
              marginRight: '0.24em',
              opacity: interpolate(frame, [wordStart, wordStart + 8], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [wordStart, wordStart + 10], ['0px 26px', '0px 0px'], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            {word}
          </span>
        );
      })}
    </>
  );
}

function autoFitScale(title: string, accent: string) {
  const longestLine = Math.max(
    1,
    ...`${title}\n${accent}`.split('\n').map((line) => line.trim().length),
  );
  const totalCharacters = Math.max(1, title.trim().length + accent.trim().length);
  const longestScale = Math.sqrt(34 / Math.max(34, longestLine));
  const totalScale = Math.sqrt(70 / Math.max(70, totalCharacters));
  return Math.max(0.62, Math.min(1, longestScale, totalScale));
}

function AnimatedHookText({
  text,
  motion,
  frame,
  fps,
  delayFrames = 0,
  charactersPerSecond,
}: {
  text: string;
  motion: BrandHookMotion;
  frame: number;
  fps: number;
  delayFrames?: number;
  charactersPerSecond: number;
}) {
  const revealEnd = delayFrames + (motion === 'cinematic' ? 24 : 14);
  const opacity = motion === 'typewriter' || motion === 'word-reveal'
    ? 1
    : interpolate(frame, [delayFrames, revealEnd], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
  const translate = motion === 'slide'
    ? interpolate(frame, [delayFrames, delayFrames + 18], ['-60px 0px', '0px 0px'], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : motion === 'soft'
      ? interpolate(frame, [delayFrames, delayFrames + 18], ['0px 30px', '0px 0px'], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })
      : '0px 0px';
  const scale = motion === 'pop'
    ? interpolate(frame, [delayFrames, delayFrames + 16], [0.86, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        output: 'perceptual-scale',
      })
    : motion === 'cinematic'
      ? interpolate(frame, [delayFrames, delayFrames + 24], [1.07, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          output: 'perceptual-scale',
        })
      : 1;
  const blur = motion === 'blur' || motion === 'cinematic'
    ? interpolate(
        frame,
        [delayFrames, delayFrames + (motion === 'cinematic' ? 24 : 16)],
        [motion === 'cinematic' ? 9 : 16, 0],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        },
      )
    : 0;
  const typingFrames = Math.ceil((text.length / charactersPerSecond) * fps);

  return (
    <span
      style={{
        display: 'block',
        opacity,
        translate,
        scale,
        filter: blur > 0 ? `blur(${blur}px)` : 'none',
      }}
    >
      {motion === 'typewriter' ? (
        <TypewriterText
          text={text}
          frame={frame}
          fps={fps}
          startFrame={delayFrames}
          charactersPerSecond={charactersPerSecond}
          showCursor={frame >= delayFrames && frame < delayFrames + typingFrames}
        />
      ) : motion === 'word-reveal' ? (
        <WordRevealText text={text} frame={frame} startFrame={delayFrames} />
      ) : text}
    </span>
  );
}

function textureFor(templateId: BrandTemplateId) {
  if (templateId === 'birthday') {
    return 'radial-gradient(circle at 12% 8%, rgba(212,119,115,.16), transparent 25%), radial-gradient(circle at 92% 74%, rgba(111,176,151,.18), transparent 30%)';
  }
  if (templateId === 'anniversary') {
    return 'radial-gradient(circle at 84% 7%, rgba(155,106,80,.14), transparent 30%), radial-gradient(circle at 4% 88%, rgba(220,190,164,.22), transparent 34%)';
  }
  return 'radial-gradient(circle at 88% 4%, rgba(213,178,166,.18), transparent 31%), radial-gradient(circle at 3% 82%, rgba(232,213,195,.32), transparent 36%)';
}

function BrandCanvas({ props }: { props: BrandVideoProps }) {
  return (
    <AbsoluteFill style={{ backgroundColor: props.palette.background }}>
      <AbsoluteFill style={{ background: textureFor(props.templateId) }} />
      <AbsoluteFill
        style={{
          opacity: 0.18,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\' viewBox=\'0 0 120 120\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'.12\'/%3E%3C/svg%3E")',
        }}
      />
    </AbsoluteFill>
  );
}

function Seal({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 74,
        height: 74,
        borderRadius: 999,
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        fontFamily: serif,
        fontSize: 28,
        lineHeight: 1,
      }}
    >
      ◇
    </div>
  );
}

function BrandHeader({ props, compact = false }: { props: BrandVideoProps; compact?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 92,
        right: 92,
        top: compact ? 106 : 128,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        color: props.palette.text,
      }}
    >
      <Seal color={props.palette.accent} />
      <span style={{ fontFamily: serif, fontSize: 45, letterSpacing: -1.2 }}>
        {props.copy.eyebrow}
      </span>
      <span
        style={{
          marginLeft: 'auto',
          width: 140,
          height: 2,
          backgroundColor: props.palette.accent,
          opacity: 0.5,
        }}
      />
    </div>
  );
}

function SceneShell({
  children,
  fadeIn = true,
  exitTransition = 'fade',
  transitionFrames = 10,
}: {
  children: ReactNode;
  fadeIn?: boolean;
  exitTransition?: BrandHookExit;
  transitionFrames?: number;
}) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const safeTransitionFrames = Math.min(
    Math.max(1, transitionFrames),
    Math.max(1, durationInFrames - 1),
  );
  const endStart = Math.max(0, durationInFrames - safeTransitionFrames);
  const introOpacity = fadeIn
    ? interpolate(frame, [0, 9], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 1;
  const exitProgress = interpolate(frame, [endStart, durationInFrames - 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 1, 1),
  });

  return (
    <AbsoluteFill
      style={{
        opacity: introOpacity * (exitTransition === 'none' ? 1 : 1 - exitProgress),
        scale: exitTransition === 'zoom' ? 1 + exitProgress * 0.09 : 1,
        translate: exitTransition === 'slide-up' ? `0px ${-140 * exitProgress}px` : '0px 0px',
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function MediaVisual({ media }: { media: BrandMediaSlot }) {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const scale = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [1.02, 1.075], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
    output: 'perceptual-scale',
  });
  const style = {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    objectPosition: `${media.focusX}% ${media.focusY}%`,
    scale,
  };

  if (media.kind === 'video') {
    return <Video src={media.src} muted loop premountFor={fps} objectFit={media.fit} style={style} />;
  }

  return <CanvasImage src={media.src} premountFor={fps} fit={media.fit} style={style} />;
}

function HookScene({ props }: { props: BrandVideoProps }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const isEditorial =
    props.hook.typography === 'editorial' ||
    props.hook.typography === 'brand-serif' ||
    props.hook.typography === 'classic';
  const isBold = props.hook.typography === 'bold';
  const isTypewriterFont = props.hook.typography === 'typewriter';
  const titleFont = hookFont(props.hook.typography);
  const typingCps = Math.max(6, props.hook.typewriterCps || 20);
  const textLeft = props.hook.alignment === 'left' ? 96 : 150;
  const textRight = props.hook.alignment === 'left' ? 200 : 170;
  const partMotions = props.hook.partMotions ?? {
    eyebrow: props.hook.motion,
    title: props.hook.motion,
    accent: props.hook.motion,
    footer: props.hook.motion,
  };
  const isThreeBeat = (props.hook.sequenceMode ?? 'single') === 'three-beat';
  const beatOneFrames = isThreeBeat ? Math.max(1, Math.floor(durationInFrames / 3)) : durationInFrames;
  const beatTwoFrames = isThreeBeat ? Math.max(1, Math.floor(durationInFrames / 3)) : 0;
  const beatThreeStart = beatOneFrames + beatTwoFrames;
  const beatIndex = !isThreeBeat
    ? 0
    : frame < beatOneFrames
      ? 0
      : frame < beatThreeStart
        ? 1
        : 2;
  const beatStart = beatIndex === 0 ? 0 : beatIndex === 1 ? beatOneFrames : beatThreeStart;
  const beatFrame = frame - beatStart;
  const beatDuration = beatIndex === 0
    ? beatOneFrames
    : beatIndex === 1
      ? beatTwoFrames
      : Math.max(1, durationInFrames - beatThreeStart);
  const currentTitle = beatIndex === 0
    ? props.copy.hookTitle
    : beatIndex === 1
      ? props.copy.hookBridge || props.copy.storyTitle || props.copy.hookTitle
      : props.copy.hookReveal || props.copy.cta || props.copy.hookAccent;
  const currentAccent = beatIndex === 0 ? props.copy.hookAccent : '';
  const titleTypingFrames = Math.ceil((currentTitle.length / typingCps) * fps);
  const accentDelay = partMotions.title === 'typewriter'
    ? Math.max(8, titleTypingFrames + 4)
    : 10;
  const fitScale = props.hook.autoFit === false
    ? 1
    : autoFitScale(currentTitle, currentAccent);
  const beatFadeOutStart = Math.max(7, beatDuration - 7);
  const beatOpacity = isThreeBeat
    ? interpolate(
        beatFrame,
        [0, 5, beatFadeOutStart, Math.max(beatFadeOutStart + 1, beatDuration - 1)],
        [0, 1, 1, 0],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        },
      )
    : 1;

  return (
    <SceneShell
      fadeIn={props.outputMode !== 'hook'}
      exitTransition={props.hook.exitTransition}
      transitionFrames={Math.round(props.hook.transitionSeconds * fps)}
    >
      <BrandCanvas props={props} />
      <div
        style={{
          position: 'absolute',
          left: 72,
          right: 180,
          top: 220,
          textAlign: 'center',
          color: props.palette.muted,
          fontFamily: sans,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 8,
        }}
      >
        <AnimatedHookText
          text={props.copy.eyebrow.toUpperCase()}
          motion={partMotions.eyebrow}
          frame={frame}
          fps={fps}
          delayFrames={2}
          charactersPerSecond={typingCps}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: textLeft,
          right: textRight,
          top: Math.round((props.hook.positionY / 100) * 1920),
          textAlign: props.hook.alignment,
          color: beatIndex === 2 ? props.palette.accent : props.palette.text,
          fontFamily: titleFont,
          opacity: beatOpacity,
        }}
      >
        <div
          style={{
            fontSize: (isBold ? 84 : isTypewriterFont ? 73 : 91) * props.hook.textScale * fitScale,
            lineHeight: isBold ? 0.98 : isTypewriterFont ? 1.14 : 1.02,
            letterSpacing: isBold ? -2.2 : isTypewriterFont ? -1 : -3.1,
            fontWeight: isBold ? 800 : isTypewriterFont ? 500 : 400,
            overflowWrap: 'anywhere',
          }}
        >
          <AnimatedHookText
            text={currentTitle}
            motion={partMotions.title}
            frame={beatFrame}
            fps={fps}
            charactersPerSecond={typingCps}
          />
        </div>
        {currentAccent ? (
          <div
            style={{
              marginTop: 18,
              color: props.palette.accent,
              fontFamily: titleFont,
              fontSize: (isBold ? 78 : isTypewriterFont ? 65 : 84) * props.hook.textScale * fitScale,
              lineHeight: isTypewriterFont ? 1.16 : 1.05,
              letterSpacing: isTypewriterFont ? -0.8 : -2,
              fontStyle: isEditorial ? 'italic' : 'normal',
              fontWeight: isBold ? 800 : isTypewriterFont ? 500 : 400,
              overflowWrap: 'anywhere',
            }}
          >
            <AnimatedHookText
              text={currentAccent}
              motion={partMotions.accent}
              frame={beatFrame}
              fps={fps}
              delayFrames={accentDelay}
              charactersPerSecond={typingCps}
            />
          </div>
        ) : null}
        {props.hook.showDivider ? (
          <div
            style={{
              width: 84,
              height: 2,
              marginTop: 76,
              marginRight: props.hook.alignment === 'center' ? 'auto' : 0,
              marginLeft: props.hook.alignment === 'center' ? 'auto' : 0,
              backgroundColor: props.palette.accent,
              opacity: 0.45,
            }}
          />
        ) : null}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 360,
          left: 72,
          right: 180,
          textAlign: 'center',
          color: props.palette.muted,
          fontFamily: sans,
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: 7,
        }}
      >
        <AnimatedHookText
          text={props.copy.hookFooter}
          motion={partMotions.footer}
          frame={frame}
          fps={fps}
          delayFrames={12}
          charactersPerSecond={typingCps}
        />
      </div>
    </SceneShell>
  );
}

function ProductScene({ props }: { props: BrandVideoProps }) {
  return (
    <SceneShell>
      <BrandCanvas props={props} />
      <BrandHeader props={props} />
      <div
        style={{
          position: 'absolute',
          left: 96,
          right: 96,
          top: 310,
          color: props.palette.text,
          fontFamily: serif,
          fontSize: 82,
          lineHeight: 0.98,
          letterSpacing: -2.6,
        }}
      >
        {props.copy.storyTitle}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 96,
          right: 96,
          top: 560,
          height: 930,
          overflow: 'hidden',
          borderRadius: props.templateId === 'birthday' ? 34 : 26,
          backgroundColor: props.palette.surface,
          border: `2px solid ${props.palette.accent}42`,
          boxShadow: '0 34px 80px rgba(56,42,36,.14)',
        }}
      >
        <MediaVisual media={props.heroMedia} />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 180,
            padding: '38px 42px',
            background: `linear-gradient(180deg, transparent, ${props.palette.text}e8 36%)`,
            color: props.palette.background,
            fontFamily: sans,
          }}
        >
          <div style={{ fontSize: 35, fontWeight: 700 }}>{props.copy.productName}</div>
          <div style={{ marginTop: 12, fontSize: 24, opacity: 0.78 }}>{props.copy.productDetail}</div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 96,
          right: 96,
          top: 1545,
          display: 'flex',
          alignItems: 'center',
          color: props.palette.muted,
          fontFamily: sans,
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        {props.heroMedia.name}
        <span style={{ marginLeft: 'auto', width: 86, height: 2, background: props.palette.accent }} />
      </div>
    </SceneShell>
  );
}

function StoryScene({ props }: { props: BrandVideoProps }) {
  const benefits = ['Kata-katamu', 'Foto dan cerita', 'Bisa dibuka kapan saja'];
  return (
    <SceneShell>
      <BrandCanvas props={props} />
      <BrandHeader props={props} compact />
      <div
        style={{
          position: 'absolute',
          left: 94,
          top: 310,
          width: 892,
          color: props.palette.text,
          fontFamily: serif,
          fontSize: 76,
          lineHeight: 1,
          letterSpacing: -2.2,
        }}
      >
        {props.copy.storyTitle}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 94,
          top: 505,
          width: 520,
          color: props.palette.muted,
          fontFamily: sans,
          fontSize: 31,
          lineHeight: 1.55,
        }}
      >
        {props.copy.storyBody}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 92,
          top: 492,
          width: 330,
          height: 570,
          borderRadius: 28,
          overflow: 'hidden',
          backgroundColor: props.palette.surface,
          border: `2px solid ${props.palette.accent}38`,
          boxShadow: '0 26px 60px rgba(56,42,36,.12)',
        }}
      >
        <MediaVisual media={props.detailMedia} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 94,
          right: 94,
          bottom: 230,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {benefits.map((benefit, index) => (
          <div
            key={benefit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              minHeight: 88,
              padding: '18px 28px',
              borderTop: `1px solid ${props.palette.accent}45`,
              color: props.palette.text,
              fontFamily: sans,
              fontSize: 28,
            }}
          >
            <span style={{ color: props.palette.accent, fontFamily: serif, fontSize: 34 }}>
              0{index + 1}
            </span>
            {benefit}
          </div>
        ))}
      </div>
    </SceneShell>
  );
}

function OutroScene({ props }: { props: BrandVideoProps }) {
  const frame = useCurrentFrame();
  return (
    <SceneShell>
      <BrandCanvas props={props} />
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: 480,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          color: props.palette.text,
          translate: interpolate(frame, [0, 18], ['0px 24px', '0px 0px'], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Seal color={props.palette.accent} />
        <div style={{ marginTop: 36, fontFamily: serif, fontSize: 79, lineHeight: 1.02 }}>
          {props.copy.cta}
        </div>
        <div
          style={{
            marginTop: 52,
            paddingBottom: 12,
            borderBottom: `2px solid ${props.palette.accent}`,
            color: props.palette.accent,
            fontFamily: sans,
            fontSize: 29,
            fontWeight: 700,
            letterSpacing: 0.3,
          }}
        >
          {props.copy.domain}
        </div>
        <div
          style={{
            marginTop: 130,
            color: props.palette.muted,
            fontFamily: sans,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: 7,
          }}
        >
          DIGITAL ATELIER
        </div>
      </div>
    </SceneShell>
  );
}

function BrandAudio({ props, sceneStarts }: { props: BrandVideoProps; sceneStarts: number[] }) {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, Math.round(0.7 * fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [Math.max(0, durationInFrames - Math.round(1.2 * fps)), durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const sfxFile = props.audio.transitionSfx === 'none'
    ? null
    : BRAND_SFX_FILES[props.audio.transitionSfx];
  const hookSfxStart = Math.min(
    Math.max(0, durationInFrames - 1),
    Math.max(0, Math.round(props.audio.sfxOffsetSeconds * fps)),
  );

  return (
    <>
      {props.audio.musicSrc ? (
        <Audio
          name={`Backsound · ${props.audio.musicName || 'musik latar'}`}
          src={props.audio.musicSrc}
          loop
          premountFor={fps}
          volume={props.audio.musicVolume * fadeIn * fadeOut}
          delayRenderTimeoutInMilliseconds={120_000}
          delayRenderRetries={2}
        />
      ) : null}
      {props.outputMode === 'hook' && sfxFile ? (
        <Audio
          name={`SFX hook · ${props.audio.transitionSfx}`}
          src={staticFile(`sounds/sfx/${sfxFile}`)}
          from={hookSfxStart}
          durationInFrames={Math.max(1, Math.min(fps * 3, durationInFrames - hookSfxStart))}
          premountFor={fps}
          volume={props.audio.transitionSfxVolume}
          delayRenderTimeoutInMilliseconds={120_000}
          delayRenderRetries={2}
        />
      ) : null}
      {props.outputMode === 'campaign' && sfxFile ? (
        <Audio
          name={`SFX scene 2 · ${props.audio.transitionSfx}`}
          src={staticFile(`sounds/sfx/${sfxFile}`)}
          from={sceneStarts[1]}
          durationInFrames={Math.min(fps * 3, durationInFrames - sceneStarts[1])}
          premountFor={fps}
          volume={props.audio.transitionSfxVolume}
          delayRenderTimeoutInMilliseconds={120_000}
          delayRenderRetries={2}
        />
      ) : null}
      {props.outputMode === 'campaign' && sfxFile ? (
        <Audio
          name={`SFX scene 3 · ${props.audio.transitionSfx}`}
          src={staticFile(`sounds/sfx/${sfxFile}`)}
          from={sceneStarts[2]}
          durationInFrames={Math.min(fps * 3, durationInFrames - sceneStarts[2])}
          premountFor={fps}
          volume={props.audio.transitionSfxVolume * 0.85}
          delayRenderTimeoutInMilliseconds={120_000}
          delayRenderRetries={2}
        />
      ) : null}
      {props.outputMode === 'campaign' && sfxFile ? (
        <Audio
          name={`SFX scene 4 · ${props.audio.transitionSfx}`}
          src={staticFile(`sounds/sfx/${sfxFile}`)}
          from={sceneStarts[3]}
          durationInFrames={Math.min(fps * 3, durationInFrames - sceneStarts[3])}
          premountFor={fps}
          volume={props.audio.transitionSfxVolume * 0.72}
          delayRenderTimeoutInMilliseconds={120_000}
          delayRenderRetries={2}
        />
      ) : null}
    </>
  );
}

export const BrandVideo = (props: BrandVideoProps) => {
  const { fps } = useVideoConfig();
  const hookFrames = Math.max(1, Math.round(props.timing.hookSeconds * fps));
  const productFrames = Math.max(1, Math.round(props.timing.productSeconds * fps));
  const storyFrames = Math.max(1, Math.round(props.timing.storySeconds * fps));
  const outroFrames = Math.max(1, Math.round(props.timing.outroSeconds * fps));
  const productStart = hookFrames;
  const storyStart = productStart + productFrames;
  const outroStart = storyStart + storyFrames;

  if (props.outputMode === 'hook') {
    return (
      <AbsoluteFill style={{ backgroundColor: props.palette.background, overflow: 'hidden' }}>
        <Sequence from={0} durationInFrames={hookFrames} premountFor={fps} name="Hook Maker">
          <HookScene props={props} />
        </Sequence>
        <BrandAudio props={props} sceneStarts={[0, hookFrames, hookFrames, hookFrames]} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: props.palette.background, overflow: 'hidden' }}>
      <Sequence from={0} durationInFrames={hookFrames} premountFor={fps} name="01 — Editorial hook">
        <HookScene props={props} />
      </Sequence>
      <Sequence from={productStart} durationInFrames={productFrames} premountFor={fps} name="02 — Product reveal">
        <ProductScene props={props} />
      </Sequence>
      <Sequence from={storyStart} durationInFrames={storyFrames} premountFor={fps} name="03 — Story and benefits">
        <StoryScene props={props} />
      </Sequence>
      <Sequence from={outroStart} durationInFrames={outroFrames} premountFor={fps} name="04 — CTA and brand outro">
        <OutroScene props={props} />
      </Sequence>
      <BrandAudio props={props} sceneStarts={[0, productStart, storyStart, outroStart]} />
    </AbsoluteFill>
  );
};

