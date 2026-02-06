import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: 'earnings' | 'expenses' | 'shifts';
  data: Record<string, unknown>;
  createdAt: number;
}

// Guest mode entry interface
export interface GuestEntry {
  id: string;
  type: 'earning' | 'expense' | 'shift';
  amount: number;
  km?: number;
  minutes?: number;
  platform_name: string;
  date: string;
  notes?: string;
  category?: string; // For expenses
  created_at: number;
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
  guestData: {
    key: string;
    value: GuestEntry;
    indexes: { 'by-type': string; 'by-date': string; 'by-createdAt': number };
  };
}

let dbInstance: IDBPDatabase<DriverPayDB> | null = null;

// Database version - increment when adding new stores
const DB_VERSION = 2;

export async function getDB(): Promise<IDBPDatabase<DriverPayDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DriverPayDB>('driverpay-offline', DB_VERSION, {
    upgrade(db, oldVersion) {
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

      // Store for guest mode data (added in version 2)
      if (oldVersion < 2 && !db.objectStoreNames.contains('guestData')) {
        const guestStore = db.createObjectStore('guestData', { keyPath: 'id' });
        guestStore.createIndex('by-type', 'type');
        guestStore.createIndex('by-date', 'date');
        guestStore.createIndex('by-createdAt', 'created_at');
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

// ==========================================
// Guest Mode Functions
// ==========================================

const GUEST_DATA_EXPIRY_DAYS = 7;

/**
 * Generate a unique ID for guest entries
 */
function generateGuestId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a guest entry to IndexedDB
 */
export async function addGuestEntry(entry: Omit<GuestEntry, 'id' | 'created_at'>): Promise<string> {
  const db = await getDB();
  const id = generateGuestId();
  
  const fullEntry: GuestEntry = {
    ...entry,
    id,
    created_at: Date.now(),
  };
  
  await db.put('guestData', fullEntry);
  
  // Update last activity timestamp
  await setSyncMetadata('guest_last_activity', Date.now());
  
  return id;
}

/**
 * Get all guest entries
 */
export async function getGuestEntries(): Promise<GuestEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('guestData', 'by-createdAt');
}

/**
 * Get guest entries by type (earning, expense, shift)
 */
export async function getGuestEntriesByType(type: GuestEntry['type']): Promise<GuestEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('guestData', 'by-type', type);
}

/**
 * Get the count of guest entries
 */
export async function getGuestEntryCount(): Promise<number> {
  const db = await getDB();
  return db.count('guestData');
}

/**
 * Delete a specific guest entry
 */
export async function deleteGuestEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('guestData', id);
}

/**
 * Clear all guest data
 */
export async function clearGuestData(): Promise<void> {
  const db = await getDB();
  await db.clear('guestData');
  await setSyncMetadata('guest_last_activity', null);
}

/**
 * Check if guest data has expired (7 days of inactivity)
 */
export async function isGuestDataExpired(): Promise<boolean> {
  const lastActivity = await getSyncMetadata('guest_last_activity') as number | null;
  
  if (!lastActivity) return false;
  
  const expiryTime = GUEST_DATA_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - lastActivity > expiryTime;
}

/**
 * Clean up expired guest data
 */
export async function cleanupExpiredGuestData(): Promise<void> {
  const isExpired = await isGuestDataExpired();
  if (isExpired) {
    await clearGuestData();
  }
}

/**
 * Check if there's any guest data stored
 */
export async function hasGuestData(): Promise<boolean> {
  const count = await getGuestEntryCount();
  return count > 0;
}
