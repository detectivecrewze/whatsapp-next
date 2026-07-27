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
          <span className="truncate text-[12px]" style={{ color: 'var(--wa-text)' }}>
            {message.text || MESSAGE_TYPE_LABELS[message.type]}
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

          {/* Image upload */}
          {['image', 'view_once'].includes(message.type) && (
            <div>
              <label className="section-label">Upload Gambar</label>
              <input
                type="file"
                accept="image/*,image/gif"
                className="input text-[12px] p-1.5"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => onUpdate({ imageData: ev.target?.result as string });
                  reader.readAsDataURL(file);
                }}
              />
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

          {/* Group sender name */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="section-label">Waktu</label>
              <input
                className="input"
                type="time"
                value={message.time ?? getCurrentTime()}
                onChange={(e) => onUpdate({ time: e.target.value })}
              />
            </div>
            <div>
              <label className="section-label">Hold (ms)</label>
              <input
                className="input"
                type="number"
                min={500}
                max={10000}
                step={100}
                value={message.customHoldMs ?? ''}
                onChange={(e) =>
                  onUpdate({ customHoldMs: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="Default"
              />
            </div>
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
