'use client';

import React, { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import MessageBubble from './MessageBubble';
import TypingBubble from './TypingBubble';

// WhatsApp default wallpaper SVG pattern
const WA_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23111b21'/%3E%3Cg opacity='0.04' fill='%2325d366'%3E%3Cpath d='M25 10c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zM75 10c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zM50 35c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z'/%3E%3C/g%3E%3C/svg%3E")`;

export default function ChatArea() {
  const { bgType, bgColor, bgImage, messages, pinnedMessage, autoZoom, zoomScale, zoomSpeed, dateBadge } =
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
      ? { backgroundImage: WA_PATTERN, backgroundSize: '300px 300px' }
      : bgType === 'color'
      ? { backgroundColor: bgColor }
      : bgImage
      ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: '#111b21' };

  // Calculate dynamic auto-zoom scale during playback
  const currentZoomScale = isPlaying && autoZoom && activeMsgId ? zoomScale : 1;

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
            background: 'rgba(31,44,51,0.92)',
            borderColor: 'var(--wa-border)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div className="w-0.5 h-7 rounded-full" style={{ background: 'var(--wa-green)' }} />
          <div>
            <p className="text-[10px] font-semibold" style={{ color: 'var(--wa-green)' }}>
              📌 Pesan Disematkan
            </p>
            <p className="text-[11.5px] truncate" style={{ color: 'var(--wa-text-muted)' }}>
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
                background: 'rgba(18, 27, 33, 0.88)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                fontSize: '11px',
                fontWeight: 500,
                color: 'rgba(241, 245, 249, 0.7)',
                letterSpacing: '0.2px',
              }}
            >
              {dateBadge}
            </div>
          </div>
        )}

        {displayedMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isVisible={true}
            isZoomed={isPlaying && autoZoom && activeMsgId === msg.id}
            zoomScale={zoomScale}
            zoomSpeed={zoomSpeed}
          />
        ))}

        {/* Typing indicator bubble */}
        {isTyping && <TypingBubble />}
      </div>

      {/* Bottom input bar (decorative) */}
      <div
        className="flex items-center gap-2 px-2 py-2"
        style={{ background: 'var(--wa-header)' }}
      >
        <div
          className="flex-1 rounded-full px-4 py-2 text-[13px]"
          style={{ background: 'var(--wa-input)', color: 'var(--wa-text-muted)' }}
        >
          Pesan
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--wa-green)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
