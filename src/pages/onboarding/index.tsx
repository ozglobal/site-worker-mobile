import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { onboardingStorage } from "@/lib/storage"
import { useAuth } from "@/contexts/AuthContext"

export function OnboardingPage() {
  const navigate = useNavigate()
  const { worker } = useAuth()

  useEffect(() => {
    sessionStorage.removeItem('postLoginFirstLogin')
  }, [])

  const handleRegisterNow = () => {
    onboardingStorage.markCompleted()
    navigate("/onboarding/worker-type")
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white overflow-hidden">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="text-8xl mb-8">👋</div>

        <h1 className="text-lg font-bold text-slate-900 text-center mb-4">
          안녕하세요, {worker?.workerName || ""}님!
        </h1>

        <p className="text-slate-500 text-center whitespace-pre-line">
          {"원활한 급여 지급을 위해\n필수 정보를 등록해주세요."}
        </p>
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pb-8 space-y-3 shrink-0">
        <Button variant="primary" size="full" onClick={handleRegisterNow}>
          시작하기
        </Button>
      </div>
    </div>
  )
}
