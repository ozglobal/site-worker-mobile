/**
 * Typed localStorage utilities for structured data storage
 *
 * Storage structure:
 * - auth: Token/session data (authToken, expiresIn, issuedAt, refreshToken)
 * - profile: User identity (workerId, workerName, relatedSiteId)
 * - todayAttendance: Daily attendance records for up to 2 sites
 *   {
 *     date: "2026-01-16",
 *     records: [
 *       { siteId, siteName, siteAddress, checkInTime, checkOutTime },
 *       { siteId, siteName, siteAddress, checkInTime, checkOutTime }
 *     ],
 *     currentCheckIn: { siteId, siteName, siteAddress, serverTimestamp } | null
 *   }
 * - autoLogin: Auto-login credentials (phone, password)
 */

// ============================================
// Type Definitions
// ============================================

export interface AuthData {
  authToken: string
  expiresIn?: number
  issuedAt: number
  refreshToken?: string
}

export interface ProfileData {
  workerId: string
  workerName: string
  username?: string
  relatedSiteId?: string
}

export interface CheckInData {
  id?: string
  siteId: string
  siteName?: string
  siteAddress?: string
  serverTimestamp?: string
}

export interface AttendanceRecord {
  id?: string
  siteId: string
  siteName?: string
  siteAddress?: string
  checkInTime: string
  checkOutTime?: string
}

export interface TodayAttendanceData {
  date: string // YYYY-MM-DD format
  records: AttendanceRecord[] // stores both complete and in-progress records
  // A record with checkOutTime is complete, without checkOutTime is in-progress (currently checked in)
}

export interface AutoLoginData {
  phone: string
  password: string
}

// ============================================
// Storage Keys
// ============================================

const STORAGE_KEYS = {
  AUTH: 'auth',
  PROFILE: 'profile',
  CHECK_IN: 'checkIn',
  TODAY_ATTENDANCE: 'todayAttendance',
  MONTHLY_ATTENDANCE: 'monthlyAttendance',
  AUTO_LOGIN: 'autoLogin',
} as const

// ============================================
// Generic Helpers
// ============================================

function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
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
// Auth Storage
// ============================================

export const authStorage = {
  get: (): AuthData | null => getStorageItem<AuthData>(STORAGE_KEYS.AUTH),

  set: (data: AuthData): void => setStorageItem(STORAGE_KEYS.AUTH, data),

  clear: (): void => removeStorageItem(STORAGE_KEYS.AUTH),

  getToken: (): string | null => authStorage.get()?.authToken ?? null,

  getRefreshToken: (): string | null => authStorage.get()?.refreshToken ?? null,

  getExpiresIn: (): number | null => authStorage.get()?.expiresIn ?? null,

  getIssuedAt: (): number | null => authStorage.get()?.issuedAt ?? null,

  setTokens: (
    authToken: string,
    refreshToken?: string,
    expiresIn?: number,
    issuedAt?: number
  ): void => {
    const data: AuthData = {
      authToken,
      issuedAt: issuedAt ?? Math.floor(Date.now() / 1000),
      ...(refreshToken && { refreshToken }),
      ...(expiresIn && { expiresIn }),
    }
    authStorage.set(data)
  },
}

// ============================================
// Profile Storage
// ============================================

export const profileStorage = {
  get: (): ProfileData | null => getStorageItem<ProfileData>(STORAGE_KEYS.PROFILE),

  set: (data: ProfileData): void => setStorageItem(STORAGE_KEYS.PROFILE, data),

  clear: (): void => removeStorageItem(STORAGE_KEYS.PROFILE),

  getWorkerId: (): string | null => profileStorage.get()?.workerId ?? null,

  getWorkerName: (): string | null => profileStorage.get()?.workerName ?? null,

  getRelatedSiteId: (): string | null => profileStorage.get()?.relatedSiteId ?? null,

  setFromWorkerInfo: (workerInfo: Record<string, unknown>): void => {
    const data: ProfileData = {
      workerId: String(workerInfo.id ?? ''),
      workerName: String(workerInfo.nameKo ?? ''),
    }
    if (workerInfo.relatedSiteId) {
      data.relatedSiteId = String(workerInfo.relatedSiteId)
    }
    if (data.workerId || data.workerName) {
      profileStorage.set(data)
    }
  },
}

// ============================================
// Check-In Storage
// ============================================

export const checkInStorage = {
  get: (): CheckInData | null => getStorageItem<CheckInData>(STORAGE_KEYS.CHECK_IN),

  set: (data: CheckInData): void => setStorageItem(STORAGE_KEYS.CHECK_IN, data),

  clear: (): void => removeStorageItem(STORAGE_KEYS.CHECK_IN),

  getSiteId: (): string | null => checkInStorage.get()?.siteId ?? null,

  getSiteName: (): string | null => checkInStorage.get()?.siteName ?? null,

  getSiteAddress: (): string | null => checkInStorage.get()?.siteAddress ?? null,

  getServerTimestamp: (): string | null => checkInStorage.get()?.serverTimestamp ?? null,
}

// ============================================
// Today Attendance Storage (supports 2 sites per day)
// ============================================

const getTodayDateString = (): string => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const MAX_CHECKINS_PER_DAY = 2

