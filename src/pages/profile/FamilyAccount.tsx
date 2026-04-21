import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { ProgressBar } from "@/components/ui/progress-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useOnboardingDraft } from "@/contexts/OnboardingDraftContext"
import { workerMetaStorage } from "@/lib/storage"
import { updatePayment } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"
import { useQueryClient } from "@tanstack/react-query"
import { useDictItems } from "@/lib/queries/useDictItems"
import { useBankNames } from "@/lib/queries/useBankNames"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { codeOfNameOrCode, labelOf } from "@/utils/dict"

interface FamilyAccountPageProps {
  mode?: "onboarding" | "profile"
}

export function FamilyAccountPage({ mode = "profile" }: FamilyAccountPageProps) {
  const navigate = useNavigate()
  const { patch: patchDraft } = useOnboardingDraft()
  const { showSuccess, showError } = useToast()
  const queryClient = useQueryClient()
  const { data: relationOptions = [] } = useDictItems("account_holder_relation")
  const { data: banks = [] } = useBankNames()
  const { data: profile, refetch } = useWorkerProfile()
  const [familyName, setFamilyName] = useState("")
  const [relationship, setRelationship] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Always fetch fresh /system/worker/me on open.
  useEffect(() => {
    if (mode === "profile") refetch()
  }, [mode, refetch])

  // Pre-fill form from backend profile when in profile mode.
  // Only hydrate when the active payment target is PROXY — otherwise the
  // backend's single record belongs to SELF/COMPANY and shouldn't leak
  // into the family form. Show an empty form instead.
  useEffect(() => {
    if (mode !== "profile" || !profile) return

    if (profile.wagePaymentTarget === "PROXY") {
      setFamilyName(profile.accountHolder || "")

      // Resolve accountHolderRelation to a dict code so the Select highlights it.
      // The backend can return the code in any casing (PARENT / parent / Parent)
      // or even the label itself ("부모" / "배우자"). Try every match before giving up.
      const rawRel = (profile.accountHolderRelation || "").trim()
      const rawLower = rawRel.toLowerCase()
      const relCode =
        relationOptions.find((o) => o.code === rawRel)?.code ??
        relationOptions.find((o) => o.code.toLowerCase() === rawLower)?.code ??
        relationOptions.find((o) => o.name === rawRel)?.code ??
        relationOptions.find((o) => o.name?.toLowerCase() === rawLower)?.code ??
        // Last-resort alias table for common backend uppercase variants.
        ({
          PARENT: relationOptions.find((o) => /parent|부모/i.test(o.name || ""))?.code,
          SPOUSE: relationOptions.find((o) => /spouse|배우|부부/i.test(o.name || ""))?.code,
          CHILD: relationOptions.find((o) => /child|자녀|자식/i.test(o.name || ""))?.code,
        }[rawRel.toUpperCase()] as string | undefined) ??
        rawRel
      setRelationship(relCode)

      // Backend returns bank label (e.g. "국민은행"); Select expects id (e.g. "kb").
      setSelectedBank(codeOfNameOrCode(banks, profile.bankName || ""))
      setAccountNumber(profile.bankAccount || "")
    } else {
      setFamilyName("")
      setRelationship("")
      setSelectedBank("")
      setAccountNumber("")
    }
  }, [profile, mode, relationOptions, banks])

  const resolveBankLabel = (code: string) => labelOf(banks, code, code)

  const handleSubmit = async () => {
    const bankLabel = resolveBankLabel(selectedBank)
    // Dict already supplies backend codes — no local translation needed.
    const relationCode = relationship

    if (mode === "onboarding") {
      patchDraft({
        bankName: bankLabel,
        bankAccount: accountNumber,
        accountHolder: familyName,
        accountHolderRelation: relationCode,
        wagePaymentTarget: 'PROXY',
      })
      navigate("/onboarding/daily-wage")
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const result = await updatePayment({
        wagePaymentTarget: 'PROXY',
        bankName: bankLabel,
        bankAccount: accountNumber,
        accountHolder: familyName,
        accountHolderRelation: relationCode,
      })
      if (!result.success) {
        showError(result.error)
        return
      }
      workerMetaStorage.patch({ wagePaymentTarget: 'PROXY' })
      // Invalidate cached /system/worker/me so the card + form fields
      // refetch the new payment info on the next render.
      queryClient.invalidateQueries({ queryKey: ['workerProfile'] })
      showSuccess("저장되었습니다.")
      navigate("/profile/payroll-account")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = !!familyName && !!relationship && !!selectedBank && accountNumber.replace(/\D/g, "").length >= 7

  const keyboardOpen = useKeyboardOpen()

  const handleNavigation = useBottomNavHandler()

  const content = (
    <>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-slate-900">가족 명의 계좌 정보를 입력해주세요</h1>
        <p className="mt-1 text-sm text-gray-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
      </div>
      <div className="px-4 py-6 space-y-5">
        {/* Family Member Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">예금주</label>
          <Input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="예금주 이름"
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">예금주와의 관계</label>
          <Select
            options={relationOptions.map((o) => ({ value: o.code, label: o.name }))}
            value={relationship}
            onChange={setRelationship}
            placeholder="관계 선택"
          />
        </div>

        {/* Bank Select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">은행명</label>
          <Select
            options={banks.map((b) => ({ value: b.code, label: b.name }))}
            value={selectedBank}
            onChange={setSelectedBank}
            placeholder="은행 선택"
          />
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">계좌번호</label>
          <Input
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
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        <AppHeader
          showLeftAction={true}
          title=""
          showRightAction={false}
          onLeftActionClick={() => navigate(-1)}
          className="shrink-0"
        />
        <ProgressBar value={70} />
        <main className="flex-1 overflow-y-auto">
          <div className="flex flex-col min-h-full">
            {content}
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction={true}
        title="가족 대리수령"
        showRightAction={false}
        onLeftActionClick={() => navigate(-1)}
        className="shrink-0"
      />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          {content}
          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={isFormValid && !isSubmitting ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
            >
              저장
            </Button>
          </div>
        </div>
      </main>
      <AppBottomNav active="profile" onNavigate={handleNavigation} className="shrink-0" />
    </div>
  )
}
