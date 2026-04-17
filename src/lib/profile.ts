import { authFetch } from './auth'
import { safeJson, type ApiResult } from './api-result'
import { API_BASE_URL } from './config'
import { reportError } from './errorReporter'

export interface WorkerMeResponse {
  success: boolean
  data?: WorkerMeData
  error?: string
}

export interface WorkerMeData {
  workerName: string
  ssnFirst: string
  ssnSecond: string
  phone: string
  address: string
  accountHolder: string
  accountHolderRelation?: string | null
  bankName: string
  bankAccount: string
  idType?: '주민등록번호' | '외국인등록번호' | '여권번호' | string
  wagePaymentTarget?: 'SELF' | 'PROXY' | 'COMPANY' | string
  workerCategory?: 'GENERAL' | 'SPECIALTY' | 'SERVICE' | 'ENGINEER' | string
  equipmentCompanyName?: string | null
  equipmentCompanyOwner?: string | null
  missingRequiredDocs?: string[]
}

/**
 * Fetch current worker profile from GET /system/worker/me
 * and sync to profileStorage
 */
export const fetchWorkerMe = async (): Promise<WorkerMeResponse> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/system/worker/me`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
      },
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!json) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` }
    }

    const payload = (json.data || json.result || json) as Record<string, unknown>

    const data: WorkerMeData = {
      workerName:
        (payload.nameKo as string) ||
        (payload.workerName as string) ||
        (payload.name as string) ||
        '',
      ssnFirst: (payload.ssnFirst as string) || (payload.residentFirst as string) || '',
      ssnSecond: (payload.ssnSecond as string) || (payload.residentSecond as string) || '',
      phone:
        (payload.mobilePhone as string) ||
        (payload.phone as string) ||
        (payload.phoneNumber as string) ||
        '',
      address: (payload.address as string) || '',
      accountHolder: (payload.accountHolder as string) || '',
      accountHolderRelation: (payload.accountHolderRelation as string) || null,
      bankName: (payload.bankName as string) || '',
      bankAccount: (payload.bankAccount as string) || (payload.bankAccountMasked as string) || '',
      idType: (payload.idType as string) || undefined,
      wagePaymentTarget: (payload.wagePaymentTarget as string) || undefined,
      workerCategory: (payload.workerCategory as string) || undefined,
      equipmentCompanyName: (payload.equipmentCompanyName as string) || null,
      equipmentCompanyOwner: (payload.equipmentCompanyOwner as string) || null,
      missingRequiredDocs: Array.isArray(payload.missingRequiredDocs)
        ? (payload.missingRequiredDocs as string[])
        : [],
    }

    return { success: true, data }
  } catch (error) {
    console.error('[PROFILE] fetchWorkerMe error:', error)
    reportError('PROFILE_FETCH_FAIL', 'Network error', { endpoint: '/system/worker/me' })
    return { success: false, error: 'Network error' }
  }
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
  error?: string
}

/**
 * Change password via PATCH /user/profile/password
 */
