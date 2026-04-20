import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotices, markNoticeRead, markAllNoticesRead } from '@/lib/notice'

export function useNotices() {
  return useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const result = await fetchNotices(1, 50)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 60_000,
    // Background poll kept at 30 min to stay friendly on mobile data.
    // User returning to the app no longer triggers a refetch — they can
    // pull-to-refresh if they need the latest, and badge counts update on
    // the next foreground poll.
    refetchInterval: 30 * 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useUnreadCount() {
  const { data } = useNotices()
  return data?.list?.filter((n) => !n.readDate).length ?? 0
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNoticeRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notices'] }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNoticesRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notices'] }),
  })
}
