import { useQuery } from '@tanstack/react-query'
import { fetchDictByPath, type DictItem } from '@/lib/dict'
import { reportError } from '@/lib/errorReporter'

const GENDER_PATH = '/common/dict/sys_user_gender'

const fetchGenderDict = async (): Promise<DictItem[]> => {
  try {
    const result = await fetchDictByPath(GENDER_PATH)
    if (!result.success) throw new Error(result.error)
    return result.data.filter((it) => it.name !== '알 수 없음')
  } catch {
    reportError('DICT_FETCH_FAIL', 'Network error', { endpoint: GENDER_PATH })
    return []
  }
}

export function useGenderDict() {
  return useQuery<DictItem[]>({
    queryKey: ['dict', GENDER_PATH],
    queryFn: fetchGenderDict,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
