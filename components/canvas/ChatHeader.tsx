'use client';

import React from 'react';
import { Phone, Video, ChevronLeft, Search } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { getInitials } from '@/lib/utils';

export default function ChatHeader() {
  const { name, pfp, chatType, groupSubtitle, headerStatus, headerStatusText, activeHeaderStatusOverride, unreadCount } = useEditorStore();

  const currentStatus = activeHeaderStatusOverride ?? headerStatus;

  const statusText =
    currentStatus === 'online'
      ? 'Online'
      : currentStatus === 'typing'
      ? 'mengetik...'
      : headerStatusText || 'Online';

  return (
    <div
      className="flex items-center gap-2 px-2 py-2"
      style={{ background: 'var(--wa-header)' }}
    >
      {/* Back button with unread badge counter next to chevron */}
      <button className="flex items-center gap-0.5 shrink-0 text-white opacity-90">
        <ChevronLeft size={22} className="text-[#53bdeb]" />
        {unreadCount > 0 && (
          <span className="text-[13px] font-semibold text-[#53bdeb] leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Avatar */}
      <div className="relative shrink-0">
        {pfp ? (
          <img
            src={pfp}
            alt={name}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-[13px]"
            style={{ background: 'var(--wa-green-teal)' }}
          >
            {getInitials(name || 'WA')}
          </div>
        )}
        {/* Online indicator dot */}
        {headerStatus === 'online' && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#1f2c33]" />
        )}
      </div>

      {/* Name + Status */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-[15px] font-semibold leading-tight truncate">
          {name || 'Nama Kontak'}
        </p>
        <p
          className="text-[12px] leading-tight truncate"
          style={{
            color:
              currentStatus === 'typing'
                ? 'var(--wa-green)'
                : 'var(--wa-text-muted)',
          }}
        >
          {chatType === 'group'
            ? groupSubtitle || statusText
            : statusText}
        </p>
      </div>

      {/* Action icons */}
      <div className="flex items-center gap-4 text-white opacity-80 shrink-0">
        <Video size={20} />
        <Phone size={18} />
        <Search size={18} />
      </div>
    </div>
  );
}
