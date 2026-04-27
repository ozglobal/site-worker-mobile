import { type DictItem } from '@/lib/dict'

const HARDCODED_NATIONALITIES: DictItem[] = [
  { code: 'VN', name: '베트남' },
  { code: 'CN', name: '중국' },
  { code: 'TH', name: '태국' },
]

export function useNationalities() {
  return {
    data: HARDCODED_NATIONALITIES,
    isLoading: false,
    isError: false,
  }
}
