import { useQuery } from '@tanstack/react-query'
import { fetchCorrectionRequests } from '@/lib/attendance'

export function useCorrectionRequests() {
  return useQuery({
    queryKey: ['correctionRequests'],
    queryFn: async () => {
      const result = await fetchCorrectionRequests()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
