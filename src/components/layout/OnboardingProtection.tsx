import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate, useNavigationType } from "react-router-dom"
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
 * 1. Back-button guard — detects POP navigations leaving /onboarding/*,
 *    navigates back, and shows an exit confirmation dialog.
 * 2. Onboarding redirect — if the backend reports onboardingCompleted===false
 *    and the user somehow lands on a non-onboarding, non-public page (e.g.
 *    /home), redirect them to /onboarding/worker-type.
 */
export function OnboardingProtection() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const navigate = useNavigate()
  const { worker, logout } = useAuth()
  const [showDialog, setShowDialog] = useState(false)

  const lastOnboardingPath = useRef<string | null>(null)

  // Track the last visited onboarding path
  useEffect(() => {
    if (location.pathname.startsWith("/onboarding")) {
      lastOnboardingPath.current = location.pathname
    }
  }, [location.pathname])

  // 1. Back-button guard: POP navigation that leaves /onboarding/*
  useEffect(() => {
    const wasInOnboarding = lastOnboardingPath.current !== null
    const nowOutside = !location.pathname.startsWith("/onboarding")
    const isPop = navigationType === "POP"
    const isAllowed = sessionStorage.getItem("onboarding_exit_allowed") === "1"

    if (wasInOnboarding && nowOutside && isPop && !isAllowed) {
      navigate(lastOnboardingPath.current!, { replace: true })
      setShowDialog(true)
    }
  }, [location.pathname, navigationType, navigate])

  // 2. Onboarding redirect: authenticated user with incomplete onboarding
  //    lands on any non-onboarding, non-public page.
  useEffect(() => {
    const isOnboarding = location.pathname.startsWith("/onboarding")
    const isAllowed = sessionStorage.getItem("onboarding_exit_allowed") === "1"

    if (
      !isOnboarding &&
      !isPublic(location.pathname) &&
      !isAllowed &&
      worker?.onboardingCompleted === false
    ) {
      navigate("/onboarding/worker-type", { replace: true })
    }
  }, [location.pathname, worker?.onboardingCompleted, navigate])

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
