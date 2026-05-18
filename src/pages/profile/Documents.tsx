import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { type StatusType } from "@/components/ui/status-list-item"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { ChevronRight as ChevronRightIcon } from "lucide-react"
import { useDocumentSummary } from "@/lib/queries/useDocumentSummary"
import { usePendingSignDocuments } from "@/lib/queries/usePendingSignDocuments"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { useToast } from "@/contexts/ToastContext"
import { requiredDocsCatalogue, type RequiredDocMeta } from "@/lib/documents"

const ALIEN_REG_CODES = new Set(["alien_reg", "alien_reg_front", "alien_reg_back"])
const ALIEN_REG_SUB_CODES = new Set(["alien_reg_front", "alien_reg_back"])

function mapStatus(status: string | undefined): { status: StatusType; label: string } {
  switch (status) {
    case "uploaded":
      return { status: "pending", label: "승인 대기" }
    case "approved":
      return { status: "complete", label: "승인 완료" }
    case "rejected":
      return { status: "error", label: "반려" }
    case "resubmission_requested":
      return { status: "error", label: "재제출 요청" }
    case "expired":
      return { status: "incomplete", label: "만료" }
    default:
      return { status: "incomplete", label: "미제출" }
  }
}

const badgeClassFor = (status: StatusType): string => {
  switch (status) {
    case "complete":
      // 승인 완료
      return "bg-[#16A34A1A] text-[#16A34A]"
    case "pending":
      // 승인 대기
      return "bg-[#EA580C1A] text-[#EA580C]"
    case "error":
      // 반려 / 재제출 요청
      return "bg-red-50 text-red-600"
    default:
      // 미제출 / 만료 — 같은 색 (#DC26261A)
      return "bg-[#DC26261A] text-[#DC2626]"
  }
}

