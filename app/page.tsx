'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PenLine, Smartphone } from 'lucide-react';

// Dynamically import to avoid SSR issues with Zustand/DOM APIs
const WhatsAppCanvas = dynamic(() => import('@/components/canvas/WhatsAppCanvas'), { ssr: false });
const EditorPanel = dynamic(() => import('@/components/editor/EditorPanel'), { ssr: false });
const StudioPlayerControl = dynamic(() => import('@/components/canvas/StudioPlayerControl'), { ssr: false });

type MobileTab = 'editor' | 'preview';

export default function EditorPage() {
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          DESKTOP LAYOUT (md and above) — two-column side by side
          ═══════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex h-screen overflow-hidden" style={{ background: 'var(--ui-bg)' }}>
        {/* Left panel — editor controls */}
        <div
          className="w-[360px] shrink-0 flex flex-col border-r panel-scroll z-10"
          style={{ borderColor: 'var(--ui-border)', background: 'var(--ui-panel)' }}
        >
          <EditorPanel />
        </div>

        {/* Right panel — live canvas + studio control */}
        <div
          className="flex-1 flex flex-col items-center justify-between p-4 relative overflow-hidden"
          style={{ background: 'var(--ui-bg)' }}
        >
          <div className="flex-1 w-full flex items-center justify-center min-h-0 relative">
            <WhatsAppCanvas />
          </div>
          <div className="pt-2 shrink-0 z-30">
            <StudioPlayerControl />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE LAYOUT (below md) — tab-based single column
          ═══════════════════════════════════════════════════════════ */}
      <div
        className="flex md:hidden flex-col overflow-hidden"
        style={{ height: '100dvh', background: 'var(--ui-bg)' }}
      >
        {/* Tab content area — fills remaining space */}
        <div className="flex-1 overflow-hidden relative">

          {/* Editor Tab */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden transition-opacity duration-200"
            style={{ opacity: mobileTab === 'editor' ? 1 : 0, pointerEvents: mobileTab === 'editor' ? 'auto' : 'none' }}
          >
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden panel-scroll"
              style={{ background: 'var(--ui-panel)' }}
            >
              <EditorPanel />
            </div>
          </div>

          {/* Preview Tab */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden transition-opacity duration-200"
            style={{ opacity: mobileTab === 'preview' ? 1 : 0, pointerEvents: mobileTab === 'preview' ? 'auto' : 'none' }}
          >
            <div
              className="flex-1 flex flex-col items-center justify-between pb-2 pt-2 px-2 relative overflow-hidden"
              style={{ background: 'var(--ui-bg)' }}
            >
              <div className="flex-1 w-full flex items-center justify-center min-h-0 relative">
                <WhatsAppCanvas />
              </div>
              <div className="pt-2 shrink-0 z-30 w-full flex justify-center">
                <StudioPlayerControl />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tab Bar */}
        <div
          className="shrink-0 flex border-t safe-area-bottom"
          style={{
            borderColor: 'var(--ui-border)',
            background: 'var(--ui-panel)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <button
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
            style={{
              color: mobileTab === 'editor' ? 'var(--wa-green)' : 'var(--wa-text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => setMobileTab('editor')}
          >
            {/* Active indicator line */}
            <div
              style={{
                height: 2,
                width: 28,
                borderRadius: 2,
                background: mobileTab === 'editor' ? 'var(--wa-green)' : 'transparent',
                marginBottom: 4,
                transition: 'background 0.2s',
              }}
            />
            <PenLine size={20} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>EDITOR</span>
          </button>

          <button
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
            style={{
              color: mobileTab === 'preview' ? 'var(--wa-green)' : 'var(--wa-text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => setMobileTab('preview')}
          >
            <div
              style={{
                height: 2,
                width: 28,
                borderRadius: 2,
                background: mobileTab === 'preview' ? 'var(--wa-green)' : 'transparent',
                marginBottom: 4,
                transition: 'background 0.2s',
              }}
            />
            <Smartphone size={20} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>PREVIEW</span>
          </button>
        </div>
      </div>
    </>
  );
}
