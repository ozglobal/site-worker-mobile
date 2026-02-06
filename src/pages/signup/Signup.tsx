import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"

export function SignUpPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
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
            {/* Option 1: Own phone */}
            <button
              onClick={() => navigate("/signup/nice-api")}
              className="w-full p-4 rounded-lg border-2 transition-colors text-left border-gray-200 hover:border-gray-300"
            >
              <p className="font-bold text-slate-900">내 명의 휴대폰이 있어요</p>
              <p className="text-sm text-slate-500 mt-1">
                내 명의 휴대폰 번호로 가입합니다.
              </p>
            </button>

            {/* Option 2: Other's phone */}
            <button
              onClick={() => navigate("/signup/sms-verification", { state: { phoneType: "other" } })}
              className="w-full p-4 rounded-lg border-2 transition-colors text-left border-gray-200 hover:border-gray-300"
            >
              <p className="font-bold text-slate-900">타인 명의 휴대폰이 있어요</p>
              <p className="text-sm text-slate-500 mt-1">
                타인 명의 휴대폰 번호로 가입합니다.
              </p>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
