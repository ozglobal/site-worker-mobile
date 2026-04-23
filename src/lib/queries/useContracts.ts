import { useQuery } from '@tanstack/react-query'
import { fetchHomeData } from '@/lib/attendance'
import { fetchWorkerContracts, groupByMonth, type MonthGroup } from '@/lib/contract'

export function useContracts(userId: string | null, fallbackSiteId?: string | null, year?: number) {
  return useQuery<MonthGroup[]>({
    queryKey: ['contracts', userId, fallbackSiteId ?? null, year ?? 'all'],
    queryFn: async () => {
      const homeResult = await fetchHomeData()
      const todaySiteIds = homeResult.success
        ? [...new Set(homeResult.data.todayAttendance.map((r) => r.siteId).filter(Boolean))]
        : []

      const siteIds = todaySiteIds.length > 0
        ? todaySiteIds
        : fallbackSiteId ? [fallbackSiteId] : []

      if (siteIds.length === 0) {
        const result = await fetchWorkerContracts(userId!, undefined, year)
        if (!result.success) throw new Error(result.error)
        return groupByMonth(result.data)
      }

      const results = await Promise.all(
        siteIds.map((siteId) => fetchWorkerContracts(userId!, siteId, year)),
      )

      const firstFailure = results.find((r) => !r.success)
      if (firstFailure && !firstFailure.success) throw new Error(firstFailure.error)

      const merged = results.flatMap((r) => (r.success ? r.data : []))
      const seen = new Set<string>()
      const deduped = merged.filter((d) => {
        if (seen.has(d.id)) return false
        seen.add(d.id)
        return true
      })

      return groupByMonth(deduped)
    },
    enabled: !!userId,
    staleTime: 60_000,
  })
}
