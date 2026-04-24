import { Outlet } from "react-router-dom"

/** Passthrough layout — actual guard is OnboardingProtection in AppRoutes. */
export function OnboardingGuard() {
  return <Outlet />
}
