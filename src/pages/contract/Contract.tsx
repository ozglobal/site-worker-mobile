import { useState, useCallback } from "react"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Spinner } from "@/components/ui/spinner"
import { useContracts } from "@/lib/queries/useContracts"
import { fetchSigningLink, fetchDocumentPdf, type EfsDocument, type SigningStage } from "@/lib/contract"
import { useToast } from "@/contexts/ToastContext"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { ChevronRight as ChevronRightIcon, ChevronDown as ExpandMoreIcon } from "lucide-react"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { useAuth } from "@/contexts/AuthContext"

// ── Badge ─────────────────────────────────────────────────

interface BadgeConfig {
  label: string
  className: string
}

function stageBadge(stage: SigningStage): BadgeConfig {
  switch (stage) {
    case 'COMPLETED':
      return { label: '서명 완료', className: 'bg-green-50 text-green-600 border-green-200' }
    case 'AWAITING_WORKER':
      return { label: '서명 필요', className: 'bg-red-50 text-red-500 border-red-200' }
    case 'AWAITING_MANAGER':
      return { label: '관리자 서명 대기', className: 'bg-blue-50 text-blue-600 border-blue-200' }
    case 'SENT':
      return { label: '서명 필요', className: 'bg-red-50 text-red-500 border-red-200' }
    case 'DRAFT':
      return { label: '미발송', className: 'bg-slate-50 text-slate-500 border-slate-200' }
    case 'REJECTED':
      return { label: '반려', className: 'bg-orange-50 text-orange-500 border-orange-200' }
    case 'CANCELLED':
      return { label: '취소', className: 'bg-slate-50 text-slate-400 border-slate-200' }
    case 'EXPIRED':
      return { label: '만료', className: 'bg-slate-50 text-slate-400 border-slate-200' }
    default:
      return { label: stage, className: 'bg-slate-50 text-slate-500 border-slate-200' }
  }
}

// ── Document Row ──────────────────────────────────────────

interface DocRowProps {
  doc: EfsDocument
  label: string
  onAction: (doc: EfsDocument) => void
  loading: boolean
}

function DocRow({ doc, label, onAction, loading }: DocRowProps) {
  const badge = stageBadge(doc.signingStage)
  const canAct = doc.signingStage === 'AWAITING_WORKER' || doc.signingStage === 'COMPLETED' || doc.signingStage === 'SENT'
  const isUrgent = doc.signingStage === 'AWAITING_WORKER' || doc.signingStage === 'SENT'
  const actionLabel = doc.signingStage === 'COMPLETED' ? '보기' : '서명하기'

  return (
    <div
      className={`flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm ${
        isUrgent ? 'border-red-300 ring-2 ring-red-200' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-col items-start gap-1.5 min-w-0 flex-1">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
          {badge.label}
        </span>
        <span className="text-sm font-semibold text-slate-900">{label}</span>
      </div>
      {canAct && (
        <button
          type="button"
          disabled={loading}
          onClick={() => onAction(doc)}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
        >
          {loading ? <Spinner size="sm" /> : (
            <>
              {actionLabel}
              <ChevronRightIcon className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ── Month Section ─────────────────────────────────────────

function formatMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  return `${y}년 ${Number(m)}월`
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

  const hasUnsigned = groups.some((g) => g.contract?.signingStage === 'AWAITING_WORKER')

  const handleAction = useCallback(async (doc: EfsDocument) => {
    if (actionLoading) return
    setActionLoading(doc.id)

    // Open the window synchronously inside the user gesture so mobile browsers
    // don't block it as a popup. We navigate it to the real URL after the fetch.
    const win = window.open('about:blank', '_blank')

    try {
      if (doc.signingStage === 'AWAITING_WORKER' || doc.signingStage === 'SENT') {
        const result = await fetchSigningLink(doc.id)
        if (result.success && result.data) {
          if (win) win.location.href = result.data
        } else {
          win?.close()
          showError(!result.success ? result.error : '서명 링크를 가져올 수 없습니다.')
        }
      } else if (doc.signingStage === 'COMPLETED') {
        const result = await fetchDocumentPdf(doc.id)
        if (result.success && result.data) {
          if (win) win.location.href = result.data
          setTimeout(() => URL.revokeObjectURL(result.data), 60_000)
        } else {
          win?.close()
          showError(!result.success ? result.error : 'PDF를 열 수 없습니다.')
        }
      } else {
        win?.close()
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
        {/* Unsigned alert */}
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
            className="flex items-center gap-1 text-lg font-bold text-slate-900"
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
        <div className="px-4 py-2 space-y-6 pb-8">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
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

                {g.contract ? (
                  <DocRow
                    doc={g.contract}
                    label="근로계약서"
                    onAction={handleAction}
                    loading={actionLoading === g.contract.id}
                  />
                ) : g.delegation ? (
                  <p className="rounded-xl border bg-white px-4 py-3 text-sm text-slate-400">계약서 없음</p>
                ) : null}

                {g.delegation && (
                  <DocRow
                    doc={g.delegation}
                    label="노무비위임장"
                    onAction={handleAction}
                    loading={actionLoading === g.delegation.id}
                  />
                )}

                {g.extras.map((doc) => (
                  <DocRow
                    key={doc.id}
                    doc={doc}
                    label={doc.title}
                    onAction={handleAction}
                    loading={actionLoading === doc.id}
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
