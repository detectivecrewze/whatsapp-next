'use client';

import React, { useEffect, useState } from 'react';
import {
  Cloud, RefreshCw, Save, Trash2, Download,
  Loader2, CheckCircle, AlertCircle, Plus, FolderOpen,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useCloudStore } from '@/store/useCloudStore';
import { CloudPreset } from '@/types';
import { newId } from '@/lib/utils';

export default function CloudSection() {
  const { templates, activeId, isLoading, error, fetchTemplates, saveTemplate, deleteTemplate, setActiveId } =
    useCloudStore();

  const [saveName, setSaveName] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Save current editor state as a new cloud preset
  async function handleSave() {
    const label = saveName.trim() || `Preset ${new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}`;
    const state = useEditorStore.getState();
    const id = newId('preset');

    const preset: CloudPreset = {
      id,
      name: label,
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
        headerStatus: state.headerStatus,
        headerStatusText: state.headerStatusText,
        pinnedMessage: state.pinnedMessage,
        unreadCount: state.unreadCount,
      },
    };

    try {
      await saveTemplate(id, preset);
      setSaveName('');
      showToast(`✅ Preset "${label}" berhasil disimpan!`);
    } catch {
      showToast('❌ Gagal menyimpan preset ke cloud', 'err');
    }
  }

  // Load a preset into editor
  function handleLoad(preset: CloudPreset) {
    const { applyPayload } = useEditorStore.getState();
    applyPayload(preset.data);
    setActiveId(preset.id);
    showToast(`✅ Preset "${preset.name}" dimuat!`);
  }

  // Delete preset
  async function handleDelete(id: string) {
    try {
      await deleteTemplate(id);
      if (confirmDelete === id) setConfirmDelete(null);
      showToast('🗑️ Preset dihapus');
    } catch {
      showToast('❌ Gagal menghapus preset', 'err');
    }
  }

  const presetList = Object.values(templates).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex flex-col gap-3">
      {/* Save new preset */}
      <div
        className="flex flex-col gap-2 p-2.5 rounded-lg border"
        style={{ background: 'rgba(37,211,102,0.05)', borderColor: 'rgba(37,211,102,0.2)' }}
      >
        <p className="text-[11.5px] font-semibold" style={{ color: 'var(--wa-green)' }}>
          ☁️ Simpan State Saat Ini
        </p>
        <input
          className="input"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="Nama preset (opsional)"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="btn btn-primary w-full py-2 text-[12.5px] font-bold gap-2"
          style={{ background: 'var(--wa-green)', color: '#000' }}
        >
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Simpan ke Cloud
        </button>
      </div>

      {/* Refresh */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold" style={{ color: 'var(--wa-text)' }}>
          Preset Tersimpan ({presetList.length})
        </p>
        <button
          onClick={fetchTemplates}
          disabled={isLoading}
          className="p-1.5 rounded-lg border transition-all hover:opacity-70"
          style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)' }}
          title="Refresh dari cloud"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={13} style={{ color: 'var(--ui-danger)' }} />
          <span className="text-[11px]" style={{ color: 'var(--ui-danger)' }}>{error}</span>
        </div>
      )}

      {/* Preset list */}
      {presetList.length === 0 && !isLoading && (
        <div className="text-center py-6 flex flex-col items-center gap-2" style={{ color: 'var(--wa-text-muted)' }}>
          <FolderOpen size={28} style={{ opacity: 0.4 }} />
          <p className="text-[12px]">Belum ada preset tersimpan</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {presetList.map((preset) => {
          const isActive = activeId === preset.id;
          const date = new Date(preset.updatedAt).toLocaleString('id-ID', {
            dateStyle: 'short',
            timeStyle: 'short',
          });

          return (
            <div
              key={preset.id}
              className="rounded-lg border p-2.5 transition-all"
              style={{
                borderColor: isActive ? 'var(--wa-green)' : 'var(--ui-border)',
                background: isActive ? 'rgba(37,211,102,0.08)' : 'var(--ui-card)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[12.5px] font-semibold truncate"
                    style={{ color: isActive ? 'var(--wa-green)' : 'var(--wa-text)' }}
                  >
                    {isActive && '✓ '}{preset.name}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--wa-text-muted)' }}>
                    {preset.data.messages?.length ?? 0} pesan · {date}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleLoad(preset)}
                    className="p-1.5 rounded-lg border transition-all hover:opacity-80"
                    style={{ borderColor: 'var(--wa-green)', color: 'var(--wa-green)' }}
                    title="Muat preset ini"
                  >
                    <Download size={12} />
                  </button>

                  {confirmDelete === preset.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(preset.id)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold"
                        style={{ background: 'var(--ui-danger)', color: '#fff' }}
                      >
                        Ya, hapus
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 rounded-lg text-[10px]"
                        style={{ background: 'var(--ui-card)', color: 'var(--wa-text-muted)', border: '1px solid var(--ui-border)' }}
                      >
                        Batal
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(preset.id)}
                      className="p-1.5 rounded-lg border transition-all hover:opacity-80"
                      style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)' }}
                      title="Hapus preset"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-28 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[12.5px] font-medium shadow-xl z-50 transition-all"
          style={{
            background: toast.type === 'ok' ? 'rgba(37,211,102,0.95)' : 'rgba(239,68,68,0.95)',
            color: toast.type === 'ok' ? '#000' : '#fff',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
