import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { AppHeader } from "@/components/layout/AppHeader"
import { OptionCard } from "@/components/ui/option-card"
import { ProgressBar } from "@/components/ui/progress-bar"
import { useOnboardingDraft } from "@/contexts/OnboardingDraftContext"
import { workerMetaStorage } from "@/lib/storage"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { updatePayment } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"

interface PayrollAccountPageProps {
  mode?: "onboarding" | "profile"
}

export function PayrollAccountPage({ mode = "profile" }: PayrollAccountPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { patch: patchDraft } = useOnboardingDraft()
  const { data: profile } = useWorkerProfile()
  const { showSuccess, showError } = useToast()

  const effectiveTarget = profile?.wagePaymentTarget
  const target: 'SELF' | 'PROXY' | 'COMPANY' | undefined =
    effectiveTarget === 'SELF' ||
    effectiveTarget === 'PROXY' ||
    effectiveTarget === 'COMPANY'
      ? effectiveTarget
      : undefined

  // Company-account option is only relevant for 용역 (labor_service) workers —
  // hide for everyone else. Compare case-insensitively since the backend dict
  // may surface either "labor_service" or "LABOR_SERVICE".
  const showCompanyOption = (profile?.workerCategory || "").toLowerCase() === "labor_service"
  const routes = mode === "onboarding"
    ? { myAccount: "/onboarding/my-account", familyAccount: "/onboarding/family-account" }
    : { myAccount: "/profile/my-account", familyAccount: "/profile/family-account" }

  const selectTarget = (t: 'SELF' | 'PROXY' | 'COMPANY') => {
    if (t === 'SELF') {
      navigate(routes.myAccount)
    } else if (t === 'PROXY') {
      workerMetaStorage.patch({ wagePaymentTarget: 'PROXY' })
      navigate(routes.familyAccount)
    } else {
      handleCompany()
    }
  }

  const cardClass = (t: 'SELF' | 'PROXY' | 'COMPANY') => {
    // No target set yet — show all 3 cards with a white, neutral look.
    if (!target) return "border-gray-200 bg-white"
    return target === t
      ? "border-primary bg-white"
      : "border-gray-200 bg-gray-100 text-slate-500"
  }

  const handleCompany = async () => {
    if (mode === "onboarding") {
      patchDraft({
        bankName: null,
        bankAccount: null,
        accountHolder: null,
        accountHolderRelation: null,
        wagePaymentTarget: 'COMPANY',
      })
      navigate("/onboarding/daily-wage")
      return
    }

    const result = await updatePayment({
      wagePaymentTarget: 'COMPANY',
      bankName: null,
      bankAccount: null,
      accountHolder: null,
      accountHolderRelation: null,
    })
    if (!result.success) {
      showError(result.error)
      return
    }
    workerMetaStorage.patch({ wagePaymentTarget: 'COMPANY' })
    queryClient.invalidateQueries({ queryKey: ['workerProfile'] })
    showSuccess("급여를 소속 회사로 지급합니다.")
    navigate("/profile")
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={() => navigate(-1)}
        className="shrink-0"
      />

      {mode === "onboarding" && <ProgressBar value={40} />}

      <main className="flex-1 overflow-y-auto px-4 pt-4">
        <div className="pb-6">
          <h1 className="text-lg font-bold text-slate-900">급여 지급 방식</h1>
          <p className="mt-1 text-sm text-gray-500">급여 지급 방식을 선택해주세요</p>
        </div>

        <div className="space-y-3">
          <OptionCard
            title="본인 계좌"
            description={
              target === 'SELF' && profile?.accountHolder
                ? profile.accountHolder
                : "본인 명의 계좌로 급여 지급"
            }
            onClick={() => selectTarget('SELF')}
            className={cardClass('SELF')}
          />
          <OptionCard
            title="가족 계좌"
            description={
              target === 'PROXY' && profile?.accountHolder
                ? profile.accountHolder
                : "가족 명의 계좌로 급여 지급"
            }
            onClick={() => selectTarget('PROXY')}
            className={cardClass('PROXY')}
          />
          {showCompanyOption && (
            <OptionCard
              title="소속 회사"
              description="소속된 용역 업체로 급여 지급"
              onClick={() => selectTarget('COMPANY')}
              className={cardClass('COMPANY')}
            />
          )}
        </div>
      </main>
    </div>
  )
}
