import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { Badge } from "@/components/ui/badge"
import { useContracts } from "@/lib/queries/useContracts"
import { fetchSigningLink, fetchDocumentPdf } from "@/lib/contract"
import { useToast } from "@/contexts/ToastContext"
import { QueryErrorState } from "@/components/ui/query-error-state"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"

const currentYear = new Date().getFullYear()

export function ContractPage() {
  const navigate = useNavigate()
  const [year, setYear] = useState(currentYear)
  const [yearOpen, setYearOpen] = useState(false)

  const { data: contracts = [], isLoading, isError, refetch } = useContracts(year)
  const { showError } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleSigningClick = useCallback(async (efsDocumentId: string) => {
    if (actionLoading) return
    setActionLoading(efsDocumentId)
    try {
      const result = await fetchSigningLink(efsDocumentId)
      if (result.success && result.data) {
        window.open(result.data, "_blank")
      } else {
        showError(!result.success ? result.error : '서명 링크를 가져올 수 없습니다.')
      }
    } finally {
      setActionLoading(null)
    }
  }, [actionLoading, showError])

  const handlePdfClick = useCallback(async (documentId: string) => {
    if (actionLoading) return
    setActionLoading(documentId)
    try {
      const result = await fetchDocumentPdf(documentId)
      if (result.success && result.data) {
        window.open(result.data, "_blank")
      } else {
        showError(!result.success ? result.error : 'PDF를 열 수 없습니다.')
      }
    } finally {
      setActionLoading(null)
    }
  }, [actionLoading, showError])

  const years = Array.from({ length: 2 }, (_, i) => currentYear - i)

  const handleNavigation = (item: NavItem) => {
    if (item === "home") {
      navigate("/home")
    } else if (item === "attendance") {
      navigate("/attendance")
    } else if (item === "contract") {
      // Already on contract page
    } else if (item === "profile") {
      navigate("/profile")
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <AppHeader showLeftAction={false} title="시재건설" showRightAction={true} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        {/* Year Selector */}
        <div className="px-4 pt-4 pb-2 relative">
          <button
            onClick={() => setYearOpen(!yearOpen)}
            className="flex items-center gap-1 text-lg font-bold text-slate-900"
          >
            {year}년
            <ExpandMoreIcon className="h-5 w-5 text-slate-500" />
          </button>
          {yearOpen && (
            <div className="absolute top-full left-4 z-10 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => { setYear(y); setYearOpen(false) }}
                  className={`block w-full px-6 py-3 text-left text-base ${y === year ? "font-bold text-primary" : "text-slate-700"} hover:bg-slate-50`}
                >
                  {y}년
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contract List */}
        <div className="px-4 py-2 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">로딩 중...</div>
          ) : isError ? (
            <QueryErrorState onRetry={() => refetch()} message="계약서를 불러오지 못했습니다." />
          ) : contracts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">계약서가 없습니다.</div>
          ) : (
            contracts.map((contract) => (
              <div
                key={contract.id}
                role="button"
                tabIndex={0}
                onClick={
                  contract.status === "sent"
                    ? () => handleSigningClick(contract.id)
                    : contract.status === "in_progress" || contract.status === "completed"
                    ? () => handlePdfClick(contract.id)
                    : undefined
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (contract.status === "sent") handleSigningClick(contract.id)
                    else if (contract.status === "in_progress" || contract.status === "completed") handlePdfClick(contract.id)
                  }
                }}
                className={`w-full flex items-center justify-between bg-white rounded-xl border p-4 shadow-sm ${
                  contract.status === "sent"
                    ? "border-[#DC2626] ring-[3px] ring-[#DC2626]/25 cursor-pointer"
                    : contract.status === "completed"
                    ? "border-green-500 cursor-pointer"
                    : "border-blue-500 cursor-pointer"
                }`}
              >
                <div className="flex flex-col items-start gap-2">
                  {contract.status === "sent" ? (
                    <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-red-50 text-red-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      미완료
                    </span>
                  ) : contract.status === "in_progress" ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 font-medium text-xs px-2 py-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-1">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      진행중
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 font-medium text-xs px-2 py-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-1">
                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      완료
                    </Badge>
                  )}
                  <span className="text-base font-semibold text-slate-900">
                    {contract.title}
                  </span>
                  <span className="text-sm text-slate-400">
                    {contract.createTime?.slice(0, 10)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  보기
                  <ChevronRightIcon className="h-4 w-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <AppBottomNav active="contract" className="shrink-0" onNavigate={handleNavigation} />
    </div>
  )
}
