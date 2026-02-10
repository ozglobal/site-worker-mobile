import { useQuery } from '@tanstack/react-query'
import { fetchContracts } from '@/lib/contract'

export function useContracts(year: number) {
  return useQuery({
    queryKey: ['contracts', year],
    queryFn: async () => {
      const result = await fetchContracts(year)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: Infinity,
  })
}
