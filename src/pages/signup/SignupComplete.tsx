import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function SignUpCompletePage() {
  const navigate = useNavigate()

  return (
    <div className="flex h-dvh flex-col bg-white">
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <p className="text-2xl font-bold text-slate-900 mb-2">회원 가입 완료</p>
        <p className="text-slate-500 mb-8">가입한 계정으로 로그인해주세요</p>

        <div className="w-full">
          <Button
            variant="primary"
            size="full"
            onClick={() => navigate("/login")}
          >
            로그인하기
          </Button>
        </div>
      </main>
    </div>
  )
}
