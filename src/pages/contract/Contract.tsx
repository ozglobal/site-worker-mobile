import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { Badge } from "@/components/ui/badge"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"

interface ContractItem {
  month: number
  status: "signed" | "unsigned"
}

const currentYear = new Date().getFullYear()

function generateContracts(year: number): ContractItem[] {
  const now = new Date()
  const maxMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12
  // Limit to 3 contracts maximum (show months 12-10 for past years)
  const count = Math.min(maxMonth, 3)
  return Array.from({ length: count }, (_, i) => ({
    month: maxMonth - i,
    status: "signed" as const,
  }))
}

export function ContractPage() {
  const navigate = useNavigate()
  const [year, setYear] = useState(currentYear)
  const [yearOpen, setYearOpen] = useState(false)

  const contracts = generateContracts(year)

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
          {contracts.map((contract) => {
            const getContractUrl = () => {
              if (year === 2026 && contract.month === 1) {
                return "https://www.eformsign.com/eform/document/external_view_service.html?company_id=127ffd45d6784499a726f642eab83214&document_id=4279cf3f24394e3c9bb3eaa3ff7283f2&outsider_token_id=8b616d31907b46a6971f33f360adb3b1&country_code=kr&viewerLang=ko"
              } else if (year === 2025 && [12, 11, 10].includes(contract.month)) {
                return "https://cworker.eformsign.io/assets/contract_2025_12.pdf?v=2"
              }
              return undefined
            }
            const url = getContractUrl()
            const handleClick = () => {
              if (url) {
                window.open(url, '_blank')
              }
            }
            return (
            <div
              key={contract.month}
              role="button"
              tabIndex={0}
              onClick={handleClick}
              onKeyDown={(e) => { if (e.key === 'Enter') handleClick() }}
              className={`w-full flex items-center justify-between bg-white rounded-xl border p-4 shadow-sm cursor-pointer ${year === currentYear && contract.month === new Date().getMonth() + 1 ? "border-[#DC2626] ring-[3px] ring-[#DC2626]/25" : "border-gray-100"}`}
            >
              <div className="flex flex-col items-start gap-2">
                {year === 2026 && contract.month === 1 ? (
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
                  {contract.month}월 근로계약서
                </span>
              </div>
              {year === 2026 && contract.month === 1 ? (
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
          )
          })}
        </div>
      </main>

      <AppBottomNav active="contract" className="shrink-0" onNavigate={handleNavigation} />
    </div>
  )
}
