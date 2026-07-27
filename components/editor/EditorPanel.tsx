'use client';

import React, { useState } from 'react';
import {
  ChevronDown, ChevronUp,
  User, MessageSquare, Image as ImageIcon,
  Settings, Volume2, Zap, Cloud, ZoomIn,
} from 'lucide-react';
import ContactSection from './ContactSection';
import ChatSequenceSection from './ChatSequenceSection';
import WallpaperSection from './WallpaperSection';
import VideoOptionsSection from './VideoOptionsSection';
import ZoomSection from './ZoomSection';
import TtsSection from './TtsSection';
import AiGeneratorSection from './AiGeneratorSection';
import CloudSection from '@/components/cloud/CloudSection';
import ShareLinkButton from '@/components/cloud/ShareLinkButton';

// ─── Accordion section wrapper ────────────────────────────────────────────────
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

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function EditorPanel() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3.5 border-b shrink-0"
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

      {/* Scrollable accordion sections */}
      <div className="flex-1 panel-scroll">
        <Section icon={<User size={15} />} title="Profil & Kontak" defaultOpen>
          <ContactSection />
        </Section>

        <Section icon={<MessageSquare size={15} />} title="Urutan Pesan" defaultOpen>
          <ChatSequenceSection />
        </Section>

        <Section icon={<ImageIcon size={15} />} title="Wallpaper & Tampilan">
          <WallpaperSection />
        </Section>

        <Section icon={<Settings size={15} />} title="Opsi Video & Animasi">
          <VideoOptionsSection />
        </Section>

        <Section icon={<ZoomIn size={15} />} title="Auto Zoom">
          <ZoomSection />
        </Section>

        <Section icon={<Zap size={15} />} title="🤖 Generator Naskah AI">
          <AiGeneratorSection />
        </Section>

        <Section icon={<Volume2 size={15} />} title="🎙️ Voice Over AI (TTS)">
          <TtsSection />
        </Section>

        <Section icon={<Cloud size={15} />} title="☁️ Cloud Preset">
          <CloudSection />
        </Section>
      </div>

      {/* Bottom: preview/record button */}
      <div
        className="px-3 py-3 border-t shrink-0"
        style={{ borderColor: 'var(--ui-border)', background: 'var(--ui-panel)' }}
      >
        <ShareLinkButton />
      </div>
    </div>
  );
}
