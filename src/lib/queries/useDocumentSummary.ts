import { useQuery } from '@tanstack/react-query'
import { fetchDocumentSummary, type DocumentSummaryItem } from '@/lib/profile'

/**
 * GET /system/worker/me/document/summary — list of required documents
 * with current submission status.
 *
 * `data` is kept as DocumentSummaryItem[] for backward compatibility with
 * existing consumers. `requiredDocsCompleted` is an additional field from
 * the same response that callers can use to override stale auth-context flags.
 */
export function useDocumentSummary() {
  const query = useQuery({
    queryKey: ['documentSummary'] as const,
    queryFn: async () => {
      const result = await fetchDocumentSummary()
      if (!result.success) throw new Error(result.error || 'Failed to fetch document summary')
      if (!result.data) throw new Error('Failed to fetch document summary')
      return result.data
    },
    staleTime: 30_000,
  })

  return {
    ...query,
    data: query.data?.items as DocumentSummaryItem[] | undefined,
    requiredDocsCompleted: query.data?.requiredDocsCompleted ?? null,
  }
}
