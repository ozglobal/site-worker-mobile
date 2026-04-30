import { useQuery } from '@tanstack/react-query'
import { fetchDictByPath, type DictItem } from '@/lib/dict'

const NATIONALITY_PATH = '/common/dict/nationality'

export function useNationalities() {
  return useQuery<DictItem[]>({
    queryKey: ['dict', NATIONALITY_PATH],
    queryFn: async () => {
      const result = await fetchDictByPath(NATIONALITY_PATH)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
