'use client';

import React, { useState } from 'react';
import { Play, Eye, Plus, Loader2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useCloudStore } from '@/store/useCloudStore';
import { newId } from '@/lib/utils';
import Toast from '@/components/ui/Toast';

const LOCAL_PREVIEW_KEY = 'wa_local_preview';

export default function ShareLinkButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const { saveTemplate } = useCloudStore();

  // ── Collect current editor state for export ─────────────────────────────────
  function collectState() {
    const state = useEditorStore.getState();
    return {
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
    };
  }

  // ── Preview locally (no cloud upload) ───────────────────────────────────────
  async function handleLocalPreview() {
    setIsPreviewing(true);
    try {
      const data = collectState();
      // Save to sessionStorage so preview page can read it
      sessionStorage.setItem(LOCAL_PREVIEW_KEY, JSON.stringify(data));
      window.open(`${window.location.origin}/preview/local`, '_blank');
    } catch (e) {
      console.error('Local preview error:', e);
      setToastType('error');
      setToastMsg('Gagal membuka preview lokal.');
    } finally {
      setIsPreviewing(false);
    }
  }

  // ── Save to cloud + open preview (screen record) ────────────────────────────
  async function handleOpenPreview() {
    setIsGenerating(true);
    try {
      const state = useEditorStore.getState();
      const presetId = newId('cloud');
      const data = collectState();

      const preset = {
        id: presetId,
        name: `Preview — ${state.name} (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`,
        updatedAt: Date.now(),
        data,
      };

      try {
        await saveTemplate(presetId, preset);
      } catch (err) {
        console.warn('Cloud save failed, proceeding with client preview URL:', err);
      }

      const previewUrl = `${window.location.origin}/preview/${presetId}`;

      setToastType('success');
      setToastMsg('Preview disimpan ke cloud! Membuka tab baru… 🎬');
      window.open(previewUrl, '_blank');
    } catch (e) {
      console.error('Error generating preview link:', e);
      setToastType('error');
      setToastMsg('Gagal membuat link preview.');
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Blank / Reset state ─────────────────────────────────────────────────────
  function handleBlankNew() {
    if (window.confirm('Buat canvas baru? Semua pesan & pengaturan saat ini akan dihapus.')) {
      useEditorStore.getState().resetToDefault();
      setToastType('success');
      setToastMsg('✅ Canvas baru (blank) berhasil dibuat!');
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        {/* Row 1: Blank Baru + Preview Lokal */}
        <div className="flex gap-2">
          {/* Blank Baru */}
          <button
            onClick={handleBlankNew}
            className="btn flex-1 py-2 text-[12px] font-semibold gap-1.5"
            style={{
              background: 'var(--ui-card)',
              color: 'var(--wa-text)',
              border: '1px solid var(--ui-border)',
            }}
            title="Reset ke canvas kosong"
          >
            <Plus size={13} />
            Blank Baru
          </button>

          {/* Preview Lokal (tanpa cloud) */}
          <button
            onClick={handleLocalPreview}
            disabled={isPreviewing}
            className="btn flex-1 py-2 text-[12px] font-semibold gap-1.5"
            style={{
              background: 'rgba(37,211,102,0.12)',
              color: 'var(--wa-green)',
              border: '1px solid rgba(37,211,102,0.3)',
            }}
            title="Preview tanpa simpan ke cloud"
          >
            {isPreviewing ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
            Preview
          </button>
        </div>

        {/* Row 2: Simpan ke Cloud + Buka Preview (Record) */}
        <button
          onClick={handleOpenPreview}
          disabled={isGenerating}
          className="btn btn-primary w-full py-2.5 text-[13px] font-bold shadow-lg gap-2"
          style={{ background: 'var(--wa-green)', color: '#000' }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Menyimpan ke Cloud…
            </>
          ) : (
            <>
              <Play size={16} fill="black" />
              Simpan ke Cloud &amp; Buka Preview
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
