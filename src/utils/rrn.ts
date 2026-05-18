/**
 * 주민등록번호 / 외국인등록번호 유효성 검증.
 * 본사관리자 WorkerRegisterDialog 의 validateIdNumber / deriveBirthDate 와 동일 로직.
 *
 * 내국인: 뒷자리 첫숫자 1·2·3·4
 * 외국인등록: 뒷자리 첫숫자 5·6·7·8
 */

export type RrnKind = 'domestic' | 'foreigner_registered'
export type RrnValidationError = 'invalid_back_first' | 'invalid_birth'

// 주민/외국인등록번호 앞 6자리(YYMMDD) + 뒷자리 첫 숫자(세기 판정)로 YYYY-MM-DD 반환
// 내국인: 1·2→1900s, 3·4→2000s
// 외국인등록: 5·6→1900s, 7·8→2000s
// 월/일 범위 자체가 유효하지 않으면 undefined
export function deriveBirthDate(idFront: string, idBack: string): string | undefined {
  if (!/^\d{6}$/.test(idFront) || !/^\d/.test(idBack)) return undefined
  const yy = idFront.slice(0, 2)
  const mm = idFront.slice(2, 4)
  const dd = idFront.slice(4, 6)
  const first = idBack[0]
  let century: string
  if (first === '1' || first === '2' || first === '5' || first === '6') century = '19'
  else if (first === '3' || first === '4' || first === '7' || first === '8') century = '20'
  else return undefined
  const year = Number(`${century}${yy}`)
  const month = Number(mm)
  const day = Number(dd)
  if (month < 1 || month > 12) return undefined
  if (day < 1 || day > 31) return undefined
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return undefined
  return `${century}${yy}-${mm}-${dd}`
}

export function validateRrn(idFront: string, idBack: string, kind: RrnKind): RrnValidationError | null {
  if (idFront.length !== 6 || idBack.length !== 7) return 'invalid_back_first'
  const first = idBack[0]
  if (kind === 'domestic' && !['1', '2', '3', '4'].includes(first)) return 'invalid_back_first'
  if (kind === 'foreigner_registered' && !['5', '6', '7', '8'].includes(first)) return 'invalid_back_first'
  if (deriveBirthDate(idFront, idBack) === undefined) return 'invalid_birth'
  return null
}
