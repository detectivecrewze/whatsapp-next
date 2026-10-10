'use client';

import React from 'react';

export default function TypingBubble() {
  return (
    <div className="flex justify-start my-1">
      <div
        className="px-3.5 py-2.5 rounded-2xl rounded-tl-xs flex items-center gap-1.5 shadow-sm"
        style={{
          background: 'var(--wa-bubble-in)',
          border: '1px solid rgba(102,119,129,0.12)',
        }}
      >
        <span
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ background: 'var(--wa-chat-muted)', animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ background: 'var(--wa-chat-muted)', animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ background: 'var(--wa-chat-muted)', animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}
