import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NavItem } from '@/components/layout/AppBottomNav'

/**
 * Returns a memoized callback for <AppBottomNav onNavigate={…}> that
 * routes the four fixed tabs (home / attendance / contract / profile)
 * to their canonical paths.
 *
 * Extracted from ~14 pages that each declared the same 5-line handler.
 */
export function useBottomNavHandler() {
  const navigate = useNavigate()
  return useCallback(
    (item: NavItem) => {
      if (item === 'home') navigate('/home')
      else if (item === 'attendance') navigate('/attendance')
      else if (item === 'contract') navigate('/contract')
      else if (item === 'profile') navigate('/profile')
    },
    [navigate],
  )
}
