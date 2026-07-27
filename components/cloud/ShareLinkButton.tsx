'use client';

import React, { useState } from 'react';
import { Play, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useCloudStore } from '@/store/useCloudStore';
import { copyToClipboard, newId } from '@/lib/utils';
import Toast from '@/components/ui/Toast';

export default function ShareLinkButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const { saveTemplate } = useCloudStore();

  async function handleOpenPreview() {
    setIsGenerating(true);
    try {
      // 1. Get current editor state
      const state = useEditorStore.getState();
      const presetId = newId('cloud');

      // 2. Prepare CloudPreset payload
      const preset = {
        id: presetId,
        name: `Preview — ${state.name} (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`,
        updatedAt: Date.now(),
        data: {
          name: state.name,
          pfp: state.pfp,
          phoneOs: state.phoneOs,
          chatType: state.chatType,
          groupSubtitle: state.groupSubtitle,
          batteryLevel: state.batteryLevel,
          customTime: state.customTime,
          useCustomTime: state.useCustomTime,
          bgType: state.bgType,
          bgColor: state.bgColor,
          bgImage: state.bgImage,
          messages: state.messages,
          holdMs: state.holdMs,
          replyDelay: state.replyDelay,
          useTyping: state.useTyping,
          useSoundIn: state.useSoundIn,
          useSoundOut: state.useSoundOut,
          autoZoom: state.autoZoom,
          zoomScale: state.zoomScale,
          zoomSpeed: state.zoomSpeed,
          enableTts: state.enableTts,
          ttsProvider: state.ttsProvider,
          elevenKey: state.elevenKey,
          elevenModel: state.elevenModel,
          ttsVoiceIn: state.ttsVoiceIn,
          ttsVoiceOut: state.ttsVoiceOut,
          ttsStability: state.ttsStability,
          ttsStyle: state.ttsStyle,
          ttsSpeed: state.ttsSpeed,
          ttsAudioMap: state.ttsAudioMap,
          headerStatus: state.headerStatus,
          headerStatusText: state.headerStatusText,
          pinnedMessage: state.pinnedMessage,
          unreadCount: state.unreadCount,
        },
      };

      // 3. Save to cloud (or fallback gracefully)
      try {
        await saveTemplate(presetId, preset);
      } catch (err) {
        console.warn('Cloud save failed, proceeding with client preview URL:', err);
      }

      // 4. Generate URL & copy
      const previewUrl = `${window.location.origin}/preview/${presetId}`;
      await copyToClipboard(previewUrl);

      setToastType('success');
      setToastMsg('Link Preview disalin ke clipboard! Membuka player… 🎬');

      // 5. Open preview page in new tab for screen recording
      window.open(previewUrl, '_blank');
    } catch (e) {
      console.error('Error generating preview link:', e);
      setToastType('error');
      setToastMsg('Gagal membuat link preview.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <div className="flex gap-2 w-full">
        <button
          onClick={handleOpenPreview}
          disabled={isGenerating}
          className="btn btn-primary flex-1 py-2.5 text-[13px] font-bold shadow-lg gap-2"
          style={{ background: 'var(--wa-green)', color: '#000' }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Menyiapkan Link…
            </>
          ) : (
            <>
              <Play size={16} fill="black" />
              Buka Preview (Record Video)
            </>
          )}
        </button>
      </div>

      {toastMsg && (
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg(null)}
        />
      )}
    </>
  );
}
