export interface JusoAddress {
  roadAddr: string    // 도로명주소
  jibunAddr: string   // 지번주소
  zipNo: string       // 우편번호
  bdNm: string        // 건물명
  siNm: string        // 시도명
  sggNm: string       // 시군구명
  emdNm: string       // 읍면동명
}

export interface JusoSearchResult {
  addresses: JusoAddress[]
  totalCount: number
}

const JUSO_API_URL = '/juso-api/addrlink/addrLinkApi.do'
const CONFM_KEY = import.meta.env.VITE_JUSO_API_KEY || ''

export async function searchAddress(
  keyword: string,
  page: number = 1,
  countPerPage: number = 10
): Promise<JusoSearchResult> {
  if (!keyword.trim()) {
    return { addresses: [], totalCount: 0 }
  }

  const params = new URLSearchParams({
    confmKey: CONFM_KEY,
    keyword: keyword.trim(),
    currentPage: String(page),
    countPerPage: String(countPerPage),
    resultType: 'json',
  })

  const url = `${JUSO_API_URL}?${params}`
  console.log('[request] GET', JUSO_API_URL, { keyword, page })

  try {
    const response = await fetch(url)
    const json = await response.json()

    console.log('[RESPONSE] GET', JUSO_API_URL, { status: response.status, data: json })

    const common = json?.results?.common
    const juso = json?.results?.juso

    if (common?.errorCode !== '0') {
      console.error('[JUSO] API error:', common?.errorMessage)
      return { addresses: [], totalCount: 0 }
    }

    const addresses: JusoAddress[] = (juso || []).map((item: Record<string, string>) => ({
      roadAddr: item.roadAddr || '',
      jibunAddr: item.jibunAddr || '',
      zipNo: item.zipNo || '',
      bdNm: item.bdNm || '',
      siNm: item.siNm || '',
      sggNm: item.sggNm || '',
      emdNm: item.emdNm || '',
    }))

    return {
      addresses,
      totalCount: Number(common?.totalCount) || 0,
    }
  } catch (error) {
    console.error('[JUSO] searchAddress error:', error)
    return { addresses: [], totalCount: 0 }
  }
}
