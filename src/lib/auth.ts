import { devLogApiRaw, devLogRequestRaw } from '../utils/devLog'
import { API_BASE_URL, X_TENANT_ID } from './config'
import { authStorage, clearAllStorage } from './storage'
import { safeJson, type ApiResult } from './api-result'
import { reportError } from './errorReporter'

// PR 1: Access token lives in memory only (not localStorage)
// On page reload, restored via /refresh endpoint
let inMemoryAccessToken: string | null = null

// PR 7: Worker info lives in memory only (not localStorage)
// On page reload, restored via /auth/user/info endpoint
interface InMemoryWorkerInfo {
  workerId: string
  workerName: string
  relatedSiteId?: string
  username?: string
}
let inMemoryWorkerInfo: InMemoryWorkerInfo | null = null

export interface LoginParams {
  username: string
  password: string
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
      id: 'mock_worker_001',
      nameKo: params.username,
      relatedSiteId: 'site_001',
    })

    return { success: true }
  }

  return { success: false, error: '아이디와 비밀번호를 입력해주세요.' }
}

// Send SMS verification code for signup
export const getSmsCode = async (phone: string): Promise<ApiResult<unknown>> => {
  try {
    const requestBody = { phone }
    devLogRequestRaw('/auth/register/send-code', requestBody)
    const response = await fetch(`${API_BASE_URL}/auth/register/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const responseData = await safeJson(response) as Record<string, unknown> | null
    devLogApiRaw('/auth/register/send-code', { status: response.status, data: responseData })

    if (!responseData) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      reportError('AUTH_SEND_CODE_FAIL', (responseData.message as string) || 'Failed to send code', { endpoint: '/auth/register/send-code', httpStatus: response.status })
      return { success: false, error: (responseData.message as string) || '인증번호 발송에 실패했습니다.' }
    }

    return { success: true, data: responseData.data || responseData }
  } catch (err) {
    reportError('AUTH_SEND_CODE_FAIL', String(err), { endpoint: '/auth/register/send-code' })
    return { success: false, error: '네트워크 오류가 발생했습니다.' }
  }
}

// Verify SMS code for signup
export const verifySmsCode = async (phone: string, verificationCode: string): Promise<ApiResult<unknown>> => {
  try {
    const requestBody = { phone, verificationCode }
    devLogRequestRaw('/auth/register/verify-code', requestBody)
    const response = await fetch(`${API_BASE_URL}/auth/register/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const responseData = await safeJson(response) as Record<string, unknown> | null
    devLogApiRaw('/auth/register/verify-code', { status: response.status, data: responseData })

    if (!responseData) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      reportError('AUTH_VERIFY_CODE_FAIL', (responseData.message as string) || 'Failed to verify code', { endpoint: '/auth/register/verify-code', httpStatus: response.status })
      return { success: false, error: (responseData.message as string) || '인증번호 확인에 실패했습니다.' }
    }

    return { success: true, data: responseData.data || responseData }
  } catch (err) {
    reportError('AUTH_VERIFY_CODE_FAIL', String(err), { endpoint: '/auth/register/verify-code' })
    return { success: false, error: '네트워크 오류가 발생했습니다.' }
  }
}

// Register worker
export interface RegisterWorkerParams {
  password: string
  nameKo: string
  mobilePhone: string
  nationalityType: string
  idType: string
  idNumber: string
  address: string
  addressDetail: string
  personalInfoConsent: boolean
  registrationToken: string
}

