import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate, useNavigationType } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Always-mounted component (lives in AppRoutes above <Routes>).
 * Detects POP navigations (device back button / browser back) that leave
 * the /onboarding/* zone, navigates the user back, and shows a dialog.
 *
 * Works with BrowserRouter (no data router required).
 */
export function OnboardingProtection() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showDialog, setShowDialog] = useState(false)

  // Track the last onboarding path the user was on
  const lastOnboardingPath = useRef<string | null>(null)

  // Keep lastOnboardingPath updated while inside the onboarding zone
  useEffect(() => {
    if (location.pathname.startsWith("/onboarding")) {
      lastOnboardingPath.current = location.pathname
    }
  }, [location.pathname])

  // Detect POP navigations that leave the onboarding zone
  useEffect(() => {
    const wasInOnboarding = lastOnboardingPath.current !== null
    const nowOutside = !location.pathname.startsWith("/onboarding")
    const isPop = navigationType === "POP"
    const isAllowed = sessionStorage.getItem("onboarding_exit_allowed") === "1"

    if (wasInOnboarding && nowOutside && isPop && !isAllowed) {
      // Navigate back to the last onboarding page (replace so it doesn't add history)
      navigate(lastOnboardingPath.current!, { replace: true })
      setShowDialog(true)
    }
  }, [location.pathname, navigationType, navigate])

  const handleStay = () => {
    setShowDialog(false)
  }

  const handleExit = () => {
    setShowDialog(false)
    lastOnboardingPath.current = null
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
