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

/**
 * Compress image to JPEG with max width, returns a Blob
 */
function compressImage(file: File, maxWidth = 1024, quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = img.width > maxWidth ? maxWidth / img.width : 1
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/jpeg',
        quality,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

/**
 * Convert Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export type DocumentType = 'id_card_front' | 'safety_cert' | 'bankbook'

export interface UploadDocumentResponse {
  success: boolean
  error?: string
}

/**
 * Upload document via POST /system/worker/me/document?documentType=...
 */
export const uploadDocument = async (
  documentType: DocumentType,
  file: File
): Promise<UploadDocumentResponse> => {
  const endpoint = `/system/worker/me/document?documentType=${documentType}`
  try {
    const compressed = await compressImage(file)
    const base64 = await blobToBase64(compressed)
    console.log('[PROFILE] uploadDocument request:', { documentType, fileName: file.name, originalSize: file.size, compressedSize: compressed.size, base64Length: base64.length })
    devLogRequestRaw(endpoint, { documentType, fileName: file.name })
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
        'X-Tenant-Id': X_TENANT_ID,
      },
      body: JSON.stringify({ file: base64 }),
    })

    const json = await safeJson(response) as Record<string, unknown> | null
    console.log('[PROFILE] uploadDocument response:', { status: response.status, data: json })
    devLogApiRaw(endpoint, { status: response.status, data: json })

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error('[PROFILE] uploadDocument error:', error)
    reportError('PROFILE_DOCUMENT_UPLOAD_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}
