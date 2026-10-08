/**
 * IndexedDB storage for CineTorrent
 * Stores torrent info by hash for speed: HASH -> { hash, id?: number, fileID?: number, ... }
 * - id: Torbox torrent_id / torrentID received when added/downloaded
 * - fileID: ID of largest file retrieved during cache check
 */

export interface StoredTorrentRecord {
  hash: string; // Lowercase 40-char infohash (primary key)
  id?: number; // Torbox torrentID
  fileID?: number; // ID of largest media file
  name?: string;
  fileName?: string;
  fileSize?: number;
  downloadedAt?: number;
}

const DB_NAME = 'CineTorrentDB';
const DB_VERSION = 1;
const STORE_NAME = 'torrents';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openCineTorrentDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'hash' });
        store.createIndex('hash', 'hash', { unique: true });
        store.createIndex('id', 'id', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open CineTorrentDB'));
    };
  });

  return dbPromise;
}

/**
 * Retrieve a torrent record by hash
 */
export async function getTorrentRecord(hash: string): Promise<StoredTorrentRecord | undefined> {
  const cleanHash = (hash || '').trim().toLowerCase();
  if (!cleanHash) return undefined;

  try {
    const db = await openCineTorrentDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(cleanHash);

      req.onsuccess = () => resolve(req.result || undefined);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error reading from IndexedDB:', err);
    return undefined;
  }
}

/**
 * Retrieve multiple torrent records by an array of hashes
 */
export async function getTorrentRecords(
  hashes: string[]
): Promise<Record<string, StoredTorrentRecord>> {
  const result: Record<string, StoredTorrentRecord> = {};
  if (!hashes || hashes.length === 0) return result;

  const cleanHashes = hashes.map((h) => (h || '').trim().toLowerCase()).filter(Boolean);
  if (cleanHashes.length === 0) return result;

  try {
    const db = await openCineTorrentDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      let pending = cleanHashes.length;
      for (const h of cleanHashes) {
        const req = store.get(h);
        req.onsuccess = () => {
          if (req.result) {
            result[h] = req.result;
          }
          pending -= 1;
          if (pending === 0) resolve(result);
        };
        req.onerror = () => {
          pending -= 1;
          if (pending === 0) resolve(result);
        };
      }
    });
  } catch (err) {
    console.warn('Error batch reading from IndexedDB:', err);
    return result;
  }
}

/**
 * Save or update a torrent record in IndexedDB
 */
export async function saveTorrentRecord(record: StoredTorrentRecord): Promise<void> {
  const cleanHash = (record.hash || '').trim().toLowerCase();
  if (!cleanHash) return;

  try {
    const db = await openCineTorrentDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Check existing to merge
      const getReq = store.get(cleanHash);
      getReq.onsuccess = () => {
        const existing: StoredTorrentRecord = getReq.result || { hash: cleanHash };
        const merged: StoredTorrentRecord = {
          ...existing,
          ...record,
          hash: cleanHash,
          // Preserve id if not provided in new record
          id: record.id !== undefined ? record.id : existing.id,
          // Preserve fileID if not provided in new record
          fileID: record.fileID !== undefined ? record.fileID : existing.fileID,
        };

        const putReq = store.put(merged);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => {
        const putReq = store.put({ ...record, hash: cleanHash });
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
    });
  } catch (err) {
    console.warn('Error writing to IndexedDB:', err);
  }
}

/**
 * Store the largest file's file_id found from cache check
 */
export async function saveFileIdFromCacheCheck(
  hash: string,
  fileID: number,
  extra?: { fileName?: string; fileSize?: number; name?: string }
): Promise<void> {
  await saveTorrentRecord({
    hash,
    fileID,
    ...(extra?.fileName ? { fileName: extra.fileName } : {}),
    ...(extra?.fileSize ? { fileSize: extra.fileSize } : {}),
    ...(extra?.name ? { name: extra.name } : {}),
  });
}

/**
 * Store the torrentID when a torrent is downloaded / created in Torbox
 */
export async function saveDownloadedTorrent(
  hash: string,
  torrentID: number,
  name?: string
): Promise<void> {
  await saveTorrentRecord({
    hash,
    id: torrentID,
    downloadedAt: Date.now(),
    ...(name ? { name } : {}),
  });
}

/**
 * Build the direct download / stream link for Torbox
 * URL: https://api.torbox.app/v1/api/torrents/requestdl?token=APIKEY&torrent_id=NUMBER&file_id=NUMBER&redirect=true
 */
export function buildTorboxRequestDlUrl(
  apiKey: string,
  torrentId: number,
  fileId?: number
): string {
  const params = new URLSearchParams({
    token: apiKey.trim(),
    torrent_id: String(torrentId),
    redirect: 'true',
  });

  if (typeof fileId === 'number' && !isNaN(fileId)) {
    params.set('file_id', String(fileId));
  }

  return `https://api.torbox.app/v1/api/torrents/requestdl?${params.toString()}`;
}

/**
 * Trigger opening the Torbox direct download link in a new tab
 */
export function openTorboxDownloadLink(
  apiKey: string,
  torrentId: number,
  fileId?: number
): void {
  const url = buildTorboxRequestDlUrl(apiKey, torrentId, fileId);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
