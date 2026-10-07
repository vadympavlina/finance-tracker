/**
 * Storage adapter — the only place that touches the persistence backend.
 *
 * The interface is async on purpose: today it is backed by localStorage,
 * tomorrow it can be swapped with a Firebase / Firestore implementation
 * without touching the repositories, the store or the UI.
 */
export interface StorageAdapter {
  read<T>(key: string): Promise<T | null>
  write<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
}

const PREFIX = 'finance-tracker:v1:'

export class StorageError extends Error {}

export const localStorageAdapter: StorageAdapter = {
  async read<T>(key: string) {
    try {
      const raw = window.localStorage.getItem(PREFIX + key)
      return raw === null ? null : (JSON.parse(raw) as T)
    } catch {
      return null
    }
  },
  async write<T>(key: string, value: T) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      throw new StorageError('Не вдалося зберегти дані. Можливо, сховище браузера переповнене.')
    }
  },
  async remove(key: string) {
    try {
      window.localStorage.removeItem(PREFIX + key)
    } catch {
      /* ignore */
    }
  },
}

/** In-memory adapter — used in tests and as a fallback when localStorage is unavailable. */
export function createMemoryAdapter(): StorageAdapter {
  const store = new Map<string, string>()
  return {
    async read<T>(key: string) {
      const raw = store.get(key)
      return raw === undefined ? null : (JSON.parse(raw) as T)
    },
    async write<T>(key: string, value: T) {
      store.set(key, JSON.stringify(value))
    },
    async remove(key: string) {
      store.delete(key)
    },
  }
}

function isLocalStorageAvailable(): boolean {
  try {
    const k = '__ft_test__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

let activeAdapter: StorageAdapter | null = null

export function getAdapter(): StorageAdapter {
  if (!activeAdapter) {
    activeAdapter = typeof window !== 'undefined' && isLocalStorageAvailable() ? localStorageAdapter : createMemoryAdapter()
  }
  return activeAdapter
}

/** Swap the backend (e.g. Firebase) at app start. */
export function setAdapter(adapter: StorageAdapter) {
  activeAdapter = adapter
}
