'use client';

import React, { useState } from 'react';
import { Plus, Trash2, ArrowUpDown, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { newId, getCurrentTime } from '@/lib/utils';
import { Message, MessageType } from '@/types';

const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  text: '💬 Teks',
  image: '🖼️ Gambar',
  view_once: '👁️ View Once',
  voice_note: '🎤 Voice Note',
  notification: '🔔 Notifikasi',
  transfer: '💸 Transfer',
  contact: '📱 Kontak',
  location: '📍 Lokasi',
  deleted: '🗑️ Dihapus',
};

function MessageRow({
  message,
  index,
  onUpdate,
  onDelete,
}: {
  message: Message;
  index: number;
  onUpdate: (updates: Partial<Message>) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--ui-border)', background: 'var(--ui-card)' }}
    >
      {/* Row header */}
      <div className="flex items-center gap-2 px-2.5 py-2">
        {/* Drag handle (visual only) */}
        <GripVertical size={14} style={{ color: 'var(--wa-text-muted)', flexShrink: 0, cursor: 'grab' }} />

        {/* Expand toggle */}
        <button
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
          onClick={() => setOpen(!open)}
        >
          <span style={{ fontSize: 11, color: 'var(--wa-text-muted)', flexShrink: 0 }}>#{index + 1}</span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0"
            style={{
              background: message.direction === 'outgoing' ? 'rgba(37,211,102,0.15)' : 'rgba(134,150,160,0.15)',
              color: message.direction === 'outgoing' ? 'var(--wa-green)' : 'var(--wa-text-muted)',
            }}
          >
            {message.direction === 'outgoing' ? 'OUT' : 'IN'}
          </span>

          {/* Type Badge */}
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 flex items-center gap-1"
            style={{
              background:
                message.type === 'notification' ? 'rgba(168,85,247,0.2)' :
                message.type === 'image' ? 'rgba(59,130,246,0.2)' :
                message.type === 'transfer' ? 'rgba(34,197,94,0.2)' :
                message.type === 'location' ? 'rgba(239,68,68,0.2)' :
                message.type === 'view_once' ? 'rgba(234,179,8,0.2)' :
                message.type === 'deleted' ? 'rgba(107,114,128,0.2)' : 'rgba(255,255,255,0.06)',
              color:
                message.type === 'notification' ? '#c084fc' :
                message.type === 'image' ? '#60a5fa' :
                message.type === 'transfer' ? '#4ade80' :
                message.type === 'location' ? '#f87171' :
                message.type === 'view_once' ? '#facc15' :
                message.type === 'deleted' ? '#9ca3af' : 'var(--wa-text-muted)',
            }}
          >
            {MESSAGE_TYPE_LABELS[message.type]}
          </span>

          {/* Zoom Badge if enabled */}
          {message.enableZoom && (
            <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 shrink-0">
              🔍 {message.customScale ? `${message.customScale}x` : 'Zoom'}
            </span>
          )}

          <span className="truncate text-[12px] flex-1" style={{ color: 'var(--wa-text)' }}>
            {message.type === 'notification'
              ? `${message.notifSender || 'Notif'}: ${message.text || 'Pesan Baru'}`
              : message.text || MESSAGE_TYPE_LABELS[message.type]}
          </span>
          {open ? <ChevronDown size={12} style={{ color: 'var(--wa-text-muted)', flexShrink: 0 }} /> : <ChevronRight size={12} style={{ color: 'var(--wa-text-muted)', flexShrink: 0 }} />}
        </button>

        {/* Delete */}
        <button className="btn-icon" onClick={onDelete} title="Hapus pesan">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Expanded editor */}
      {open && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-2.5 border-t" style={{ borderColor: 'var(--ui-border)' }}>
          {/* Type + Direction */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="section-label">Tipe Pesan</label>
              <select
                className="select"
                value={message.type}
                onChange={(e) => onUpdate({ type: e.target.value as MessageType })}
              >
                {Object.entries(MESSAGE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="section-label">Arah</label>
              <select
                className="select"
                value={message.direction}
                onChange={(e) => onUpdate({ direction: e.target.value as 'incoming' | 'outgoing' })}
              >
                <option value="incoming">← Masuk</option>
                <option value="outgoing">→ Keluar</option>
              </select>
            </div>
          </div>

          {/* Text (for text, notification, transfer, contact, location) */}
          {['text', 'notification', 'transfer', 'contact', 'location', 'deleted'].includes(message.type) && (
            <div>
              <label className="section-label">
                {message.type === 'transfer' ? 'Nominal' : message.type === 'location' ? 'Nama Lokasi' : 'Teks'}
              </label>
              <textarea
                className="input resize-none"
                rows={2}
                value={message.text ?? ''}
                onChange={(e) => onUpdate({ text: e.target.value })}
                placeholder={
                  message.type === 'transfer' ? 'cth: Rp 500.000' :
                  message.type === 'location' ? 'cth: Grand Indonesia' :
                  message.type === 'contact' ? 'Nama kontak...' :
                  'Ketik pesan...'
                }
              />
            </div>
          )}

          {/* Caption (for image, location, contact, transfer) */}
          {['image', 'location', 'contact', 'transfer'].includes(message.type) && (
            <div>
              <label className="section-label">Caption / Keterangan</label>
              <input
                className="input"
                value={message.caption ?? ''}
                onChange={(e) => onUpdate({ caption: e.target.value })}
                placeholder="Caption opsional..."
              />
            </div>
          )}

          {/* Image / GIF upload & URL */}
          {['image', 'view_once'].includes(message.type) && (
            <div className="flex flex-col gap-2">
              <label className="section-label">Gambar / GIF</label>
              
              {/* File upload picker */}
              <input
                type="file"
                accept="image/*,image/gif"
                className="input text-[11px] p-1"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => onUpdate({ imageData: ev.target?.result as string });
                  reader.readAsDataURL(file);
                }}
              />

              {/* Or paste Image/GIF URL */}
              <input
                className="input text-[11.5px]"
                value={message.imageData?.startsWith('data:') ? '' : message.imageData ?? ''}
                onChange={(e) => onUpdate({ imageData: e.target.value })}
                placeholder="Atau paste URL Gambar/GIF (http...)"
              />

              {/* Thumbnail preview if present */}
              {message.imageData && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border mt-1" style={{ borderColor: 'var(--ui-border)' }}>
                  <img src={message.imageData} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => onUpdate({ imageData: undefined })}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center text-[10px]"
                    title="Hapus gambar"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notification extra fields */}
          {message.type === 'notification' && (
            <div className="flex flex-col gap-2 p-2 rounded border border-purple-500/20 bg-purple-500/5">
              <span className="text-[11px] font-semibold text-purple-400">🔔 Push Notification Popup HP</span>
              <div>
                <label className="section-label">Pengirim Notifikasi</label>
                <input
                  className="input"
                  value={message.notifSender ?? message.senderName ?? 'WhatsApp'}
                  onChange={(e) => onUpdate({ notifSender: e.target.value })}
                  placeholder="cth: WhatsApp / Mama / Bank BCA"
                />
              </div>
              <div>
                <label className="section-label">Judul Notifikasi</label>
                <input
                  className="input"
                  value={message.notifTitle ?? 'Pesan Baru'}
                  onChange={(e) => onUpdate({ notifTitle: e.target.value })}
                  placeholder="cth: 💬 Pesan Baru"
                />
              </div>
            </div>
          )}

          {/* Voice note duration */}
          {message.type === 'voice_note' && (
            <div>
              <label className="section-label">Durasi Voice Note</label>
              <input
                className="input"
                value={message.duration ?? '0:12'}
                onChange={(e) => onUpdate({ duration: e.target.value })}
                placeholder="cth: 0:30"
              />
            </div>
          )}

          {/* Waktu & Hold Duration */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="section-label">Waktu Pesan</label>
              <input
                className="input"
                type="time"
                value={message.time ?? getCurrentTime()}
                onChange={(e) => onUpdate({ time: e.target.value })}
              />
            </div>
            <div>
              <label className="section-label">Hold Tampil (Detik)</label>
              <input
                className="input"
                type="number"
                min={0.5}
                max={30}
                step={0.1}
                value={message.customHoldMs ? message.customHoldMs / 1000 : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdate({ customHoldMs: val ? Math.round(Number(val) * 1000) : undefined });
                }}
                placeholder={message.type === 'notification' ? 'Default 4.5s' : 'Default 2.5s'}
              />
            </div>
          </div>

          {/* Zoom Kamera Custom */}
          <div className="flex flex-col gap-1.5 p-2 rounded border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center justify-between">
              <label className="section-label text-amber-400 font-semibold mb-0">🔍 Zoom Kamera Khusus Pesan Ini</label>
              {message.enableZoom && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                  {message.customScale ? `${message.customScale}x` : 'Standard'}
                </span>
              )}
            </div>
            <select
              className="select text-[11.5px]"
              value={!message.enableZoom ? 'off' : String(message.customScale || '1.3')}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'off') {
                  onUpdate({ enableZoom: false, customScale: undefined });
                } else {
                  onUpdate({ enableZoom: true, customScale: Number(val) });
                }
              }}
            >
              <option value="off">OFF (Ikuti Auto Zoom Global)</option>
              <option value="1.15">1.15x (Soft Zoom)</option>
              <option value="1.3">1.30x (Standard Focus)</option>
              <option value="1.5">1.50x (Drama Focus)</option>
              <option value="1.8">1.80x (Close-Up)</option>
              <option value="2.2">2.20x (Extreme Focus)</option>
            </select>
          </div>

          {/* Group sender name */}
          {message.direction === 'incoming' && (
            <div>
              <label className="section-label">Nama Pengirim (Grup)</label>
              <input
                className="input"
                value={message.senderName ?? ''}
                onChange={(e) => onUpdate({ senderName: e.target.value || undefined })}
                placeholder="Kosong = sembunyikan..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatSequenceSection() {
  const { messages, addMessage, updateMessage, deleteMessage, reverseAllDirections } = useEditorStore();

  function handleAdd() {
    const newMsg: Message = {
      id: newId('msg'),
      type: 'text',
      direction: messages.length % 2 === 0 ? 'incoming' : 'outgoing',
      text: '',
      time: getCurrentTime(),
    };
    addMessage(newMsg);
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Actions */}
      <div className="flex gap-2">
        <button className="btn btn-primary flex-1" onClick={handleAdd}>
          <Plus size={14} /> Tambah Pesan
        </button>
        <button
          className="btn btn-ghost"
          onClick={reverseAllDirections}
          title="Balik semua arah pesan In ↔ Out"
        >
          <ArrowUpDown size={13} />
        </button>
      </div>

      {/* Message list */}
      <div className="flex flex-col gap-1.5">
        {messages.length === 0 && (
          <div
            className="text-center py-6 rounded-lg border border-dashed"
            style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)', fontSize: 12 }}
          >
            Belum ada pesan.{' '}
            <button onClick={handleAdd} style={{ color: 'var(--wa-green)' }}>
              Tambah pesan pertama
            </button>
          </div>
        )}
        {messages.map((msg, idx) => (
          <MessageRow
            key={msg.id}
            message={msg}
            index={idx}
            onUpdate={(updates) => updateMessage(msg.id, updates)}
            onDelete={() => deleteMessage(msg.id)}
          />
        ))}
      </div>
    </div>
  );
}
