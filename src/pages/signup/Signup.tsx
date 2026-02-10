import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { OptionCard } from "@/components/ui/option-card"

export function SignUpPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={handleBack}
        className="shrink-0"
      />

      <main className="flex-1 overflow-y-auto px-4">
        <div className="mt-4">
          <p className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
            회원 가입을 위해 본인 인증을<br />진행해 주세요
          </p>

          <div className="space-y-3">
            <OptionCard
              title="내 명의 휴대폰이 있어요"
              description="내 명의 휴대폰 번호로 가입합니다."
              onClick={() => navigate("/signup/nice-api")}
            />
            <OptionCard
              title="타인 명의 휴대폰이 있어요"
              description="타인 명의 휴대폰 번호로 가입합니다."
              onClick={() => navigate("/signup/sms-verification", { state: { phoneType: "other" } })}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
