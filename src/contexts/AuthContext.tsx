import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  login as loginApi,
  getAccessToken,
  getWorkerInfo,
  clearTokens,
  clearWorkerInfo,
  isAuthenticated as checkAuth,
  checkAndRefreshToken,
  type LoginParams,
} from '@/lib/auth'

interface WorkerInfo {
  workerId: string | null
  workerName: string | null
  relatedSiteId: string | null
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  worker: WorkerInfo | null
  login: (params: LoginParams) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [worker, setWorker] = useState<WorkerInfo | null>(null)

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const restoreAuth = async () => {
      const hasToken = checkAuth()

      if (hasToken) {
        // Verify token is still valid
        const isValid = await checkAndRefreshToken()

        if (isValid) {
          setIsAuthenticated(true)
          setWorker(getWorkerInfo())
        } else {
          // Token invalid, clear state
          setIsAuthenticated(false)
          setWorker(null)
        }
      }

      setIsLoading(false)
    }

    restoreAuth()
  }, [])

  const login = useCallback(async (params: LoginParams) => {
    const result = await loginApi(params)

    if (result.success) {
      setIsAuthenticated(true)
      setWorker(getWorkerInfo())
    }

    return result
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    clearWorkerInfo()
    setIsAuthenticated(false)
    setWorker(null)
    window.location.href = '/login'
  }, [])

  const refreshAuth = useCallback(async () => {
    const isValid = await checkAndRefreshToken()

    if (!isValid) {
      setIsAuthenticated(false)
      setWorker(null)
      return false
    }

    return true
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        worker,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
