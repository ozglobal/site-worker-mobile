import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav } from "@/components/layout/AppBottomNav"

export function SignUpCompletePage() {
  const navigate = useNavigate()

  const handleGoToLogin = () => {
    navigate("/login")
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader
        showLeftAction={false}
        title=""
        showRightAction={false}
        className="shrink-0"
      />

      <main className="flex-1 overflow-y-auto bg-white px-4 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <p className="text-2xl font-bold text-slate-900 mb-2">가입이 완료되었습니다</p>
          <p className="text-slate-500 mb-8">로그인하여 서비스를 이용해주세요</p>

          <button
            onClick={handleGoToLogin}
            className="w-full py-4 rounded-lg font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            로그인하기
          </button>
        </div>
      </main>

      <AppBottomNav className="shrink-0" />
    </div>
  )
}
