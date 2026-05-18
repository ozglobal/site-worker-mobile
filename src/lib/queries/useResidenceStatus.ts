import { useQuery } from '@tanstack/react-query'
import { fetchDictByPath, type DictItem } from '@/lib/dict'

const RESIDENCE_STATUS_PATH = '/system/common/dict/residence_status'

export function useResidenceStatus() {
  return useQuery<DictItem[]>({
    queryKey: ['dict', RESIDENCE_STATUS_PATH],
    queryFn: async () => {
      const result = await fetchDictByPath(RESIDENCE_STATUS_PATH, true)
      if (!result.success) throw new Error(result.error || 'Failed to load residence status list')
      return result.data
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
