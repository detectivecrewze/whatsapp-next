'use client';

import React from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { getSenderColor, stripAudioTags, extractDomain } from '@/lib/utils';
import { Check, CheckCheck, Mic, MapPin, Phone, Eye, Trash2, Image as ImageIcon, Globe } from 'lucide-react';
import { Message } from '@/types';

// Time + tick row
function TimeRow({ time, direction }: { time?: string; direction: 'incoming' | 'outgoing' }) {
  return (
    <div className="flex items-center justify-end gap-1 mt-0.5">
      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {time || '09:00'}
      </span>
      {direction === 'outgoing' && (
        <CheckCheck size={14} className="tick-double" />
      )}
    </div>
  );
}

// Sender Name Header inside Group Chat Bubbles (Authentic WhatsApp)
function SenderNameHeader({ message, className }: { message: Message; className?: string }) {
  if (!message.senderName) return null;
  const color = message.senderColor || getSenderColor(message.senderName);
  return (
    <div
      className={`text-[12.5px] font-bold leading-tight select-none tracking-tight ${className || 'mb-1'}`}
      style={{ color }}
    >
      {message.senderName}
    </div>
  );
}

// Text Bubble
function TextBubble({ message, showSenderName }: { message: Message; showSenderName?: boolean }) {
  const isOut = message.direction === 'outgoing';
  const visualText = stripAudioTags(message.text || '');
  const isPureUrl = visualText.startsWith('http://') || visualText.startsWith('https://');

  return (
    <div className={`bubble-base ${isOut ? 'bubble-out' : 'bubble-in'}`}>
      {showSenderName && <SenderNameHeader message={message} />}
      {visualText && (
        <p className="text-white leading-[1.35]" style={{ fontSize: '14.2px' }}>
          {isPureUrl ? (
            <span style={{ color: '#53bdeb' }} className="underline break-all">
              {visualText}
            </span>
          ) : (
            visualText
          )}
        </p>
      )}
      <TimeRow time={message.time} direction={message.direction} />
    </div>
  );
}

