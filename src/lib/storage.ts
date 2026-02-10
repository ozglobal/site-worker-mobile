import { reportError } from './errorReporter'

/**
 * Typed localStorage & IndexedDB utilities
 *
 * localStorage keys (final state after migration):
 * - auth: refresh token + metadata (access token is in-memory, PR 1)
 * - engineer: form draft data
 * - onboarding_completed: one-time flag
 *
 * IndexedDB:
 * - fileStorage: binary file storage
 */

// ============================================
// Type Definitions
// ============================================

export interface AuthData {
  expiresIn?: number
  issuedAt: number
  refreshToken?: string
}

// ============================================
// Generic Helpers
// ============================================

function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    reportError('STORAGE_PARSE_FAIL', `localStorage corrupted for key: ${key}`, { level: 'warn' })
    return null
  }
}

function setStorageItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function removeStorageItem(key: string): void {
  localStorage.removeItem(key)
}

// ============================================
// Auth Storage (refresh token + metadata)
// ============================================

export const authStorage = {
  get: (): AuthData | null => getStorageItem<AuthData>('auth'),

  set: (data: AuthData): void => setStorageItem('auth', data),

  clear: (): void => removeStorageItem('auth'),

  getRefreshToken: (): string | null => authStorage.get()?.refreshToken ?? null,

  getExpiresIn: (): number | null => authStorage.get()?.expiresIn ?? null,

  getIssuedAt: (): number | null => authStorage.get()?.issuedAt ?? null,

  setTokens: (
    refreshToken?: string,
    expiresIn?: number,
    issuedAt?: number
  ): void => {
    const data: AuthData = {
      issuedAt: issuedAt ?? Math.floor(Date.now() / 1000),
      ...(refreshToken && { refreshToken }),
      ...(expiresIn && { expiresIn }),
    }
    authStorage.set(data)
  },
}

// ============================================
// File Storage (IndexedDB for binary files)
// ============================================

const FILE_DB_NAME = 'cworker-files'
const FILE_DB_VERSION = 1
const FILE_STORE_NAME = 'files'

function openFileDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FILE_DB_NAME, FILE_DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(FILE_STORE_NAME)) {
        db.createObjectStore(FILE_STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export interface StoredFileInfo {
  name: string
  size: number
  type: string
  savedAt: number
}

export const fileStorage = {
  save: async (key: string, file: File): Promise<void> => {
    const db = await openFileDB()
    const tx = db.transaction(FILE_STORE_NAME, 'readwrite')
    const store = tx.objectStore(FILE_STORE_NAME)
    store.put({ blob: file, name: file.name, size: file.size, type: file.type, savedAt: Date.now() }, key)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  get: async (key: string): Promise<File | null> => {
    const db = await openFileDB()
    const tx = db.transaction(FILE_STORE_NAME, 'readonly')
    const store = tx.objectStore(FILE_STORE_NAME)
    const request = store.get(key)
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result
        if (!result) return resolve(null)
        const file = new File([result.blob], result.name, { type: result.type })
        resolve(file)
      }
      request.onerror = () => reject(request.error)
    })
  },

  getInfo: async (key: string): Promise<StoredFileInfo | null> => {
    const db = await openFileDB()
    const tx = db.transaction(FILE_STORE_NAME, 'readonly')
    const store = tx.objectStore(FILE_STORE_NAME)
    const request = store.get(key)
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result
        if (!result) return resolve(null)
        resolve({ name: result.name, size: result.size, type: result.type, savedAt: result.savedAt })
      }
      request.onerror = () => reject(request.error)
    })
  },

  remove: async (key: string): Promise<void> => {
    const db = await openFileDB()
    const tx = db.transaction(FILE_STORE_NAME, 'readwrite')
    const store = tx.objectStore(FILE_STORE_NAME)
    store.delete(key)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  clear: async (): Promise<void> => {
    const db = await openFileDB()
    const tx = db.transaction(FILE_STORE_NAME, 'readwrite')
    const store = tx.objectStore(FILE_STORE_NAME)
    store.clear()
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },
}

// ============================================
// Engineer Storage (form draft)
// ============================================

export interface EngineerData {
  engineerType?: 'representative' | 'employee'
  representativeName?: string
  machine?: string
}

export const engineerStorage = {
  get: (): EngineerData | null => getStorageItem<EngineerData>('engineer'),

  set: (data: EngineerData): void => setStorageItem('engineer', data),

  update: (partial: Partial<EngineerData>): void => {
    const existing = engineerStorage.get() || {}
    engineerStorage.set({ ...existing, ...partial })
  },

  clear: (): void => removeStorageItem('engineer'),
}

// ============================================
// Onboarding Storage (one-time flag)
// ============================================

export const onboardingStorage = {
  isCompleted: (): boolean => localStorage.getItem('onboarding_completed') === 'true',

  markCompleted: (): void => localStorage.setItem('onboarding_completed', 'true'),

  clear: (): void => removeStorageItem('onboarding_completed'),
}

// ============================================
// Signup Storage (sessionStorage, cleared on tab close)
// ============================================

export const signupStorage = {
  getPhone: (): string => sessionStorage.getItem('signup_phone') || '',

  setPhone: (phone: string): void => sessionStorage.setItem('signup_phone', phone),

  clear: (): void => sessionStorage.removeItem('signup_phone'),
}

// ============================================
// Clear All Storage (for logout)
// ============================================

export const clearAllStorage = async (): Promise<void> => {
  authStorage.clear()
  await fileStorage.clear()
}
