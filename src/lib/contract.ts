import { authFetch } from './auth'
import { API_BASE_URL } from './config'
import { safeJson, type ApiResult } from './api-result'
import { reportError } from './errorReporter'
import { devLogApiRaw, devLogRequestRaw } from '../utils/devLog'

interface DocumentApiItem {
  id: string
  efsDocumentId: string
  title: string
  status: string
  bizType: string
  bizId: string
  hasPdf: boolean
  statusUpdatedAt: string
  completedAt: string | null
  createTime: string
}

interface DocumentListResponse {
  list: DocumentApiItem[]
  total: number
  page: number
  size: number
  pages: number
  empty: boolean
  first: boolean
  last: boolean
}

export interface ContractItem {
  id: string
  title: string
  month: number | null
  status: "sent" | "in_progress" | "completed"
  createTime: string
}

/** Fetch contracts from API for a given year */
export async function fetchContracts(year: number): Promise<ApiResult<ContractItem[]>> {
  try {
    const params = new URLSearchParams({
      page: '1',
      size: '100',
      sorts: 'createTime,desc',
      bizType: 'worker_contract',
      year: String(year),
    })

    const endpoint = `/efs/api/documents?${params}`
    devLogRequestRaw(endpoint, { page: 1, size: 100, sorts: 'createTime,desc', bizType: 'worker_contract', year })

    const response = await authFetch(`${API_BASE_URL}${endpoint}`)
    const json = await safeJson(response) as { code?: number; message?: string; data?: DocumentListResponse } | null

    devLogApiRaw(endpoint, { status: response.status, data: json })

    if (!json || !response.ok) {
      const msg = json?.message || `HTTP ${response.status}`
      reportError('CONTRACT_FETCH_FAIL', msg)
      return { success: false, error: msg }
    }

    const payload: DocumentListResponse = json.data || (json as unknown as DocumentListResponse)
    const contracts: ContractItem[] = (payload.list || []).map((item) => ({
      id: item.id,
      title: item.title,
      month: item.createTime ? new Date(item.createTime).getMonth() + 1 : null,
      status: (item.status as ContractItem['status']) || 'sent',
      createTime: item.createTime,
    }))

    return { success: true, data: contracts }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    devLogApiRaw('/efs/api/documents', { error: msg })
    reportError('CONTRACT_FETCH_FAIL', msg)
    return { success: false, error: msg }
  }
}

/** Fetch PDF for a completed document — returns a blob URL to open */
export async function fetchDocumentPdf(documentId: string): Promise<ApiResult<string>> {
  try {
    const endpoint = `/efs/api/documents/${encodeURIComponent(documentId)}/pdf`
    devLogRequestRaw(endpoint, { documentId })

    const response = await authFetch(`${API_BASE_URL}${endpoint}`)

    devLogApiRaw(endpoint, { status: response.status })

    if (!response.ok) {
      const msg = `HTTP ${response.status}`
      reportError('CONTRACT_PDF_FAIL', msg)
      return { success: false, error: msg }
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    return { success: true, data: blobUrl }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    devLogApiRaw('/efs/api/documents/pdf', { error: msg })
    reportError('CONTRACT_PDF_FAIL', msg)
    return { success: false, error: msg }
  }
}

interface SigningLinkItem {
  id: string
  documentId: string
  signerType: string
  efsMemberId: string
  workflowSeq: number
  workflowName: string
  linkUrl: string
  status: string
  issuedAt: string
  expiresAt: string
}

/** Fetch signing link for a document */
export async function fetchSigningLink(documentId: string): Promise<ApiResult<string>> {
  try {
    const endpoint = `/efs/api/signing-link?documentId=${encodeURIComponent(documentId)}`
    devLogRequestRaw(endpoint, { documentId })

    const response = await authFetch(`${API_BASE_URL}${endpoint}`)
    const json = await safeJson(response) as { code?: number; message?: string; data?: SigningLinkItem[] } | null

    devLogApiRaw(endpoint, { status: response.status, data: json })

    if (!json || !response.ok) {
      const msg = json?.message || `HTTP ${response.status}`
      reportError('CONTRACT_SIGNING_LINK_FAIL', msg)
      return { success: false, error: msg }
    }

    const link = json.data?.[0]?.linkUrl || ''
    if (!link) {
      return { success: false, error: '서명 링크가 없습니다.' }
    }
    return { success: true, data: link }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    devLogApiRaw('/efs/api/signing-link', { error: msg })
    reportError('CONTRACT_SIGNING_LINK_FAIL', msg)
    return { success: false, error: msg }
  }
}
