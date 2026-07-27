'use client';

import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with Zustand/DOM APIs
const WhatsAppCanvas = dynamic(() => import('@/components/canvas/WhatsAppCanvas'), { ssr: false });
const EditorPanel = dynamic(() => import('@/components/editor/EditorPanel'), { ssr: false });

export default function EditorPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--ui-bg)' }}>
      {/* Left panel — editor controls */}
      <div
        className="w-[360px] shrink-0 flex flex-col border-r panel-scroll"
        style={{ borderColor: 'var(--ui-border)', background: 'var(--ui-panel)' }}
      >
        <EditorPanel />
      </div>

      {/* Right panel — live canvas preview */}
      <div className="flex-1 flex items-center justify-center p-4" style={{ background: 'var(--ui-bg)' }}>
        <WhatsAppCanvas />
      </div>
    </div>
  );
}
