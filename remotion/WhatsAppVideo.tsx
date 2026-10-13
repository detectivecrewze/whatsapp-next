import React from 'react';
import { Audio } from '@remotion/media';
import { Camera, Mic, Paperclip, Phone, Search, Smile, Video } from 'lucide-react';
import {
  AbsoluteFill,
  AnimatedImage,
  CanvasImage,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { Message } from '@/types';
import { extractDomain, getChatTimelineTime, getInitials, getSenderColor, stripAudioTags } from '@/lib/utils';
import { getEndTransitionSfx } from '@/lib/endTransitions';
import { usesLightChatTheme } from '@/lib/chatTheme';

const AUDIO_RENDER_TIMEOUT_MS = 120_000;
const AUDIO_RENDER_RETRIES = 2;
import { buildVideoTimeline, getTimelineState, type TimelineEvent } from './timeline';
import type { WhatsAppVideoProps } from './videoTypes';
import { getMessageCustomSfx, getMessageSoundSource, getVoiceSource } from './audio';

const COLORS = {
  chrome: '#054d44',
  header: '#075e54',
  chat: '#0b141a',
  incoming: '#202c33',
  outgoing: '#005c4b',
  green: '#128c7e',
  blue: '#53bdeb',
  text: '#e9edef',
  muted: '#8696a0',
};

const FONT = 'Inter, Arial, Helvetica, sans-serif';
// Large enough for readable chat, while retaining the right/bottom safe area
// used by Reels and TikTok controls.
const REELS_PHONE_SCALE = 0.78;
const REELS_PHONE_TOP = 150;
const ChatThemeContext = React.createContext({
  outgoing: COLORS.outgoing,
  incoming: COLORS.incoming,
  text: COLORS.text,
  muted: COLORS.muted,
  shadow: '0 4px 12px rgba(0,0,0,0.28)',
  linkCard: 'rgba(0,0,0,0.2)',
  linkBorder: 'rgba(134,150,160,0.14)',
});

function isAnimatedImage(src: string) {
  const normalized = src.toLowerCase().split('?')[0].split('#')[0];
  return normalized.endsWith('.gif') || src.toLowerCase().startsWith('data:image/gif');
}

function MediaAsset({
  src,
  width,
  height,
  fit = 'cover',
}: {
  src: string;
  width: number;
  height: number;
  fit?: 'cover' | 'contain';
}) {
  const { fps } = useVideoConfig();

  if (isAnimatedImage(src)) {
    return (
      <AnimatedImage
        src={src}
        width={width}
        height={height}
        fit={fit}
        loopBehavior="loop"
        premountFor={fps}
        style={{ display: 'block' }}
      />
    );
  }

  return (
    <CanvasImage
      src={src}
      premountFor={fps}
      style={{ width, height, objectFit: fit, display: 'block' }}
    />
  );
}

function estimateTextLines(text: string, charactersPerLine = 34) {
  return Math.max(
    1,
    text.split('\n').reduce((total, line) => total + Math.max(1, Math.ceil(line.length / charactersPerLine)), 0)
  );
}

function estimateMessageHeight(message: Message) {
  const senderHeight = message.senderName ? 42 : 0;
  const caption = stripAudioTags(message.caption || message.text || '');

  switch (message.type) {
    case 'image':
      return 525 + senderHeight + (caption ? estimateTextLines(caption) * 46 + 20 : 0);
    case 'link': {
      const commentary = message.text && !message.text.startsWith('http') ? message.text : '';
      return 595 + senderHeight + (commentary ? estimateTextLines(commentary) * 46 + 18 : 0);
    }
    case 'voice_note':
      return 150 + senderHeight;
    case 'transfer':
    case 'contact':
    case 'location':
      return 190 + senderHeight;
    case 'view_once':
    case 'deleted':
      return 125 + senderHeight;
    default:
      return 78 + senderHeight + estimateTextLines(stripAudioTags(message.text || '')) * 48;
  }
}

function TimeAndTicks({ message }: { message: Message }) {
  const theme = React.useContext(ChatThemeContext);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 7,
        marginTop: 8,
        color: theme.muted,
        fontSize: 23,
        lineHeight: 1,
      }}
    >
      <span>{message.time || '09:41'}</span>
      {message.direction === 'outgoing' ? (
        <span style={{ color: COLORS.blue, fontWeight: 800, letterSpacing: -7, paddingRight: 7 }}>
          ✓✓
        </span>
      ) : null}
    </div>
  );
}

function SenderName({ message }: { message: Message }) {
  if (!message.senderName) return null;

  return (
    <div
      style={{
        color: message.senderColor || getSenderColor(message.senderName),
        fontWeight: 800,
        fontSize: 29,
        marginBottom: 9,
      }}
    >
      {message.senderName}
    </div>
  );
}

function BubbleShell({
  message,
  children,
  showSenderName,
  maxWidth = 760,
  padding = '19px 22px 15px',
}: {
  message: Message;
  children: React.ReactNode;
  showSenderName: boolean;
  maxWidth?: number;
  padding?: string;
}) {
  const outgoing = message.direction === 'outgoing';
  const theme = React.useContext(ChatThemeContext);

  return (
    <div
      style={{
        maxWidth,
        minWidth: 190,
        padding,
        backgroundColor: outgoing ? theme.outgoing : theme.incoming,
        borderRadius: outgoing ? '28px 4px 28px 28px' : '4px 28px 28px 28px',
        boxShadow: theme.shadow,
        color: theme.text,
        overflow: 'hidden',
      }}
    >
      {showSenderName ? <SenderName message={message} /> : null}
      {children}
      <TimeAndTicks message={message} />
    </div>
  );
}

