import { authFetch } from './auth'
import { API_BASE_URL } from './config'
import { safeJson, type ApiResult } from './api-result'
import { reportError } from './errorReporter'

// ── Types ─────────────────────────────────────────────────

export type SigningStage =
  | 'COMPLETED'
  | 'AWAITING_WORKER'
  | 'AWAITING_MANAGER'
  | 'SENT'
  | 'DRAFT'
  | 'REJECTED'
  | 'CANCELLED'
  | 'DELETED'
  | 'EXPIRED'
  | 'SEND_FAILED'

export interface EfsDocument {
  id: string
  efsDocumentId: string
  title: string
  status: string
  signingStage: SigningStage
  contractId: string | null
  docTypeCode: string | null
  contractMonth: string | null
  hasPdf: boolean
  statusUpdatedAt: string | null
  completedAt: string | null
  createTime: string
}

export interface MonthGroup {
  month: string        // "2026-04"
  contract?: EfsDocument
  delegation?: EfsDocument
  extras: EfsDocument[]
}

// ── Helpers ───────────────────────────────────────────────

const isContract = (d: EfsDocument) => d.docTypeCode?.startsWith('DAILY_CONTRACT_') ?? false
const isDelegation = (d: EfsDocument) => d.docTypeCode?.startsWith('LABOR_COST_DELEGATION_') ?? false
const byCreateDesc = (a: EfsDocument, b: EfsDocument) => b.createTime.localeCompare(a.createTime)

export function groupByMonth(docs: EfsDocument[]): MonthGroup[] {
  const buckets = new Map<string, EfsDocument[]>()
  for (const d of docs) {
    const key = d.contractMonth ?? d.createTime.slice(0, 7)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(d)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, items]) => {
      const contracts = items.filter(isContract).sort(byCreateDesc)
      const delegations = items.filter(isDelegation).sort(byCreateDesc)
      const contract = contracts[0]
      const delegation = delegations[0]
      const extras = items.filter((d) => d !== contract && d !== delegation)
      return { month, contract, delegation, extras }
    })
}

// ── API ───────────────────────────────────────────────────

/** Fetch all efs documents for the logged-in worker (sys_user.id) */
export async function fetchWorkerContracts(
  userId: string,
  siteId?: string | null,
  year?: number,
): Promise<ApiResult<EfsDocument[]>> {
  try {
    const params = new URLSearchParams({
      page: '1',
      size: '200',
      sortField: 'createTime',
      sortOrder: 'desc',
    })
    if (siteId) params.set('siteId', siteId)
    if (year) params.set('year', String(year))

    const response = await authFetch(
      `${API_BASE_URL}/efs/api/documents/user/${encodeURIComponent(userId)}?${params}`,
    )
    const json = await safeJson(response) as { code?: number; message?: string; data?: { list?: unknown[] } } | null

    if (!json || !response.ok) {
      const msg = (json as { message?: string } | null)?.message || `HTTP ${response.status}`
      reportError('CONTRACT_FETCH_FAIL', msg)
      return { success: false, error: msg }
    }

    const payload = json.data ?? (json as unknown as { list?: unknown[] })
    const list = (payload.list ?? []) as EfsDocument[]
    return { success: true, data: list }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    reportError('CONTRACT_FETCH_FAIL', msg)
    return { success: false, error: msg }
  }
}

/** Open PDF — handles 503 "still generating" with exponential back-off (3 attempts) */
export async function fetchDocumentPdf(documentId: string): Promise<ApiResult<string>> {
  const url = `${API_BASE_URL}/efs/api/documents/${encodeURIComponent(documentId)}/pdf`
  const delays = [5_000, 10_000, 20_000]

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const response = await authFetch(url)

      if (response.status === 503) {
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]))
          continue
        }
        reportError('CONTRACT_PDF_FAIL', 'PDF not yet available (503)')
        return { success: false, error: 'PDF가 아직 생성 중입니다. 잠시 후 다시 시도해주세요.' }
      }

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
      reportError('CONTRACT_PDF_FAIL', msg)
      return { success: false, error: msg }
    }
  }

  return { success: false, error: 'PDF를 열 수 없습니다.' }
}

interface SigningLinkItem {
  id: string
  documentId: string
  signerType: string
  linkUrl: string
  status: string
}

/** Fetch the worker-side signing link for a document awaiting worker signature */
export async function fetchSigningLink(documentId: string): Promise<ApiResult<string>> {
  try {
    const response = await authFetch(
      `${API_BASE_URL}/efs/api/signing-link?documentId=${encodeURIComponent(documentId)}`,
    )
    const json = await safeJson(response) as { code?: number; message?: string; data?: SigningLinkItem[] } | null

    if (!json || !response.ok) {
      const msg = (json as { message?: string } | null)?.message || `HTTP ${response.status}`
      reportError('CONTRACT_SIGNING_LINK_FAIL', msg)
      return { success: false, error: msg }
    }

    const items = json.data ?? []
    const link = (items.length >= 2 ? items[1]?.linkUrl : items[0]?.linkUrl) || ''
    if (!link) return { success: false, error: '서명 링크가 없습니다.' }
    return { success: true, data: link }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    reportError('CONTRACT_SIGNING_LINK_FAIL', msg)
    return { success: false, error: msg }
  }
}
