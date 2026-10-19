// IndexedDB helper to reliably persist uploaded background photos/videos
// without hitting localStorage 5MB quota limits.

const DB_NAME = 'fya-pba-studio-db';
const STORE_NAME = 'media-cache';
const RECORD_KEY = 'letter-hook-bg-media';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredBgMedia {
  blob: Blob;
  name: string;
  kind: 'image' | 'video';
  updatedAt: number;
}

export async function saveBgMediaToIndexedDB(
  blob: Blob,
  name: string,
  kind: 'image' | 'video',
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const data: StoredBgMedia = {
      blob,
      name,
      kind,
      updatedAt: Date.now(),
    };
    store.put(data, RECORD_KEY);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[letterHookMediaStorage] Failed to save media to IndexedDB:', err);
  }
}

export async function loadBgMediaFromIndexedDB(): Promise<StoredBgMedia | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(RECORD_KEY);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result as StoredBgMedia | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[letterHookMediaStorage] Failed to load media from IndexedDB:', err);
    return null;
  }
}

export async function clearBgMediaFromIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(RECORD_KEY);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[letterHookMediaStorage] Failed to clear media from IndexedDB:', err);
  }
}
