import { authFetch, getWorkerId } from './auth'
import { API_BASE_URL } from './config'
import { safeJson, type ApiResult } from './api-result'
import { reportError } from './errorReporter'

export interface NoticeItem {
  id: string
  type: string
  title: string
  content: string
  priority: string
  readDate: string | null
  createTime: string
  path: string | null
}

interface NoticeListResponse {
  list: NoticeItem[]
  total: number
  page: number
  size: number
}

/** Fetch notice inbox for current worker */
export async function fetchNotices(page = 1, size = 20): Promise<ApiResult<NoticeListResponse>> {
  try {
    const workerId = getWorkerId()
    if (!workerId) return { success: false, error: '근로자 정보가 없습니다' }

    const params = new URLSearchParams({
      recipientType: 'WORKER',
      recipientId: workerId,
      page: String(page),
      size: String(size),
    })

    const response = await authFetch(`${API_BASE_URL}/notices/inbox?${params}`)
    const json = await safeJson(response) as { code?: number; message?: string; data?: NoticeListResponse } | null

    if (!json || !response.ok) {
      const msg = json?.message || `HTTP ${response.status}`
      reportError('NOTICE_FETCH_FAIL', msg)
      return { success: false, error: msg }
    }

    const payload = json.data || (json as unknown as NoticeListResponse)
    return { success: true, data: payload }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    reportError('NOTICE_FETCH_FAIL', msg)
    return { success: false, error: msg }
  }
}

/** Mark a single notice as read */
export async function markNoticeRead(id: string): Promise<ApiResult<void>> {
  try {
    const response = await authFetch(`${API_BASE_URL}/notices/inbox/${id}/read`, { method: 'PATCH' })
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Mark all notices as read */
export async function markAllNoticesRead(): Promise<ApiResult<void>> {
  try {
    const workerId = getWorkerId()
    if (!workerId) return { success: false, error: '근로자 정보가 없습니다' }

    const params = new URLSearchParams({
      recipientType: 'WORKER',
      recipientId: workerId,
    })

    const response = await authFetch(`${API_BASE_URL}/notices/inbox/read-all?${params}`, { method: 'PATCH' })
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
