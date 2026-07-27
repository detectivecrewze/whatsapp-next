'use client';

import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with Zustand/DOM APIs
const WhatsAppCanvas = dynamic(() => import('@/components/canvas/WhatsAppCanvas'), { ssr: false });
const EditorPanel = dynamic(() => import('@/components/editor/EditorPanel'), { ssr: false });
const StudioPlayerControl = dynamic(() => import('@/components/canvas/StudioPlayerControl'), { ssr: false });

export default function EditorPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--ui-bg)' }}>
      {/* Left panel — editor controls */}
      <div
        className="w-[360px] shrink-0 flex flex-col border-r panel-scroll z-10"
        style={{ borderColor: 'var(--ui-border)', background: 'var(--ui-panel)' }}
      >
        <EditorPanel />
      </div>

      {/* Right panel — live canvas preview + studio player controller */}
      <div
        className="flex-1 flex flex-col items-center justify-between p-4 relative overflow-hidden"
        style={{ background: 'var(--ui-bg)' }}
      >
        {/* Phone canvas preview area */}
        <div className="flex-1 w-full flex items-center justify-center min-h-0 relative">
          <WhatsAppCanvas />
        </div>

        {/* Floating Studio Player Control Bar at bottom */}
        <div className="pt-2 shrink-0 z-30">
          <StudioPlayerControl />
        </div>
      </div>
    </div>
  );
}