function TextMessage({ message, showSenderName }: { message: Message; showSenderName: boolean }) {
  return (
    <BubbleShell message={message} showSenderName={showSenderName}>
      <div style={{ fontSize: 36, lineHeight: 1.34, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {stripAudioTags(message.text || '')}
      </div>
    </BubbleShell>
  );
}

function ImageMessage({ message, showSenderName }: { message: Message; showSenderName: boolean }) {
  const caption = stripAudioTags(message.caption || message.text || '');
  const isGif = Boolean(message.imageData && isAnimatedImage(message.imageData));

  return (
    <BubbleShell
      message={message}
      showSenderName={showSenderName}
      maxWidth={790}
      padding="11px 11px 12px"
    >
      <div
        style={{
          position: 'relative',
          width: 768,
          height: 455,
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: '#111b21',
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.055)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {message.imageData ? (
          <MediaAsset
            src={message.imageData}
            width={768}
            height={455}
            fit="cover"
          />
        ) : (
          <div style={{ color: COLORS.muted, fontSize: 30 }}>📷 Gambar</div>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 18,
            border: '2px solid rgba(255,255,255,0.07)',
            pointerEvents: 'none',
          }}
        />
        {isGif ? (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              padding: '6px 13px',
              borderRadius: 10,
              backgroundColor: 'rgba(0,0,0,0.72)',
              color: '#00d084',
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 1.5,
            }}
          >
            GIF
          </div>
        ) : null}
      </div>
      {caption ? (
        <div style={{ fontSize: 34, lineHeight: 1.3, marginTop: 15, padding: '0 10px' }}>
          {caption}
        </div>
      ) : null}
    </BubbleShell>
  );
}

function LinkMessage({ message, showSenderName }: { message: Message; showSenderName: boolean }) {
  const url = message.linkUrl || message.text || '';
  const domain = extractDomain(url);
  const commentary = message.text && !message.text.startsWith('http') ? stripAudioTags(message.text) : '';
  const theme = React.useContext(ChatThemeContext);

  return (
    <BubbleShell message={message} showSenderName={showSenderName} maxWidth={800}>
      {commentary ? <div style={{ fontSize: 34, lineHeight: 1.3, marginBottom: 15 }}>{commentary}</div> : null}
      <div
        style={{
          backgroundColor: theme.linkCard,
          border: `2px solid ${theme.linkBorder}`,
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            // Match the preview card's 125:274 thumbnail ratio at Remotion's width.
            height: 345,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'linear-gradient(135deg, #243b4a, #111b21)',
          }}
        >
          {message.linkImage || message.imageData ? (
            <MediaAsset
              src={(message.linkImage || message.imageData) as string}
              width={756}
              height={345}
              fit="cover"
            />
          ) : (
            <div style={{ fontSize: 72 }}>🌐</div>
          )}
        </div>
        <div style={{ padding: '18px 22px 20px' }}>
          <div style={{ color: theme.text, fontSize: 34, fontWeight: 750 }}>{message.linkTitle || domain || 'Tautan Web'}</div>
          <div style={{ color: theme.muted, fontSize: 27, lineHeight: 1.35, marginTop: 8 }}>
            {message.linkDescription || 'Klik untuk membuka tautan halaman web'}
          </div>
          <div style={{ color: theme.muted, fontSize: 23, marginTop: 10 }}>{domain}</div>
        </div>
      </div>
      <div style={{ color: COLORS.blue, fontSize: 29, marginTop: 13, overflowWrap: 'anywhere' }}>{url}</div>
    </BubbleShell>
  );
}

function VoiceNoteMessage({ message, showSenderName }: { message: Message; showSenderName: boolean }) {
  const waveform = message.waveform || [30, 52, 35, 72, 44, 80, 62, 30, 68, 48, 78, 36, 58, 72, 40, 64, 32, 74, 52, 68];

  return (
    <BubbleShell message={message} showSenderName={showSenderName} maxWidth={760}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: 999,
            backgroundColor: COLORS.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
          }}
        >
          ▶
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 58, gap: 5 }}>
            {waveform.slice(0, 26).map((height, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: Math.max(7, (height / 100) * 56),
                  borderRadius: 999,
                  backgroundColor: 'rgba(233,237,239,0.62)',
                }}
              />
            ))}
          </div>
          <div style={{ color: COLORS.muted, fontSize: 24, marginTop: 5 }}>{message.duration || '0:12'}</div>
        </div>
      </div>
    </BubbleShell>
  );
}