// Image & GIF Bubble (Full Width Alignment & Default App Placeholder Card)
function ImageBubble({ message, showSenderName }: { message: Message; showSenderName?: boolean }) {
  const isOut = message.direction === 'outgoing';
  const isGif = message.imageData?.includes('.gif') || message.imageData?.startsWith('data:image/gif');
  const [imgErr, setImgErr] = React.useState(false);

  const bg = isOut ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)';
  const br = isOut ? '12px 0 12px 12px' : '0 12px 12px 12px';

  const hasValidImage = Boolean(message.imageData && !imgErr);
  const captionText = message.caption || (message.text && message.type === 'image' ? message.text : undefined);

  return (
    <div
      className={`relative overflow-hidden ${isOut ? 'ml-auto' : ''}`}
      style={{
        background: bg,
        borderRadius: br,
        maxWidth: '260px',
        width: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        padding: captionText || showSenderName ? '3px 3px 0 3px' : '0',
      }}
    >
      {showSenderName && (
        <div className="px-2 pt-1 pb-1">
          <SenderNameHeader message={message} className="" />
        </div>
      )}
      {hasValidImage ? (
        <div className="relative w-full overflow-hidden" style={{ borderRadius: captionText ? '8px' : br }}>
          <img
            src={message.imageData}
            alt=""
            className="w-full max-h-[300px] object-cover block"
            style={{ width: '100%' }}
            onError={() => setImgErr(true)}
          />
          {isGif && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-[#00a884] tracking-wider">
              GIF
            </span>
          )}
        </div>
      ) : (
        /* Built-in App Default Placeholder Card */
        <div
          className="w-full h-[130px] flex flex-col items-center justify-center gap-1.5 p-3 text-center"
          style={{ background: 'rgba(0,0,0,0.22)', borderRadius: captionText ? '8px' : br }}
        >
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-300 mb-0.5">
            <ImageIcon size={18} />
          </div>
          <span style={{ color: 'var(--wa-text-muted)', fontSize: 11, fontWeight: 600 }}>
            📷 Gambar (Klik di Editor untuk Upload)
          </span>
        </div>
      )}

      {captionText && (
        <div className="px-2.5 pt-1.5 pb-0.5">
          <p style={{ fontSize: '13.5px', color: 'var(--wa-text)', lineHeight: '1.35' }}>
            {stripAudioTags(captionText)}
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-1 px-2 pb-1.5 pt-0.5">
        <TimeRow time={message.time} direction={message.direction} />
      </div>
    </div>
  );
}

// View Once Bubble (Authentic WhatsApp Pill Badge)
function ViewOnceBubble({ message, showSenderName }: { message: Message; showSenderName?: boolean }) {
  const isOut = message.direction === 'outgoing';
  return (
    <div
      className={`bubble-base flex flex-col ${isOut ? 'bubble-out ml-auto' : 'bubble-in'}`}
      style={{ minWidth: '150px' }}
    >
      {showSenderName && <SenderNameHeader message={message} />}
      <div className="flex items-center gap-2.5 w-full">
        <div className="w-6 h-6 rounded-full border-2 border-[#00a884] flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-[#00a884]">1</span>
        </div>
        <span className="text-[14px] font-semibold text-white flex-1">Foto</span>
        <TimeRow time={message.time} direction={message.direction} />
      </div>
    </div>
  );
}

// Voice Note Bubble (Authentic WhatsApp Waveform & Mic Badge)
function VoiceNoteBubble({ message, showSenderName }: { message: Message; showSenderName?: boolean }) {
  const isOut = message.direction === 'outgoing';
  const waveform = message.waveform ?? Array.from({ length: 24 }, (_, i) => Math.floor(Math.sin(i * 0.45) * 35) + 35);
  const { pfp } = useEditorStore();
  const activeMsgId = usePlayerStore((s) => s.activeMsgId);
  const isPlayingVn = activeMsgId === message.id;

  return (
    <div
      className={`bubble-base flex flex-col ${isOut ? 'bubble-out ml-auto' : 'bubble-in'}`}
      style={{ width: '235px' }}
    >
      {showSenderName && <SenderNameHeader message={message} className="mb-1" />}
      <div className="flex items-center gap-2.5 w-full">
      {/* Avatar for incoming */}
      {!isOut && (
        <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-[#00a884] flex items-center justify-center">
          {pfp ? (
            <img src={pfp} className="w-full h-full object-cover" alt="" />
          ) : (
            <Mic size={15} className="text-white" />
          )}
        </div>
      )}

      {/* Play/Pause Button */}
      <button
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95"
        style={{ background: isOut ? 'rgba(255,255,255,0.2)' : '#00a884' }}
      >
        {isPlayingVn ? (
          <div className="flex gap-[2.5px] items-center justify-center">
            <div className="w-[3px] h-3 bg-white rounded-full animate-pulse" />
            <div className="w-[3px] h-3 bg-white rounded-full animate-pulse" />
          </div>
        ) : (
          <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
            <path d="M0 0l10 6-10 6V0z" />
          </svg>
        )}
      </button>

      {/* Waveform & Duration */}
      <div className="flex flex-col flex-1 gap-0.5 min-w-0">
        <div className="flex items-center gap-[2px] w-full" style={{ height: '20px' }}>
          {waveform.map((h, i) => (
            <div
              key={i}
              className="rounded-full flex-1"
              style={{
                height: `${Math.max(4, (h / 100) * 18)}px`,
                background: isOut
                  ? (isPlayingVn ? '#53bdeb' : 'rgba(255,255,255,0.65)')
                  : (isPlayingVn ? '#00a884' : 'rgba(255,255,255,0.45)'),
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
            {message.duration || '0:12'}
          </span>
          <div className="flex items-center gap-1">
            <Mic size={12} style={{ color: isOut ? '#53bdeb' : 'rgba(255,255,255,0.6)' }} />
            <TimeRow time={message.time} direction={message.direction} />
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

// Notification Bubble
function NotificationBubble({ message }: { message: Message }) {
  return (
    <div className="flex justify-center my-1">
      <div
        className="px-3 py-1 rounded-full text-center"
        style={{
          background: 'rgba(17,27,33,0.7)',
          backdropFilter: 'blur(8px)',
          fontSize: '11.5px',
          color: 'var(--wa-text-muted)',
          maxWidth: '80%',
        }}
      >
        {message.text || '🔒 Pesan dienkripsi end-to-end'}
      </div>
    </div>
  );
}

// Transfer Card
function TransferCard({ message, showSenderName }: { message: Message; showSenderName?: boolean }) {
  const isOut = message.direction === 'outgoing';
  return (
    <div
      className={`rounded-[10px] overflow-hidden ${isOut ? 'ml-auto' : ''}`}
      style={{ maxWidth: '220px', background: isOut ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)' }}
    >
      <div className="px-3 py-3">
        {showSenderName && <SenderNameHeader message={message} className="mb-2" />}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
            <span className="text-white text-[13px] font-bold">Rp</span>
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--wa-text)', fontWeight: 600 }}>Transfer Berhasil</p>
            <p style={{ fontSize: '11px', color: 'var(--wa-text-muted)' }}>via QRIS / M-Banking</p>
          </div>
        </div>
        <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--wa-green)' }}>
          {message.text || 'Rp 250.000'}
        </p>
        {message.caption && (
          <p style={{ fontSize: '11px', color: 'var(--wa-text-muted)', marginTop: 4 }}>{message.caption}</p>
        )}
      </div>
      <div className="px-3 pb-1.5">
        <TimeRow time={message.time} direction={message.direction} />
      </div>
    </div>
  );
}

// Contact Card
function ContactCard({ message, showSenderName }: { message: Message; showSenderName?: boolean }) {
  const isOut = message.direction === 'outgoing';
  return (
    <div
      className={`rounded-[10px] overflow-hidden ${isOut ? 'ml-auto' : ''}`}
      style={{ maxWidth: '220px', background: isOut ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)' }}
    >
      {showSenderName && (
        <div className="px-3 pt-2.5 pb-0.5">
          <SenderNameHeader message={message} className="" />
        </div>
      )}
      <div className="px-3 py-2.5 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--wa-green-teal)' }}>
          <Phone size={18} className="text-white" />
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--wa-text)' }}>{message.text || 'Nama Kontak'}</p>
          <p style={{ fontSize: '11px', color: 'var(--wa-text-muted)' }}>{message.caption || '+62 812 xxxx xxxx'}</p>
        </div>
      </div>
      <div
        className="border-t py-1.5 px-3 text-center"
        style={{ borderColor: 'var(--wa-border)' }}
      >
        <span style={{ fontSize: '13px', color: 'var(--wa-green)', fontWeight: 500 }}>Kirim Pesan</span>
      </div>
    </div>
  );
}

// Location Card
function LocationCard({ message, showSenderName }: { message: Message; showSenderName?: boolean }) {
  const isOut = message.direction === 'outgoing';
  return (
    <div
      className={`rounded-[10px] overflow-hidden ${isOut ? 'ml-auto' : ''}`}
      style={{ maxWidth: '220px', background: isOut ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)' }}
    >
      {showSenderName && (
        <div className="px-3 pt-2 pb-1">
          <SenderNameHeader message={message} className="" />
        </div>
      )}
      <div
        className="w-full h-[120px] flex items-center justify-center"
        style={{ background: '#1a2738' }}
      >
        <MapPin size={28} style={{ color: 'var(--ui-danger)' }} />
      </div>
      <div className="px-3 py-2">
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--wa-text)' }}>
          {message.text || 'Lokasi Saya'}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--wa-text-muted)' }}>
          {message.caption || 'Jakarta, Indonesia'}
        </p>
        <TimeRow time={message.time} direction={message.direction} />
      </div>
    </div>
  );
}

// Link & Web Preview Bubble (Aesthetic WhatsApp Rich Card)
function LinkBubble({ message, showSenderName }: { message: Message; showSenderName?: boolean }) {
  const isOut = message.direction === 'outgoing';
  const bg = isOut ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)';
  const br = isOut ? '12px 0 12px 12px' : '0 12px 12px 12px';

  const rawUrl = message.linkUrl || (message.text?.startsWith('http') ? message.text : '') || 'https://anniv.for-you-always.my.id/c/auto-********';
  const domain = extractDomain(rawUrl);
  const displayTitle = message.linkTitle || (domain ? `${domain}` : 'Tautan Web');
  const displayDesc = message.linkDescription || 'Klik untuk membuka tautan halaman web';
  const displayImg = message.linkImage || message.imageData;
  const [imgErr, setImgErr] = React.useState(false);

  // Commentary text (e.g. "guys, kirim satu pesan buat dia yaa...")
  const commentary = message.text && !message.text.startsWith('http') ? stripAudioTags(message.text) : (message.caption ? stripAudioTags(message.caption) : null);

  return (
    <div
      className={`relative overflow-hidden ${isOut ? 'ml-auto' : ''}`}
      style={{
        background: bg,
        borderRadius: br,
        maxWidth: '280px',
        width: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        padding: '3px 3px 2px 3px',
      }}
    >
      {/* Group Sender Name */}
      {showSenderName && (
        <div className="px-2 pt-1 pb-1">
          <SenderNameHeader message={message} className="" />
        </div>
      )}

      {/* Optional Commentary Header */}
      {commentary && (
        <div className="px-2 pt-0.5 pb-1.5">
          <p className="text-white leading-[1.35]" style={{ fontSize: '14.2px' }}>
            {commentary}
          </p>
        </div>
      )}

      {/* Embedded Rich Preview Card */}
      <div
        className="rounded-[8px] overflow-hidden flex flex-col"
        style={{
          background: 'rgba(0, 0, 0, 0.22)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        {/* Banner Image or Aesthetic Fallback Banner */}
        {displayImg && !imgErr ? (
          <div className="relative w-full h-[125px] overflow-hidden bg-black/30">
            <img
              src={displayImg}
              alt=""
              className="w-full h-full object-cover block"
              onError={() => setImgErr(true)}
            />
          </div>
        ) : (
          <div
            className="w-full h-[95px] flex flex-col items-center justify-center gap-1.5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.35) 100%)',
            }}
          >
            {/* Ambient circle */}
            <div
              className="absolute w-24 h-24 rounded-full pointer-events-none opacity-25"
              style={{
                background: 'radial-gradient(circle, #53bdeb 0%, transparent 70%)',
              }}
            />
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Globe size={18} className="text-[#53bdeb]" />
            </div>
            <span
              className="text-[10.5px] font-mono tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.75)' }}
            >
              {domain || 'WEB PREVIEW'}
            </span>
          </div>
        )}

        {/* Card Metadata (Title, Description, Domain) */}
        <div className="px-2.5 py-2 flex flex-col gap-0.5">
          <p
            className="font-semibold text-white leading-tight line-clamp-1"
            style={{ fontSize: '13.5px' }}
          >
            {displayTitle}
          </p>
          <p
            className="text-[11.5px] line-clamp-2 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            {displayDesc}
          </p>
          <div className="flex items-center gap-1 pt-0.5 text-[10.5px] font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <Globe size={11} className="shrink-0 text-[#53bdeb]" />
            <span className="truncate">{domain}</span>
          </div>
        </div>
      </div>

      {/* The URL itself in WhatsApp link blue (#53bdeb) */}
      <div className="px-2 pt-1.5 pb-0.5">
        <span
          className="break-all hover:underline cursor-pointer select-text"
          style={{ fontSize: '13.5px', color: '#53bdeb', lineHeight: '1.3' }}
        >
          {rawUrl}
        </span>
      </div>

      {/* Time & tick row */}
      <div className="px-1 pb-0.5">
        <TimeRow time={message.time} direction={message.direction} />
      </div>
    </div>
  );
}

// Deleted Message
function DeletedBubble({ message, showSenderName }: { message: Message; showSenderName?: boolean }) {
  const isOut = message.direction === 'outgoing';
  return (
    <div className={`bubble-base flex flex-col ${isOut ? 'bubble-out ml-auto' : 'bubble-in'}`}>
      {showSenderName && <SenderNameHeader message={message} />}
      <div className="flex items-center gap-2">
        <Trash2 size={14} style={{ color: 'var(--wa-text-muted)', flexShrink: 0 }} />
        <p style={{ fontSize: '13.5px', fontStyle: 'italic', color: 'var(--wa-text-muted)' }}>
          Pesan ini telah dihapus
        </p>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isVisible?: boolean;
  isZoomed?: boolean;
  zoomScale?: number;
  zoomSpeed?: number;
  showSenderName?: boolean;
}

// Main MessageBubble dispatcher
export default function MessageBubble({
  message,
  isVisible = true,
  isZoomed = false,
  zoomScale = 1.08,
  zoomSpeed = 400,
  showSenderName = false,
}: MessageBubbleProps) {
  const { isPlaying } = usePlayerStore();
  const isOut = message.direction === 'outgoing';

  if (!isVisible) return null;

  const renderBubble = () => {
    switch (message.type) {
      case 'text': return <TextBubble message={message} showSenderName={showSenderName} />;
      case 'link': return <LinkBubble message={message} showSenderName={showSenderName} />;
      case 'image': return <ImageBubble message={message} showSenderName={showSenderName} />;
      case 'view_once': return <ViewOnceBubble message={message} showSenderName={showSenderName} />;
      case 'voice_note': return <VoiceNoteBubble message={message} showSenderName={showSenderName} />;
      case 'notification': return <NotificationBubble message={message} />;
      case 'transfer': return <TransferCard message={message} showSenderName={showSenderName} />;
      case 'contact': return <ContactCard message={message} showSenderName={showSenderName} />;
      case 'location': return <LocationCard message={message} showSenderName={showSenderName} />;
      case 'deleted': return <DeletedBubble message={message} showSenderName={showSenderName} />;
      default: return <TextBubble message={message} showSenderName={showSenderName} />;
    }
  };

  if (message.type === 'notification') {
    return null;
  }

  // Active check: is this message currently playing in the sequence?
  const { activeMsgId } = usePlayerStore.getState();
  const isActiveMsg = activeMsgId === message.id;

  // Per-message enableZoom override takes priority when this message is active
  const shouldZoom = message.enableZoom !== undefined ? (message.enableZoom && isActiveMsg) : isZoomed;
  const effectiveScale = message.customScale || zoomScale;
  const isCurrentlyZoomed = isPlaying && shouldZoom;

  return (
    <div
      className={`flex flex-col relative ${isOut ? 'items-end' : 'items-start'} ${isCurrentlyZoomed ? 'my-2.5 z-30' : 'mb-2 z-10'}`}
      style={{
        transform: isCurrentlyZoomed ? `scale(${effectiveScale})` : 'scale(1)',
        transformOrigin: isOut ? 'right center' : 'left center',
        transition: `transform ${zoomSpeed}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      {renderBubble()}
    </div>
  );
}
