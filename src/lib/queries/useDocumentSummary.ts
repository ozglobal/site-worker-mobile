import { useQuery } from '@tanstack/react-query'
import { fetchDocumentSummary, type DocumentSummaryItem } from '@/lib/profile'

/**
 * GET /system/worker/me/document/summary — list of required documents
 * with current submission status.
 */
export function useDocumentSummary() {
  return useQuery<DocumentSummaryItem[]>({
    queryKey: ['documentSummary'],
    queryFn: async () => {
      const result = await fetchDocumentSummary()
      if (!result.success) throw new Error(result.error || 'Failed to fetch document summary')
      if (!result.data) throw new Error('Failed to fetch document summary')
      return result.data
    },
    staleTime: 30_000,
  })
}
