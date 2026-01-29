import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: 'earnings' | 'expenses' | 'shifts';
  data: Record<string, unknown>;
  createdAt: number;
}

interface CachedData {
  id: string;
  table: string;
  data: Record<string, unknown>;
  updatedAt: number;
}

interface DriverPayDB extends DBSchema {
  pendingOperations: {
    key: string;
    value: PendingOperation;
    indexes: { 'by-table': string; 'by-createdAt': number };
  };
  cachedData: {
    key: string;
    value: CachedData;
    indexes: { 'by-table': string };
  };
  syncMetadata: {
    key: string;
    value: { key: string; value: unknown };
  };
}

let dbInstance: IDBPDatabase<DriverPayDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<DriverPayDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DriverPayDB>('driverpay-offline', 1, {
    upgrade(db) {
      // Store for pending operations (to sync when online)
      if (!db.objectStoreNames.contains('pendingOperations')) {
        const pendingStore = db.createObjectStore('pendingOperations', { keyPath: 'id' });
        pendingStore.createIndex('by-table', 'table');
        pendingStore.createIndex('by-createdAt', 'createdAt');
      }

      // Store for cached data (for offline reading)
      if (!db.objectStoreNames.contains('cachedData')) {
        const cacheStore = db.createObjectStore('cachedData', { keyPath: 'id' });
        cacheStore.createIndex('by-table', 'table');
      }

      // Store for sync metadata
      if (!db.objectStoreNames.contains('syncMetadata')) {
        db.createObjectStore('syncMetadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Pending Operations functions
export async function addPendingOperation(
  type: PendingOperation['type'],
  table: PendingOperation['table'],
  data: Record<string, unknown>
): Promise<string> {
  const db = await getDB();
  const id = `${table}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await db.put('pendingOperations', {
    id,
    type,
    table,
    data,
    createdAt: Date.now(),
  });

  return id;
}

export async function getPendingOperations(): Promise<PendingOperation[]> {
  const db = await getDB();
  return db.getAllFromIndex('pendingOperations', 'by-createdAt');
}

export async function getPendingOperationsByTable(table: PendingOperation['table']): Promise<PendingOperation[]> {
  const db = await getDB();
  return db.getAllFromIndex('pendingOperations', 'by-table', table);
}

export async function removePendingOperation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingOperations', id);
}

export async function clearPendingOperations(): Promise<void> {
  const db = await getDB();
  await db.clear('pendingOperations');
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  return db.count('pendingOperations');
}

// Cache functions
export async function cacheData(
  table: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = await getDB();
  await db.put('cachedData', {
    id: `${table}-${id}`,
    table,
    data,
    updatedAt: Date.now(),
  });
}

export async function cacheBulkData(
  table: string,
  items: Array<{ id: string } & Record<string, unknown>>
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('cachedData', 'readwrite');
  
  await Promise.all([
    ...items.map(item => 
      tx.store.put({
        id: `${table}-${item.id}`,
        table,
        data: item,
        updatedAt: Date.now(),
      })
    ),
    tx.done,
  ]);
}

export async function getCachedData(table: string): Promise<Record<string, unknown>[]> {
  const db = await getDB();
  const items = await db.getAllFromIndex('cachedData', 'by-table', table);
  return items.map(item => item.data);
}

export async function getCachedItem(table: string, id: string): Promise<Record<string, unknown> | undefined> {
  const db = await getDB();
  const item = await db.get('cachedData', `${table}-${id}`);
  return item?.data;
}

export async function removeCachedItem(table: string, id: string): Promise<void> {
  const db = await getDB();
  await db.delete('cachedData', `${table}-${id}`);
}

export async function clearCachedTable(table: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('cachedData', 'readwrite');
  const index = tx.store.index('by-table');
  
  let cursor = await index.openCursor(table);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  
  await tx.done;
}

// Sync metadata
export async function setSyncMetadata(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('syncMetadata', { key, value });
}

export async function getSyncMetadata(key: string): Promise<unknown> {
  const db = await getDB();
  const item = await db.get('syncMetadata', key);
  return item?.value;
}
