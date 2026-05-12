import { useState, useCallback } from "react"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Spinner } from "@/components/ui/spinner"
import { useContracts } from "@/lib/queries/useContracts"
import { useDictItems } from "@/lib/queries/useDictItems"
import { fetchSigningLink, fetchDocumentPdf, type EfsDocument, type ContractGroup } from "@/lib/contract"
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



// ── Month Card ────────────────────────────────────────────

interface MonthCardProps {
  group: ContractGroup
  actionLoading: string | null
  onAction: (doc: EfsDocument) => void
  workerCategories: { code: string; name: string }[]
}

function badgePill(status: string) {
  switch (status) {
    case 'in_progress':  return { text: '현장관리자 서명 대기', cls: 'bg-orange-50 text-orange-500' }
    case 'sent':         return { text: '근로자 서명 대기',     cls: 'bg-red-50 text-red-500' }
    case 'completed':    return { text: '서명 완료',           cls: 'bg-green-50 text-green-600' }
    case 'rejected':     return { text: '서명 거절',           cls: 'bg-orange-50 text-orange-500' }
    case 'cancelled':    return { text: '취소',                cls: 'bg-slate-100 text-slate-400' }
    case 'deleted':      return { text: '삭제',                cls: 'bg-slate-100 text-slate-400' }
    case 'expired':      return { text: '만료',                cls: 'bg-slate-100 text-slate-400' }
    case 'send_failed':  return { text: '발송 실패',           cls: 'bg-slate-100 text-slate-400' }
    default:             return { text: status,               cls: 'bg-slate-100 text-slate-400' }
  }
}

function MonthCard({ group, actionLoading, onAction, workerCategories }: MonthCardProps) {
  const allDocs: { doc: EfsDocument; label: string }[] = []
  if (group.contract)   allDocs.push({ doc: group.contract,   label: '근로계약서' })
  if (group.delegation) allDocs.push({ doc: group.delegation, label: '노무비위임장' })
  group.extras.forEach((doc) => allDocs.push({ doc, label: doc.title }))

  const needsSign = allDocs.some((d) => d.doc.status === 'sent')

  const refDoc = group.contract ?? group.delegation ?? group.extras[0]
  const siteName = refDoc?.siteName ?? ''
  const dailyWage = refDoc?.dailyWage
  const rawWorkerType = refDoc?.workerType ?? ''
  const categoryLabel = workerCategories.find((c) => c.code === rawWorkerType)?.name ?? rawWorkerType
  const headerLine = [categoryLabel, dailyWage != null ? `${dailyWage.toLocaleString('ko-KR')}원` : ''].filter(Boolean).join(' · ')

  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white ${
        needsSign
          ? 'border-2 border-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.25)]'
          : 'border border-slate-200 shadow-sm'
      }`}
    >
      {(headerLine || siteName) && (
        <div className={`border-b px-4 py-4 ${needsSign ? 'border-red-100 bg-red-50' : 'border-slate-100 bg-black/[0.03]'}`}>
          {headerLine && <p className="text-sm font-bold text-slate-900">{headerLine}</p>}
          {siteName && <p className="mt-2 text-sm text-slate-500">{siteName}</p>}
        </div>
      )}

      {allDocs.map(({ doc, label }, i) => {
        const loading = actionLoading === doc.id
        const pill = badgePill(doc.status)

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
            {loading ? (
              <Spinner size="sm" />
            ) : doc.status === 'sent' ? (
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
  const { data: workerCategories = [] } = useDictItems('worker_category')

  const hasUnsigned = groups.some((mg) =>
    mg.groups.some((cg) =>
      [cg.contract, cg.delegation, ...cg.extras].some((d) => d?.status === 'sent')
    )
  )

  const handleAction = useCallback(async (doc: EfsDocument) => {
    if (actionLoading) return
    setActionLoading(doc.id)

    const win = window.open('about:blank', '_blank')

    try {
      if (doc.status === 'sent') {
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
            groups.map((mg) => (
              <section key={mg.month} className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-500">{formatMonth(mg.month)}</h3>
                {mg.groups.map((cg) => (
                  <MonthCard
                    key={cg.contractId ?? cg.contract?.id ?? cg.delegation?.id ?? cg.extras[0]?.id}
                    group={cg}
                    actionLoading={actionLoading}
                    onAction={handleAction}
                    workerCategories={workerCategories}
                  />
                ))}
              </section>
            ))
          )}
        </div>
      </main>

      <AppBottomNav active="contract" className="shrink-0" onNavigate={handleNavigation} />
    </div>
  )
}
