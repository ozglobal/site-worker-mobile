import { authFetch } from './auth'
import { devLogApiRaw, devLogRequestRaw } from '../utils/devLog'
import { API_BASE_URL, X_TENANT_ID } from './config'
import { reportError } from './errorReporter'

// ============================================
// Types
// ============================================

export interface UploadedFile {
  originalName: string
  savedName: string
  size: number
  mimetype: string
  url: string
}

export interface UploadResult {
  success: boolean
  data?: UploadedFile[]
  error?: string
}

// ============================================
// Constants
// ============================================

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'application/pdf',
]

// ============================================
// Validation
// ============================================

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return '지원하지 않는 파일 형식입니다. 이미지 또는 PDF만 업로드 가능합니다.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return '파일 크기가 10MB를 초과합니다.'
  }
  return null
}

// ============================================
// Upload API
// ============================================

/**
 * Upload a single file to the server.
 *
 * Uses authFetch for automatic Bearer token handling.
 * Do NOT set Content-Type header — the browser auto-sets
 * multipart/form-data with the correct boundary for FormData.
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  const validationError = validateFile(file)
  if (validationError) {
    return { success: false, error: validationError }
  }

  try {
    const formData = new FormData()
    formData.append('files', file)

    devLogRequestRaw('/uploads', {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    const response = await authFetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      headers: {
        'X-Tenant-Id': X_TENANT_ID,
      },
      body: formData,
    })

    const responseData = await response.json()
    devLogApiRaw('/uploads', { status: response.status, data: responseData })

    if (!response.ok) {
      return {
        success: false,
        error: responseData.message || `업로드 실패 (${response.status})`,
      }
    }

    const payload = responseData.data || responseData
    return {
      success: true,
      data: Array.isArray(payload) ? payload : [payload],
    }
  } catch (error) {
    reportError('UPLOAD_FAIL', error instanceof Error ? error.message : 'Upload network error', { endpoint: '/uploads' })
    return {
      success: false,
      error: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
    }
  }
}
