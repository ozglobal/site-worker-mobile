import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen"
import { ArrowLeft as ArrowBackIcon, AlertCircle as ErrorOutlineIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { ProgressBar } from "@/components/ui/progress-bar"
import { useActivePartners } from "@/lib/queries/useActivePartners"

export function OnboardingOutsourcingPage() {
  const navigate = useNavigate()
  const { data: partners, isLoading, isError, refetch } = useActivePartners()
  const [selectedCompany, setSelectedCompany] = useState("")

  const handleSubmit = () => {
    // TODO: Save outsourcing info
    navigate("/onboarding/company-account")
  }

  const isFormValid = selectedCompany !== ""

  const keyboardOpen = useKeyboardOpen()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Header with back button */}
      <div className="flex items-center px-4 h-14 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar value={35} />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
        {/* Title */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-lg font-bold text-slate-900">용역 회사 정보를 입력해주세요</h1>
          <p className="mt-1 text-sm text-gray-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
        </div>

        <div className="px-4 py-6 space-y-5">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              용역회사
            </label>
            {isLoading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : isError ? (
              <QueryErrorState message="용역회사 목록을 불러오지 못했습니다" onRetry={refetch} />
            ) : (
              <Select
                options={(partners || []).map((p) => ({ value: p.id, label: p.partnerName }))}
                value={selectedCompany}
                onChange={setSelectedCompany}
                placeholder="용역회사 선택"
              />
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-3">
              <ErrorOutlineIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-700">내 용역회사를 찾을 수 없나요?</p>
                <p className="text-sm text-slate-500 mt-1">목록에 용역회사가 보이지 않을 경우 현장 관리자에게 등록을 요청해주세요.</p>
              </div>
            </div>
          </div>
        </div>

          {/* Save Button */}
          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={isFormValid ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid}
              onClick={handleSubmit}
            >
              다음
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
