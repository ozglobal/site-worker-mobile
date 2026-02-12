import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { onboardingStorage } from "@/lib/storage"
import { useAuth } from "@/contexts/AuthContext"

export function OnboardingPage() {
  const navigate = useNavigate()
  const { worker } = useAuth()

  const handleRegisterNow = () => {
    onboardingStorage.markCompleted()
    navigate("/profile")
  }

  const handleRegisterLater = () => {
    onboardingStorage.markCompleted()
    navigate("/home")
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="text-8xl mb-8">👋</div>

        <h1 className="text-2xl font-bold text-slate-900 text-center mb-4">
          안녕하세요, {worker?.workerName || ""}님!
        </h1>

        <p className="text-slate-500 text-center whitespace-pre-line">
          {"원활한 급여 지급을 위해\n몇 가지 정보를 더 여쭤볼게요."}
        </p>
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pb-8 space-y-3 shrink-0">
        <Button variant="secondary" size="full" onClick={handleRegisterLater}>
          나중에 등록하기
        </Button>
        <Button variant="primary" size="full" onClick={handleRegisterNow}>
          지금 등록하기
        </Button>
      </div>
    </div>
  )
}