export const todayAttendanceStorage = {
  get: (): TodayAttendanceData | null => {
    const data = getStorageItem<TodayAttendanceData>(STORAGE_KEYS.TODAY_ATTENDANCE)
    // Reset if date is not today
    if (data && data.date !== getTodayDateString()) {
      todayAttendanceStorage.clear()
      return null
    }
    return data
  },

  set: (data: TodayAttendanceData): void => setStorageItem(STORAGE_KEYS.TODAY_ATTENDANCE, data),

  clear: (): void => removeStorageItem(STORAGE_KEYS.TODAY_ATTENDANCE),

  // Initialize today's attendance if not exists
  init: (): TodayAttendanceData => {
    const existing = todayAttendanceStorage.get()
    if (existing) return existing

    const initial: TodayAttendanceData = {
      date: getTodayDateString(),
      records: [],
    }
    todayAttendanceStorage.set(initial)
    return initial
  },

  // Check-in to a site (adds record without checkOutTime)
  checkIn: (data: CheckInData): boolean => {
    const attendance = todayAttendanceStorage.init()

    // Already checked in (has a record without checkOutTime)
    const inProgressRecord = attendance.records.find(r => !r.checkOutTime)
    if (inProgressRecord) return false

    // Reached daily limit
    if (attendance.records.length >= MAX_CHECKINS_PER_DAY) return false

    // Add new record with checkInTime only
    const newRecord: AttendanceRecord = {
      id: data.id,
      siteId: data.siteId,
      siteName: data.siteName,
      siteAddress: data.siteAddress,
      checkInTime: data.serverTimestamp || new Date().toISOString(),
    }
    attendance.records.push(newRecord)
    todayAttendanceStorage.set(attendance)
    return true
  },

  // Check-out from current site (updates the in-progress record with checkOutTime)
  checkOut: (checkOutTime?: string): AttendanceRecord | null => {
    const attendance = todayAttendanceStorage.get()
    if (!attendance) return null

    // Find the in-progress record (without checkOutTime)
    const inProgressIndex = attendance.records.findIndex(r => !r.checkOutTime)
    if (inProgressIndex === -1) return null

    // Update the record with checkOutTime
    attendance.records[inProgressIndex].checkOutTime = checkOutTime || new Date().toISOString()
    todayAttendanceStorage.set(attendance)
    return attendance.records[inProgressIndex]
  },

  // Get current check-in state (the in-progress record)
  getCurrentCheckIn: (): CheckInData | null => {
    const records = todayAttendanceStorage.get()?.records ?? []
    const inProgress = records.find(r => !r.checkOutTime)
    if (!inProgress) return null
    return {
      id: inProgress.id,
      siteId: inProgress.siteId,
      siteName: inProgress.siteName,
      siteAddress: inProgress.siteAddress,
      serverTimestamp: inProgress.checkInTime,
    }
  },

  // Get all records
  getRecords: (): AttendanceRecord[] => {
    return todayAttendanceStorage.get()?.records ?? []
  },

  // Get completed records (with checkOutTime)
  getCompletedRecords: (): AttendanceRecord[] => {
    return (todayAttendanceStorage.get()?.records ?? []).filter(r => !!r.checkOutTime)
  },

  // Get check-out count (completed records)
  getCheckOutCount: (): number => {
    return todayAttendanceStorage.getCompletedRecords().length
  },

  // Check if can check-in (not currently checked in and not reached limit)
  canCheckIn: (): boolean => {
    const attendance = todayAttendanceStorage.get()
    if (!attendance) return true
    const hasInProgress = attendance.records.some(r => !r.checkOutTime)
    return !hasInProgress && attendance.records.length < MAX_CHECKINS_PER_DAY
  },

  // Check if currently checked in (has in-progress record)
  isCheckedIn: (): boolean => {
    const records = todayAttendanceStorage.get()?.records ?? []
    return records.some(r => !r.checkOutTime)
  },

  // Check if daily limit reached
  isLimitReached: (): boolean => {
    const attendance = todayAttendanceStorage.get()
    return (attendance?.records.length ?? 0) >= MAX_CHECKINS_PER_DAY
  },
}

// ============================================
// Monthly Attendance Storage
// ============================================

interface MonthlyAttendanceData {
  year: number
  month: number
  records: unknown[]
  attendanceDays?: number
  totalWorkEffort?: number
}

export const monthlyAttendanceStorage = {
  get: (year: number, month: number): unknown[] | null => {
    const data = getStorageItem<MonthlyAttendanceData>(STORAGE_KEYS.MONTHLY_ATTENDANCE)
    // Return records only if they match the requested year/month
    if (data && data.year === year && data.month === month) {
      return data.records
    }
    return null
  },

  getSummary: (year: number, month: number): { attendanceDays: number; totalWorkEffort: number } | null => {
    const data = getStorageItem<MonthlyAttendanceData>(STORAGE_KEYS.MONTHLY_ATTENDANCE)
    if (data && data.year === year && data.month === month) {
      return {
        attendanceDays: data.attendanceDays ?? 0,
        totalWorkEffort: data.totalWorkEffort ?? 0,
      }
    }
    return null
  },

  set: (year: number, month: number, records: unknown[], attendanceDays?: number, totalWorkEffort?: number): void => {
    setStorageItem(STORAGE_KEYS.MONTHLY_ATTENDANCE, { year, month, records, attendanceDays, totalWorkEffort })
  },

  clear: (): void => removeStorageItem(STORAGE_KEYS.MONTHLY_ATTENDANCE),
}

// ============================================
// Auto-Login Storage
// ============================================

export const autoLoginStorage = {
  get: (): AutoLoginData | null => getStorageItem<AutoLoginData>(STORAGE_KEYS.AUTO_LOGIN),

  set: (data: AutoLoginData): void => setStorageItem(STORAGE_KEYS.AUTO_LOGIN, data),

  clear: (): void => removeStorageItem(STORAGE_KEYS.AUTO_LOGIN),
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
// Clear All Storage (for logout)
// ============================================

export const clearAllStorage = (): void => {
  authStorage.clear()
  profileStorage.clear()
  checkInStorage.clear()
  todayAttendanceStorage.clear()
  monthlyAttendanceStorage.clear()
  autoLoginStorage.clear()
  fileStorage.clear()
}
