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
    staleTime: 30_000,
    refetchInterval: 60_000,
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
