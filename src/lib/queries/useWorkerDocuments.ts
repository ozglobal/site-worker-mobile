import { useQuery } from '@tanstack/react-query'
import { fetchWorkerDocuments } from '@/lib/profile'

export function useWorkerDocuments() {
  return useQuery({
    queryKey: ['workerDocuments'],
    queryFn: async () => {
      const result = await fetchWorkerDocuments()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: Infinity,
  })
}