export const changePassword = async (params: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
  try {
    const body = {
      oldPassword: params.currentPassword,
      newPassword: params.newPassword,
    }
    const response = await authFetch(`${API_BASE_URL}/user/profile/password`, {
      method: 'PATCH',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!json) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      return { success: false, error: (json.message as string) || `API error: ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error('[PROFILE] changePassword error:', error)
    reportError('PROFILE_PASSWORD_FAIL', 'Network error', { endpoint: '/user/profile/password' })
    return { success: false, error: 'Network error' }
  }
}

/**
 * Compress image to JPEG with max width, returns a Blob
 */
function compressImage(file: File, maxWidth = 1024, quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = img.width > maxWidth ? maxWidth / img.width : 1
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/jpeg',
        quality,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

/**
 * Convert Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export interface Partner {
  id: string
  partnerName: string
  partnerType: string
}

export interface ActivePartnersResponse {
  success: boolean
  data?: Partner[]
  error?: string
}

/**
 * Fetch active partners via GET /system/partner/active
 */
export const fetchActivePartners = async (): Promise<ActivePartnersResponse> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/system/partner/active`, {
      method: 'GET',
      headers: { 'accept': '*/*' },
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!json) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` }
    }

    const data = (json.data || []) as Partner[]
    return { success: true, data }
  } catch (error) {
    console.error('[PROFILE] fetchActivePartners error:', error)
    reportError('PARTNER_FETCH_FAIL', 'Network error', { endpoint: '/system/partner/active' })
    return { success: false, error: 'Network error' }
  }
}

/**
 * Update worker profile via POST /system/worker
 */
export const updateWorkerProfile = async (data: {
  workerName: string
  ssnFirst: string
  ssnSecond: string
  phone: string
  address: string
}): Promise<ApiResult<void>> => {
  const endpoint = '/system/worker'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    return { success: true, data: undefined }
  } catch (error) {
    console.error('[PROFILE] updateWorkerProfile error:', error)
    reportError('PROFILE_UPDATE_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

/**
 * Update worker profile via PUT /system/worker/me
 */
export const updateWorkerAddress = async (
  address: string
): Promise<ApiResult<void>> => {
  const endpoint = '/system/worker/me'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    return { success: true, data: undefined }
  } catch (error) {
    console.error('[PROFILE] updateWorkerAddress error:', error)
    reportError('PROFILE_ADDRESS_UPDATE_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export interface WorkerOnboardingPayload {
  bankName: string | null
  bankAccount: string | null
  accountHolder: string | null
  accountHolderRelation: string | null
  equipmentCompanyName: string | null
  equipmentCompanyOwner: string | null
  wagePaymentTarget: 'SELF' | 'PROXY' | 'COMPANY' | null
  dailyWage: number | null
}

export const completeWorkerOnboarding = async (): Promise<ApiResult<void>> => {
  const endpoint = '/system/worker/me/complete'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'accept': '*/*' },
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    return { success: true, data: undefined }
  } catch {
    reportError('PROFILE_ONBOARDING_COMPLETE_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export const submitWorkerOnboarding = async (
  payload: WorkerOnboardingPayload,
): Promise<ApiResult<void>> => {
  const endpoint = '/system/worker/me'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    return { success: true, data: undefined }
  } catch {
    reportError('PROFILE_ONBOARDING_SUBMIT_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export const updateBankAccount = async (data: {
  bankName: string
  bankAccount: string
  accountHolder: string
  wagePaymentTarget: string
}): Promise<ApiResult<void>> => {
  const endpoint = '/system/worker/me/bank'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    return { success: true, data: undefined }
  } catch (error) {
    console.error('[PROFILE] updateBankAccount error:', error)
    reportError('PROFILE_BANK_UPDATE_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export interface UploadEquipmentPayload {
  equipmentType: string
  licenseFile: File
  validFrom: string // YYYY-MM-DD
  validUntil: string // YYYY-MM-DD
}

/**
 * POST /system/worker/me/equipment as multipart/form-data.
 * Do NOT set Content-Type — the browser will add the correct boundary.
 */
export const uploadEquipment = async (
  payload: UploadEquipmentPayload,
): Promise<ApiResult<void>> => {
  const endpoint = '/system/worker/me/equipment'
  try {
    const form = new FormData()
    form.append('equipmentType', payload.equipmentType)
    form.append('licenseFile', payload.licenseFile)
    form.append('validFrom', payload.validFrom)
    form.append('validUntil', payload.validUntil)

    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'accept': '*/*' },
      body: form,
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    return { success: true, data: undefined }
  } catch {
    reportError('EQUIPMENT_UPLOAD_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export const updateEngineerCategory = async (data: {
  equipmentCompanyName: string
  equipmentCompanyOwner: string
  isRepresentative: boolean
}): Promise<ApiResult<void>> => {
  const endpoint = '/system/worker/me/category'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workerCategory: 'equipment_driver',
        ...data,
      }),
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    return { success: true, data: undefined }
  } catch {
    reportError('PROFILE_ENGINEER_UPDATE_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export const updateWorkerCategory = async (
  workerCategory: string,
): Promise<ApiResult<void>> => {
  const endpoint = '/system/worker/me/category'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workerCategory }),
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    return { success: true, data: undefined }
  } catch {
    reportError('PROFILE_CATEGORY_UPDATE_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export interface PaymentInfo {
  bankName?: string
  bankAccount?: string
  accountHolder?: string
  wagePaymentTarget?: 'SELF' | 'PROXY' | 'COMPANY' | string
}

/**
 * PUT /system/worker/me/payment with no body — returns current payment info.
 * Used on /profile/payroll-account open to hydrate the view.
 */
export const fetchPaymentInfo = async (): Promise<ApiResult<PaymentInfo>> => {
  const endpoint = '/system/worker/me/payment'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: '{}',
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    const payload = ((json?.data as Record<string, unknown>) || json || {}) as Record<string, unknown>
    const data: PaymentInfo = {
      bankName: (payload.bankName as string) || undefined,
      bankAccount: (payload.bankAccount as string) || undefined,
      accountHolder: (payload.accountHolder as string) || undefined,
      wagePaymentTarget: (payload.wagePaymentTarget as string) || undefined,
    }
    return { success: true, data }
  } catch {
    reportError('PROFILE_PAYMENT_FETCH_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export interface UpdatePaymentPayload {
  wagePaymentTarget: 'SELF' | 'PROXY' | 'COMPANY'
  bankName?: string | null
  bankAccount?: string | null
  accountHolder?: string | null
  accountHolderRelation?: string | null
}

export const updatePayment = async (
  payload: UpdatePaymentPayload,
): Promise<ApiResult<void>> => {
  const endpoint = '/system/worker/me/payment'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    return { success: true, data: undefined }
  } catch {
    reportError('PROFILE_PAYMENT_UPDATE_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export const updatePaymentTarget = async (
  wagePaymentTarget: 'SELF' | 'PROXY' | 'COMPANY',
): Promise<ApiResult<void>> => {
  const endpoint = '/system/worker/me/payment'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ wagePaymentTarget }),
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    return { success: true, data: undefined }
  } catch {
    reportError('PROFILE_PAYMENT_UPDATE_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export interface DocumentSummaryItem {
  code: string
  label?: string
  method?: 'upload' | 'eformsign' | string
  status?: string
  perSite?: boolean
  submittedAt?: string | null
}

/**
 * GET /system/worker/me/document/summary — catalogue of documents the
 * worker must submit, including current status. Tolerates both the
 * short `{ code, label, method, status }` and Spring-style alternatives
 * (`value`, `name`, `submissionMethod`, etc.).
 */
export const fetchDocumentSummary = async (): Promise<ApiResult<DocumentSummaryItem[]>> => {
  const endpoint = '/system/worker/me/document/summary'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'accept': '*/*' },
    })

    const json = await safeJson(response) as Record<string, unknown> | null
    if (!json) return { success: false, error: 'Invalid server response' }
    if (!response.ok) {
      return { success: false, error: (json.message as string) || `API error: ${response.status}` }
    }

    const payload = (json.data ?? json.result ?? json) as Record<string, unknown>
    // eslint-disable-next-line no-console
    console.log('[DOCS] /document/summary payload keys:', Object.keys(payload), payload)

    // Response ships a `requiredGroups` array. Each entry may either BE an item
    // directly, or be a group wrapper with nested `items` — flatten both shapes.
    // Fallback: a flat array at the root for backward compatibility.
    const groups = Array.isArray(payload.requiredGroups)
      ? payload.requiredGroups as Array<Record<string, unknown>>
      : []
    const flatList: unknown[] = groups.length > 0
      ? groups.flatMap((g) => (Array.isArray(g.items) ? g.items : [g]))
      : Array.isArray(payload) ? payload : []
    // eslint-disable-next-line no-console
    console.log('[DOCS] flatList length:', flatList.length, flatList)

    const items: DocumentSummaryItem[] = flatList
      .map((entry) => {
        // requiredGroups ships plain strings (doc codes) alongside the object-form catalogue.
        if (typeof entry === 'string') {
          return { code: entry }
        }
        const e = entry as Record<string, unknown>
        const code = (e.code ?? e.value ?? e.documentCode ?? e.documentType ?? '') as string
        const label = (e.label ?? e.name ?? e.documentName ?? undefined) as string | undefined
        const method = (e.method ?? e.submissionMethod ?? undefined) as string | undefined
        const status = (e.status ?? undefined) as string | undefined
        const perSite = (e.perSite ?? e.siteSpecific ?? undefined) as boolean | undefined
        const submittedAt = (e.submittedAt ?? e.submitDate ?? null) as string | null
        return { code: String(code), label, method, status, perSite, submittedAt }
      })
      .filter((it) => it.code)

    return { success: true, data: items }
  } catch (error) {
    console.error('[DOCS] fetchDocumentSummary error:', error)
    reportError('DOCS_SUMMARY_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export interface WorkerDocument {
  id: string
  documentType: string
  documentGroup: string
  documentName: string
  status: string
  fileId: string
}

/**
 * Fetch worker documents via GET /system/worker/me/document
 */
export const fetchWorkerDocuments = async (): Promise<ApiResult<WorkerDocument[]>> => {
  const endpoint = '/system/worker/me/document'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'accept': '*/*' },
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    const payload = json?.data || json
    const data = (Array.isArray(payload) ? payload : []) as WorkerDocument[]
    return { success: true, data }
  } catch (error) {
    console.error('[PROFILE] fetchWorkerDocuments error:', error)
    reportError('PROFILE_DOCUMENTS_FETCH_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export type DocumentType = 'id_card_front' | 'id_card_back' | 'safety_cert' | 'bankbook' | 'business_license' | 'proxy_general' | 'family_cert' | 'labor_proxy' | 'business_cert'

// ============================================
// Worker Document Upload APIs
// POST /system/worker/me/document/{slug}  (multipart/form-data)
// ============================================

const postDocumentMultipart = async (
  slug: string,
  form: FormData,
): Promise<ApiResult<void>> => {
  const endpoint = `/system/worker/me/document/${slug}`
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'accept': '*/*' },
      body: form,
    })
    const json = await safeJson(response) as Record<string, unknown> | null
    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }
    return { success: true, data: undefined }
  } catch {
    reportError('DOCUMENT_UPLOAD_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

/** 1. 신분증 사본 — POST /system/worker/me/document/id-card */
export const uploadIdCardDoc = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return postDocumentMultipart('id-card', form)
}

export interface AlienRegUploadReq {
  frontFile?: File
  backFile?: File
  nationality?: string
  residenceStatus?: string
  residencePeriodStart?: string // yyyy-MM-dd
  residencePeriodEnd?: string // yyyy-MM-dd
}

/** 2. 외국인등록증 — POST /system/worker/me/document/alien-reg */
export const uploadAlienRegDoc = (data: AlienRegUploadReq) => {
  const form = new FormData()
  if (data.frontFile) form.append('frontFile', data.frontFile)
  if (data.backFile) form.append('backFile', data.backFile)
  if (data.nationality) form.append('nationality', data.nationality)
  if (data.residenceStatus) form.append('residenceStatus', data.residenceStatus)
  if (data.residencePeriodStart) form.append('residencePeriodStart', data.residencePeriodStart)
  if (data.residencePeriodEnd) form.append('residencePeriodEnd', data.residencePeriodEnd)
  return postDocumentMultipart('alien-reg', form)
}

export interface PassportUploadReq {
  file?: File
  nationality?: string
  passportExpiryDate?: string // yyyy-MM-dd
}

/** 3. 여권 — POST /system/worker/me/document/passport */
export const uploadPassportDoc = (data: PassportUploadReq) => {
  const form = new FormData()
  if (data.file) form.append('file', data.file)
  if (data.nationality) form.append('nationality', data.nationality)
  if (data.passportExpiryDate) form.append('passportExpiryDate', data.passportExpiryDate)
  return postDocumentMultipart('passport', form)
}

export interface BankbookUploadReq {
  file?: File
  accountHolder?: string
  bankName?: string
  bankAccount?: string
}

/** 4. 통장사본 — POST /system/worker/me/document/bankbook */
export const uploadBankbookDoc = (data: BankbookUploadReq) => {
  const form = new FormData()
  if (data.file) form.append('file', data.file)
  if (data.accountHolder) form.append('accountHolder', data.accountHolder)
  if (data.bankName) form.append('bankName', data.bankName)
  if (data.bankAccount) form.append('bankAccount', data.bankAccount)
  return postDocumentMultipart('bankbook', form)
}

/** 5. 기초안전보건교육 이수증 — POST /system/worker/me/document/safety-cert */
export const uploadSafetyCertDoc = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return postDocumentMultipart('safety-cert', form)
}

/** 6. 가족관계증명서 — POST /system/worker/me/document/family-relation */
export const uploadFamilyRelationDoc = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return postDocumentMultipart('family-relation', form)
}

/** 7. 사업자등록증 — POST /system/worker/me/document/business-license */
export const uploadBusinessLicenseDoc = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return postDocumentMultipart('business-license', form)
}

/** 8. 건강검진 내역 — POST /system/worker/me/document/health-checkup */
export const uploadHealthCheckupDoc = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return postDocumentMultipart('health-checkup', form)
}

export interface UploadDocumentResponse {
  success: boolean
  error?: string
}

/**
 * Upload document via POST /system/worker/me/document?documentType=...
 */
export const uploadDocument = async (
  documentType: DocumentType,
  file: File
): Promise<UploadDocumentResponse> => {
  const endpoint = `/system/worker/me/document?documentType=${documentType}`
  try {
    const isImage = file.type.startsWith('image/')
    const blob = isImage ? await compressImage(file) : file
    const base64 = await blobToBase64(blob)
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: base64 }),
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!response.ok) {
      return { success: false, error: (json?.message as string) || `API error: ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error('[PROFILE] uploadDocument error:', error)
    reportError('PROFILE_DOCUMENT_UPLOAD_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}
