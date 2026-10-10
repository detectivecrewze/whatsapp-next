'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Cloud,
  Download,
  Eye,
  FolderOpen,
  Loader2,
  MessageSquareText,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useCloudStore } from '@/store/useCloudStore';
import type { CloudPreset, EditorState } from '@/types';
import { newId } from '@/lib/utils';
import { persistAudioMapForCloud } from '@/lib/tts';

const LOCAL_PREVIEW_KEY = 'wa_local_preview';

function collectEditorData(state: ReturnType<typeof useEditorStore.getState>): Partial<EditorState> {
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
    dateBadge: state.dateBadge,
  };
}

function countAudio(preset: CloudPreset) {
  return new Set(Object.values(preset.data.ttsAudioMap ?? {}).filter(Boolean)).size;
}

export default function CloudSection() {
  const {
    templates,
    activeId,
    isLoading,
    error,
    fetchTemplates,
    saveTemplate,
    renameTemplate,
    deleteTemplate,
    setActiveId,
  } = useCloudStore();

  const [saveName, setSaveName] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const presetList = useMemo(
    () => Object.values(templates).sort((a, b) => b.updatedAt - a.updatedAt),
    [templates],
  );
  const projectsWithAudio = presetList.filter((preset) => countAudio(preset) > 0).length;

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    const label = saveName.trim() || `Project ${new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}`;
    const state = useEditorStore.getState();
    const id = newId('preset');

    try {
      const ttsAudioMap = await persistAudioMapForCloud(state.ttsAudioMap);
      state.applyPayload({ ttsAudioMap });

      const preset: CloudPreset = {
        id,
        name: label,
        updatedAt: Date.now(),
        data: { ...collectEditorData(useEditorStore.getState()), ttsAudioMap },
      };

      await saveTemplate(id, preset);
      setSaveName('');
      showToast(`Project “${label}” tersimpan lengkap.`);
    } catch (caughtError) {
      showToast(caughtError instanceof Error ? caughtError.message : 'Gagal menyimpan project ke cloud.', 'err');
    }
  }

  function handleLoad(preset: CloudPreset) {
    useEditorStore.getState().applyPayload(preset.data);
    setActiveId(preset.id);
    showToast(`Project “${preset.name}” dimuat.`);
  }

  async function handleRename(id: string) {
    const name = editingName.trim();
    if (!name) return;
    try {
      await renameTemplate(id, name);
      setEditingId(null);
      setEditingName('');
      showToast('Nama project diperbarui.');
    } catch (caughtError) {
      showToast(caughtError instanceof Error ? caughtError.message : 'Gagal mengganti nama.', 'err');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTemplate(id);
      setConfirmDelete(null);
      showToast('Project dihapus dari cloud.');
    } catch (caughtError) {
      showToast(caughtError instanceof Error ? caughtError.message : 'Gagal menghapus project.', 'err');
    }
  }

  function openPreview(preset: CloudPreset) {
    try {
      sessionStorage.setItem(LOCAL_PREVIEW_KEY, JSON.stringify(preset.data));
      window.open(`${window.location.origin}/preview/local`, '_blank');
    } catch {
      showToast('Gagal membuka preview.', 'err');
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <section
        className="overflow-hidden rounded-2xl border"
        style={{ background: 'linear-gradient(145deg, rgba(37,211,102,0.11), rgba(37,211,102,0.025))', borderColor: 'rgba(37,211,102,0.28)' }}
      >
        <div className="flex items-start gap-3 border-b p-3.5" style={{ borderColor: 'rgba(37,211,102,0.16)' }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(37,211,102,0.14)', color: 'var(--wa-green)' }}>
            <Cloud size={18} />
          </span>
          <div>
            <p className="text-[12.5px] font-semibold" style={{ color: 'var(--wa-text)' }}>Simpan project baru</p>
            <p className="mt-0.5 text-[10px] leading-relaxed" style={{ color: 'var(--wa-text-muted)' }}>
              Chat, visual, pengaturan video, dan voice over disimpan bersama.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 p-3.5">
          <input
            className="input"
            value={saveName}
            onChange={(event) => setSaveName(event.target.value)}
            placeholder="Nama project, misalnya: Horror CCTV"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !isLoading) void handleSave();
            }}
          />
          <button type="button" onClick={() => void handleSave()} disabled={isLoading} className="btn btn-primary w-full gap-2 py-2.5 text-[12px] font-bold">
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Simpan project lengkap
          </button>
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold" style={{ color: 'var(--wa-text)' }}>Project cloud</p>
            <p className="mt-0.5 text-[9.5px]" style={{ color: 'var(--wa-text-muted)' }}>
              {presetList.length} project · {projectsWithAudio} dengan voice over
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchTemplates()}
            disabled={isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-opacity hover:opacity-75"
            style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)', background: 'var(--ui-card)' }}
            title="Muat ulang dari cloud"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {error && (
          <div className="mb-2.5 flex items-start gap-2 rounded-xl border p-2.5" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.24)' }}>
            <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: '#fca5a5' }} />
            <span className="text-[10px] leading-relaxed" style={{ color: '#fca5a5' }}>{error}</span>
          </div>
        )}

        {presetList.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-8 text-center" style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)' }}>
            <FolderOpen size={26} style={{ opacity: 0.42 }} />
            <div>
              <p className="text-[11.5px] font-medium">Belum ada project cloud</p>
              <p className="mt-0.5 text-[9.5px]">Project pertama kamu akan muncul di sini.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {presetList.map((preset) => {
              const isActive = activeId === preset.id;
              const audioCount = countAudio(preset);
              const date = new Date(preset.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
              const isEditing = editingId === preset.id;
              const isConfirmingDelete = confirmDelete === preset.id;

              return (
                <article
                  key={preset.id}
                  className="rounded-2xl border p-3 transition-colors"
                  style={{
                    borderColor: isActive ? 'rgba(37,211,102,0.62)' : 'var(--ui-border)',
                    background: isActive ? 'rgba(37,211,102,0.075)' : 'var(--ui-card)',
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: isActive ? 'rgba(37,211,102,0.15)' : 'rgba(255,255,255,0.045)', color: isActive ? 'var(--wa-green)' : 'var(--wa-text-muted)' }}
                    >
                      {isActive ? <Check size={15} /> : <FolderOpen size={14} />}
                    </span>

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex gap-1.5">
                          <input
                            autoFocus
                            className="input min-w-0 flex-1 py-1.5 text-[11px]"
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') void handleRename(preset.id);
                              if (event.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button type="button" onClick={() => void handleRename(preset.id)} className="flex w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'rgba(37,211,102,0.45)', color: 'var(--wa-green)' }} title="Simpan nama"><Check size={13} /></button>
                          <button type="button" onClick={() => setEditingId(null)} className="flex w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)' }} title="Batal"><X size={13} /></button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold" style={{ color: isActive ? 'var(--wa-green)' : 'var(--wa-text)' }}>{preset.name}</p>
                            <p className="mt-0.5 text-[9px]" style={{ color: 'var(--wa-text-muted)' }}>{date}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setEditingId(preset.id); setEditingName(preset.name); setConfirmDelete(null); }}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                            style={{ color: 'var(--wa-text-muted)' }}
                            title="Ganti nama project"
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px]" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--wa-text-muted)' }}>
                          <MessageSquareText size={9} /> {preset.data.messages?.length ?? 0} pesan
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px]" style={{ background: audioCount ? 'rgba(37,211,102,0.10)' : 'rgba(255,255,255,0.05)', color: audioCount ? 'var(--wa-green)' : 'var(--wa-text-muted)' }}>
                          <Volume2 size={9} /> {audioCount ? `${audioCount} voice` : 'Tanpa voice'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-1.5 border-t pt-2.5" style={{ borderColor: 'var(--ui-border)' }}>
                      <button type="button" onClick={() => openPreview(preset)} className="flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[9.5px] font-semibold transition-opacity hover:opacity-75" style={{ borderColor: 'var(--ui-border)', color: 'var(--wa-text-muted)' }}><Eye size={11} /> Preview</button>
                      <button type="button" onClick={() => handleLoad(preset)} className="flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[9.5px] font-semibold transition-opacity hover:opacity-75" style={{ borderColor: 'rgba(37,211,102,0.38)', color: 'var(--wa-green)', background: 'rgba(37,211,102,0.06)' }}><Download size={11} /> Muat</button>
                      <button type="button" onClick={() => { setConfirmDelete(isConfirmingDelete ? null : preset.id); setEditingId(null); }} className="flex h-8 w-8 items-center justify-center rounded-lg border transition-opacity hover:opacity-75" style={{ borderColor: isConfirmingDelete ? 'rgba(239,68,68,0.42)' : 'var(--ui-border)', color: isConfirmingDelete ? '#fca5a5' : 'var(--wa-text-muted)' }} title="Hapus project"><Trash2 size={11} /></button>
                    </div>
                  )}

                  {isConfirmingDelete && !isEditing && (
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg px-2.5 py-2" style={{ background: 'rgba(239,68,68,0.08)' }}>
                      <span className="text-[9.5px] text-red-200">Hapus permanen dari cloud?</span>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => setConfirmDelete(null)} className="rounded-md px-2 py-1 text-[9px]" style={{ color: 'var(--wa-text-muted)' }}>Batal</button>
                        <button type="button" onClick={() => void handleDelete(preset.id)} className="rounded-md bg-red-500 px-2 py-1 text-[9px] font-semibold text-white">Hapus</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {toast && (
        <div
          className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-[11px] font-medium shadow-xl"
          style={{ background: toast.type === 'ok' ? 'rgba(37,211,102,0.96)' : 'rgba(239,68,68,0.96)', color: toast.type === 'ok' ? '#07120c' : '#fff' }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
