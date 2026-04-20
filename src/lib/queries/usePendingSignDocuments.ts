import { useQuery } from '@tanstack/react-query'
import { fetchPendingSignDocuments, type PendingSignDocument } from '@/lib/profile'
import { getWorkerId } from '@/lib/auth'

/**
 * GET /efs/api/documents/worker/{workerId} — eformsign documents the
 * worker has received but not yet signed.
 *
 * Currently disabled: the backend endpoint returns 404. Re-enable (drop
 * the `enabled: false` override) once the UI surface is wired up and the
 * backend is live.
 */
export function usePendingSignDocuments() {
  const workerId = getWorkerId()
  return useQuery<PendingSignDocument[]>({
    queryKey: ['pendingSignDocuments', workerId],
    queryFn: async () => {
      if (!workerId) return []
      const result = await fetchPendingSignDocuments(workerId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch pending sign documents')
      }
      return result.data || []
    },
    enabled: false,
    staleTime: 30_000,
  })
}
