import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { OptionCard } from "@/components/ui/option-card"
import { ProgressBar } from "@/components/ui/progress-bar"

interface PayrollAccountPageProps {
  mode?: "onboarding" | "profile"
}

export function PayrollAccountPage({ mode = "profile" }: PayrollAccountPageProps) {
  const navigate = useNavigate()

  const routes = mode === "onboarding"
    ? { myAccount: "/onboarding/my-account", familyAccount: "/onboarding/family-account" }
    : { myAccount: "/profile/my-account", familyAccount: "/profile/family-account" }

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
          <h1 className="text-lg font-bold text-slate-900">급여 지급 방식을 알려주세요</h1>
          <p className="mt-1 text-sm text-gray-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
        </div>

        <div className="space-y-3">
          <OptionCard
            title="본인 계좌로 지급"
            description="본인이 입력한 계좌로 직접 지급"
            onClick={() => navigate(routes.myAccount)}
          />
          <OptionCard
            title="가족 계좌로 지급"
            description="가족 명의 계좌로 급여 지급"
            onClick={() => navigate(routes.familyAccount)}
          />
        </div>
      </main>
    </div>
  )
}
