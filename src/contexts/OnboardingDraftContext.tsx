import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react'

export type WagePaymentTarget = 'SELF' | 'PROXY' | 'COMPANY'

export interface OnboardingDraft {
  bankName: string | null
  bankAccount: string | null
  accountHolder: string | null
  accountHolderRelation: string | null
  equipmentCompanyName: string | null
  equipmentCompanyOwner: string | null
  wagePaymentTarget: WagePaymentTarget | null
  dailyWage: number | null
}

const emptyDraft: OnboardingDraft = {
  bankName: null,
  bankAccount: null,
  accountHolder: null,
  accountHolderRelation: null,
  equipmentCompanyName: null,
  equipmentCompanyOwner: null,
  wagePaymentTarget: null,
  dailyWage: null,
}

interface OnboardingDraftContextValue {
  get: () => OnboardingDraft
  patch: (partial: Partial<OnboardingDraft>) => void
  reset: () => void
}

const OnboardingDraftContext = createContext<OnboardingDraftContextValue | null>(null)

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  // Use a ref to avoid re-renders on every write. Pages read via get() on submit.
  const draftRef = useRef<OnboardingDraft>({ ...emptyDraft })

  const get = useCallback(() => draftRef.current, [])
  const patch = useCallback((partial: Partial<OnboardingDraft>) => {
    draftRef.current = { ...draftRef.current, ...partial }
  }, [])
  const reset = useCallback(() => {
    draftRef.current = { ...emptyDraft }
  }, [])

  return (
    <OnboardingDraftContext.Provider value={{ get, patch, reset }}>
      {children}
    </OnboardingDraftContext.Provider>
  )
}

export function useOnboardingDraft() {
  const ctx = useContext(OnboardingDraftContext)
  if (!ctx) throw new Error('useOnboardingDraft must be used inside OnboardingDraftProvider')
  return ctx
}
