'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Download, Layers3, Loader2, TriangleAlert } from 'lucide-react';
import {
  assertBrandRenderSupport,
  downloadBrandVideo,
  renderBrandVideo,
} from '@/lib/renderBrandVideo';
import { useBrandStudioStore } from '@/store/useBrandStudioStore';
import styles from '@/app/brand/brand.module.css';

type QueueStatus = 'waiting' | 'rendering' | 'done' | 'error';

interface QueueItem {
  id: string;
  label: string;
  progress: number;
  status: QueueStatus;
  error?: string;
}

export default function BrandBatchExport() {
  const variants = useBrandStudioStore((state) => state.variants);
  const selectedVariants = useMemo(
    () => variants.filter((variant) => variant.selected),
    [variants],
  );
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  function updateQueue(id: string, updates: Partial<QueueItem>) {
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }

  async function exportSelected() {
    if (!selectedVariants.length || running) return;

    setGeneralError(null);
    setRunning(true);
    setQueue(selectedVariants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      progress: 0,
      status: 'waiting',
    })));

    try {
      await assertBrandRenderSupport();
      for (const variant of selectedVariants) {
        updateQueue(variant.id, { status: 'rendering', progress: 0, error: undefined });
        try {
          const blob = await renderBrandVideo(
            variant.props,
            (progress) => updateQueue(variant.id, { progress }),
          );
          downloadBrandVideo(blob, variant.props, variant.id.replace('variant-', 'versi-'));
          updateQueue(variant.id, { status: 'done', progress: 100 });
        } catch (error) {
          updateQueue(variant.id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Render versi ini gagal.',
          });
        }
      }
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Browser tidak dapat memulai batch export.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className={styles.batchExportCard}>
      <div className={styles.batchExportHeading}>
        <span><Layers3 size={16} /></span>
        <div>
          <strong>Batch export terpilih</strong>
          <small>Dirender satu per satu supaya browser tetap stabil.</small>
        </div>
      </div>

      {queue.length ? (
        <div className={styles.batchQueue}>
          {queue.map((item) => (
            <div className={styles.batchQueueItem} key={item.id}>
              <div>
                {item.status === 'rendering' ? <Loader2 size={13} className="animate-spin" /> : null}
                {item.status === 'done' ? <CheckCircle2 size={13} /> : null}
                {item.status === 'error' ? <TriangleAlert size={13} /> : null}
                {item.status === 'waiting' ? <span className={styles.queueDot} /> : null}
                <strong>{item.label}</strong>
                <small>{item.status === 'rendering' ? `${item.progress}%` : item.status}</small>
              </div>
              <span><i style={{ width: `${item.progress}%` }} /></span>
              {item.error ? <p>{item.error}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        className={styles.batchExportButton}
        onClick={() => void exportSelected()}
        disabled={running || !selectedVariants.length}
      >
        {running ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        {running ? 'Memproses antrean…' : `Export ${selectedVariants.length} versi MP4`}
      </button>
      <small className={styles.batchExportNote}>
        Browser mungkin meminta izin untuk mengunduh beberapa file sekaligus.
      </small>
      {generalError ? <p className={styles.batchError}>{generalError}</p> : null}
    </div>
  );
}