function SpecialCard({ message, showSenderName }: { message: Message; showSenderName: boolean }) {
  const icon = message.type === 'transfer' ? 'Rp' : message.type === 'contact' ? '👤' : '📍';
  const title =
    message.type === 'transfer'
      ? 'Transfer Berhasil'
      : message.type === 'contact'
        ? message.text || 'Nama Kontak'
        : message.text || 'Lokasi Saya';
  const subtitle =
    message.type === 'transfer'
      ? message.text || 'Rp 250.000'
      : message.caption || (message.type === 'contact' ? '+62 812 xxxx xxxx' : 'Jakarta, Indonesia');

  return (
    <BubbleShell message={message} showSenderName={showSenderName} maxWidth={700}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 86,
            height: 86,
            borderRadius: 999,
            backgroundColor: message.type === 'location' ? '#d34b43' : COLORS.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: message.type === 'transfer' ? 29 : 42,
            fontWeight: 800,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 34, fontWeight: 750 }}>{title}</div>
          <div
            style={{
              color: message.type === 'transfer' ? '#25d366' : COLORS.muted,
              fontSize: message.type === 'transfer' ? 43 : 28,
              fontWeight: message.type === 'transfer' ? 800 : 500,
              marginTop: 6,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    </BubbleShell>
  );
}

function ViewOnceMessage({ message, showSenderName }: { message: Message; showSenderName: boolean }) {
  return (
    <BubbleShell message={message} showSenderName={showSenderName} maxWidth={580}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 35, fontWeight: 650 }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 999,
            border: `4px solid ${COLORS.green}`,
            color: COLORS.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 27,
          }}
        >
          1
        </div>
        Foto
      </div>
    </BubbleShell>
  );
}

function DeletedMessage({ message, showSenderName }: { message: Message; showSenderName: boolean }) {
  return (
    <BubbleShell message={message} showSenderName={showSenderName} maxWidth={650}>
      <div style={{ color: COLORS.muted, fontSize: 33, fontStyle: 'italic' }}>⊘ Pesan ini telah dihapus</div>
    </BubbleShell>
  );
}

function MessageContent({ message, showSenderName }: { message: Message; showSenderName: boolean }) {
  // Keep unfinished empty drafts out of the exported frame as well.
  if (message.type === 'text' && !stripAudioTags(message.text || '').trim()) return null;

  switch (message.type) {
    case 'image':
      return <ImageMessage message={message} showSenderName={showSenderName} />;
    case 'link':
      return <LinkMessage message={message} showSenderName={showSenderName} />;
    case 'voice_note':
      return <VoiceNoteMessage message={message} showSenderName={showSenderName} />;
    case 'transfer':
    case 'contact':
    case 'location':
      return <SpecialCard message={message} showSenderName={showSenderName} />;
    case 'view_once':
      return <ViewOnceMessage message={message} showSenderName={showSenderName} />;
    case 'deleted':
      return <DeletedMessage message={message} showSenderName={showSenderName} />;
    default:
      return <TextMessage message={message} showSenderName={showSenderName} />;
  }
}

function ChatMessage({
  message,
  event,
  frame,
  showSenderName,
  focusProgress,
}: {
  message: Message;
  event: TimelineEvent;
  frame: number;
  showSenderName: boolean;
  focusProgress: number;
}) {
  const entry = interpolate(frame, [event.revealFrame, event.revealFrame + 7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isMediaCard = message.type === 'link' || message.type === 'image';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: message.direction === 'outgoing' ? 'flex-end' : 'flex-start',
        width: '100%',
        opacity: entry,
        translate: `${message.direction === 'outgoing' ? 32 * (1 - entry) : -32 * (1 - entry)}px 0px`,
        scale: 1 + (isMediaCard ? 0.015 : 0.035) * focusProgress,
        transformOrigin: message.direction === 'outgoing' ? 'right center' : 'left center',
        zIndex: focusProgress > 0 ? 2 : 1,
        flexShrink: 0,
      }}
    >
      <MessageContent message={message} showSenderName={showSenderName} />
    </div>
  );
}

function TypingBubble() {
  const frame = useCurrentFrame();
  const theme = React.useContext(ChatThemeContext);

  return (
    <div
      style={{
        alignSelf: 'flex-start',
        display: 'flex',
        gap: 10,
        padding: '24px 30px',
        borderRadius: '4px 28px 28px 28px',
        backgroundColor: theme.incoming,
        boxShadow: theme.shadow,
      }}
    >
      {[0, 1, 2].map((index) => {
        const phase = (frame + index * 5) % 20;
        const opacity = interpolate(phase, [0, 10, 20], [0.35, 1, 0.35]);
        return (
          <div
            key={index}
            style={{ width: 17, height: 17, borderRadius: 999, backgroundColor: theme.muted, opacity }}
          />
        );
      })}
    </div>
  );
}

