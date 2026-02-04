import { authFetch } from './auth'
import { devLogApiRaw, devLogRequestRaw } from '../utils/devLog'
import { profileStorage } from './storage'
import { API_BASE_URL, X_TENANT_ID } from './config'

export interface WorkerMeResponse {
  success: boolean
  data?: WorkerMeData
  error?: string
}

export interface WorkerMeData {
  workerName: string
  ssnFirst: string
  ssnSecond: string
  phone: string
  address: string
  accountHolder: string
  bankName: string
  bankAccountMasked: string
}

/**
 * Fetch current worker profile from GET /system/worker/me
 * and sync to profileStorage
 */
export const fetchWorkerMe = async (): Promise<WorkerMeResponse> => {
  try {
    devLogRequestRaw('/system/worker/me', null)
    const response = await authFetch(`${API_BASE_URL}/system/worker/me`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'X-Tenant-Id': X_TENANT_ID,
      },
    })

    const json = await response.json()
    devLogApiRaw('/system/worker/me', { status: response.status, data: json })

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` }
    }

    const payload = json.data || json.result || json

    const data: WorkerMeData = {
      workerName: payload.nameKo || '',
      ssnFirst: payload.ssnFirst || payload.residentFirst || '',
      ssnSecond: payload.ssnSecond || payload.residentSecond || '',
      phone: payload.mobilePhone || '',
      address: payload.address || '',
      accountHolder: payload.accountHolder || '',
      bankName: payload.bankName || '',
      bankAccountMasked: payload.bankAccountMasked || '',
    }

    // Sync to profileStorage
    const existing = profileStorage.get()
    if (existing) {
      profileStorage.set({
        ...existing,
        workerName: data.workerName || existing.workerName,
        ssnFirst: data.ssnFirst,
        ssnSecond: data.ssnSecond,
        phone: data.phone,
        address: data.address,
      })
    }

    return { success: true, data }
  } catch (error) {
    console.error('[PROFILE] fetchWorkerMe error:', error)
    return { success: false, error: 'Network error' }
  }
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
  error?: string
}

/**
 * Change password via PATCH /user/profile/password
 */
export const changePassword = async (params: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
  try {
    const body = {
      oldPassword: params.currentPassword,
      newPassword: params.newPassword,
    }
    devLogRequestRaw('/user/profile/password', body)
    const response = await authFetch(`${API_BASE_URL}/user/profile/password`, {
      method: 'PATCH',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
        'X-Tenant-Id': X_TENANT_ID,
      },
      body: JSON.stringify(body),
    })

    const json = await response.json()
    devLogApiRaw('/user/profile/password', { status: response.status, data: json })

    if (!response.ok) {
      return { success: false, error: json.message || `API error: ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error('[PROFILE] changePassword error:', error)
    return { success: false, error: 'Network error' }
  }
}
