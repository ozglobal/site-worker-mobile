import { useQuery } from '@tanstack/react-query'
import { fetchWorkerEquipments } from '@/lib/profile'

export function useWorkerEquipments() {
  return useQuery({
    queryKey: ['workerEquipments'],
    queryFn: async () => {
      const result = await fetchWorkerEquipments()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })
}
