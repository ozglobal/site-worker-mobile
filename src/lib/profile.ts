import { authFetch } from './auth'
import { devLogApiRaw, devLogRequestRaw } from '../utils/devLog'
import { safeJson } from './api-result'
import { API_BASE_URL, X_TENANT_ID } from './config'
import { reportError } from './errorReporter'

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

    const json = await safeJson(response) as Record<string, unknown> | null
    devLogApiRaw('/system/worker/me', { status: response.status, data: json })

    if (!json) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` }
    }

    const payload = (json.data || json.result || json) as Record<string, unknown>

    const data: WorkerMeData = {
      workerName: (payload.nameKo as string) || '',
      ssnFirst: (payload.ssnFirst as string) || (payload.residentFirst as string) || '',
      ssnSecond: (payload.ssnSecond as string) || (payload.residentSecond as string) || '',
      phone: (payload.mobilePhone as string) || '',
      address: (payload.address as string) || '',
      accountHolder: (payload.accountHolder as string) || '',
      bankName: (payload.bankName as string) || '',
      bankAccountMasked: (payload.bankAccountMasked as string) || '',
    }

    return { success: true, data }
  } catch (error) {
    console.error('[PROFILE] fetchWorkerMe error:', error)
    reportError('PROFILE_FETCH_FAIL', 'Network error', { endpoint: '/system/worker/me' })
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

    const json = await safeJson(response) as Record<string, unknown> | null
    devLogApiRaw('/user/profile/password', { status: response.status, data: json })

    if (!json) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      return { success: false, error: (json.message as string) || `API error: ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error('[PROFILE] changePassword error:', error)
    reportError('PROFILE_PASSWORD_FAIL', 'Network error', { endpoint: '/user/profile/password' })
    return { success: false, error: 'Network error' }
  }
}
