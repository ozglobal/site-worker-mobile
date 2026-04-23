import { useQuery } from '@tanstack/react-query'
import { fetchWorkerContracts, groupByMonth, type MonthGroup } from '@/lib/contract'

export function useContracts(userId: string | null, year?: number) {
  return useQuery<MonthGroup[]>({
    queryKey: ['contracts', userId, year ?? 'all'],
    queryFn: async () => {
      const result = await fetchWorkerContracts(userId!, undefined, year)
      if (!result.success) throw new Error(result.error)
      return groupByMonth(result.data)
    },
    enabled: !!userId,
    staleTime: 60_000,
  })
}
