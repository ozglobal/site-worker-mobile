import { devLogApiPair, logError } from '../utils/devLog'
import { API_BASE_URL, X_TENANT_ID } from './config'
import { authStorage, workerStorage, clearAllStorage } from './storage'
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
  onboardingCompleted?: boolean
  requiredDocsCompleted?: boolean
  requiredContractsCompleted?: boolean
  workerCategory?: string | null
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
    const response = await loggedFetch(`${API_BASE_URL}/auth/register/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const responseData = await safeJson(response) as Record<string, unknown> | null

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

// Send SMS verification code for password reset
export const sendPasswordCode = async (phone: string): Promise<ApiResult<unknown>> => {
  try {
    const requestBody = { phone }
    const response = await loggedFetch(`${API_BASE_URL}/auth/password/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
      body: JSON.stringify(requestBody),
    })

    const responseData = await safeJson(response) as Record<string, unknown> | null

    if (!responseData) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      reportError('AUTH_PASSWORD_SEND_CODE_FAIL', (responseData.message as string) || 'Failed to send code', { endpoint: '/auth/password/send-code', httpStatus: response.status })
      return { success: false, error: (responseData.message as string) || '인증번호 발송에 실패했습니다.' }
    }

    return { success: true, data: responseData.data || responseData }
  } catch (err) {
    reportError('AUTH_PASSWORD_SEND_CODE_FAIL', String(err), { endpoint: '/auth/password/send-code' })
    return { success: false, error: '네트워크 오류가 발생했습니다.' }
  }
}

// Reset password via SMS verification code
export const resetPasswordBySms = async (params: {
  phone: string
  code: string
  newPassword: string
}): Promise<ApiResult<unknown>> => {
  try {
    const response = await loggedFetch(
      `${API_BASE_URL}/auth/password/reset-by-sms`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
        body: JSON.stringify(params),
      },
      { phone: params.phone, code: '***' },
    )

    const responseData = await safeJson(response) as Record<string, unknown> | null

    if (!responseData) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      reportError('AUTH_PASSWORD_RESET_FAIL', (responseData.message as string) || 'Password reset failed', { endpoint: '/auth/password/reset-by-sms', httpStatus: response.status })
      return { success: false, error: (responseData.message as string) || '비밀번호 변경에 실패했습니다.' }
    }

    return { success: true, data: responseData.data || responseData }
  } catch (err) {
    reportError('AUTH_PASSWORD_RESET_FAIL', String(err), { endpoint: '/auth/password/reset-by-sms' })
    return { success: false, error: '네트워크 오류가 발생했습니다.' }
  }
}

