import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface SyncAction {
  id?: number;
  type: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  timestamp: number;
}

interface OfflineDB extends DBSchema {
  cached_data: {
    key: string;
    value: any;
  };
  sync_queue: {
    key: number;
    value: SyncAction;
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

export const getDB = () => {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>('voduong-offline-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cached_data')) {
          db.createObjectStore('cached_data');
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
};

export const saveToCache = async (key: string, data: any) => {
  const db = await getDB();
  if (db) return db.put('cached_data', data, key);
};

export const getFromCache = async (key: string) => {
  const db = await getDB();
  if (db) return db.get('cached_data', key);
};

export const enqueueSyncAction = async (action: Omit<SyncAction, 'id' | 'timestamp'>) => {
  const db = await getDB();
  if (db) {
    return db.add('sync_queue', { ...action, timestamp: Date.now() });
  }
};

export const getSyncQueue = async () => {
  const db = await getDB();
  if (db) {
    return db.getAllFromIndex('sync_queue', 'by-timestamp');
  }
  return [];
};

export const clearSyncAction = async (id: number) => {
  const db = await getDB();
  if (db) return db.delete('sync_queue', id);
};
