import { useState, useLayoutEffect, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Always-mounted component (lives in AppRoutes above <Routes>).
 *
 * Guards /onboarding (the entry page only). Two independent concerns:
 *
 * 1. Sentinel management (useLayoutEffect, before paint):
 *    - Push a sentinel entry at the same URL when landing on /onboarding
 *      so back-presses pop to the same page.
 *    - replaceState if already at a sentinel to avoid stacking multiples.
 *
 * 2. Persistent popstate listener (useEffect [], never removed):
 *    - Ignores events that land ON a sentinel entry (arrived at /onboarding
 *      via back from worker-type — free navigation).
 *    - Intercepts events that land on the ORIGINAL /onboarding entry
 *      (back was pressed while on /onboarding — show dialog).
 *
 * Result: back from worker-type → /onboarding is always free.
 *         back while on /onboarding always shows the exit dialog.
 */
export function OnboardingProtection() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showDialog, setShowDialog] = useState(false)
  const exitingRef = useRef(false)

  // 1. Ensure exactly one sentinel entry exists while on /onboarding.
  //    Runs before paint so the sentinel is ready before any user input.
  useLayoutEffect(() => {
    if (location.pathname !== "/onboarding") return
    if (window.history.state?.onboardingGuard) {
      // Already at a sentinel — refresh in place, don't stack a new one.
      window.history.replaceState({ onboardingGuard: true }, document.title)
    } else {
      // Original /onboarding entry — push sentinel above it.
      window.history.pushState({ onboardingGuard: true }, document.title)
    }
  }, [location.pathname])

  // 2. Single permanent listener — checks live browser state, not React state.
  useEffect(() => {
    const handlePopState = () => {
      if (exitingRef.current) return
      if (window.location.pathname !== "/onboarding") return
      // Arrived AT a sentinel → free navigation (back from worker-type etc.)
      if (window.history.state?.onboardingGuard) return
      // Arrived AT the original entry → user tried to leave /onboarding.
      window.history.pushState({ onboardingGuard: true }, document.title)
      setShowDialog(true)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

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
