import { devLogApiRaw, devLogRequestRaw } from '../utils/devLog'
import { API_BASE_URL, X_TENANT_ID } from './config'
import { authStorage, profileStorage, clearAllStorage } from './storage'
import { fetchTodayAttendance } from './attendance'

export interface LoginParams {
  username: string
  password: string
  captcha?: string
  captchaId?: string
  clientId?: string
}

export interface LoginResult {
  success: boolean
  error?: string
}

// Mock login for development (when API is not available)
const MOCK_LOGIN_ENABLED = false

const mockLogin = async (params: LoginParams): Promise<LoginResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Accept any credentials for development
  if (params.username && params.password) {
    const mockAccessToken = 'mock_access_token_' + Date.now()
    const mockRefreshToken = 'mock_refresh_token_' + Date.now()
    const issuedAt = Math.floor(Date.now() / 1000)

    setTokens(mockAccessToken, mockRefreshToken, 3600, issuedAt)
    setWorkerInfo({
      workerId: 'mock_worker_001',
      workerName: params.username,
      relatedSiteId: 'site_001',
    })

    return { success: true }
  }

  return { success: false, error: '아이디와 비밀번호를 입력해주세요.' }
}

// Login API call
export const login = async (params: LoginParams): Promise<LoginResult> => {
  // Use mock login in development when API is not available
  if (MOCK_LOGIN_ENABLED) {
    return mockLogin(params)
  }

  try {
    const requestBody = {
      username: params.username,
      password: params.password,
      captcha: params.captcha || '1234',
      captchaId: params.captchaId || '550e8400-e29b-41d4-a716-446655440000',
      clientId: params.clientId || 'mobile',
    }
    devLogRequestRaw('/auth/login', requestBody)
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseData = await response.json()
    devLogApiRaw('/auth/login', { status: response.status, data: responseData })

    if (!response.ok) {
      return { success: false, error: responseData.message || 'Login failed' }
    }

    // Unwrap response: API returns { code, message, data: { ... } }
    const payload = responseData.data || responseData

    // Store auth tokens
    const accessToken = payload.accessToken
    const refreshToken = payload.refreshToken
    const expiresIn = payload.expiresIn

    if (!accessToken) {
      return { success: false, error: 'No access token received' }
    }

    // Calculate issued timestamp from current time (API doesn't provide it)
    const issuedAt = Math.floor(Date.now() / 1000)
    setTokens(accessToken, refreshToken, expiresIn, issuedAt)

    // Store worker info from login response
    if (payload.workerInfo) {
      setWorkerInfo(payload.workerInfo)
    }

    // Fetch today's attendance records and sync to localStorage
    await fetchTodayAttendance()

    return { success: true }
  } catch {
    return { success: false, error: 'Network error' }
  }
}

export const getAccessToken = () => authStorage.getToken()
export const getRefreshToken = () => authStorage.getRefreshToken()
export const getExpiresIn = () => {
  const val = authStorage.getExpiresIn()
  return val !== null ? String(val) : null
}
export const getIssuedAt = () => {
  const val = authStorage.getIssuedAt()
  return val !== null ? String(val) : null
}

export const setTokens = (accessToken: string, refreshToken?: string, expiresIn?: number, timestamp?: number) => {
  authStorage.setTokens(accessToken, refreshToken, expiresIn, timestamp)
}

export const clearTokens = () => {
  authStorage.clear()
}

export const setWorkerInfo = (workerInfo: Record<string, unknown>) => {
  profileStorage.setFromWorkerInfo(workerInfo)
}

export const getWorkerInfo = () => {
  const profile = profileStorage.get()
  return {
    workerId: profile?.workerId ?? null,
    workerName: profile?.workerName ?? null,
    relatedSiteId: profile?.relatedSiteId ?? null,
  }
}

export const clearWorkerInfo = () => {
  profileStorage.clear()
}

// Legacy user info functions (for backward compatibility)
export const setUserInfo = setWorkerInfo
export const getUserInfo = getWorkerInfo
export const clearUserInfo = clearWorkerInfo

// Check if token is expired
export const isTokenExpired = (): boolean => {
  const expiresIn = getExpiresIn()
  const issuedAt = getIssuedAt()

  if (!expiresIn || !issuedAt) {
    return false // Can't determine, assume not expired
  }

  // Both expiresIn and issuedAt are in seconds
  const expiresAtSec = Number(issuedAt) + Number(expiresIn)
  const nowSec = Math.floor(Date.now() / 1000)

  // Add 30 second buffer to refresh before actual expiry
  return nowSec >= expiresAtSec - 30
}

export const isAuthenticated = () => !!getAccessToken()

// Refresh the access token using refresh token
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return null
  }

  try {
    devLogRequestRaw('/auth/refresh', { refreshToken: '***' })
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'X-Refresh-Token': refreshToken,
      },
    })

    if (!response.ok) {
      clearTokens()
      return null
    }

    const responseData = await response.json()
    devLogApiRaw('/auth/refresh', { status: response.status, data: responseData })

    // Unwrap response: API returns { code, message, data: { ... } }
    const payload = responseData.data || responseData

    const newAccessToken = payload.accessToken
    const newRefreshToken = payload.refreshToken
    const newExpiresIn = payload.expiresIn

    if (newAccessToken) {
      const issuedAt = Math.floor(Date.now() / 1000)
      setTokens(newAccessToken, newRefreshToken, newExpiresIn, issuedAt)
      return newAccessToken
    }

    return null
  } catch {
    clearTokens()
    return null
  }
}

// Logout - clear tokens and user info, redirect to login
export const handleLogout = () => {
  clearAllStorage()
  window.location.href = '/login'
}

// Fetch user info from API and save to localStorage
export const fetchUserInfo = async (): Promise<Record<string, unknown> | null> => {
  const accessToken = getAccessToken()
  if (!accessToken) {
    return null
  }

  try {
    devLogRequestRaw('/auth/user/info', { method: 'GET' })
    const response = await fetch(`${API_BASE_URL}/auth/user/info`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-Id': X_TENANT_ID,
      },
    })

    if (!response.ok) {
      return null
    }

    const responseData = await response.json()
    devLogApiRaw('/auth/user/info', { status: response.status, data: responseData })

    // Unwrap response: API returns { code, message, data: { ... } }
    const userInfo = responseData.data || responseData

    // Note: Do not update localStorage here - worker info is set from login response only
    return userInfo
  } catch {
    return null
  }
}

// Check token and refresh if expired - call this proactively
export const checkAndRefreshToken = async (): Promise<boolean> => {
  if (!isAuthenticated()) {
    return false
  }

  if (isTokenExpired()) {
    const newToken = await refreshAccessToken()
    return !!newToken
  }

  return true
}

// Fetch wrapper with automatic token refresh
export const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  let accessToken = getAccessToken()

  // Proactively refresh token if expired or about to expire
  if (isTokenExpired()) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      accessToken = newToken
    } else {
      window.location.href = '/login'
      throw new Error('Session expired')
    }
  }

  // Add auth header
  const headers = new Headers(options.headers)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  let response = await fetch(url, { ...options, headers })

  // If 401, try to refresh token and retry (fallback)
  if (response.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      response = await fetch(url, { ...options, headers })
    } else {
      // Redirect to login if refresh fails
      window.location.href = '/login'
    }
  }

  return response
}
