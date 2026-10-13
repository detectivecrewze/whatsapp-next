'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ArrowUpDown, GripVertical, ChevronDown, ChevronRight, Clock3, MessageCirclePlus, Play, Volume2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { addMinutesToTime, newId, getCurrentTime, compressImageFile, extractDomain } from '@/lib/utils';
import { Message, MessageType } from '@/types';
import { getSfxDefinition, getSfxVolume, SFX_LIBRARY } from '@/lib/sfx';
import { isVisualMessage } from '@/lib/messageTiming';

const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  text: '💬 Teks',
  link: '🔗 Link / Web',
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
  initiallyOpen = false,
}: {
  message: Message;
  index: number;
  onUpdate: (updates: Partial<Message>) => void;
  onDelete: () => void;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const rowRef = useRef<HTMLDivElement>(null);
  const activeSfx = getSfxDefinition(message.sfxId);
  const holdMs = useEditorStore((state) => state.holdMs);
  const imageHoldMs = useEditorStore((state) => state.imageHoldMs);
  const defaultHoldMs = isVisualMessage(message) ? imageHoldMs : holdMs;

  useEffect(() => {
    if (!initiallyOpen) return;
    const frame = window.requestAnimationFrame(() => {
      rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initiallyOpen]);

  function previewSfx() {
    if (!activeSfx) return;
    const audio = new Audio(`/${activeSfx.file}`);
    audio.volume = getSfxVolume(message.sfxVolume);
    void audio.play().catch(() => {});
  }

  return (
    <div
      ref={rowRef}
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
                message.type === 'link' ? 'rgba(56,189,248,0.2)' :
                message.type === 'image' ? 'rgba(59,130,246,0.2)' :
                message.type === 'transfer' ? 'rgba(34,197,94,0.2)' :
                message.type === 'location' ? 'rgba(239,68,68,0.2)' :
                message.type === 'view_once' ? 'rgba(234,179,8,0.2)' :
                message.type === 'deleted' ? 'rgba(107,114,128,0.2)' : 'rgba(255,255,255,0.06)',
              color:
                message.type === 'notification' ? '#c084fc' :
                message.type === 'link' ? '#38bdf8' :
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

          {activeSfx && (
            <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-violet-500/15 text-violet-300 shrink-0">
              🔊 {activeSfx.label}
            </span>
          )}

          <span className="truncate text-[12px] flex-1" style={{ color: 'var(--wa-text)' }}>
            {message.type === 'notification'
              ? `${message.notifSender || 'Notif'}: ${message.text || 'Pesan Baru'}`
              : message.type === 'link'
              ? `${message.linkTitle || message.linkUrl || message.text || '🔗 Link Web'}`
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

          {/* Link / Web Preview specific inputs */}
          {message.type === 'link' && (
            <div className="flex flex-col gap-2.5 p-2.5 rounded-lg border border-sky-500/25 bg-sky-500/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-sky-400">🔗 Link &amp; Web Rich Preview</span>
                <span className="text-[10px] text-gray-400">Aesthetic WA Card</span>
              </div>

              {/* URL Link */}
              <div>
                <label className="section-label">URL / Tautan Halaman Web</label>
                <input
                  className="input font-mono text-[12px]"
                  value={message.linkUrl ?? message.text ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdate({
                      linkUrl: val,
                      // If title is empty, suggest clean domain
                      linkTitle: message.linkTitle || (val ? extractDomain(val) : ''),
                    });
                  }}
                  placeholder="https://anniv.for-you-always.my.id/c/auto-..."
                />
              </div>

              {/* Title & Description */}
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="section-label">Judul Halaman (Title)</label>
                  <input
                    className="input"
                    value={message.linkTitle ?? ''}
                    onChange={(e) => onUpdate({ linkTitle: e.target.value })}
                    placeholder="cth: Surprises Nadin 🎁 / Spotify / Hadiah Spesial"
                  />
                </div>
                <div>
                  <label className="section-label">Deskripsi / Cuplikan Subtitle</label>
                  <input
                    className="input"
                    value={message.linkDescription ?? ''}
                    onChange={(e) => onUpdate({ linkDescription: e.target.value })}
                    placeholder="cth: Klik untuk membuka pesan rahasia buat kamu..."
                  />
                </div>
              </div>

              {/* Additional Commentary Text (e.g. "guys, kirim satu pesan buat dia yaa...") */}
              <div>
                <label className="section-label">Pesan Tambahan (Komentar di atas Link)</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={message.text?.startsWith('http') ? '' : (message.text ?? message.caption ?? '')}
                  onChange={(e) => onUpdate({ text: e.target.value })}
                  placeholder="cth: guys, kirim satu pesan buat dia yaa. jangan bilang-bilang 🤫"
                />
              </div>

              {/* Banner / Cover Thumbnail */}
              <div className="flex flex-col gap-1.5">
                <label className="section-label">Gambar Banner / Thumbnail (Opsional)</label>
                <input
                  type="file"
                  accept="image/*,image/png,image/jpeg,image/gif,image/webp"
                  className="input text-[11px] p-1"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const compressedDataUrl = await compressImageFile(file);
                      onUpdate({ linkImage: compressedDataUrl, imageData: compressedDataUrl });
                    } catch (err) {
                      console.error('[ImageUpload] Error compressing link image:', err);
                    }
                  }}
                />
                <input
                  className="input text-[11.5px]"
                  value={message.linkImage?.startsWith('data:') ? '' : (message.linkImage ?? message.imageData ?? '')}
                  onChange={(e) => onUpdate({ linkImage: e.target.value, imageData: e.target.value })}
                  placeholder="Atau paste URL Gambar/Banner (https://...)"
                />

                {/* Preview Thumbnail */}
                {(message.linkImage || message.imageData) && (
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden border mt-1" style={{ borderColor: 'var(--ui-border)' }}>
                    <img src={message.linkImage || message.imageData} alt="preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => onUpdate({ linkImage: undefined, imageData: undefined })}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center text-[10px]"
                      title="Hapus banner"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
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

              {message.imageHint && !message.imageData && (
                <div
                  className="rounded-lg border px-3 py-2 text-[10.5px] leading-relaxed"
                  style={{
                    background: 'rgba(59,130,246,0.07)',
                    borderColor: 'rgba(59,130,246,0.24)',
                    color: 'var(--wa-text-muted)',
                  }}
                >
                  <strong style={{ color: '#93c5fd' }}>Saran visual dari AI:</strong>{' '}
                  {message.imageHint}
                </div>
              )}
              
              {/* File upload picker (PNG, JPG, WEBP, GIF supported with auto-compression) */}
              <input
                type="file"
                accept="image/*,image/png,image/jpeg,image/gif,image/webp"
                className="input text-[11px] p-1"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const compressedDataUrl = await compressImageFile(file);
                    onUpdate({ imageData: compressedDataUrl });
                  } catch (err) {
                    console.error('[ImageUpload] Error compressing image:', err);
                  }
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
          <div className="flex flex-col gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 p-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <label className="section-label mb-0 flex items-center gap-1.5 text-violet-300">
                  <Volume2 size={12} /> SFX khusus pesan ini
                </label>
                <p className="mt-1 text-[9.5px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
                  Diputar tepat saat bubble muncul. Terpisah dari bunyi notifikasi WA.
                </p>
              </div>
              <button
                type="button"
                onClick={previewSfx}
                disabled={!activeSfx}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-35"
                style={{ borderColor: 'rgba(196,181,253,0.3)', color: '#c4b5fd' }}
                title="Dengarkan SFX"
              >
                <Play size={12} fill="currentColor" />
              </button>
            </div>

            <select
              className="select text-[11.5px]"
              value={message.sfxId ?? ''}
              onChange={(event) => onUpdate({
                sfxId: (event.target.value || undefined) as Message['sfxId'],
                sfxVolume: event.target.value ? (message.sfxVolume ?? 0.22) : undefined,
              })}
            >
              <option value="">Tanpa SFX khusus</option>
              {(['Horror & tegang', 'Komedi', 'Drama & transisi'] as const).map((category) => (
                <optgroup key={category} label={category}>
                  {SFX_LIBRARY.filter((item) => item.category === category).map((item) => (
                    <option key={item.id} value={item.id}>{item.label} — {item.description}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {activeSfx && (
              <div>
                <div className="mb-1 flex items-center justify-between text-[9.5px]" style={{ color: 'var(--wa-text-muted)' }}>
                  <span>Volume SFX</span>
                  <span className="font-semibold text-violet-300">{Math.round(getSfxVolume(message.sfxVolume) * 100)}%</span>
                </div>
                <input
                  type="range"
                  className="slider w-full"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={getSfxVolume(message.sfxVolume)}
                  onChange={(event) => onUpdate({ sfxVolume: Number(event.target.value) })}
                />
              </div>
            )}
          </div>

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
                placeholder={`Default ${defaultHoldMs / 1000}s`}
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
  const [lastAddedMessageId, setLastAddedMessageId] = useState<string | null>(null);
  const nextMessageTime = messages.length > 0
    ? addMinutesToTime(messages[messages.length - 1]?.time)
    : getCurrentTime();

  function handleAdd() {
    const newMsg: Message = {
      id: newId('msg'),
      type: 'text',
      direction: messages.length % 2 === 0 ? 'incoming' : 'outgoing',
      text: '',
      time: nextMessageTime,
    };
    setLastAddedMessageId(newMsg.id);
    addMessage(newMsg);
  }

  return (
    <div className="flex flex-col gap-2.5 pb-1">
      {/* Compact sequence overview */}
      <div
        className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
        style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold" style={{ color: 'var(--wa-text)' }}>
            {messages.length} pesan dalam urutan
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[9.5px]" style={{ color: 'var(--wa-text-muted)' }}>
            <Clock3 size={10} /> Pesan berikutnya otomatis pukul {nextMessageTime}
          </p>
        </div>
        <button
          className="btn btn-ghost shrink-0"
          onClick={reverseAllDirections}
          title="Balik semua arah pesan In ↔ Out"
        >
          <ArrowUpDown size={13} /> Balik arah
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
            initiallyOpen={msg.id === lastAddedMessageId}
          />
        ))}
      </div>

      {messages.length > 0 && (
        <button
          type="button"
          onClick={handleAdd}
          className="group mt-1 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, rgba(37,211,102,0.13), rgba(37,211,102,0.055))',
            borderColor: 'rgba(37,211,102,0.38)',
            boxShadow: '0 8px 22px rgba(0,0,0,0.12)',
          }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
            style={{ background: 'var(--wa-green)', color: '#06130b' }}
          >
            <MessageCirclePlus size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-[11.5px]" style={{ color: 'var(--wa-text)' }}>Tambah pesan di bawah</strong>
            <span className="mt-0.5 flex items-center gap-1.5 text-[9.5px]" style={{ color: 'var(--wa-text-muted)' }}>
              Pesan #{messages.length + 1}
              <span aria-hidden="true">•</span>
              <Clock3 size={10} /> {nextMessageTime} (+1 menit)
            </span>
          </span>
          <Plus size={17} className="shrink-0 transition-transform group-hover:rotate-90" style={{ color: 'var(--wa-green)' }} />
        </button>
      )}
    </div>
  );
}
