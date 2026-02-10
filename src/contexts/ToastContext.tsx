import { createContext, useContext, useState, useCallback, useRef } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  toasts: Toast[]
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((type: ToastType, title: string, message?: string) => {
    const id = nextId.current++
    setToasts(prev => [...prev, { id, type, title, message }])
    setTimeout(() => dismiss(id), 3000)
  }, [dismiss])

  const showSuccess = useCallback((title: string, message?: string) => show('success', title, message), [show])
  const showError = useCallback((title: string, message?: string) => show('error', title, message), [show])
  const showInfo = useCallback((title: string, message?: string) => show('info', title, message), [show])

  return (
    <ToastContext.Provider value={{ toasts, showSuccess, showError, showInfo, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}
