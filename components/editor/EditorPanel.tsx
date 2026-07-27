'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User, MessageSquare, Image, Settings, Volume2, Zap, Cloud, Share2 } from 'lucide-react';
import ContactSection from './ContactSection';
import ChatSequenceSection from './ChatSequenceSection';

// Accordion section wrapper
function Section({
  icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b" style={{ borderColor: 'var(--ui-border)' }}>
      <button
        className="accordion-header w-full"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <span style={{ color: 'var(--wa-green)' }}>{icon}</span>
          <span className="text-[13.5px] font-semibold" style={{ color: 'var(--wa-text)' }}>
            {title}
          </span>
        </div>
        <span style={{ color: 'var(--wa-text-muted)' }}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-2.5">
          {children}
        </div>
      )}
    </div>
  );
}

export default function EditorPanel() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3.5 border-b"
        style={{ borderColor: 'var(--ui-border)', background: 'var(--ui-panel)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--wa-green)' }}
        >
          <MessageSquare size={14} className="text-black" />
        </div>
        <div>
          <h1 className="text-[14px] font-bold" style={{ color: 'var(--wa-text)' }}>
            WA Generator
          </h1>
          <p className="text-[10px]" style={{ color: 'var(--wa-text-muted)' }}>
            Dark Mode Content Creator
          </p>
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 panel-scroll">
        <Section icon={<User size={15} />} title="Profil & Kontak" defaultOpen={true}>
          <ContactSection />
        </Section>

        <Section icon={<MessageSquare size={15} />} title="Urutan Pesan" defaultOpen={true}>
          <ChatSequenceSection />
        </Section>

        <Section icon={<Image size={15} />} title="Wallpaper & Tampilan">
          <WallpaperPlaceholder />
        </Section>

        <Section icon={<Settings size={15} />} title="Opsi Video & Animasi">
          <VideoOptionsPlaceholder />
        </Section>

        <Section icon={<Volume2 size={15} />} title="Voice Over AI (TTS)">
          <TtsPlaceholder />
        </Section>

        <Section icon={<Zap size={15} />} title="Generator Naskah AI">
          <AiPlaceholder />
        </Section>

        <Section icon={<Cloud size={15} />} title="Cloud Preset">
          <CloudPlaceholder />
        </Section>
      </div>

      {/* Bottom actions */}
      <div
        className="flex items-center gap-2 px-3 py-3 border-t"
        style={{ borderColor: 'var(--ui-border)' }}
      >
        <button className="btn btn-primary flex-1 text-[13px] gap-1.5">
          <Share2 size={14} />
          Share Link Preview
        </button>
      </div>
    </div>
  );
}

// ── Placeholder sections (to be replaced in subsequent phases) ──

function WallpaperPlaceholder() {
  return (
    <div className="text-center py-4" style={{ color: 'var(--wa-text-muted)', fontSize: 12 }}>
      🖼 Pengaturan wallpaper — Fase 3
    </div>
  );
}

function VideoOptionsPlaceholder() {
  return (
    <div className="text-center py-4" style={{ color: 'var(--wa-text-muted)', fontSize: 12 }}>
      ⚙️ Opsi video & animasi — Fase 3
    </div>
  );
}

function TtsPlaceholder() {
  return (
    <div className="text-center py-4" style={{ color: 'var(--wa-text-muted)', fontSize: 12 }}>
      🎙️ TTS Voice Over — Fase 5
    </div>
  );
}

function AiPlaceholder() {
  return (
    <div className="text-center py-4" style={{ color: 'var(--wa-text-muted)', fontSize: 12 }}>
      🤖 AI Script Generator — Fase 4
    </div>
  );
}

function CloudPlaceholder() {
  return (
    <div className="text-center py-4" style={{ color: 'var(--wa-text-muted)', fontSize: 12 }}>
      ☁️ Cloud Preset Manager — Fase 6
    </div>
  );
}