function StatusBar({ props, visibleCount }: { props: WhatsAppVideoProps; visibleCount: number }) {
  const displayTime = props.useCustomTime
    ? props.customTime
    : getChatTimelineTime(props.messages, visibleCount);

  return (
    <div
      style={{
        height: 92,
        flexShrink: 0,
        backgroundColor: COLORS.chrome,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '22px 48px 10px',
        color: 'white',
        fontSize: 30,
        fontWeight: 700,
      }}
    >
      <span>{displayTime}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        <div style={{ height: 26, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          {[10, 15, 20, 25].map((height) => (
            <div key={height} style={{ width: 6, height, borderRadius: 2, backgroundColor: 'white' }} />
          ))}
        </div>
        <svg width="36" height="28" viewBox="0 0 24 18" fill="none">
          <path d="M2 6.5C7.8 1.3 16.2 1.3 22 6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
          <path d="M6 10c3.4-3 8.6-3 12 0" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />
          <path d="M10.5 14c.9-.8 2.1-.8 3 0" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: 58,
              height: 27,
              border: '3px solid rgba(255,255,255,0.8)',
              borderRadius: 7,
              padding: 3,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(3, props.batteryLevel)}%`,
                borderRadius: 3,
                backgroundColor: props.batteryLevel <= 20 ? '#ff3b30' : 'white',
              }}
            />
          </div>
          <div style={{ width: 4, height: 12, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' }} />
        </div>
      </div>
    </div>
  );
}

function ChatHeader({ props, isTyping }: { props: WhatsAppVideoProps; isTyping: boolean }) {
  const status = isTyping
    ? 'mengetik...'
    : props.chatType === 'group'
      ? props.groupSubtitle || 'Grup WhatsApp'
      : props.headerStatus === 'custom'
        ? props.headerStatusText || 'Online'
        : props.headerStatus === 'typing'
          ? 'mengetik...'
          : 'Online';

  return (
    <div
      style={{
        height: 154,
        flexShrink: 0,
        backgroundColor: COLORS.header,
        display: 'flex',
        alignItems: 'center',
        padding: '18px 31px 24px',
        color: 'white',
        borderBottom: '2px solid rgba(134,150,160,0.1)',
      }}
    >
      <div style={{ color: COLORS.blue, fontSize: 62, lineHeight: 1, marginRight: 12 }}>‹</div>
      {props.unreadCount > 0 ? (
        <div style={{ color: COLORS.blue, fontSize: 28, marginRight: 16 }}>{Math.min(99, props.unreadCount)}</div>
      ) : null}
      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: 999,
          backgroundColor: '#dfe5e7',
          color: '#54656f',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {props.pfp ? (
          <CanvasImage src={props.pfp} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          getInitials(props.name || 'WA')
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, marginLeft: 22 }}>
        <div style={{ fontSize: 39, lineHeight: 1.12, fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {props.name || 'Nama Kontak'}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.74)', fontSize: 27, marginTop: 8 }}>{status}</div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 44,
          alignItems: 'center',
          color: '#aebac1',
          flexShrink: 0,
        }}
      >
        <Video size={55} strokeWidth={2} />
        <Phone size={50} strokeWidth={2} />
        <Search size={50} strokeWidth={2} />
      </div>
    </div>
  );
}

function NotificationOverlay({ event }: { event: TimelineEvent }) {
  const frame = useCurrentFrame();
  const message = event.message;
  const entry = interpolate(frame, [event.revealFrame, event.revealFrame + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 112,
        left: 38,
        right: 38,
        padding: '26px 29px',
        borderRadius: 34,
        backgroundColor: 'rgba(32,44,51,0.97)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
        color: 'white',
        display: 'flex',
        gap: 22,
        opacity: entry,
        translate: `0px ${-35 * (1 - entry)}px`,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          backgroundColor: '#25d366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 42,
          flexShrink: 0,
        }}
      >
        ☎
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ fontSize: 29, fontWeight: 800 }}>{message.notifSender || 'WhatsApp'}</span>
          <span style={{ color: COLORS.muted, fontSize: 24 }}>{message.time || 'Sekarang'}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{message.notifTitle || 'Pesan Baru'}</div>
        <div style={{ color: '#d8dde0', fontSize: 28, lineHeight: 1.3, marginTop: 5 }}>{message.text}</div>
      </div>
    </div>
  );
}

function DoodlePattern({ opacity = 1 }: { opacity?: number }) {
  const { fps } = useVideoConfig();
  const tileSize = 660;
  const columns = 2;
  const rows = 4;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: columns * rows }, (_, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);

        return (
          <CanvasImage
            key={`${column}-${row}`}
            src={staticFile('whatsapp-doodle.svg')}
            premountFor={fps}
            style={{
              position: 'absolute',
              left: column * tileSize,
              top: row * tileSize,
              width: tileSize,
              height: tileSize,
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

function ReelsBackground({ image }: { image?: string | null }) {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#061712',
        backgroundImage: [
          'radial-gradient(circle at 50% 17%, rgba(37,211,102,0.18), transparent 31%)',
          'radial-gradient(circle at 50% 72%, rgba(18,140,126,0.2), transparent 38%)',
          'linear-gradient(180deg, #08251f 0%, #061712 54%, #04100d 100%)',
        ].join(', '),
        overflow: 'hidden',
      }}
    >
      {image ? (
        <>
          <CanvasImage
            src={image}
            premountFor={fps}
            style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <AbsoluteFill
            style={{
              background: 'linear-gradient(180deg, rgba(2,14,11,0.30), rgba(2,14,11,0.58))',
            }}
          />
        </>
      ) : (
        <DoodlePattern opacity={0.23} />
      )}
    </AbsoluteFill>
  );
}

function Wallpaper({ props }: { props: WhatsAppVideoProps }) {
  if (props.bgType === 'image' && props.bgImage) {
    return (
      <AbsoluteFill>
        <CanvasImage
          src={props.bgImage}
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <AbsoluteFill style={{ backgroundColor: 'rgba(11,20,26,0.12)' }} />
      </AbsoluteFill>
    );
  }

  if (props.bgType === 'color') {
    return (
      <AbsoluteFill style={{ backgroundColor: props.bgColor }}>
        <DoodlePattern opacity={0.58} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#efeae2' }}>
      <DoodlePattern />
    </AbsoluteFill>
  );
}

function MessageAudioTracks({
  props,
  timeline,
}: {
  props: WhatsAppVideoProps;
  timeline: TimelineEvent[];
}) {
  const { fps } = useVideoConfig();
  const voicePlaybackRate = Math.max(0.5, Math.min(2, props.ttsSpeed || 1));

  return (
    <>
      {timeline.map((event) => {
        const soundSource = getMessageSoundSource(props, event.message);
        const customSfx = getMessageCustomSfx(event.message);
        const voiceSource = getVoiceSource(props, event.message, event.index);

        return (
          <React.Fragment key={`audio-${event.message.id}`}>
            {soundSource ? (
              <Audio
                name={`SFX ${event.message.direction} ${event.index + 1}`}
                src={staticFile(soundSource)}
                from={event.revealFrame}
                volume={voiceSource ? 0.15 : 0.25}
                premountFor={fps}
                delayRenderTimeoutInMilliseconds={AUDIO_RENDER_TIMEOUT_MS}
                delayRenderRetries={AUDIO_RENDER_RETRIES}
              />
            ) : null}
            {customSfx ? (
              <Audio
                name={`${customSfx.label} · pesan ${event.index + 1}`}
                src={staticFile(customSfx.source)}
                from={event.revealFrame}
                durationInFrames={Math.max(1, Math.min(3 * fps, event.endFrame - event.revealFrame))}
                volume={customSfx.volume * (voiceSource ? 0.65 : 1)}
                premountFor={fps}
                delayRenderTimeoutInMilliseconds={AUDIO_RENDER_TIMEOUT_MS}
                delayRenderRetries={AUDIO_RENDER_RETRIES}
              />
            ) : null}
            {voiceSource ? (
              <Audio
                name={`Voice ${event.index + 1}`}
                src={voiceSource}
                from={event.revealFrame}
                volume={1}
                playbackRate={voicePlaybackRate}
                premountFor={fps}
                delayRenderTimeoutInMilliseconds={AUDIO_RENDER_TIMEOUT_MS}
                delayRenderRetries={AUDIO_RENDER_RETRIES}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
}

function BackgroundMusicTrack({
  props,
  timeline,
}: {
  props: WhatsAppVideoProps;
  timeline: TimelineEvent[];
}) {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  if (!props.enableBgm || !props.bgmUrl) return null;

  const baseVolume = Math.max(0, Math.min(1, props.bgmVolume ?? 0.18));
  const fadeInFrames = Math.max(0, Math.round((props.bgmFadeIn ?? 1) * fps));
  const fadeOutFrames = Math.max(0, Math.round((props.bgmFadeOut ?? 1.25) * fps));
  const fadeInVolume = fadeInFrames > 0
    ? interpolate(frame, [0, fadeInFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;
  const fadeOutStart = Math.max(0, durationInFrames - fadeOutFrames);
  const fadeOutVolume = fadeOutFrames > 0
    ? interpolate(frame, [fadeOutStart, Math.max(fadeOutStart + 1, durationInFrames - 1)], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  let duckMultiplier = 1;
    if (props.bgmDucking) {
    const duckTarget = Math.max(0.05, Math.min(1, props.bgmDuckVolume ?? 0.25));
    const rampFrames = Math.max(1, Math.round(fps * 0.18));

      const getWindowMultiplier = (
        startFrame: number,
        endFrame: number,
        target: number,
      ) => {
        if (frame >= startFrame - rampFrames && frame < startFrame) {
          return interpolate(
            frame,
            [startFrame - rampFrames, startFrame],
            [1, target],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );
        }
        if (frame >= startFrame && frame <= endFrame) return target;
        if (frame > endFrame && frame <= endFrame + rampFrames) {
          return interpolate(
            frame,
            [endFrame, endFrame + rampFrames],
            [target, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );
        }
        return 1;
      };

    for (const event of timeline) {
      const hasVoice = Boolean(getVoiceSource(props, event.message, event.index));
        if (props.enableTts && hasVoice && event.voiceEndFrame > event.revealFrame) {
          duckMultiplier = Math.min(
            duckMultiplier,
            getWindowMultiplier(event.revealFrame, event.voiceEndFrame, duckTarget),
          );
      }

        const hasDefaultSfx = Boolean(getMessageSoundSource(props, event.message));
        const customSfx = getMessageCustomSfx(event.message);
        if (hasDefaultSfx || customSfx) {
          const sfxDurationFrames = customSfx
            ? Math.max(1, Math.min(3 * fps, event.endFrame - event.revealFrame))
            : Math.max(1, Math.round(0.7 * fps));
          const sfxTarget = Math.min(0.12, duckTarget * 0.5);
          duckMultiplier = Math.min(
            duckMultiplier,
            getWindowMultiplier(
              event.revealFrame,
              event.revealFrame + sfxDurationFrames,
              sfxTarget,
            ),
          );
        }
      }

      if (props.endTransition !== 'none' && getEndTransitionSfx(props.endTransitionSfx)?.file) {
        const transitionFrames = Math.max(1, Math.round(fps * 0.75));
        const transitionStart = Math.max(0, durationInFrames - transitionFrames);
        duckMultiplier = Math.min(
          duckMultiplier,
          getWindowMultiplier(
            transitionStart,
            durationInFrames - 1,
            Math.min(0.12, duckTarget * 0.5),
          ),
        );
    }
  }

  const semitones = Math.max(-4, Math.min(4, props.bgmPitchSemitones ?? 0));

  return (
    <Audio
      name={`Backsound · ${props.bgmName || 'musik latar'}`}
      src={props.bgmUrl}
      loop={props.bgmLoop}
      trimBefore={Math.max(0, Math.round((props.bgmStartAt ?? 0) * fps))}
      volume={baseVolume * fadeInVolume * fadeOutVolume * duckMultiplier}
      toneFrequency={2 ** (semitones / 12)}
      premountFor={fps}
      delayRenderTimeoutInMilliseconds={AUDIO_RENDER_TIMEOUT_MS}
      delayRenderRetries={AUDIO_RENDER_RETRIES}
    />
  );
}

function EndTransitionLayer({ props }: { props: WhatsAppVideoProps }) {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const transition = props.endTransition || 'none';
  const transitionFrames = Math.max(1, Math.round(fps * 0.75));
  const startFrame = Math.max(0, durationInFrames - transitionFrames);
  const progress = interpolate(frame, [startFrame, durationInFrames - 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const sfx = getEndTransitionSfx(props.endTransitionSfx);

  if (transition === 'none') return null;

  return (
    <>
      {sfx?.file ? (
        <Audio
          name={`SFX transisi · ${sfx.label}`}
          src={staticFile(sfx.file)}
          from={startFrame}
          durationInFrames={transitionFrames}
          volume={0.22}
          premountFor={fps}
          delayRenderTimeoutInMilliseconds={AUDIO_RENDER_TIMEOUT_MS}
          delayRenderRetries={AUDIO_RENDER_RETRIES}
        />
      ) : null}

      {transition === 'fade' ? (
        <AbsoluteFill
          style={{
            zIndex: 100,
            pointerEvents: 'none',
            backgroundColor: '#020807',
            opacity: progress,
          }}
        />
      ) : null}

      {transition === 'wipe' ? (
        <AbsoluteFill style={{ zIndex: 100, pointerEvents: 'none', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '112%',
              background: 'linear-gradient(110deg, #25d366 0%, #128c7e 42%, #054d44 78%, #020807 100%)',
              translate: `${(1 - progress) * 102}% 0`,
              boxShadow: '-48px 0 90px rgba(37,211,102,0.24)',
            }}
          />
        </AbsoluteFill>
      ) : null}

      {transition === 'iris' ? (
        <AbsoluteFill style={{ zIndex: 100, pointerEvents: 'none', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 2400,
              height: 2400,
              borderRadius: 9999,
              backgroundColor: '#020807',
              translate: '-50% -50%',
              scale: progress,
            }}
          />
        </AbsoluteFill>
      ) : null}

      {transition === 'flash' ? (
        <AbsoluteFill style={{ zIndex: 100, pointerEvents: 'none' }}>
          <AbsoluteFill
            style={{
              backgroundColor: '#ffffff',
              opacity: interpolate(progress, [0, 0.34, 0.55], [0, 1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          />
          <AbsoluteFill
            style={{
              backgroundColor: '#020807',
              opacity: interpolate(progress, [0.48, 1], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          />
        </AbsoluteFill>
      ) : null}
    </>
  );
}

export const WhatsAppVideo: React.FC<WhatsAppVideoProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeline = buildVideoTimeline(props);
  const { visibleCount, activeEvent, typingEvent } = getTimelineState(frame, timeline);
  const visibleEvents = timeline
    .slice(0, visibleCount)
    .filter((event) => event.message.type !== 'notification');
  const activeNotification = activeEvent?.message.type === 'notification' ? activeEvent : null;
  const dateBadgeHeight = props.dateBadge && visibleCount > 0 ? 58 : 0;
  const estimatedHeights = visibleEvents.map((event) => estimateMessageHeight(event.message));
  const estimatedContentHeight =
    dateBadgeHeight +
    estimatedHeights.reduce((total, height) => total + height, 0) +
    Math.max(0, visibleEvents.length - 1) * 16 +
    (typingEvent ? 96 : 0);
  const availableChatHeight = props.pinnedMessage ? 1368 : 1488;
  const scrollOffset = Math.min(0, availableChatHeight - estimatedContentHeight);

  const activeVisibleIndex = activeEvent
    ? visibleEvents.findIndex((event) => event.message.id === activeEvent.message.id)
    : -1;
  const zoomEnabled =
    activeEvent !== null &&
    activeVisibleIndex >= 0 &&
    (activeEvent.message.enableZoom ?? props.autoZoom);
  const activeHeight = activeVisibleIndex >= 0 ? estimatedHeights[activeVisibleIndex] : 0;
  const heightBeforeActive =
    dateBadgeHeight +
    estimatedHeights.slice(0, Math.max(0, activeVisibleIndex)).reduce((total, height) => total + height + 16, 0);
  const zoomOriginY = estimatedContentHeight > 0
    ? Math.max(8, Math.min(92, ((heightBeforeActive + activeHeight / 2) / estimatedContentHeight) * 100))
    : 50;

  let cameraScale = 1;
  let zoomProgress = 0;
  if (zoomEnabled && activeEvent) {
    const eventDuration = Math.max(2, activeEvent.endFrame - activeEvent.revealFrame);
    const rampFrames = Math.max(
      1,
      Math.min(Math.round((props.zoomSpeed / 1000) * fps), Math.floor(eventDuration / 2))
    );
    const zoomIn = interpolate(
      frame,
      [activeEvent.revealFrame, activeEvent.revealFrame + rampFrames],
      [0, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }
    );
    const zoomOut = interpolate(
      frame,
      [activeEvent.endFrame - rampFrames, activeEvent.endFrame],
      [1, 0],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }
    );
    zoomProgress = Math.min(zoomIn, zoomOut);
    const requestedScale = activeEvent.message.customScale || props.zoomScale;
    const targetScale = activeEvent.message.type === 'link'
      ? Math.min(requestedScale, 1.16)
      : activeEvent.message.type === 'image'
        ? Math.min(requestedScale, 1.18)
        : requestedScale;
    cameraScale = 1 + (targetScale - 1) * zoomProgress;
  }

  const isTallMediaCard = activeEvent?.message.type === 'link' || activeEvent?.message.type === 'image';
  const activeCenterInViewport = heightBeforeActive + activeHeight / 2 + scrollOffset;
  const safeMediaCenterY = availableChatHeight * (activeEvent?.message.type === 'link' ? 0.58 : 0.56);
  const mediaFocusShiftY = zoomEnabled && isTallMediaCard
    ? (safeMediaCenterY - activeCenterInViewport) * zoomProgress
    : 0;
  const cameraTranslateY = scrollOffset + mediaFocusShiftY;

  // Anchor the camera to the bubble's own edge. Using an inset origin caused
  // the rounded bubble edge to move outside the viewport during zoom, making
  // it look as if only the text was enlarged.
  const zoomOriginX = activeEvent?.message.direction === 'outgoing' ? 100 : 0;
  const introOpacity = interpolate(frame, [0, Math.round(fps * 0.35)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Wallpaper type does not decide whether chat chrome is light or dark.
  // A photo wallpaper may still use WhatsApp's original pale-green bubbles.
  const usesLightTheme = usesLightChatTheme(props.bubbleColor);
  const usePhoneLayout = props.exportLayout !== 'normal';

  return (
    <ChatThemeContext.Provider
      value={{
        outgoing: props.bubbleColor || '#d9fdd3',
        incoming: usesLightTheme ? '#ffffff' : COLORS.incoming,
        text: usesLightTheme ? '#111b21' : COLORS.text,
        muted: usesLightTheme ? '#667781' : COLORS.muted,
        shadow: usesLightTheme ? '0 2px 4px rgba(11,20,26,0.10)' : '0 4px 12px rgba(0,0,0,0.28)',
        linkCard: usesLightTheme ? 'rgba(11,20,26,0.06)' : 'rgba(0,0,0,0.2)',
        linkBorder: usesLightTheme ? 'rgba(102,119,129,0.12)' : 'rgba(134,150,160,0.14)',
      }}
    >
      <AbsoluteFill
        style={{
          backgroundColor: usePhoneLayout ? '#061712' : COLORS.chat,
          color: COLORS.text,
          fontFamily: FONT,
          overflow: 'hidden',
        }}
      >
        {usePhoneLayout ? <ReelsBackground image={props.exportLayoutBgImage} /> : null}

        <div
          style={{
            position: 'absolute',
            left: usePhoneLayout ? '50%' : 0,
            top: usePhoneLayout ? REELS_PHONE_TOP : 0,
            width: usePhoneLayout ? 1080 : '100%',
            height: usePhoneLayout ? 1920 : '100%',
            translate: usePhoneLayout ? '-50% 0' : 'none',
            scale: usePhoneLayout ? REELS_PHONE_SCALE : 1,
            transformOrigin: 'top center',
            borderRadius: usePhoneLayout ? 108 : 0,
            overflow: usePhoneLayout ? 'visible' : 'hidden',
            background: 'transparent',
            opacity: introOpacity,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: usePhoneLayout ? 108 : 0,
              border: usePhoneLayout ? '3px solid #45494d' : 'none',
              padding: usePhoneLayout ? 11 : 0,
              boxSizing: 'border-box',
              overflow: 'hidden',
              background: usePhoneLayout
                ? 'linear-gradient(90deg, #090a0b 0%, #6b7074 2%, #34383c 4.5%, #151719 8%, #070809 50%, #151719 92%, #34383c 95.5%, #6b7074 98%, #090a0b 100%)'
                : COLORS.chat,
              boxShadow: usePhoneLayout
                ? 'inset 0 0 0 2px rgba(255,255,255,0.16), inset 0 0 0 6px rgba(0,0,0,0.42)'
                : 'none',
            }}
          >
            <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: COLORS.chat,
              borderRadius: usePhoneLayout ? 96 : 0,
              border: usePhoneLayout ? '15px solid #0b0b0c' : 'none',
              boxSizing: 'border-box',
              boxShadow: usePhoneLayout
                ? 'inset 0 0 0 2px rgba(255,255,255,0.025)'
                : 'none',
              position: 'relative',
            }}
          >
      <StatusBar props={props} visibleCount={visibleCount} />
      <ChatHeader props={props} isTyping={Boolean(typingEvent)} />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <Wallpaper props={props} />

        {props.pinnedMessage ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 96,
              backgroundColor: usesLightTheme ? 'rgba(255,255,255,0.96)' : 'rgba(32,44,51,0.96)',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '12px 38px',
            }}
          >
            <div style={{ width: 6, height: 62, borderRadius: 8, backgroundColor: COLORS.green }} />
            <div>
              <div style={{ color: '#25d366', fontSize: 24, fontWeight: 750 }}>📌 Pesan Disematkan</div>
              <div style={{ color: usesLightTheme ? '#54656f' : '#c8d0d5', fontSize: 27, marginTop: 3 }}>{props.pinnedMessage}</div>
            </div>
          </div>
        ) : null}

        <div
          style={{
            position: 'absolute',
            left: 30,
            right: 30,
            top: props.pinnedMessage ? 120 : 28,
            bottom: 28,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              width: '100%',
              translate: `0px ${cameraTranslateY}px`,
              scale: cameraScale,
              transformOrigin: `${zoomOriginX}% ${zoomOriginY}%`,
            }}
          >
            {props.dateBadge && visibleCount > 0 ? (
              <div
                style={{
                  alignSelf: 'center',
                  padding: '12px 30px',
                  borderRadius: 16,
                  backgroundColor: usesLightTheme ? 'rgba(225,243,251,0.95)' : 'rgba(18,27,33,0.92)',
                  color: usesLightTheme ? '#54656f' : '#c7d0d5',
                  fontSize: 25,
                  flexShrink: 0,
                }}
              >
                {props.dateBadge}
              </div>
            ) : null}

            {visibleEvents.map((event, visibleIndex) => {
              const previous = visibleIndex > 0 ? visibleEvents[visibleIndex - 1]?.message : null;
              const showSenderName =
                props.chatType === 'group' &&
                event.message.direction === 'incoming' &&
                Boolean(event.message.senderName) &&
                (!previous ||
                  previous.direction !== 'incoming' ||
                  previous.senderName !== event.message.senderName);

              return (
                <ChatMessage
                  key={event.message.id}
                  message={event.message}
                  event={event}
                  frame={frame}
                  showSenderName={showSenderName}
                  focusProgress={
                    zoomEnabled && event.message.id === activeEvent?.message.id
                      ? zoomProgress
                      : 0
                  }
                />
              );
            })}

            {typingEvent ? <TypingBubble /> : null}
          </div>
        </div>
      </div>

      <div
        style={{
          height: 128,
          flexShrink: 0,
          backgroundColor: usesLightTheme ? '#f0f2f5' : '#111b21',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '18px 26px',
          borderTop: '2px solid rgba(134,150,160,0.1)',
        }}
      >
        <div
          style={{
            flex: 1,
            height: 82,
            borderRadius: 999,
            backgroundColor: usesLightTheme ? '#ffffff' : '#2a3942',
            color: usesLightTheme ? '#667781' : COLORS.muted,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            padding: '0 27px',
            fontSize: 31,
          }}
        >
          <Smile size={43} strokeWidth={1.8} />
          <span style={{ flex: 1 }}>Pesan</span>
          <Paperclip size={42} strokeWidth={1.8} />
          <Camera size={42} strokeWidth={1.8} />
        </div>
        <div
          style={{
            width: 82,
            height: 82,
            borderRadius: 999,
            backgroundColor: COLORS.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Mic size={45} color="white" strokeWidth={2.1} />
        </div>
      </div>

      {activeNotification ? <NotificationOverlay event={activeNotification} /> : null}
            </div>
          </div>
          {usePhoneLayout ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: -15,
                  top: 262,
                  width: 15,
                  height: 78,
                  borderRadius: '6px 0 0 6px',
                  background: 'linear-gradient(90deg, #070809, #4d5256 72%, #17191b)',
                  border: '2px solid rgba(0,0,0,0.78)',
                  boxSizing: 'border-box',
                  zIndex: 4,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: -16,
                  top: 386,
                  width: 16,
                  height: 142,
                  borderRadius: '7px 0 0 7px',
                  background: 'linear-gradient(90deg, #070809, #4d5256 72%, #17191b)',
                  border: '2px solid rgba(0,0,0,0.78)',
                  boxSizing: 'border-box',
                  zIndex: 4,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: -16,
                  top: 559,
                  width: 16,
                  height: 142,
                  borderRadius: '7px 0 0 7px',
                  background: 'linear-gradient(90deg, #070809, #4d5256 72%, #17191b)',
                  border: '2px solid rgba(0,0,0,0.78)',
                  boxSizing: 'border-box',
                  zIndex: 4,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  right: -16,
                  top: 452,
                  width: 16,
                  height: 190,
                  borderRadius: '0 7px 7px 0',
                  background: 'linear-gradient(90deg, #17191b, #4d5256 28%, #070809)',
                  border: '2px solid rgba(0,0,0,0.78)',
                  boxSizing: 'border-box',
                  zIndex: 4,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 38,
                  width: 238,
                  height: 61,
                  translate: '-50% 0',
                  borderRadius: 999,
                  background: 'linear-gradient(180deg, #080909 0%, #000000 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.055)',
                  zIndex: 20,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: 19,
                    top: 18,
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    background: 'radial-gradient(circle at 36% 34%, #273b4e 0%, #101a24 38%, #020405 72%)',
                    boxShadow: 'inset 0 0 0 3px rgba(73,102,130,0.22)',
                  }}
                />
              </div>
            </>
          ) : null}
        </div>
        <BackgroundMusicTrack props={props} timeline={timeline} />
        <MessageAudioTracks props={props} timeline={timeline} />
        <EndTransitionLayer props={props} />
      </AbsoluteFill>
    </ChatThemeContext.Provider>
  );
};

