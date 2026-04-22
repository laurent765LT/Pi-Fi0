// ─── IndexedDB-backed key/value store ────────────────────────────────────
// Thin wrapper around the native IndexedDB API (no library) that exposes a
// simple IDBStore interface for offline caching. SSR-safe: all operations
// reject when `window.indexedDB` is unavailable.

export interface IDBStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
  clear(): Promise<void>;
}

const DEFAULT_STORE_NAME = 'kv';

// ─── Helpers ──────────────────────────────────────────────────────────────

function openDatabase(dbName: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }
    const request = window.indexedDB.open(dbName, version);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DEFAULT_STORE_NAME)) {
        db.createObjectStore(DEFAULT_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open IndexedDB.'));
    request.onblocked = () =>
      reject(new Error('IndexedDB upgrade blocked by another connection.'));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

// ─── Factory ──────────────────────────────────────────────────────────────

export function createStore(name: string, version: number): IDBStore {
  if (!name || name.trim() === '') {
    throw new Error('createStore: name must be a non-empty string.');
  }
  if (!Number.isInteger(version) || version < 1) {
    throw new Error('createStore: version must be a positive integer.');
  }

  let dbPromise: Promise<IDBDatabase> | null = null;

  function getDb(): Promise<IDBDatabase> {
    if (!dbPromise) {
      dbPromise = openDatabase(name, version).catch((err) => {
        // Reset so a future caller can retry
        dbPromise = null;
        throw err;
      });
    }
    return dbPromise;
  }

  async function withStore<R>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => Promise<R> | R,
  ): Promise<R> {
    const db = await getDb();
    return new Promise<R>((resolve, reject) => {
      const tx = db.transaction(DEFAULT_STORE_NAME, mode);
      const store = tx.objectStore(DEFAULT_STORE_NAME);
      let result: R;
      let errored = false;
      Promise.resolve(fn(store))
        .then((r) => {
          result = r;
        })
        .catch((err) => {
          errored = true;
          reject(err);
        });
      tx.oncomplete = () => {
        if (!errored) resolve(result);
      };
      tx.onerror = () => reject(tx.error ?? new Error('Transaction failed.'));
      tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted.'));
    });
  }

  return {
    async get<T>(key: string): Promise<T | undefined> {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return undefined;
      }
      try {
        const value = await withStore<T | undefined>('readonly', (store) =>
          requestToPromise<T | undefined>(store.get(key) as IDBRequest<T | undefined>),
        );
        return value;
      } catch {
        return undefined;
      }
    },

    async set<T>(key: string, value: T): Promise<void> {
      if (typeof window === 'undefined' || !('indexedDB' in window)) return;
      await withStore('readwrite', (store) =>
        requestToPromise(store.put(value as unknown as IDBValidKey, key)),
      );
    },

    async delete(key: string): Promise<void> {
      if (typeof window === 'undefined' || !('indexedDB' in window)) return;
      await withStore('readwrite', (store) =>
        requestToPromise(store.delete(key)),
      );
    },

    async list(): Promise<string[]> {
      if (typeof window === 'undefined' || !('indexedDB' in window)) return [];
      try {
        const keys = await withStore<IDBValidKey[]>('readonly', (store) =>
          requestToPromise(store.getAllKeys()),
        );
        return keys.map((k) => String(k));
      } catch {
        return [];
      }
    },

    async clear(): Promise<void> {
      if (typeof window === 'undefined' || !('indexedDB' in window)) return;
      await withStore('readwrite', (store) => requestToPromise(store.clear()));
    },
  };
}

// ─── Default store (lazy) ─────────────────────────────────────────────────

let defaultStore: IDBStore | null = null;

export function getDefaultStore(): IDBStore {
  if (!defaultStore) {
    defaultStore = createStore('strickin-offline', 1);
  }
  return defaultStore;
}
