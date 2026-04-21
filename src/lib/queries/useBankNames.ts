import { useQuery } from '@tanstack/react-query'
import { authFetch } from '@/lib/auth'
import { safeJson, type ApiResult } from '@/lib/api-result'
import { API_BASE_URL } from '@/lib/config'
import { reportError } from '@/lib/errorReporter'
import type { DictItem } from '@/lib/dict'

/**
 * Bank list lives at a different endpoint than the generic dict items:
 *   GET /system/common/dict/bank_name
 * Response is parsed using the same {label,value} → {name,code} mapping as
 * `fetchDictItems`, with legacy field fallbacks.
 */
async function fetchBankNames(): Promise<ApiResult<DictItem[]>> {
  const endpoint = '/system/common/dict/bank_name'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { accept: '*/*' },
    })
    const json = (await safeJson(response)) as Record<string, unknown> | null
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
    reportError('BANK_NAMES_FETCH_FAIL', 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export function useBankNames() {
  return useQuery<DictItem[]>({
    queryKey: ['bankNames'],
    queryFn: async () => {
      const result = await fetchBankNames()
      if (!result.success) throw new Error(result.error || 'Failed to load bank list')
      return result.data
    },
    staleTime: Infinity,
  })
}
