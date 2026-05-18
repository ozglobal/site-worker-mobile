import { useEffect, useState } from 'react'

/**
 * Tracks whether the on-screen keyboard is currently open by watching
 * `window.visualViewport.height`. Returns `true` when the viewport has
 * shrunk by more than ~150 px — a reliable heuristic on iOS/Android.
 *
 * Extracted from the many copies that were scattered across form pages
 * (MyAccount, FamilyAccount, ChangePassword, Equipment, the MyInfo* pages,
 * the onboarding flow, etc.).
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const handle = () => setOpen(window.innerHeight - viewport.height > 150)
    viewport.addEventListener('resize', handle)
    return () => viewport.removeEventListener('resize', handle)
  }, [])
  return open
}
