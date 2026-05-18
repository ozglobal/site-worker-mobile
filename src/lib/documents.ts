import type { DocumentType } from './profile'
import type { WorkerMeta } from './storage'

export interface DocumentItem {
  id: string
  apiType: DocumentType
  title: string
  description: string
}

// Canonical document catalogue. Only these appear anywhere in the app.
const ID_CARD: DocumentItem = {
  id: 'id-card',
  apiType: 'id_card_front',
  title: '주민등록증(운전면허증)',
  description: '',
}

const FOREIGN_CARD: DocumentItem = {
  id: 'foreign-card',
  apiType: 'id_card_front',
  title: '외국인등록증',
  description: '',
}

const PASSPORT: DocumentItem = {
  id: 'passport',
  apiType: 'id_card_front',
  title: '여권',
  description: '',
}

const BANKBOOK: DocumentItem = {
  id: 'bankbook',
  apiType: 'bankbook',
  title: '통장',
  description: '',
}

const FAMILY_CERT: DocumentItem = {
  id: 'family-cert',
  apiType: 'family_cert',
  title: '가족관계증명서',
  description: '',
}

const SAFETY_CERT: DocumentItem = {
  id: 'safety-cert',
  apiType: 'safety_cert',
  title: '기초안전보건교육 이수증',
  description: '',
}

// Full set — used as a fallback when worker meta is unknown
// (e.g. a profile user lands on the Documents page before any
// meta has been cached). Showing too many is safer than too few.
export const allDocuments: DocumentItem[] = [
  ID_CARD,
  FOREIGN_CARD,
  PASSPORT,
  BANKBOOK,
  FAMILY_CERT,
  SAFETY_CERT,
]

/**
 * Compute the list of documents the worker must submit, based on their
 * nationality / id type and wage-payment target.
 *
 * Rules:
 *   - exactly one of 주민등록증 / 외국인등록증 / 여권 (driven by idType)
 *   - 통장: only when wagePaymentTarget is SELF or FAMILY
 *   - 가족관계증명서: only when wagePaymentTarget is FAMILY
 *   - 기초안전보건교육 이수증: always
 *
 * Each rule is applied independently so partial meta (e.g. idType known but
 * wagePaymentTarget still unset) still yields a useful, filtered list.
 */
/**
 * Map the backend-reported idType strings to our internal enum.
 *   '주민등록번호' / 'resident_id'       → 'resident_id'
 *   '외국인등록번호' / 'alien_registration' → 'alien_registration'
 *   '여권번호' / 'passport'              → 'passport'
 */
export function backendIdTypeToInternal(raw: string | undefined): WorkerMeta['idType'] | undefined {
  if (raw === '주민등록번호' || raw === 'resident_id') return 'resident_id'
  if (raw === '외국인등록번호' || raw === 'alien_registration') return 'alien_registration'
  if (raw === '여권번호' || raw === 'passport') return 'passport'
  return undefined
}

/**
 * Backend-driven document catalogue. Codes come from
 * `GET /system/worker/me.missingRequiredDocs[]`.
 */
export type SubmissionMethod = 'upload' | 'eformsign'

export interface RequiredDocMeta {
  code: string
  group: string
  label: string
  method: SubmissionMethod
  perSite: boolean
}

export const requiredDocsCatalogue: Record<string, RequiredDocMeta> = {
  id_card:           { code: 'id_card',           group: 'id_card',           label: '신분증 사본',                method: 'upload',    perSite: false },
  bankbook:          { code: 'bankbook',          group: 'bankbook',          label: '통장사본',                  method: 'upload',    perSite: true  },
  safety_cert:       { code: 'safety_cert',       group: 'safety_cert',       label: '기초안전보건교육 이수증',     method: 'upload',    perSite: false },
  family_relation:   { code: 'family_relation',   group: 'family_relation',   label: '가족관계증명서',             method: 'upload',    perSite: true  },
  proxy_general:     { code: 'proxy_general',     group: 'proxy_general',     label: '위임장 (일반)',              method: 'eformsign', perSite: true  },
  proxy_contractor:  { code: 'proxy_contractor',  group: 'proxy_contractor',  label: '위임장 (용역)',              method: 'eformsign', perSite: true  },
  equipment_license: { code: 'equipment_license', group: 'equipment_license', label: '장비자격증',                 method: 'upload',    perSite: false },
  alien_reg:         { code: 'alien_reg',         group: 'alien_reg',         label: '외국인등록증',               method: 'upload',    perSite: false },
  alien_reg_front:   { code: 'alien_reg_front',   group: 'alien_reg',         label: '외국인등록증 앞면',          method: 'upload',    perSite: false },
  alien_reg_back:    { code: 'alien_reg_back',    group: 'alien_reg',         label: '외국인등록증 뒷면',          method: 'upload',    perSite: false },
  business_license:  { code: 'business_license',  group: 'business_license',  label: '사업자등록증',               method: 'upload',    perSite: false },
  health_checkup:    { code: 'health_checkup',    group: 'health_checkup',    label: '건강검진 내역',              method: 'upload',    perSite: false },
  passport:          { code: 'passport',          group: 'passport',          label: '여권 사본',                  method: 'upload',    perSite: false },
}

/**
 * Resolve missingRequiredDocs codes (from /system/worker/me) to catalogue
 * entries. Unknown codes are passed through with a fallback label so the
 * UI never silently drops a required item.
 */
export function resolveRequiredDocs(codes: string[] | undefined): RequiredDocMeta[] {
  if (!codes) return []
  return codes.map((code) =>
    requiredDocsCatalogue[code] ?? { code, group: code, label: code, method: 'upload', perSite: false }
  )
}

export function getRequiredDocuments(meta: WorkerMeta | null): DocumentItem[] {
  const list: DocumentItem[] = []

  // 1. ID document — respect idType when known; if unknown, show all 3.
  if (meta?.idType === 'resident_id') list.push(ID_CARD)
  else if (meta?.idType === 'alien_registration') list.push(FOREIGN_CARD)
  else if (meta?.idType === 'passport') list.push(PASSPORT)
  else list.push(ID_CARD, FOREIGN_CARD, PASSPORT)

  // 2. Bankbook — required for SELF/FAMILY. When wagePaymentTarget is unknown,
  //    include it conservatively (most workers will need it).
  if (meta?.wagePaymentTarget !== 'COMPANY') {
    list.push(BANKBOOK)
  }

  // 3. Family cert — required for FAMILY, or possibly required when unknown.
  if (meta?.wagePaymentTarget === 'PROXY' || meta?.wagePaymentTarget === undefined) {
    list.push(FAMILY_CERT)
  }

  list.push(SAFETY_CERT)
  return list
}
