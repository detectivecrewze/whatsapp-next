'use client';

import React from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { getSenderColor, stripAudioTags } from '@/lib/utils';
import { Check, CheckCheck, Mic, MapPin, Phone, Eye, Trash2 } from 'lucide-react';
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

// Text Bubble
function TextBubble({ message }: { message: Message }) {
  const isOut = message.direction === 'outgoing';
  const visualText = stripAudioTags(message.text || '');
  return (
    <div className={`bubble-base ${isOut ? 'bubble-out' : 'bubble-in'}`}>
      {visualText && (
        <p className="text-white leading-[1.35]" style={{ fontSize: '14.2px' }}>
          {visualText}
        </p>
      )}
      <TimeRow time={message.time} direction={message.direction} />
    </div>
  );
}

// Image Bubble
// Image Bubble
function ImageBubble({ message }: { message: Message }) {
  const isOut = message.direction === 'outgoing';
  const isGif = message.imageData?.includes('.gif') || message.imageData?.startsWith('data:image/gif');

  return (
    <div
      className={`relative rounded-[8px] overflow-hidden p-[3px] ${isOut ? 'ml-auto bubble-out' : 'bubble-in'}`}
      style={{ maxWidth: '240px' }}
    >
      {message.imageData ? (
        <div className="relative rounded-[6px] overflow-hidden">
          <img
            src={message.imageData}
            alt="media"
            className="w-full max-h-[280px] object-cover block"
          />
          {isGif && (
            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white tracking-wider">
              GIF
            </span>
          )}
        </div>
      ) : (
        <div
          className="w-[200px] h-[150px] flex items-center justify-center rounded-[6px]"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          <span style={{ color: 'var(--wa-text-muted)', fontSize: 12 }}>🖼 Gambar / GIF</span>
        </div>
      )}
      {message.caption && (
        <div className="px-1.5 pt-1.5 pb-0.5">
          <p style={{ fontSize: '13.5px', color: 'var(--wa-text)', lineHeight: '1.35' }}>
            {stripAudioTags(message.caption)}
          </p>
        </div>
      )}
      <div className="px-1 pb-0.5">
        <TimeRow time={message.time} direction={message.direction} />
      </div>
    </div>
  );
}

// View Once Bubble (Authentic WhatsApp Pill Badge)
function ViewOnceBubble({ message }: { message: Message }) {
  const isOut = message.direction === 'outgoing';
  return (
    <div
      className={`bubble-base flex items-center gap-2.5 px-3 py-2 ${isOut ? 'bubble-out ml-auto' : 'bubble-in'}`}
      style={{ minWidth: '150px' }}
    >
      <div className="w-6 h-6 rounded-full border-2 border-[#00a884] flex items-center justify-center shrink-0">
        <span className="text-[11px] font-bold text-[#00a884]">1</span>
      </div>
      <span className="text-[14px] font-semibold text-white flex-1">Foto</span>
      <TimeRow time={message.time} direction={message.direction} />
    </div>
  );
}

// Voice Note Bubble (Authentic WhatsApp Waveform & Mic Badge)
function VoiceNoteBubble({ message }: { message: Message }) {
  const isOut = message.direction === 'outgoing';
  const waveform = message.waveform ?? Array.from({ length: 24 }, (_, i) => Math.floor(Math.sin(i * 0.45) * 35) + 35);
  const { pfp } = useEditorStore();
  const activeMsgId = usePlayerStore((s) => s.activeMsgId);
  const isPlayingVn = activeMsgId === message.id;

  return (
    <div
      className={`bubble-base flex items-center gap-2.5 px-3 py-2 ${isOut ? 'bubble-out ml-auto' : 'bubble-in'}`}
      style={{ width: '235px' }}
    >
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
function TransferCard({ message }: { message: Message }) {
  const isOut = message.direction === 'outgoing';
  return (
    <div
      className={`rounded-[10px] overflow-hidden ${isOut ? 'ml-auto' : ''}`}
      style={{ maxWidth: '220px', background: isOut ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)' }}
    >
      <div className="px-3 py-3">
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
function ContactCard({ message }: { message: Message }) {
  const isOut = message.direction === 'outgoing';
  return (
    <div
      className={`rounded-[10px] overflow-hidden ${isOut ? 'ml-auto' : ''}`}
      style={{ maxWidth: '220px', background: isOut ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)' }}
    >
      <div className="px-3 py-3 flex items-center gap-2.5">
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
function LocationCard({ message }: { message: Message }) {
  const isOut = message.direction === 'outgoing';
  return (
    <div
      className={`rounded-[10px] overflow-hidden ${isOut ? 'ml-auto' : ''}`}
      style={{ maxWidth: '220px', background: isOut ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)' }}
    >
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

// Deleted Message
function DeletedBubble({ message }: { message: Message }) {
  const isOut = message.direction === 'outgoing';
  return (
    <div className={`bubble-base flex items-center gap-2 ${isOut ? 'bubble-out ml-auto' : 'bubble-in'}`}>
      <Trash2 size={14} style={{ color: 'var(--wa-text-muted)', flexShrink: 0 }} />
      <p style={{ fontSize: '13.5px', fontStyle: 'italic', color: 'var(--wa-text-muted)' }}>
        Pesan ini telah dihapus
      </p>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isVisible?: boolean;
  isZoomed?: boolean;
  zoomScale?: number;
  zoomSpeed?: number;
}

// Main MessageBubble dispatcher
export default function MessageBubble({
  message,
  isVisible = true,
  isZoomed = false,
  zoomScale = 1.08,
  zoomSpeed = 400,
}: MessageBubbleProps) {
  const { chatType } = useEditorStore();
  const isOut = message.direction === 'outgoing';

  if (!isVisible) return null;

  const renderBubble = () => {
    switch (message.type) {
      case 'text': return <TextBubble message={message} />;
      case 'image': return <ImageBubble message={message} />;
      case 'view_once': return <ViewOnceBubble message={message} />;
      case 'voice_note': return <VoiceNoteBubble message={message} />;
      case 'notification': return <NotificationBubble message={message} />;
      case 'transfer': return <TransferCard message={message} />;
      case 'contact': return <ContactCard message={message} />;
      case 'location': return <LocationCard message={message} />;
      case 'deleted': return <DeletedBubble message={message} />;
      default: return <TextBubble message={message} />;
    }
  };

  if (message.type === 'notification') {
    return renderBubble();
  }

  return (
    <div
      className={`flex flex-col relative ${isOut ? 'items-end' : 'items-start'} ${isZoomed ? 'my-2.5 z-30' : 'mb-2 z-10'}`}
      style={{
        transform: isZoomed ? `scale(${zoomScale})` : 'scale(1)',
        transformOrigin: isOut ? 'right center' : 'left center',
        transition: `transform ${zoomSpeed}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      {/* Group sender badge */}
      {!isOut && chatType === 'group' && message.senderName && (
        <span
          className="text-[11.5px] font-semibold ml-2 mb-0.5"
          style={{ color: message.senderColor || getSenderColor(message.senderName) }}
        >
          {message.senderName}
        </span>
      )}
      {renderBubble()}
    </div>
  );
}
