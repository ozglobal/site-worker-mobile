import { authFetch, loggedFetch } from './auth'
import { safeJson, type ApiResult } from './api-result'
import { API_BASE_URL } from './config'
import { reportError } from './errorReporter'

export interface DictItem {
  code: string
  name: string
}

/**
 * Fetch a dictionary list via GET /system/dict/item/code/{codeName}.
 * Accepts both the short `{ code, name }` and Spring-style `{ itemCode, itemName }`
 * payload shapes so the caller can pick whichever the backend ships.
 *
 * @param codeName  dict name (e.g. "worker_category", "id_type")
 * @param options.auth  false = call without Authorization header (use in signup flow
 *                      where the user isn't logged in yet). Defaults to true.
 */
/**
 * Fetch nationality list via GET /system/common/dict/nationality.
 * Used in the passport-holder signup form.
 */
export const fetchNationalities = async (bearerToken?: string): Promise<ApiResult<DictItem[]>> => {
  const endpoint = '/system/common/dict/nationality'
  try {
    const headers: Record<string, string> = { 'accept': '*/*' }
    if (bearerToken) headers['Authorization'] = `Bearer ${bearerToken}`
    const fetchFn = bearerToken ? loggedFetch : authFetch
    const response = await fetchFn(`${API_BASE_URL}${endpoint}`, { method: 'GET', headers })
    const json = await safeJson(response) as Record<string, unknown> | null
    if (!json) return { success: false, error: 'Invalid server response' }
    if (!response.ok) return { success: false, error: `API error: ${response.status}` }

    const raw = (json.data ?? json.result ?? json) as unknown
    const list = Array.isArray(raw) ? raw : []
    const items: DictItem[] = list
      .map((entry) => {
        const e = entry as Record<string, unknown>
        const code = (e.value ?? e.code ?? e.itemCode ?? '') as string
        const name = (e.label ?? e.name ?? e.itemName ?? '') as string
        return { code: String(code), name: String(name) }
      })
      .filter((it) => it.code)

    return { success: true, data: items }
  } catch {
    reportError('DICT_FETCH_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

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
    const items: DictItem[] = list
      .map((entry) => {
        const e = entry as Record<string, unknown>
        // Backend ships `{ label, value }`; tolerate legacy `code`/`itemCode` / `name`/`itemName` too.
        const code = (e.value ?? e.code ?? e.itemCode ?? '') as string
        const name = (e.label ?? e.name ?? e.itemName ?? '') as string
        return { code: String(code), name: String(name) }
      })
      .filter((it) => it.code)

    return { success: true, data: items }
  } catch (error) {
    console.error(`[DICT] fetch ${codeName} error:`, error)
    reportError('DICT_FETCH_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}
