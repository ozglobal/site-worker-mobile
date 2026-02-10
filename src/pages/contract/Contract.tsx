import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { Badge } from "@/components/ui/badge"
import { useContracts } from "@/lib/queries/useContracts"
import { QueryErrorState } from "@/components/ui/query-error-state"
import type { ContractItem } from "@/lib/contract"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

export function ContractPage() {
  const navigate = useNavigate()
  const [year, setYear] = useState(currentYear)
  const [yearOpen, setYearOpen] = useState(false)

  const { data: s3Contracts = [], isLoading, isError, refetch } = useContracts(year)

  const years = Array.from({ length: 2 }, (_, i) => currentYear - i)

  // Build contract list: current month (unsigned) + S3 files (signed)
  const contracts: ContractItem[] = []

  // Add current month's unsigned contract (for 2026 February)
  if (year === currentYear) {
    contracts.push({
      id: `unsigned-${currentMonth}`,
      name: `${currentMonth}월 근로계약서`,
      month: currentMonth,
      status: "unsigned",
      url: "https://www.eformsign.com/eform/document/external_view_service.html?company_id=127ffd45d6784499a726f642eab83214&document_id=4279cf3f24394e3c9bb3eaa3ff7283f2&outsider_token_id=8b616d31907b46a6971f33f360adb3b1&country_code=kr&viewerLang=ko",
    })
  }

  // Add S3 contracts (exclude current month if already added as unsigned)
  s3Contracts.forEach((contract) => {
    if (year === currentYear && contract.month === currentMonth) {
      // Skip - already added as unsigned
      return
    }
    contracts.push(contract)
  })

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

  const handleCardClick = (url: string) => {
    if (url) {
      window.open(url, "_blank")
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
                onClick={() => handleCardClick(contract.url)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCardClick(contract.url) }}
                className={`w-full flex items-center justify-between bg-white rounded-xl border p-4 shadow-sm cursor-pointer ${
                  year === currentYear && contract.month === currentMonth
                    ? "border-[#DC2626] ring-[3px] ring-[#DC2626]/25"
                    : "border-gray-100"
                }`}
              >
                <div className="flex flex-col items-start gap-2">
                  {contract.status === "unsigned" ? (
                    <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-red-50 text-red-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      미완료
                    </span>
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
                    {contract.month ? `${contract.month}월 근로계약서` : contract.name}
                  </span>
                </div>
                {contract.status === "unsigned" ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                ) : (
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    보기
                    <ChevronRightIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      <AppBottomNav active="contract" className="shrink-0" onNavigate={handleNavigation} />
    </div>
  )
}
