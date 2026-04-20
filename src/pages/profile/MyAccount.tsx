import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { ProgressBar } from "@/components/ui/progress-bar"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { updatePayment } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"
import { workerMetaStorage } from "@/lib/storage"
import { getWorkerName } from "@/lib/auth"
import { useQueryClient } from "@tanstack/react-query"
import { useDictItems } from "@/lib/queries/useDictItems"

interface MyAccountPageProps {
  mode?: "onboarding" | "profile"
}

export function MyAccountPage({ mode = "profile" }: MyAccountPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: profile, isLoading: loading, isError, refetch } = useWorkerProfile()
  const { data: banks = [] } = useDictItems("bank")
  const { showSuccess, showError } = useToast()
  const accountNumberRef = useRef<HTMLInputElement>(null)
  const [accountHolder, setAccountHolder] = useState(getWorkerName() || "")
  const [selectedBank, setSelectedBank] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Always fetch fresh /system/worker/me when the page opens so
  // accountHolder / accountHolderRelation / bankName / bankAccount reflect
  // the latest server state (useWorkerProfile has staleTime: Infinity).
  useEffect(() => {
    if (mode === "profile") refetch()
  }, [mode, refetch])

  useEffect(() => {
    if (mode !== "profile" || !profile) return
    // 예금주 defaults to the worker's own name even when no SELF record exists,
    // because that's what will be saved when the user submits.
    setAccountHolder(profile.workerName || getWorkerName() || "")

    // Only hydrate bank fields when the active payment target is SELF.
    // Otherwise show an empty form (the backend's single payment record
    // belongs to PROXY/COMPANY and shouldn't leak into the SELF form).
    if (profile.wagePaymentTarget === "SELF") {
      const raw = profile.bankName || ""
      const bankCode = banks.find((b) => b.name === raw)?.code || raw
      setSelectedBank(bankCode)
      setAccountNumber(profile.bankAccount || "")
    } else {
      setSelectedBank("")
      setAccountNumber("")
    }
  }, [profile, mode, banks])

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const bankLabel = banks.find((b) => b.code === selectedBank)?.name || selectedBank
      const result = await updatePayment({
        wagePaymentTarget: "SELF",
        bankName: bankLabel,
        bankAccount: accountNumber,
        accountHolder,
        accountHolderRelation: null,
      })
      if (!result.success) {
        showError(result.error)
        return
      }
      workerMetaStorage.patch({ wagePaymentTarget: 'SELF' })
      // Invalidate cached /system/worker/me so the card + form fields
      // refetch the new payment info on the next render.
      queryClient.invalidateQueries({ queryKey: ['workerProfile'] })
      showSuccess("저장되었습니다.")
      navigate("/profile/payroll-account")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFamilyProxy = () => {
    navigate(mode === "onboarding" ? "/onboarding/family-account" : "/profile/family-account")
  }

  const isFormValid = !!selectedBank && accountNumber.replace(/\D/g, "").length >= 7

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

  const handleNavigation = (item: NavItem) => {
    if (item === "home") navigate("/home")
    else if (item === "attendance") navigate("/attendance")
    else if (item === "contract") navigate("/contract")
    else if (item === "profile") navigate("/profile")
  }

  const content = (
    <>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-slate-900">본인 계좌 정보를 입력해주세요</h1>
        <p className="mt-1 text-sm text-gray-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
      </div>
      <div className="px-4 py-6 space-y-5">
        {/* Account Holder Name (readonly) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">예금주</label>
          <div className="w-full h-12 px-4 flex items-center rounded-lg border border-gray-200 bg-gray-50 text-slate-500">
            {accountHolder}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-3">
            <ErrorOutlineIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-700">본인 명의 계좌가 아닌가요?</p>
              <p className="text-sm text-slate-500 mt-1">가족 명의 계좌로 대리 수령이 가능합니다.</p>
              <button onClick={handleFamilyProxy} className="text-sm text-primary font-medium mt-2">
                가족 대리수령 신청하기
              </button>
            </div>
          </div>
        </div>

        {/* Bank Select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">은행명</label>
          <Select
            options={banks.map((b) => ({ value: b.code, label: b.name }))}
            value={selectedBank}
            onChange={(v) => { setSelectedBank(v); setTimeout(() => accountNumberRef.current?.focus(), 300) }}
            placeholder="은행 선택"
          />
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">계좌번호</label>
          <Input
            ref={accountNumberRef}
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="- 없이 숫자만 입력"
          />
        </div>

      </div>
    </>
  )

  if (mode === "onboarding") {
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
        <ProgressBar value={70} />
        <main className="flex-1 overflow-y-auto">
          {content}
        </main>
        <div className="px-4 py-4 shrink-0">
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
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction={true}
        title="계좌 정보"
        showRightAction={false}
        onLeftActionClick={() => navigate(-1)}
        className="shrink-0"
      />

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : isError ? (
          <QueryErrorState onRetry={() => refetch()} message="계좌 정보를 불러오지 못했습니다." />
        ) : (
          <div className="flex flex-col min-h-full">
            {content}
            <div className="px-4 py-6 mt-auto">
              <Button
                variant={isFormValid ? "primary" : "primaryDisabled"}
                size="full"
                disabled={!isFormValid || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        )}
      </main>

      <AppBottomNav active="profile" onNavigate={handleNavigation} className="shrink-0" />
    </div>
  )
}
