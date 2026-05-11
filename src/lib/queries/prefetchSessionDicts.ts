import { type QueryClient } from '@tanstack/react-query'
import { fetchDictByPath } from '@/lib/dict'

const GENDER_PATH      = '/common/dict/sys_user_gender'
const NATIONALITY_PATH = '/common/dict/nationality'

export async function prefetchSessionDicts(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['dict', GENDER_PATH],
      queryFn: async () => {
        const result = await fetchDictByPath(GENDER_PATH)
        if (!result.success) throw new Error(result.error)
        return result.data.filter((it) => it.name !== '알 수 없음')
      },
      staleTime: Infinity,
    }),
    queryClient.prefetchQuery({
      queryKey: ['dict', NATIONALITY_PATH],
      queryFn: async () => {
        const result = await fetchDictByPath(NATIONALITY_PATH)
        if (!result.success) throw new Error(result.error)
        return result.data
      },
      staleTime: Infinity,
    }),
  ])
}
