import { authFetch, loggedFetch } from './auth'
import { safeJson, type ApiResult } from './api-result'
import { API_BASE_URL } from './config'
import { reportError } from './errorReporter'

export interface DictItem {
  code: string
  name: string
}

const mapDictEntry = (entry: unknown): DictItem => {
  const e = entry as Record<string, unknown>
  const code = (e.value ?? e.code ?? e.itemCode ?? '') as string
  const name = (e.label ?? e.name ?? e.itemName ?? '') as string
  return { code: String(code), name: String(name) }
}

export const fetchDictByPath = async (
  path: string,
  auth = false,
): Promise<ApiResult<DictItem[]>> => {
  const fetchFn = auth ? authFetch : loggedFetch
  try {
    const response = await fetchFn(`${API_BASE_URL}${path}`, { method: 'GET', headers: { accept: '*/*' } })
    const json = await safeJson(response) as Record<string, unknown> | null
    if (!json) return { success: false, error: 'Invalid server response' }
    if (!response.ok) return { success: false, error: `API error: ${response.status}` }
    const raw = (json.data ?? json.result ?? json) as unknown
    const list = Array.isArray(raw) ? raw : []
    return { success: true, data: list.map(mapDictEntry).filter((it) => it.code) }
  } catch {
    reportError('DICT_FETCH_FAIL', 'Network error', { endpoint: path })
    return { success: false, error: 'Network error' }
  }
}

export const fetchNationalities = (): Promise<ApiResult<DictItem[]>> =>
  fetchDictByPath('/common/dict/nationality')

export const fetchDictItems = async (
  codeName: string,
  options?: { auth?: boolean },
): Promise<ApiResult<DictItem[]>> => {
  const endpoint = `/system/dict/item/code/${codeName}`
  const fetchFn = options?.auth === false ? loggedFetch : authFetch
  try {
    const response = await fetchFn(`${API_BASE_URL}${endpoint}`, {
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

    const raw = (json.data ?? json.result ?? json) as unknown
    const list = Array.isArray(raw) ? raw : []
    return { success: true, data: list.map(mapDictEntry).filter((it) => it.code) }
  } catch (error) {
    console.error(`[DICT] fetch ${codeName} error:`, error)
    reportError('DICT_FETCH_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}
