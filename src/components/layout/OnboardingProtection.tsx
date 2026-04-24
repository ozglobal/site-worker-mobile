import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

const PUBLIC_PREFIXES = ["/login", "/signup"]

function isPublic(path: string) {
  return PUBLIC_PREFIXES.some((p) => path.startsWith(p))
}

/**
 * Always-mounted component (lives in AppRoutes above <Routes>).
 *
 * Two responsibilities:
 * 1. Back-button guard — injects a sentinel history entry while the user is on
 *    any /onboarding/* page and intercepts the raw popstate event so that the
 *    device back button, browser back button, and navigate(-1) all show the
 *    exit confirmation dialog instead of leaving the flow.
 * 2. Onboarding redirect — if the backend reports onboardingCompleted !== true
 *    and the user somehow lands on a non-onboarding, non-public page (e.g.
 *    /home), redirect them to /onboarding/worker-type.
 */
export function OnboardingProtection() {
  const location = useLocation()
  const navigate = useNavigate()
  const { worker, logout } = useAuth()
  const [showDialog, setShowDialog] = useState(false)
  const exitingRef = useRef(false)

  // 1. Back-button guard: inject a sentinel history entry on every onboarding
  //    page so that any back gesture pops to the same URL, keeping React Router
  //    in sync while our popstate handler intercepts the event.
  useEffect(() => {
    const isOnboarding = location.pathname.startsWith("/onboarding")
    const isAllowed = sessionStorage.getItem("onboarding_exit_allowed") === "1"
    if (!isOnboarding || isAllowed) return

    // Sentinel entry at the same URL — back button pops it without changing
    // the visible URL, so React Router doesn't navigate away.
    window.history.pushState({ onboardingGuard: true }, document.title)

    const handlePopState = () => {
      if (exitingRef.current) return
      const stillAllowed = sessionStorage.getItem("onboarding_exit_allowed") === "1"
      if (stillAllowed) return
      // Re-push sentinel so consecutive back presses are also caught.
      window.history.pushState({ onboardingGuard: true }, document.title)
      setShowDialog(true)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [location.pathname])

  // 2. Onboarding redirect: authenticated user with incomplete onboarding
  //    lands on any non-onboarding, non-public page.
  //    Uses !== true so that null (unknown/not returned) is treated as incomplete.
  useEffect(() => {
    const isOnboarding = location.pathname.startsWith("/onboarding")
    const isAllowed = sessionStorage.getItem("onboarding_exit_allowed") === "1"

    if (
      worker !== null &&
      !isOnboarding &&
      !isPublic(location.pathname) &&
      !isAllowed &&
      worker.onboardingCompleted !== true
    ) {
      navigate("/onboarding/worker-type", { replace: true })
    }
  }, [location.pathname, worker, navigate])

  const handleStay = () => setShowDialog(false)

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
