'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import StatusBar from './StatusBar';
import ChatHeader from './ChatHeader';
import ChatArea from './ChatArea';
import PushNotificationOverlay from './PushNotificationOverlay';
import { usesLightChatTheme } from '@/lib/chatTheme';

export default function WhatsAppCanvas() {
  const bubbleColor = useEditorStore((state) => state.bubbleColor);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const usesLightTheme = usesLightChatTheme(bubbleColor);

  const CANVAS_WIDTH = 390;
  const CANVAS_HEIGHT = 844;

  // Fit canvas perfectly inside container bounds using ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function calculateScale() {
      const parent = el?.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const parentH = rect.height || parent.clientHeight || window.innerHeight;
      const parentW = rect.width || parent.clientWidth || window.innerWidth;

      // Available space with 24px margin
      const availH = Math.max(parentH - 24, 100);
      const availW = Math.max(parentW - 24, 100);

      const scaleH = availH / CANVAS_HEIGHT;
      const scaleW = availW / CANVAS_WIDTH;
      const computedScale = Math.min(scaleH, scaleW, 1);

      setScale(Math.max(computedScale, 0.2));
    }

    calculateScale();
    const timer = setTimeout(calculateScale, 60);

    const observer = new ResizeObserver(() => calculateScale());
    if (el.parentElement) {
      observer.observe(el.parentElement);
    }

    window.addEventListener('resize', calculateScale);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, []);

  const scaledWidth = CANVAS_WIDTH * scale;
  const scaledHeight = CANVAS_HEIGHT * scale;

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full h-full overflow-hidden"
    >
      {/* Wrapper box with exact scaled dimensions */}
      <div
        style={{
          width: scaledWidth,
          height: scaledHeight,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Inner Phone Frame */}
        <div
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            borderRadius: '44px',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)',
            background: 'var(--wa-phone-chrome)',
            '--wa-bubble-out': bubbleColor || '#d9fdd3',
            '--wa-bubble-in': usesLightTheme ? '#ffffff' : '#202c33',
            '--wa-bubble-shadow': usesLightTheme
              ? '0 1px 0.5px rgba(11,20,26,0.10)'
              : '0 1px 1px rgba(0,0,0,0.18)',
            '--wa-chat-text': usesLightTheme ? '#111b21' : '#e9edef',
            '--wa-chat-muted': usesLightTheme ? '#667781' : '#8696a0',
            '--wa-chat-time': usesLightTheme ? '#667781' : 'rgba(255,255,255,0.55)',
            '--wa-chat-input': usesLightTheme ? '#ffffff' : '#2a3942',
            '--wa-input-tray': usesLightTheme ? '#f0f2f5' : '#111b21',
            '--wa-link-card': usesLightTheme ? 'rgba(11,20,26,0.06)' : 'rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            top: 0,
            left: 0,
          } as React.CSSProperties}
        >
          {/* Status bar */}
          <StatusBar />

          {/* Push Notification Popup Banner (If active) */}
          <PushNotificationOverlay />

          {/* Chat header */}
          <ChatHeader />

          {/* Chat area (fills remaining space) */}
          <ChatArea />
        </div>
      </div>
    </div>
  );
}
