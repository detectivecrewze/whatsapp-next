'use client';

import React from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Message } from '@/types';

export default function PushNotificationOverlay() {
  const { messages, phoneOs } = useEditorStore();
  const { visibleCount, activeMsgId } = usePlayerStore();

  // Find active notification message during playback or edit
  let activeNotif: Message | undefined;

  if (activeMsgId) {
    const msg = messages.find((m) => m.id === activeMsgId);
    if (msg?.type === 'notification') {
      activeNotif = msg;
    }
  } else if (visibleCount > 0 && visibleCount <= messages.length) {
    const msg = messages[visibleCount - 1];
    if (msg?.type === 'notification') {
      activeNotif = msg;
    }
  }

  if (!activeNotif) return null;

  const isIos = phoneOs === 'ios';

  return (
    <div className="absolute top-11 left-3 right-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      {isIos ? (
        // iOS Style Push Notification Banner
        <div
          className="rounded-[18px] p-3 shadow-2xl backdrop-blur-xl border border-white/10 flex items-start gap-3"
          style={{ background: 'rgba(32, 38, 46, 0.88)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <p className="text-[12px] font-semibold text-white truncate">
                {activeNotif.notifSender || activeNotif.senderName || 'WhatsApp'}
              </p>
              <span className="text-[10px] text-gray-400 shrink-0">
                {activeNotif.time || 'Sekarang'}
              </span>
            </div>
            <p className="text-[12px] font-medium text-gray-200 truncate mt-0.5">
              {activeNotif.notifTitle || 'Pesan Baru'}
            </p>
            <p className="text-[11.5px] text-gray-300 leading-snug line-clamp-2 mt-0.5">
              {activeNotif.text || 'Notifikasi baru diterima'}
            </p>
          </div>
        </div>
      ) : (
        // Android Style Push Notification Banner
        <div
          className="rounded-2xl p-3 shadow-2xl border border-white/10 flex items-start gap-3"
          style={{ background: '#1e2830' }}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
                {activeNotif.notifApp || 'WhatsApp'} • {activeNotif.time || '10:00'}
              </span>
            </div>
            <p className="text-[12px] font-bold text-white truncate mt-0.5">
              {activeNotif.notifSender || activeNotif.senderName || 'Pesan Baru'}
            </p>
            <p className="text-[11.5px] text-gray-300 line-clamp-2 mt-0.5">
              {activeNotif.text || 'Notifikasi baru diterima'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
