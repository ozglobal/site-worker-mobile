import { useState, useCallback } from "react"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Spinner } from "@/components/ui/spinner"
import { useContracts } from "@/lib/queries/useContracts"
import { useHomeData } from "@/lib/queries/useHomeData"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { useDictItems } from "@/lib/queries/useDictItems"
import { fetchSigningLink, fetchDocumentPdf, type EfsDocument, type MonthGroup, type SigningStage } from "@/lib/contract"
import { useToast } from "@/contexts/ToastContext"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { ChevronDown as ExpandMoreIcon } from "lucide-react"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { useAuth } from "@/contexts/AuthContext"

// ── Helpers ───────────────────────────────────────────────

function formatMonth(yyyyMM: string): string {
  const [, m] = yyyyMM.split('-')
  return `${Number(m)}월`
}


function badgeText(stage: SigningStage): string {
  switch (stage) {
    case 'AWAITING_WORKER':  return '서명 필요'
    case 'AWAITING_MANAGER': return '관리자 승인 대기'
    case 'COMPLETED':        return '완료'
    case 'SENT':             return '승인 대기'
    case 'DRAFT':            return '미발송'
    case 'REJECTED':         return '반려'
    case 'CANCELLED':        return '취소'
    case 'EXPIRED':          return '만료'
    default:                 return stage
  }
}

// ── Month Card ────────────────────────────────────────────

interface MonthCardProps {
  group: MonthGroup
  actionLoading: string | null
  onAction: (doc: EfsDocument) => void
  dailyWageSnapshot?: number | null
  workerCategoryLabel?: string
  siteName?: string
}

function badgePill(stage: SigningStage) {
  switch (stage) {
    case 'AWAITING_WORKER':  return { text: badgeText(stage), cls: 'bg-red-50 text-red-500' }
    case 'AWAITING_MANAGER': return { text: badgeText(stage), cls: 'bg-orange-50 text-orange-500' }
    case 'COMPLETED':        return { text: badgeText(stage), cls: 'bg-green-50 text-green-600' }
    case 'SENT':             return { text: badgeText(stage), cls: 'bg-blue-50 text-blue-600' }
    case 'REJECTED':         return { text: badgeText(stage), cls: 'bg-orange-50 text-orange-500' }
    default:                 return { text: badgeText(stage), cls: 'bg-slate-100 text-slate-400' }
  }
}

