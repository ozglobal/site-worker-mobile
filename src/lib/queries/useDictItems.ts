import { useQuery } from '@tanstack/react-query'
import { fetchDictItems, type DictItem } from '@/lib/dict'

interface UseDictItemsOptions {
  /** Set `auth: false` when the page is publicly accessible (e.g. signup). */
  auth?: boolean
}

/**
 * React Query hook for dictionary items from
 * GET /system/dict/item/code/{codeName}. Cached per session.
 */
export function useDictItems(codeName: string, options?: UseDictItemsOptions) {
  const auth = options?.auth !== false
  return useQuery<DictItem[]>({
    queryKey: ['dict', codeName, auth ? 'authed' : 'public'],
    queryFn: async () => {
      const result = await fetchDictItems(codeName, { auth })
      if (!result.success || !result.data) {
        throw new Error(result.error || `Failed to load dict: ${codeName}`)
      }
      return result.data
    },
    staleTime: Infinity,
    enabled: !!codeName,
  })
}
