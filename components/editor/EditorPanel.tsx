'use client';

import React from 'react';
import {
  Cloud,
  Eye,
  Film,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  User,
  Volume2,
  Zap,
  ZoomIn,
  type LucideIcon,
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
import VideoExportButton from '@/components/video/VideoExportButton';

export type EditorSectionId =
  | 'contact'
  | 'messages'
  | 'ai-script'
  | 'voice-over'
  | 'wallpaper'
  | 'video-options'
  | 'auto-zoom'
  | 'cloud-presets'
  | 'preview-share'
  | 'export-video';

export type EditorSectionMeta = {
  id: EditorSectionId;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
};

export const EDITOR_SECTIONS: Record<EditorSectionId, EditorSectionMeta> = {
  contact: {
    id: 'contact',
    title: 'Profil & Kontak',
    shortTitle: 'Profil kontak',
    description: 'Identitas kontak, status header, jam, dan detail tampilan percakapan.',
    icon: User,
  },
  messages: {
    id: 'messages',
    title: 'Urutan Pesan',
    shortTitle: 'Urutan pesan',
    description: 'Tambah, edit, urutkan, dan atur timing setiap pesan.',
    icon: MessageSquare,
  },
  'ai-script': {
    id: 'ai-script',
    title: 'AI Naskah Generator',
    shortTitle: 'Generator naskah',
    description: 'Buat drama dengan product reveal atau horror chat melalui alur yang fokus.',
    icon: Zap,
  },
  'voice-over': {
    id: 'voice-over',
    title: 'Voice Over AI',
    shortTitle: 'Voice generator',
    description: 'Ubah bubble chat menjadi suara untuk preview dan video MP4.',
    icon: Volume2,
  },
  wallpaper: {
    id: 'wallpaper',
    title: 'Wallpaper & Tema',
    shortTitle: 'Wallpaper',
    description: 'Atur warna atau gambar latar belakang chat.',
    icon: ImageIcon,
  },
  'video-options': {
    id: 'video-options',
    title: 'Video & Animasi',
    shortTitle: 'Video & animasi',
    description: 'Atur tempo pesan, efek typing, dan suara notifikasi.',
    icon: Settings,
  },
  'auto-zoom': {
    id: 'auto-zoom',
    title: 'Auto Zoom Global',
    shortTitle: 'Auto zoom',
    description: 'Atur zoom otomatis untuk seluruh pesan, dengan override per-pesan.',
    icon: ZoomIn,
  },
  'cloud-presets': {
    id: 'cloud-presets',
    title: 'Cloud Preset',
    shortTitle: 'Preset tersimpan',
    description: 'Simpan dan muat kembali proyek tanpa membangun ulang dari awal.',
    icon: Cloud,
  },
  'preview-share': {
    id: 'preview-share',
    title: 'Preview & Bagikan',
    shortTitle: 'Preview & share',
    description: 'Buka preview lokal atau bagikan versi yang tersimpan di cloud.',
    icon: Eye,
  },
  'export-video': {
    id: 'export-video',
    title: 'Export Video',
    shortTitle: 'Render MP4',
    description: 'Render video vertikal HD 1080×1920 lengkap dengan audio.',
    icon: Film,
  },
};

function ExportSummary() {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-xl border p-3"
        style={{ background: 'var(--ui-card)', borderColor: 'var(--ui-border)' }}
      >
        <p className="text-[12.5px] font-semibold" style={{ color: 'var(--wa-text)' }}>
          Siap untuk TikTok & Reels
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]" style={{ color: 'var(--wa-text-muted)' }}>
          <span>Resolusi</span><strong className="text-right font-medium" style={{ color: 'var(--wa-text)' }}>1080 × 1920</strong>
          <span>Format</span><strong className="text-right font-medium" style={{ color: 'var(--wa-text)' }}>MP4 · H.264</strong>
          <span>Audio</span><strong className="text-right font-medium" style={{ color: 'var(--wa-text)' }}>AAC</strong>
          <span>Rasio</span><strong className="text-right font-medium" style={{ color: 'var(--wa-text)' }}>9:16</strong>
        </div>
      </div>
      <VideoExportButton />
    </div>
  );
}

function SectionContent({ section }: { section: EditorSectionId }) {
  switch (section) {
    case 'contact':
      return <ContactSection />;
    case 'messages':
      return <ChatSequenceSection />;
    case 'ai-script':
      return <AiGeneratorSection />;
    case 'voice-over':
      return <TtsSection />;
    case 'wallpaper':
      return <WallpaperSection />;
    case 'video-options':
      return <VideoOptionsSection />;
    case 'auto-zoom':
      return <ZoomSection />;
    case 'cloud-presets':
      return <CloudSection />;
    case 'preview-share':
      return <ShareLinkButton />;
    case 'export-video':
      return <ExportSummary />;
  }
}

export default function EditorPanel({ activeSection = 'messages' }: { activeSection?: EditorSectionId }) {
  const meta = EDITOR_SECTIONS[activeSection];
  const Icon = meta.icon;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header
        className="shrink-0 border-b px-4 py-4"
        style={{ borderColor: 'var(--ui-border)', background: 'var(--ui-panel)' }}
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(37,211,102,0.12)', color: 'var(--wa-green)' }}
          >
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--wa-text)' }}>
              {meta.title}
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
              {meta.description}
            </p>
          </div>
        </div>
      </header>

      <div className="panel-scroll flex-1 px-4 py-4">
        <SectionContent section={activeSection} />
      </div>
    </div>
  );
}
