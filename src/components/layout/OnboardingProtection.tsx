import { useState, useLayoutEffect, useEffect, useRef } from "react"
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
 *
 * A. Redirect guard — if onboardingCompleted !== true and the user is on any
 *    page outside /onboarding/* and public routes, redirect to /onboarding/worker-type.
 *    This catches normal navigation AND device back-button escapes.
 *
 * B. /onboarding entry-page back-button guard:
 *    1. Sentinel (useLayoutEffect): push/replace a sentinel at the same URL
 *       so device back stays on /onboarding without stacking duplicates.
 *    2. Permanent popstate listener: if back lands on the ORIGINAL /onboarding
 *       entry (not the sentinel), show the exit dialog.
 *       If back lands ON the sentinel (arriving from worker-type etc.), let it through.
 */
export function OnboardingProtection() {
  const location = useLocation()
  const navigate = useNavigate()
  const { worker, logout } = useAuth()
  const [showDialog, setShowDialog] = useState(false)
  const exitingRef = useRef(false)

  // A. Redirect any authenticated user with incomplete onboarding away from
  //    non-onboarding, non-public pages — including device back-button escapes.
  useEffect(() => {
    if (exitingRef.current) return
    const isOnboarding = location.pathname.startsWith("/onboarding")
    if (
      worker !== null &&
      worker.onboardingCompleted !== true &&
      !isOnboarding &&
      !isPublic(location.pathname)
    ) {
      navigate("/onboarding/worker-type", { replace: true })
    }
  }, [location.pathname, worker, navigate])

  // B1. Sentinel management — runs before paint so the guard is ready
  //     before any user interaction after arriving at /onboarding.
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

  // B2. Permanent popstate listener — checks live browser state, not React state.
  useEffect(() => {
    const handlePopState = () => {
      if (exitingRef.current) return
      if (window.location.pathname !== "/onboarding") return
      // Arrived AT a sentinel → free navigation (e.g. back from worker-type).
      if (window.history.state?.onboardingGuard) return
      // Arrived AT the original /onboarding entry → intercept.
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
