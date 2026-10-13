'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ChevronRight,
  Cloud,
  Eye,
  Film,
  Image as ImageIcon,
  MessageSquare,
  PenLine,
  Smartphone,
  Volume2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import {
  EDITOR_SECTIONS,
  type EditorSectionId,
} from '@/components/editor/EditorPanel';
import styles from './studio.module.css';

const WhatsAppCanvas = dynamic(() => import('@/components/canvas/WhatsAppCanvas'), { ssr: false });
const EditorPanel = dynamic(() => import('@/components/editor/EditorPanel'), { ssr: false });
const StudioPlayerControl = dynamic(() => import('@/components/canvas/StudioPlayerControl'), { ssr: false });

type WorkspaceId = 'chat' | 'ai' | 'voice' | 'visual' | 'project' | 'export';
type MobileView = 'editor' | 'preview';

type Workspace = {
  id: WorkspaceId;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  sections: EditorSectionId[];
};

const WORKSPACES: Workspace[] = [
  {
    id: 'chat',
    label: 'Chat',
    title: 'Percakapan',
    description: 'Profil kontak dan seluruh isi chat.',
    icon: MessageSquare,
    sections: ['contact', 'messages'],
  },
  {
    id: 'ai',
    label: 'AI Naskah',
    title: 'AI Naskah',
    description: 'Buat dan poles alur percakapan.',
    icon: Zap,
    sections: ['ai-script'],
  },
  {
    id: 'voice',
    label: 'Voice',
    title: 'Voice Over',
    description: 'Kelola voice dan musik latar.',
    icon: Volume2,
    sections: ['voice-over', 'background-music'],
  },
  {
    id: 'visual',
    label: 'Visual',
    title: 'Visual & Gerakan',
    description: 'Tampilan chat dan animasi video.',
    icon: ImageIcon,
    sections: ['wallpaper', 'video-options', 'auto-zoom'],
  },
  {
    id: 'project',
    label: 'Project',
    title: 'Project',
    description: 'Preset, preview, dan tautan berbagi.',
    icon: Cloud,
    sections: ['cloud-presets', 'preview-share'],
  },
  {
    id: 'export',
    label: 'Export',
    title: 'Export Video',
    description: 'Pengecekan akhir dan render MP4.',
    icon: Film,
    sections: ['export-video'],
  },
];

function findWorkspace(section: EditorSectionId) {
  return WORKSPACES.find((workspace) => workspace.sections.includes(section)) ?? WORKSPACES[0];
}

export default function EditorPage() {
  const [activeSection, setActiveSection] = useState<EditorSectionId>('messages');
  const [mobileView, setMobileView] = useState<MobileView>('editor');
  const name = useEditorStore((state) => state.name);
  const messageCount = useEditorStore((state) => state.messages.length);
  const activeWorkspace = useMemo(() => findWorkspace(activeSection), [activeSection]);

  function selectWorkspace(workspace: Workspace) {
    setActiveSection(workspace.sections[0]);
    setMobileView('editor');
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}><MessageSquare size={17} /></span>
          <span className={styles.brandCopy}>
            <strong>WA Story Studio</strong>
            <small>Local Creator</small>
          </span>
        </div>

        <div className={styles.projectTitle}>
          <strong>{name || 'Proyek tanpa judul'}</strong>
          <span>•</span>
          <span>{messageCount} pesan</span>
          <span className={styles.savedState}>Tersimpan otomatis</span>
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.previewShortcut}
            onClick={() => setMobileView('preview')}
          >
            <Eye size={15} />
            <span>Preview</span>
          </button>
          <button
            type="button"
            className={styles.exportShortcut}
            onClick={() => {
              setActiveSection('export-video');
              setMobileView('editor');
            }}
          >
            <Film size={15} />
            Export MP4
          </button>
        </div>
      </header>

      <div className={styles.workspace}>
        <nav className={styles.rail} aria-label="Workspace studio">
          {WORKSPACES.map((workspace) => {
            const Icon = workspace.icon;
            const active = activeWorkspace.id === workspace.id;
            return (
              <button
                key={workspace.id}
                type="button"
                className={`${styles.railButton} ${active ? styles.railButtonActive : ''}`}
                onClick={() => selectWorkspace(workspace)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} />
                <span>{workspace.label}</span>
              </button>
            );
          })}
        </nav>

        <aside className={styles.contextPanel}>
          <div className={styles.contextHeader}>
            <span className={styles.eyebrow}>Workspace</span>
            <h1>{activeWorkspace.title}</h1>
            <p>{activeWorkspace.description}</p>
          </div>

          <div
            className={`${styles.contextList} ${
              activeWorkspace.sections.length >= 3 ? styles.contextListDense : ''
            }`}
          >
            {activeWorkspace.sections.map((sectionId) => {
              const section = EDITOR_SECTIONS[sectionId];
              const Icon = section.icon;
              const active = activeSection === sectionId;
              return (
                <button
                  key={sectionId}
                  type="button"
                  className={`${styles.contextButton} ${active ? styles.contextButtonActive : ''}`}
                  onClick={() => {
                    setActiveSection(sectionId);
                    setMobileView('editor');
                  }}
                >
                  <span className={styles.contextIcon}><Icon size={16} /></span>
                  <span className={styles.contextButtonCopy}>
                    <strong>{section.shortTitle}</strong>
                    <small>{section.description}</small>
                  </span>
                  <ChevronRight size={14} className={styles.contextChevron} />
                </button>
              );
            })}
          </div>

          <div className={styles.contextHint}>
            <span className={styles.hintDot} />
            Perubahan langsung terlihat di preview.
          </div>
        </aside>

        <section className={`${styles.previewArea} ${mobileView === 'preview' ? styles.mobileVisible : styles.mobileHidden}`}>
          <div className={styles.previewToolbar}>
            <div>
              <strong>Live Preview</strong>
              <span>WhatsApp Story</span>
            </div>
            <div className={styles.previewBadges}>
              <span>9:16</span>
              <span>1080p</span>
            </div>
          </div>
          <div className={styles.canvasStage}>
            <WhatsAppCanvas />
          </div>
          <div className={styles.playerDock}>
            <StudioPlayerControl />
          </div>
        </section>

        <aside className={`${styles.inspector} ${mobileView === 'editor' ? styles.mobileVisible : styles.mobileHidden}`}>
          <EditorPanel activeSection={activeSection} />
        </aside>
      </div>

      <nav className={styles.mobileTabs} aria-label="Tampilan mobile">
        <button
          type="button"
          className={mobileView === 'editor' ? styles.mobileTabActive : ''}
          onClick={() => setMobileView('editor')}
        >
          <PenLine size={19} />
          Editor
        </button>
        <button
          type="button"
          className={mobileView === 'preview' ? styles.mobileTabActive : ''}
          onClick={() => setMobileView('preview')}
        >
          <Smartphone size={19} />
          Preview
        </button>
      </nav>
    </main>
  );
}
