import { useState, useEffect } from "react"
import { Outlet, useBlocker, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Layout route that guards all /onboarding/* pages.
 * Any attempt to navigate away (including the device back button) triggers
 * a confirmation dialog. Confirming logs the user out and returns to /login.
 *
 * To allow the final navigate('/home') after a successful submit, set:
 *   sessionStorage.setItem('onboarding_exit_allowed', '1')
 * before calling navigate(). The guard ignores the flag check after that.
 */
export function OnboardingGuard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [showDialog, setShowDialog] = useState(false)

  const blocker = useBlocker(({ nextLocation }) => {
    if (nextLocation.pathname.startsWith("/onboarding")) return false
    if (sessionStorage.getItem("onboarding_exit_allowed") === "1") return false
    return true
  })

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowDialog(true)
    }
  }, [blocker.state])

  const handleStay = () => {
    setShowDialog(false)
    blocker.reset?.()
  }

  const handleExit = () => {
    setShowDialog(false)
    blocker.reset?.()
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <>
      <Outlet />

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
    </>
  )
}
