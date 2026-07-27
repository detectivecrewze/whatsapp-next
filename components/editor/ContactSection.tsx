'use client';

import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { getInitials } from '@/lib/utils';

export default function ContactSection() {
  const {
    name, pfp, phoneOs, chatType, groupSubtitle,
    batteryLevel, customTime, useCustomTime,
    headerStatus, headerStatusText, pinnedMessage, unreadCount, dateBadge,
    setName, setPfp, setPhoneOs, setChatType, setGroupSubtitle,
    setBatteryLevel, setCustomTime, setUseCustomTime,
    setHeaderStatus, setHeaderStatusText, setPinnedMessage, setUnreadCount, setDateBadge,
  } = useEditorStore();

  const pfpInputRef = useRef<HTMLInputElement>(null);

  function handlePfpUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPfp(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Avatar + Name row */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <button
            onClick={() => pfpInputRef.current?.click()}
            className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center border-2 transition-all hover:opacity-80"
            style={{ borderColor: 'var(--ui-border)' }}
            title="Upload foto profil"
          >
            {pfp ? (
              <img src={pfp} alt="pfp" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-0.5"
                style={{ background: 'var(--ui-card)', color: 'var(--wa-text-muted)' }}
              >
                <Upload size={14} />
                <span style={{ fontSize: 9 }}>FOTO</span>
              </div>
            )}
          </button>
          {pfp && (
            <button
              onClick={() => setPfp(null)}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'var(--ui-danger)' }}
              title="Hapus foto"
            >
              <X size={10} className="text-white" />
            </button>
          )}
          <input ref={pfpInputRef} type="file" accept="image/*" className="hidden" onChange={handlePfpUpload} />
        </div>

        {/* Name */}
        <div className="flex-1">
          <label className="section-label">Nama Kontak</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth: Sayang ❤️"
          />
        </div>
      </div>

      {/* Phone OS + Chat Type */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="section-label">Tipe HP</label>
          <select className="select" value={phoneOs} onChange={(e) => setPhoneOs(e.target.value as 'ios' | 'android')}>
            <option value="ios">🍎 iPhone (iOS)</option>
            <option value="android">🤖 Android</option>
          </select>
        </div>
        <div>
          <label className="section-label">Tipe Chat</label>
          <select className="select" value={chatType} onChange={(e) => setChatType(e.target.value as 'personal' | 'group')}>
            <option value="personal">👤 Personal</option>
            <option value="group">👥 Grup</option>
          </select>
        </div>
      </div>

      {/* Group subtitle (only for group) */}
      {chatType === 'group' && (
        <div>
          <label className="section-label">Subtitle Grup</label>
          <input
            className="input"
            value={groupSubtitle}
            onChange={(e) => setGroupSubtitle(e.target.value)}
            placeholder="cth: Kamu, Budi, +3 lainnya"
          />
        </div>
      )}

      {/* Battery */}
      <div>
        <label className="section-label">
          Level Baterai —{' '}
          <span style={{ color: batteryLevel <= 20 ? 'var(--ui-danger)' : 'var(--wa-green)' }}>
            {batteryLevel}%
          </span>
        </label>
        <input
          type="range"
          className="slider"
          min={1}
          max={100}
          value={batteryLevel}
          onChange={(e) => setBatteryLevel(Number(e.target.value))}
        />
      </div>

      {/* Custom time */}
      <div className="flex items-center justify-between">
        <label className="section-label mb-0">Jam Kustom</label>
        <label className="toggle">
          <input type="checkbox" checked={useCustomTime} onChange={(e) => setUseCustomTime(e.target.checked)} />
          <span className="toggle-track" />
          <span className="toggle-thumb" />
        </label>
      </div>
      {useCustomTime && (
        <input
          type="time"
          className="input"
          value={customTime}
          onChange={(e) => setCustomTime(e.target.value)}
        />
      )}

      {/* Header status */}
      <div>
        <label className="section-label">Status Header</label>
        <select
          className="select"
          value={headerStatus}
          onChange={(e) => setHeaderStatus(e.target.value as 'online' | 'typing' | 'custom')}
        >
          <option value="online">🟢 Online</option>
          <option value="typing">⌨️ Mengetik...</option>
          <option value="custom">✏️ Custom</option>
        </select>
        {headerStatus === 'custom' && (
          <input
            className="input mt-2"
            value={headerStatusText}
            onChange={(e) => setHeaderStatusText(e.target.value)}
            placeholder="Teks status kustom..."
          />
        )}
      </div>

      {/* Pinned message */}
      <div>
        <label className="section-label">Pesan Disematkan</label>
        <input
          className="input"
          value={pinnedMessage}
          onChange={(e) => setPinnedMessage(e.target.value)}
          placeholder="Tinggalkan kosong untuk menyembunyikan..."
        />
      </div>

      {/* Unread badge */}
      <div>
        <label className="section-label">Badge Pesan Belum Dibaca</label>
        <input
          type="number"
          className="input"
          min={0}
          max={999}
          value={unreadCount}
          onChange={(e) => setUnreadCount(Number(e.target.value))}
          placeholder="0 = sembunyikan"
        />
      </div>

      {/* Date badge */}
      <div>
        <label className="section-label">Label Tanggal Chat</label>
        <input
          className="input"
          value={dateBadge}
          onChange={(e) => setDateBadge(e.target.value)}
          placeholder="cth: Today / HARI INI / Kemarin (kosong = sembunyikan)"
        />
      </div>
    </div>
  );
}