export function ProfileDocumentsPage() {
  const navigate = useNavigate()
  const { showInfo } = useToast()
  const { data: summary, isLoading, isError, refetch, sites: docSites, documents: rawDocs } = useDocumentSummary()
  const { data: profile } = useWorkerProfile()
  // Fire-and-forget: surfaces any eformsign documents the worker still needs
  // to sign. Payload consumed elsewhere once the UI for it is designed.
  usePendingSignDocuments()

  const handleNavigation = useBottomNavHandler()

  // id_card 라벨은 근로자의 nationalityType 에 따라 동적으로 표시:
  //  - domestic → 주민등록증
  //  - foreigner_registered → 외국인등록증
  //  - foreigner_unregistered → 여권 사본
  const idCardLabelByNationality: Record<string, string> = {
    domestic: '주민등록증',
    foreigner_registered: '외국인등록증',
    foreigner_unregistered: '여권 사본',
  }
  const idCardLabel = (profile?.nationalityType && idCardLabelByNationality[profile.nationalityType]) || null

  const baseDocs = (summary || []).filter((item) => !ALIEN_REG_SUB_CODES.has(item.code)).map((item) => {
    const catalogue: RequiredDocMeta | undefined = requiredDocsCatalogue[item.code]
    const baseLabel = item.label || catalogue?.label || item.code
    return {
      code: item.code,
      label: item.code === 'id_card' && idCardLabel ? idCardLabel : baseLabel,
      method: item.method || catalogue?.method || "upload",
      status: item.status,
      state: item.state,
      perSite: catalogue?.perSite ?? false,
    }
  })

  // Expand per-site documents into one row per assigned site so each (doc, site)
  // pair can carry its own siteName subtitle and status.
  interface DocRow {
    key: string
    code: string
    label: string
    method: string
    status?: string
    state?: 'missing' | 'completed'
    siteName?: string
    siteId?: string
    validUntil?: string | null
  }
  const lookupValidUntil = (code: string, siteId?: string): string | null => {
    // 코드별 만료일 위치가 다름:
    //  - alien_reg → workers.residence_period_end (profile.residencePeriodEnd)
    //  - passport → workers.passport_expiry_date (profile.passportExpiryDate)
    //  - 그 외 → worker_documents.valid_until (documents[].validUntil)
    if (code === 'alien_reg') return profile?.residencePeriodEnd ?? null
    if (code === 'passport') return profile?.passportExpiryDate ?? null
    const match = rawDocs.find((d) =>
      d.documentType === code && (siteId ? d.siteId === siteId : true),
    )
    return match?.validUntil ?? null
  }
  const docs: DocRow[] = baseDocs.flatMap((d) => {
    if (!d.perSite || docSites.length === 0) {
      return [{
        key: d.code,
        code: d.code,
        label: d.label,
        method: d.method,
        status: d.status,
        state: d.state,
        validUntil: lookupValidUntil(d.code),
      }]
    }
    // 현장별 행으로 펼침. state 는 해당 현장의 missing/completedGroups 로 판정,
    // status(uploaded/approved/rejected)는 rawDocs 에서 (code, siteId) 로 조회.
    return docSites
      .filter((s) => s.requiredGroups.includes(d.code))
      .map((s) => {
        let state: 'missing' | 'completed' | undefined
        if (s.missingGroups.includes(d.code)) {
          state = 'missing'
        } else if (s.completedGroups.includes(d.code)) {
          state = 'completed'
        }
        // 현장별 doc 의 status — 글로벌(site_id=NULL) status 를 쓰지 않고 해당 현장 doc 만 조회.
        // (글로벌 doc 이 다른 현장 행까지 '승인 대기' 로 물들이던 버그 수정)
        const status = rawDocs.find(
          (rd) => rd.documentType === d.code && rd.siteId === s.siteId,
        )?.status
        return {
          key: `${d.code}::${s.siteId}`,
          code: d.code,
          label: d.label,
          method: d.method,
          status,
          state,
          siteName: s.siteName,
          siteId: s.siteId,
          validUntil: lookupValidUntil(d.code, s.siteId),
        }
      })
  })

  const formatExpiryInfo = (validUntil: string | null | undefined): { label: string; className: string } | null => {
    if (!validUntil) return null
    const d = new Date(validUntil)
    if (Number.isNaN(d.getTime())) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
    const ymd = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    const label = diff >= 0 ? `만료일: ${ymd} (D-${diff})` : `만료일: ${ymd} (D+${-diff})`
    // 만료(D+N) 또는 7일 이내: 빨강 / 8~30일: 주황 / 그 외: 회색
    const className =
      diff < 0 || diff <= 7 ? 'text-red-600'
      : diff <= 30 ? 'text-amber-600'
      : 'text-slate-500'
    return { label, className }
  }

  const viewerSlugByCode: Record<string, string> = {
    id_card: "id-card",
    bankbook: "bankbook",
    family_relation: "family-relation",
    safety_cert: "safety-cert",
    passport: "passport",
  }

  const handleView = (code: string, siteId?: string) => {
    if (ALIEN_REG_CODES.has(code)) {
      navigate("/profile/documents/alien-reg")
      return
    }
    if (code === "passport") {
      navigate("/profile/documents/passport")
      return
    }
    if (code === "equipment_license") {
      navigate("/profile/equipments-list")
      return
    }
    const slug = viewerSlugByCode[code]
    if (slug) {
      const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : ""
      navigate(`/profile/documents/view/${slug}${query}`)
      return
    }
    showInfo("미리보기는 준비 중입니다.")
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100">
      <AppTopBar title="제출서류" onBack={() => navigate(-1)} className="h-14 shrink-0" />

      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : isError ? (
          <QueryErrorState onRetry={() => refetch()} message="제출서류 정보를 불러오지 못했습니다." />
        ) : docs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            제출이 필요한 서류가 없습니다.
          </div>
        ) : (
          <div className="mt-6 mx-4 bg-white rounded-xl border border-gray-300 shadow-sm">
            {docs.map((doc, idx) => {
              const mapped = mapStatus(doc.status)
              const isLast = idx === docs.length - 1
              const expiry = formatExpiryInfo(doc.validUntil)
              // 만료일이 오늘보다 과거 → 백엔드 status와 무관하게 "만료됨" 뱃지로 override.
              const isExpired = (() => {
                if (!doc.validUntil) return false
                const d = new Date(doc.validUntil)
                if (Number.isNaN(d.getTime())) return false
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return d.getTime() < today.getTime()
              })()
              const displayBadge = isExpired
                ? { status: 'error' as StatusType, label: '만료됨' }
                : mapped

              return (
                <button
                  key={doc.key}
                  type="button"
                  onClick={() => handleView(doc.code, doc.siteId)}
                  className={`w-full flex items-center justify-between gap-3 px-4 h-[60px] text-left transition-colors hover:bg-slate-50 ${isLast ? "" : "border-b border-gray-200"}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-slate-900 leading-tight">{doc.label}</p>
                    {(doc.siteName || expiry) && (
                      <div>
                        {doc.siteName && (
                          <span className="text-xs text-slate-500 leading-tight">{doc.siteName}</span>
                        )}
                        {doc.siteName && expiry && (
                          <span className="text-xs text-slate-400 leading-tight"> · </span>
                        )}
                        {expiry && (
                          <span className={`text-xs font-medium leading-tight ${expiry.className}`}>{expiry.label}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${badgeClassFor(displayBadge.status)}`}>
                      {displayBadge.label}
                    </span>
                    <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      <AppBottomNav active="profile" onNavigate={handleNavigation} className="shrink-0" />
    </div>
  )
}
