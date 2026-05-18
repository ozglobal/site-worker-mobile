import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export function OnboardingPage() {
  const navigate = useNavigate()
  const { worker, logout } = useAuth()
  const [showDialog, setShowDialog] = useState(false)
  const exitingRef = useRef(false)

  useEffect(() => {
    sessionStorage.removeItem('postLoginFirstLogin')
  }, [])

  // Device back guard.
  // On first mount history.state has no onboardingGuard → push sentinel above
  // the original /onboarding entry. On remount after backing in from worker-type
  // we arrive AT the sentinel (state.onboardingGuard === true) → skip the push
  // so there is never more than one sentinel between the user and the entry below.
  // handlePopState: arriving AT sentinel means free navigation (back from
  // worker-type); arriving at the original entry means the user tried to leave
  // /onboarding → intercept and show the dialog.
  useLayoutEffect(() => {
    if (!window.history.state?.onboardingGuard) {
      window.history.pushState({ onboardingGuard: true }, document.title)
    }

    const handlePopState = () => {
      if (exitingRef.current) return
      if (window.history.state?.onboardingGuard) return  // arrived at sentinel — free
      // arrived at original entry — intercept
      window.history.pushState({ onboardingGuard: true }, document.title)
      setShowDialog(true)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const handleRegisterNow = () => {
    navigate("/onboarding/worker-type")
  }

  const handleBack = () => setShowDialog(true)

  const handleStay = () => {
    setShowDialog(false)
    navigate("/onboarding/worker-type")
  }

  const handleExit = () => {
    setShowDialog(false)
    exitingRef.current = true
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white overflow-hidden">
      {/* App back button */}
      <div className="h-14 flex items-center px-2 shrink-0">
        <button onClick={handleBack} className="p-2 -ml-1">
          <ArrowLeft className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="text-8xl mb-8">👋</div>

        <h1 className="text-lg font-bold text-slate-900 text-center mb-4">
          안녕하세요, {worker?.workerName || ""}님!
        </h1>

        <p className="text-slate-500 text-center whitespace-pre-line">
          {"회원 가입을 환영합니다.\n이 앱으로 출퇴근을 하기 위하여\n회원 유형 및 일급(노임)을 등록해주세요."}
        </p>
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pb-8 space-y-3 shrink-0">
        <Button variant="primary" size="full" onClick={handleRegisterNow}>
          시작하기
        </Button>
      </div>

      {/* Exit confirmation dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleStay} />
          <div className="relative z-10 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-5">
            <p className="text-sm text-slate-700 leading-relaxed text-center whitespace-pre-line">
              {"온보딩 절차가 완료되지 않았습니다.\n나가시겠습니까?"}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="full" onClick={handleStay}>
                계속하기
              </Button>
              <Button variant="primary" size="full" onClick={handleExit}>
                나가기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
