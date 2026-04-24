import { useEffect } from "react"
import { Outlet, useBlocker } from "react-router-dom"

/**
 * Layout route that traps the user inside /onboarding/* until onboarding
 * is complete. Intercepts both the device back button and any programmatic
 * navigate() calls that would leave the /onboarding zone.
 *
 * To allow the final navigate('/home') after a successful submit, set:
 *   sessionStorage.setItem('onboarding_exit_allowed', '1')
 * before calling navigate(). The guard clears the flag once used.
 */
export function OnboardingGuard() {
  const blocker = useBlocker(({ nextLocation }) => {
    if (nextLocation.pathname.startsWith("/onboarding")) return false
    if (sessionStorage.getItem("onboarding_exit_allowed") === "1") return false
    return true
  })

  useEffect(() => {
    if (blocker.state === "blocked") {
      blocker.reset()
    }
  }, [blocker])

  return <Outlet />
}