export const registerWorker = async (params: RegisterWorkerParams): Promise<ApiResult<unknown>> => {
  try {
    devLogRequestRaw('/auth/register/worker', { ...params, password: '***' })
    const response = await fetch(`${API_BASE_URL}/auth/register/worker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    const responseData = await safeJson(response) as Record<string, unknown> | null
    devLogApiRaw('/auth/register/worker', { status: response.status, data: responseData })

    if (!responseData) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      reportError('AUTH_REGISTER_FAIL', (responseData.message as string) || 'Registration failed', { endpoint: '/auth/register/worker', httpStatus: response.status })
      return { success: false, error: (responseData.message as string) || '회원가입에 실패했습니다.' }
    }

    return { success: true, data: responseData.data || responseData }
  } catch (err) {
    reportError('AUTH_REGISTER_FAIL', String(err), { endpoint: '/auth/register/worker' })
    return { success: false, error: '네트워크 오류가 발생했습니다.' }
  }
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

    const responseData = await safeJson(response) as Record<string, unknown> | null
    devLogApiRaw('/auth/login', { status: response.status, data: responseData })

    if (!responseData) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      reportError('AUTH_LOGIN_REJECTED', (responseData.message as string) || 'Login failed', { endpoint: '/auth/login', httpStatus: response.status })
      return { success: false, error: (responseData.message as string) || 'Login failed' }
    }

    // Unwrap response: API returns { code, message, data: { ... } }
    const payload = (responseData.data || responseData) as Record<string, unknown>

    // Store auth tokens
    const accessToken = payload.accessToken as string | undefined
    const refreshToken = payload.refreshToken as string | undefined
    const expiresIn = payload.expiresIn as number | undefined

    if (!accessToken) {
      return { success: false, error: 'No access token received' }
    }

    // Calculate issued timestamp from current time (API doesn't provide it)
    const issuedAt = Math.floor(Date.now() / 1000)
    setTokens(accessToken, refreshToken, expiresIn, issuedAt)

    // Store worker info from login response
    if (payload.workerInfo) {
      setWorkerInfo(payload.workerInfo as Record<string, unknown>)
    }

    // Save username to in-memory worker info
    if (inMemoryWorkerInfo) {
      inMemoryWorkerInfo.username = params.username
    } else {
      inMemoryWorkerInfo = { workerId: '', workerName: '', username: params.username }
    }

    return { success: true }
  } catch (error) {
    console.error('[LOGIN] Error:', error)
    reportError('AUTH_LOGIN_FAIL', 'Network error', { endpoint: '/auth/login' })
    return { success: false, error: 'Network error' }
  }
}

// PR 1: read access token from memory only
export const getAccessToken = () => inMemoryAccessToken
export const getRefreshToken = () => authStorage.getRefreshToken()
export const getExpiresIn = () => {
  const val = authStorage.getExpiresIn()
  return val !== null ? String(val) : null
}
export const getIssuedAt = () => {
  const val = authStorage.getIssuedAt()
  return val !== null ? String(val) : null
}

// PR 1: access token stored in memory, refresh token + metadata in localStorage
export const setTokens = (accessToken: string, refreshToken?: string, expiresIn?: number, timestamp?: number) => {
  inMemoryAccessToken = accessToken
  authStorage.setTokens(refreshToken, expiresIn, timestamp)
}

export const clearTokens = () => {
  inMemoryAccessToken = null
  authStorage.clear()
}

export const setWorkerInfo = (workerInfo: Record<string, unknown>) => {
  const info: InMemoryWorkerInfo = {
    workerId: String(workerInfo.id ?? workerInfo.workerId ?? ''),
    workerName: String(workerInfo.nameKo ?? workerInfo.workerName ?? ''),
  }
  if (workerInfo.relatedSiteId) {
    info.relatedSiteId = String(workerInfo.relatedSiteId)
  }
  if (inMemoryWorkerInfo?.username) {
    info.username = inMemoryWorkerInfo.username
  }
  inMemoryWorkerInfo = info
}

export const getWorkerInfo = () => ({
  workerId: inMemoryWorkerInfo?.workerId ?? null,
  workerName: inMemoryWorkerInfo?.workerName ?? null,
  relatedSiteId: inMemoryWorkerInfo?.relatedSiteId ?? null,
})

export const getWorkerId = () => inMemoryWorkerInfo?.workerId ?? null
export const getWorkerName = () => inMemoryWorkerInfo?.workerName ?? null

export const clearWorkerInfo = () => {
  inMemoryWorkerInfo = null
}

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
// Dedup: if a refresh is already in-flight, return the same promise
let refreshInFlight: Promise<string | null> | null = null

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
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
        devLogApiRaw('/auth/refresh', { status: response.status, error: 'Refresh failed' })
        reportError('AUTH_REFRESH_FAIL', 'Token refresh failed', { endpoint: '/auth/refresh', httpStatus: response.status })
        clearTokens()
        return null
      }

      const responseData = await safeJson(response) as Record<string, unknown> | null
      devLogApiRaw('/auth/refresh', { status: response.status, data: responseData })

      if (!responseData) {
        devLogApiRaw('/auth/refresh', { error: 'Invalid response body' })
        reportError('AUTH_REFRESH_INVALID', 'Invalid refresh response')
        clearTokens()
        return null
      }

      // Unwrap response: API returns { code, message, data: { ... } }
      const payload = (responseData.data || responseData) as Record<string, unknown>

      const newAccessToken = payload.accessToken as string | undefined
      const newRefreshToken = payload.refreshToken as string | undefined
      const newExpiresIn = payload.expiresIn as number | undefined

      if (newAccessToken) {
        const issuedAt = Math.floor(Date.now() / 1000)
        setTokens(newAccessToken, newRefreshToken, newExpiresIn, issuedAt)
        return newAccessToken
      }

      return null
    } catch (err) {
      devLogApiRaw('/auth/refresh', { error: 'Network error', detail: String(err) })
      reportError('AUTH_REFRESH_NETWORK', 'Refresh network error', { endpoint: '/auth/refresh' })
      clearTokens()
      return null
    }
  })()

  refreshInFlight.finally(() => { refreshInFlight = null })
  return refreshInFlight
}

// Logout - clear tokens and user info, redirect to login
export const handleLogout = async () => {
  await clearAllStorage()
  window.location.href = '/login'
}

// PR 7: Fetch user info from API and restore in-memory worker info
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

    const responseData = await safeJson(response) as Record<string, unknown> | null
    devLogApiRaw('/auth/user/info', { status: response.status, data: responseData })

    if (!responseData) {
      return null
    }

    // Unwrap response: API returns { code, message, data: { ... } }
    const userInfo = (responseData.data || responseData) as Record<string, unknown>

    // Restore in-memory worker info from API response
    setWorkerInfo(userInfo)
    return userInfo
  } catch {
    reportError('AUTH_USERINFO_FAIL', 'Failed to fetch user info', { endpoint: '/auth/user/info' })
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
      reportError('AUTH_SESSION_EXPIRED', 'Session expired — refresh failed (proactive)')
      window.location.href = '/login'
      return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
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
      reportError('AUTH_SESSION_EXPIRED', 'Session expired — refresh failed (401 retry)')
      window.location.href = '/login'
    }
  }

  return response
}
