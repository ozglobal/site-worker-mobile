import { useState, useLayoutEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Always-mounted component (lives in AppRoutes above <Routes>).
 *
 * Guards /onboarding (the entry page only). Pushes a sentinel history entry
 * via useLayoutEffect — which fires synchronously before paint — so the
 * popstate listener is active before any user interaction can occur, even
 * when the user arrives here via a rapid device back press from worker-type.
 *
 * worker-type and daily-wage do NOT trigger the dialog; back is free there.
 */
export function OnboardingProtection() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showDialog, setShowDialog] = useState(false)
  const exitingRef = useRef(false)

  useLayoutEffect(() => {
    if (location.pathname !== "/onboarding") return

    window.history.pushState({ onboardingGuard: true }, document.title)

    const handlePopState = () => {
      if (exitingRef.current) return
      window.history.pushState({ onboardingGuard: true }, document.title)
      setShowDialog(true)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [location.pathname])

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

  if (!showDialog) return null

  return (
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
  )
}