// Verify SMS code for signup
export const verifySmsCode = async (phone: string, verificationCode: string): Promise<ApiResult<unknown>> => {
  try {
    const requestBody = { phone, verificationCode }
    const response = await loggedFetch(`${API_BASE_URL}/auth/register/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const responseData = await safeJson(response) as Record<string, unknown> | null

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
  nameEn?: string
  mobilePhone: string
  nationalityType: string
  idType: string
  idNumber: string
  address: string
  addressDetail: string
  gender?: 'male' | 'female' | string
  birthDate?: string // yyyy-MM-dd
  personalInfoConsent: boolean
  registrationToken: string
}

export const registerWorker = async (params: RegisterWorkerParams): Promise<ApiResult<unknown>> => {
  try {
    const response = await loggedFetch(
      `${API_BASE_URL}/auth/register/worker`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      { ...params, password: '***' },
    )

    const responseData = await safeJson(response) as Record<string, unknown> | null

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
    const response = await loggedFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseData = await safeJson(response) as Record<string, unknown> | null

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
    logError('[LOGIN] Error', { code: String(error) })
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
  if (typeof workerInfo.onboardingCompleted === 'boolean') {
    info.onboardingCompleted = workerInfo.onboardingCompleted
  }
  if (typeof workerInfo.requiredDocsCompleted === 'boolean') {
    info.requiredDocsCompleted = workerInfo.requiredDocsCompleted
  }
  if (typeof workerInfo.requiredContractsCompleted === 'boolean') {
    info.requiredContractsCompleted = workerInfo.requiredContractsCompleted
  }
  if ('workerCategory' in workerInfo) {
    info.workerCategory = (workerInfo.workerCategory as string | null) ?? null
  }
  inMemoryWorkerInfo = info

  // Cache to localStorage for restore on reload (skip if name is empty to avoid overwriting good cache)
  if (info.workerName) {
    workerStorage.set({
      workerId: info.workerId,
      workerName: info.workerName,
      ...(info.relatedSiteId && { relatedSiteId: info.relatedSiteId }),
    })
  }
}

export const getWorkerInfo = () => {
  const mem = inMemoryWorkerInfo
  const cached = workerStorage.get()
  return {
    workerId: mem?.workerId || cached?.workerId || null,
    workerName: mem?.workerName || cached?.workerName || null,
    relatedSiteId: mem?.relatedSiteId || cached?.relatedSiteId || null,
    onboardingCompleted: mem?.onboardingCompleted ?? null,
    // TODO: backend not yet providing `requiredDocsCompleted` /
    // `requiredContractsCompleted`. Hardcoded to `false` so the
    // "제출하지 않은 서류" / "서명하지 않은 근로계약서" banners render for testing.
    // Revert to `mem?.requiredDocsCompleted ?? null` / `mem?.requiredContractsCompleted ?? null` once wired.
    requiredDocsCompleted: false,
    requiredContractsCompleted: false,
    workerCategory: mem?.workerCategory ?? null,
  }
}

export const getWorkerId = () => inMemoryWorkerInfo?.workerId || workerStorage.get()?.workerId || null
export const getWorkerName = () => inMemoryWorkerInfo?.workerName || workerStorage.get()?.workerName || null

export const clearWorkerInfo = () => {
  inMemoryWorkerInfo = null
  workerStorage.clear()
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
      const response = await loggedFetch(
        `${API_BASE_URL}/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'X-Refresh-Token': refreshToken,
          },
        },
        { refreshToken: '***' },
      )

      if (!response.ok) {
        reportError('AUTH_REFRESH_FAIL', 'Token refresh failed', { endpoint: '/auth/refresh', httpStatus: response.status })
        clearTokens()
        return null
      }

      const responseData = await safeJson(response) as Record<string, unknown> | null

      if (!responseData) {
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
      void err
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
// Dedup: if a fetch is already in-flight, return the same promise (handles StrictMode double-mount)
let userInfoInFlight: Promise<Record<string, unknown> | null> | null = null

export const fetchUserInfo = async (): Promise<Record<string, unknown> | null> => {
  if (userInfoInFlight) return userInfoInFlight

  userInfoInFlight = _fetchUserInfoImpl()
  userInfoInFlight.finally(() => { userInfoInFlight = null })
  return userInfoInFlight
}

const _fetchUserInfoImpl = async (): Promise<Record<string, unknown> | null> => {
  const accessToken = getAccessToken()
  if (!accessToken) {
    return null
  }

  try {
    const response = await loggedFetch(`${API_BASE_URL}/auth/user/info`, {
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

  // Proactively refresh when:
  //   - the stored metadata says the token is expired, OR
  //   - the in-memory access token is gone (post-reload) but a refresh token
  //     still exists — otherwise we'd fire a doomed no-Authorization request
  //     and pay for an extra 401 → refresh → retry round trip.
  const needsRefresh = isTokenExpired() || (!accessToken && !!getRefreshToken())
  if (needsRefresh) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      accessToken = newToken
    } else {
      reportError('AUTH_SESSION_EXPIRED', 'Session expired — refresh failed (proactive)')
      window.location.href = '/login'
      return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // Add auth header + default X-Tenant-Id
  const headers = new Headers(options.headers)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  if (!headers.has('X-Tenant-Id')) {
    headers.set('X-Tenant-Id', X_TENANT_ID)
  }

  // Log request
  const endpoint = url.replace(API_BASE_URL, '') || url
  const method = options.method || 'GET'
  let requestBody: unknown
  if (options.body) {
    try { requestBody = JSON.parse(options.body as string) } catch { requestBody = options.body }
  }
  const log = devLogApiPair(`${method} ${endpoint}`, requestBody)

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

  // Log response. Skip JSON parsing for non-JSON responses (binary file
  // downloads, HTML error pages) so they don't trigger JSON_PARSE_FAIL.
  try {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const clone = response.clone()
      const json = await safeJson(clone)
      log.end({ status: response.status, data: json })
    } else {
      log.end({ status: response.status })
    }
  } catch {
    log.end({ status: response.status })
  }

  return response
}

/**
 * Public/unauthenticated fetch with automatic paired request/response logging.
 * Use for endpoints that don't need a Bearer token (login, refresh, password reset, etc.).
 * For authed endpoints, use {@link authFetch}.
 *
 * @param url         full URL
 * @param options     standard RequestInit
 * @param logRequest  optional override for the logged request payload
 *                    (use for sensitive bodies — e.g. `{ password: '***' }`);
 *                    when omitted, the request body is auto-extracted and logged.
 */
export const loggedFetch = async (
  url: string,
  options: RequestInit = {},
  logRequest?: unknown,
): Promise<Response> => {
  const endpoint = url.replace(API_BASE_URL, '') || url
  const method = options.method || 'GET'
  let requestBody: unknown = logRequest
  if (requestBody === undefined && options.body) {
    try { requestBody = JSON.parse(options.body as string) } catch { requestBody = options.body }
  }
  const log = devLogApiPair(`${method} ${endpoint}`, requestBody)

  try {
    const response = await fetch(url, options)
    try {
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const clone = response.clone()
        const json = await safeJson(clone)
        log.end({ status: response.status, data: json })
      } else {
        log.end({ status: response.status })
      }
    } catch {
      log.end({ status: response.status })
    }
    return response
  } catch (err) {
    log.end(err instanceof Error ? err : new Error(String(err)))
    throw err
  }
}
