'use client';

import React, { useEffect, useRef } from 'react';
import { Camera, Mic, Paperclip, Smile } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import MessageBubble from './MessageBubble';
import TypingBubble from './TypingBubble';

export default function ChatArea() {
  const { chatType, bgType, bgColor, bgImage, messages, pinnedMessage, autoZoom, zoomScale, zoomSpeed, dateBadge } =
    useEditorStore();
  const { isPlaying, visibleCount, isTyping, activeMsgId } = usePlayerStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter visible messages based on playback state
  const displayedMessages =
    visibleCount === -1
      ? messages
      : messages.slice(0, visibleCount);

  // Auto scroll to bottom as messages appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedMessages.length, isTyping]);

  const backgroundStyle: React.CSSProperties =
    bgType === 'default'
      ? {
          backgroundColor: '#efeae2',
          backgroundImage: "url('/whatsapp-doodle.svg')",
          backgroundSize: '240px 240px',
        }
      : bgType === 'color'
      ? {
          backgroundColor: bgColor,
          backgroundImage: "url('/whatsapp-doodle.svg')",
          backgroundSize: '240px 240px',
          backgroundBlendMode: 'soft-light',
        }
      : bgImage
      ? {
          backgroundImage: `linear-gradient(rgba(11,20,26,0.12), rgba(11,20,26,0.12)), url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : { backgroundColor: '#efeae2' };

  return (
    <div
      className="relative flex-1 flex flex-col overflow-hidden"
      style={backgroundStyle}
    >
      {/* Pinned message banner */}
      {pinnedMessage && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 border-b"
          style={{
            background: bgType === 'default' ? 'rgba(255,255,255,0.94)' : 'rgba(31,44,51,0.92)',
            borderColor: 'rgba(102,119,129,0.15)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div className="w-0.5 h-7 rounded-full" style={{ background: 'var(--wa-green)' }} />
          <div>
            <p className="text-[10px] font-semibold" style={{ color: 'var(--wa-green)' }}>
              📌 Pesan Disematkan
            </p>
            <p className="text-[11.5px] truncate" style={{ color: 'var(--wa-chat-muted)' }}>
              {pinnedMessage}
            </p>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2.5 py-2 flex flex-col gap-[2px]"
      >
        {/* WhatsApp Date Pill Badge (Today / Date) */}
        {dateBadge && (
          <div className="flex justify-center my-1.5 shrink-0">
            <div
              className="px-3 py-1 rounded-md text-center shadow-sm"
              style={{
                background: bgType === 'default' ? 'rgba(225,243,251,0.94)' : 'rgba(18, 27, 33, 0.88)',
                border: bgType === 'default' ? '1px solid rgba(102,119,129,0.08)' : '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                fontSize: '11px',
                fontWeight: 500,
                color: bgType === 'default' ? '#54656f' : 'rgba(241, 245, 249, 0.7)',
                letterSpacing: '0.2px',
              }}
            >
              {dateBadge}
            </div>
          </div>
        )}

        {displayedMessages.map((msg, idx) => {
          const prevMsg = idx > 0 ? displayedMessages[idx - 1] : null;
          // Cluster grouping: only show sender name on first message of a consecutive series from the same sender
          const showSenderName =
            chatType === 'group' &&
            msg.direction === 'incoming' &&
            Boolean(msg.senderName) &&
            (!prevMsg || prevMsg.direction !== 'incoming' || prevMsg.senderName !== msg.senderName);

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isVisible={true}
              isZoomed={isPlaying && (msg.enableZoom ?? autoZoom) && activeMsgId === msg.id}
              zoomScale={zoomScale}
              zoomSpeed={zoomSpeed}
              showSenderName={showSenderName}
            />
          );
        })}

        {/* Typing indicator bubble */}
        {isTyping && <TypingBubble />}
      </div>

      {/* Bottom input bar (decorative) */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 border-t"
        style={{ background: 'var(--wa-input-tray)', borderColor: 'rgba(134,150,160,0.12)' }}
      >
        <div
          className="flex-1 h-10 rounded-full px-3 flex items-center gap-2.5 text-[13px]"
          style={{ background: 'var(--wa-chat-input)', color: 'var(--wa-chat-muted)' }}
        >
          <Smile size={19} strokeWidth={1.8} />
          <span className="flex-1">Pesan</span>
          <Paperclip size={18} strokeWidth={1.8} />
          <Camera size={18} strokeWidth={1.8} />
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--wa-green-teal)' }}
        >
          <Mic size={19} color="white" strokeWidth={2.1} />
        </div>
      </div>
    </div>
  );
}