function MonthCard({ group, actionLoading, onAction, dailyWageSnapshot, workerCategoryLabel, siteName }: MonthCardProps) {
  const allDocs: { doc: EfsDocument; label: string }[] = []
  if (group.contract)   allDocs.push({ doc: group.contract,   label: '근로계약서' })
  if (group.delegation) allDocs.push({ doc: group.delegation, label: '노무비위임장' })
  group.extras.forEach((doc) => allDocs.push({ doc, label: doc.title }))

  const needsSign = allDocs.some((d) => d.doc.signingStage === 'AWAITING_WORKER')

  const headerParts = [workerCategoryLabel, dailyWageSnapshot != null ? `${dailyWageSnapshot.toLocaleString('ko-KR')}원` : ''].filter(Boolean)
  const headerLine = headerParts.join(' · ')

  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ${
        needsSign ? 'border-2 border-red-400' : 'border border-slate-200'
      }`}
    >
      {(headerLine || siteName) && (
        <div className="border-b border-slate-100 bg-black/[0.03] px-4 py-4">
          {headerLine && <p className="text-base font-bold text-slate-900">{headerLine}</p>}
          {siteName && <p className="mt-0.5 text-sm text-slate-500">{siteName}</p>}
        </div>
      )}

      {allDocs.map(({ doc, label }, i) => {
        const canAct = doc.signingStage === 'AWAITING_WORKER'
          || doc.signingStage === 'COMPLETED'
          || doc.signingStage === 'SENT'
        const loading = actionLoading === doc.id
        const pill = badgePill(doc.signingStage)

        return (
          <div
            key={doc.id}
            className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}
          >
            <span className="w-20 shrink-0 text-sm font-semibold text-slate-900">{label}</span>
            <div className="flex-1">
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${pill.cls}`}>
                {pill.text}
              </span>
            </div>
            {canAct && (
              loading ? (
                <Spinner size="sm" />
              ) : doc.signingStage === 'AWAITING_WORKER' ? (
                <button
                  type="button"
                  onClick={() => onAction(doc)}
                  className="shrink-0 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white active:opacity-80"
                >
                  서명하기
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onAction(doc)}
                  className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  열람
                </button>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

const currentYear = new Date().getFullYear()

export function ContractPage() {
  const { worker } = useAuth()
  const userId = worker?.userId ?? null

  const [year, setYear] = useState(currentYear)
  const [yearOpen, setYearOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { showError } = useToast()
  const handleNavigation = useBottomNavHandler()

  const { data: groups = [], isLoading, isError, refetch } = useContracts(userId, year)
  const { data: homeData } = useHomeData()
  const { data: profile } = useWorkerProfile()
  const { data: workerCategories = [] } = useDictItems('worker_category')
  const attendance = homeData?.todayAttendance.find((a) => a.dailyWageSnapshot != null) ?? homeData?.todayAttendance[0]
  const dailyWageSnapshot = attendance?.dailyWageSnapshot ?? null
  const siteName = attendance?.siteName ?? ''
  const categoryLabel = profile?.workerCategory
    ? (workerCategories.find((c) => c.code === profile.workerCategory)?.name ?? profile.workerCategory)
    : ''

  const hasUnsigned = groups.some((g) =>
    [g.contract, g.delegation, ...g.extras].some((d) => d?.signingStage === 'AWAITING_WORKER')
  )

  const handleAction = useCallback(async (doc: EfsDocument) => {
    if (actionLoading) return
    setActionLoading(doc.id)

    const win = window.open('about:blank', '_blank')

    try {
      if (doc.signingStage === 'AWAITING_WORKER') {
        const result = await fetchSigningLink(doc.id)
        if (result.success && result.data) {
          if (win) win.location.href = result.data
        } else {
          win?.close()
          showError(!result.success ? result.error : '서명 링크를 가져올 수 없습니다.')
        }
      } else {
        const result = await fetchDocumentPdf(doc.id)
        if (result.success && result.data) {
          if (win) win.location.href = result.data
          setTimeout(() => URL.revokeObjectURL(result.data), 60_000)
        } else {
          win?.close()
          showError(!result.success ? result.error : 'PDF를 열 수 없습니다.')
        }
      }
    } finally {
      setActionLoading(null)
    }
  }, [actionLoading, showError])

  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <AppHeader showLeftAction={false} title="계약서" showRightAction={true} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        {!isLoading && !isError && hasUnsigned && (
          <div className="px-4 pt-4">
            <AlertBanner
              title="서명하지 않은 근로계약서가 있어요"
              description="월말까지 서명하지 않을 경우, 급여가 지급되지 않을 수 있으니 반드시 확인해주세요."
            />
          </div>
        )}

        {/* Year selector */}
        <div className="relative px-4 pt-4 pb-2">
          <button
            onClick={() => setYearOpen(!yearOpen)}
            className="flex items-center gap-1 text-xl font-bold text-slate-900"
          >
            {year}년
            <ExpandMoreIcon className="h-5 w-5 text-slate-500" />
          </button>
          {yearOpen && (
            <div className="absolute top-full left-4 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => { setYear(y); setYearOpen(false) }}
                  className={`block w-full px-6 py-3 text-left text-base ${
                    y === year ? 'font-bold text-primary' : 'text-slate-700'
                  } hover:bg-slate-50`}
                >
                  {y}년
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-8 space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : isError ? (
            <QueryErrorState onRetry={() => refetch()} message="계약서를 불러오지 못했습니다." />
          ) : !userId ? (
            <p className="py-8 text-center text-sm text-slate-500">사용자 정보를 불러오는 중입니다.</p>
          ) : groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">{year}년 계약서가 없습니다.</p>
          ) : (
            groups.map((g) => (
              <section key={g.month} className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-500">{formatMonth(g.month)}</h3>
                <MonthCard
                  group={g}
                  actionLoading={actionLoading}
                  onAction={handleAction}
                  dailyWageSnapshot={dailyWageSnapshot}
                  workerCategoryLabel={categoryLabel}
                  siteName={siteName}
                />
              </section>
            ))
          )}
        </div>
      </main>

      <AppBottomNav active="contract" className="shrink-0" onNavigate={handleNavigation} />
    </div>
  )
}
