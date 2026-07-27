'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import StatusBar from './StatusBar';
import ChatHeader from './ChatHeader';
import ChatArea from './ChatArea';

export default function WhatsAppCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const CANVAS_WIDTH = 390;
  const CANVAS_HEIGHT = 844;

  // Fit canvas to available container dimensions
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (!parent) return;
        const availH = parent.clientHeight - 24;
        const availW = parent.clientWidth - 24;
        const scaleH = availH / CANVAS_HEIGHT;
        const scaleW = availW / CANVAS_WIDTH;
        const computedScale = Math.min(scaleH, scaleW, 1);
        setScale(Math.max(computedScale, 0.2));
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scaledWidth = CANVAS_WIDTH * scale;
  const scaledHeight = CANVAS_HEIGHT * scale;

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full h-full overflow-hidden"
    >
      {/* Wrapper box with exact scaled dimensions to prevent clipping */}
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
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)',
            background: 'var(--wa-header)',
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {/* Status bar */}
          <StatusBar />

          {/* Chat header */}
          <ChatHeader />

          {/* Chat area (fills remaining space) */}
          <ChatArea />
        </div>
      </div>
    </div>
  );
}
