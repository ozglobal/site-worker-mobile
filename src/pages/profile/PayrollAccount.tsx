import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { OptionCard } from "@/components/ui/option-card"
import { ProgressBar } from "@/components/ui/progress-bar"
import { useOnboardingDraft } from "@/contexts/OnboardingDraftContext"
import { workerMetaStorage } from "@/lib/storage"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"

interface PayrollAccountPageProps {
  mode?: "onboarding" | "profile"
}

export function PayrollAccountPage({ mode = "profile" }: PayrollAccountPageProps) {
  const navigate = useNavigate()
  const { patch: patchDraft } = useOnboardingDraft()
  const { data: profile } = useWorkerProfile()

  const effectiveTarget = profile?.wagePaymentTarget
  const target: 'SELF' | 'PROXY' | 'COMPANY' | undefined =
    effectiveTarget === 'SELF' ||
    effectiveTarget === 'PROXY' ||
    effectiveTarget === 'COMPANY'
      ? effectiveTarget
      : undefined
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

  const handleCompany = () => {
    if (mode === "onboarding") {
      patchDraft({
        bankName: null,
        bankAccount: null,
        accountHolder: null,
        accountHolderRelation: null,
        wagePaymentTarget: 'COMPANY',
      })
      navigate("/onboarding/daily-wage")
    } else {
      // TODO: PUT /system/worker/me/payment with wagePaymentTarget: 'COMPANY'
      workerMetaStorage.patch({ wagePaymentTarget: 'COMPANY' })
      navigate("/profile")
    }
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
          <OptionCard
            title="소속 회사"
            description="소속된 용역 업체로 급여 지급"
            onClick={() => selectTarget('COMPANY')}
            className={cardClass('COMPANY')}
          />
        </div>
      </main>
    </div>
  )
}
