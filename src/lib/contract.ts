import { authFetch } from './auth'
import { API_BASE_URL } from './config'
import { safeJson, type ApiResult } from './api-result'
import { reportError } from './errorReporter'
import { logDebug } from '../utils/devLog'

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
  // contract-level context fields (may be present on list response)
  workerType?: string | null
  dailyWage?: number | null
  siteName?: string | null
}

export interface ContractGroup {
  contractId: string | null
  contract?: EfsDocument
  delegation?: EfsDocument
  extras: EfsDocument[]
}

export interface MonthGroup {
  month: string        // "2026-04"
  groups: ContractGroup[]
}

// ── Helpers ───────────────────────────────────────────────

const isContract = (d: EfsDocument) => d.docTypeCode?.startsWith('DAILY_CONTRACT_') ?? false
const isDelegation = (d: EfsDocument) => d.docTypeCode?.startsWith('LABOR_COST_DELEGATION_') ?? false
const byCreateDesc = (a: EfsDocument, b: EfsDocument) => b.createTime.localeCompare(a.createTime)

let _nullSeq = 0

export function groupByMonth(docs: EfsDocument[]): MonthGroup[] {
  // Level 1: bucket by month
  const monthBuckets = new Map<string, EfsDocument[]>()
  for (const d of docs) {
    const key = d.contractMonth ?? d.createTime.slice(0, 7)
    if (!monthBuckets.has(key)) monthBuckets.set(key, [])
    monthBuckets.get(key)!.push(d)
  }

  return [...monthBuckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, items]) => {
      // Level 2: bucket by site within the month — 한 현장의 근로계약서·노무비위임장을
      // 한 카드에 묶어 보여준다. (근로계약서/위임장은 백엔드에서 별개 Contract 라
      //  contractId 가 달라, contractId 로 묶으면 현장이 같아도 카드가 쪼개지던 문제 수정)
      const siteBuckets = new Map<string, EfsDocument[]>()
      for (const d of items) {
        const key = d.siteName ?? `__nosite_${_nullSeq++}`
        if (!siteBuckets.has(key)) siteBuckets.set(key, [])
        siteBuckets.get(key)!.push(d)
      }

      const groups: ContractGroup[] = [...siteBuckets.entries()]
        .map(([, cdocs]) => {
          const sorted = [...cdocs].sort(byCreateDesc)
          const contract = sorted.find(isContract)
          const delegation = sorted.find(isDelegation)
          const extras = sorted.filter((d) => d !== contract && d !== delegation)
          const contractId = contract?.contractId ?? delegation?.contractId ?? null
          return { contractId, contract, delegation, extras }
        })
        // Sort groups within a month: oldest first (by earliest doc createTime)
        .sort((a, b) => {
          const earliest = (g: ContractGroup) =>
            [...[g.contract, g.delegation, ...g.extras].filter(Boolean) as EfsDocument[]]
              .map((d) => d.createTime)
              .sort()[0] ?? ''
          return earliest(a).localeCompare(earliest(b))
        })

      return { month, groups }
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
    logDebug('[signing-link] items', items)
    const link = items[0]?.linkUrl || ''
    logDebug('[signing-link] selected linkUrl', link)
    if (!link) return { success: false, error: '서명 링크가 없습니다.' }
    return { success: true, data: link }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    reportError('CONTRACT_SIGNING_LINK_FAIL', msg)
    return { success: false, error: msg }
  }
}
