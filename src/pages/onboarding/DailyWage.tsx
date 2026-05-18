import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle as ErrorOutlineIcon } from "lucide-react"
import { submitWorkerOnboarding, completeWorkerOnboarding, updateDailyWage } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"
import { useOnboardingDraft } from "@/contexts/OnboardingDraftContext"
import { workerMetaStorage } from "@/lib/storage"

export function OnboardingDailyWagePage() {
  const navigate = useNavigate()
  const { showError } = useToast()
  const { get: getDraft, reset: resetDraft } = useOnboardingDraft()
  const [wage, setWage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const handleResize = () => {
      const keyboardVisible = window.innerHeight - viewport.height > 150
      setViewportHeight(keyboardVisible ? viewport.height : null)
    }
    viewport.addEventListener("resize", handleResize)
    return () => viewport.removeEventListener("resize", handleResize)
  }, [])

  const formatWage = (raw: string) => {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    return Number(digits).toLocaleString("ko-KR")
  }

  const isFormValid = wage.replace(/\D/g, "").length > 0

  const handleSubmit = async () => {
    if (isSubmitting) return
    const amount = Number(wage.replace(/\D/g, ""))
    if (!amount) return
    setIsSubmitting(true)
    const draft = getDraft()
    const onboardingResult = await submitWorkerOnboarding({
      bankName: draft.bankName,
      bankAccount: draft.bankAccount,
      accountHolder: draft.accountHolder,
      accountHolderRelation: draft.accountHolderRelation,
      equipmentCompanyName: draft.equipmentCompanyName,
      equipmentCompanyOwner: draft.equipmentCompanyOwner,
      wagePaymentTarget: draft.wagePaymentTarget,
      dailyWage: null,
    })
    if (!onboardingResult.success) {
      setIsSubmitting(false)
      showError(onboardingResult.error)
      return
    }
    const wageResult = await updateDailyWage(amount)
    if (!wageResult.success) {
      setIsSubmitting(false)
      showError(wageResult.error)
      return
    }
    const completeResult = await completeWorkerOnboarding()
    setIsSubmitting(false)
    if (!completeResult.success) {
      showError(completeResult.error)
      return
    }
    if (draft.wagePaymentTarget) {
      workerMetaStorage.patch({ wagePaymentTarget: draft.wagePaymentTarget })
    }
    resetDraft()
    setShowDone(true)
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-white"
      style={{ height: viewportHeight ? `${viewportHeight}px` : undefined }}
    >
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={() => navigate(-1)}
        className="shrink-0"
      />
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-lg font-bold text-slate-900">일급(노임)를 입력해주세요</h1>
          <p className="mt-1 text-sm text-gray-500">회사와 합의된 본인의 일급을 기재해주세요</p>
        </div>
        <div className="px-4 py-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">일급 (원)</label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatWage(wage)}
              onChange={(e) => setWage(e.target.value)}
              placeholder="일급 입력"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-3">
              <ErrorOutlineIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-500">
                입력한 정보는 관리자 확인 후 확정되며, 합의된 금액과 상이한 경우 관리자가 언제든지 변경할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </main>
      <div className="px-4 py-4 shrink-0">
        <Button
          variant={isFormValid ? "primary" : "primaryDisabled"}
          size="full"
          disabled={!isFormValid || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "저장 중..." : "저장"}
        </Button>
      </div>

      {/* 온보딩 완료 + 추가 등록 안내 다이얼로그 */}
      {showDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <p className="text-sm text-slate-700 leading-relaxed mb-3 whitespace-pre-line">
              {"회원 유형과 일급(노임)이 등록되었습니다.\n지금부터 현장에서 출퇴근 체크가 가능합니다.\n급여 지급을 위한 계좌정보 등록과 서류제출은 하단 [내 정보] 메뉴에서 할 수 있습니다."}
            </p>
            <Button
              variant="primary"
              size="full"
              onClick={() => {
                setShowDone(false)
                navigate("/home")
              }}
            >
              확인
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
