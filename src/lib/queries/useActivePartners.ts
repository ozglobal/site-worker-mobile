import { useQuery } from '@tanstack/react-query'
import { fetchActivePartners, type Partner } from '@/lib/profile'

export function useActivePartners() {
  return useQuery<Partner[]>({
    queryKey: ['activePartners'],
    queryFn: async () => {
      const result = await fetchActivePartners()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch active partners')
      }
      return result.data
    },
    staleTime: Infinity,
  })
}
