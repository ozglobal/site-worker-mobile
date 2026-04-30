import { useQuery } from '@tanstack/react-query'
import { fetchDictByPath, type DictItem } from '@/lib/dict'

const BANK_PATH = '/system/common/dict/bank_name'

export function useBankNames() {
  return useQuery<DictItem[]>({
    queryKey: ['dict', BANK_PATH],
    queryFn: async () => {
      const result = await fetchDictByPath(BANK_PATH, true)
      if (!result.success) throw new Error(result.error || 'Failed to load bank list')
      return result.data
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
