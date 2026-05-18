import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { PhoneField } from "@/components/ui/PhoneField"
import { AddressField } from "@/components/ui/AddressField"
import { validateRrn } from "@/utils/rrn"

const LATIN = /[A-Za-z]/

export interface RrnFormValues {
  name: string
  ssnFirst: string
  ssnSecond: string
  phone: string
  address: string
  addressDetail: string
}

interface IdFormRrnProps {
  mode: "signup" | "edit"
  values: RrnFormValues
  onChange: (field: keyof RrnFormValues, value: string) => void
  onPhoneChangeClick?: () => void
  /** NICE 본인인증 완료된 워커는 이름/주민등록번호 수정 불가 */
  verified?: boolean
  /** 전체 폼을 읽기 전용으로 표시. (내정보 진입 시 기본값, "내 정보 수정" 클릭 시 false 로 전환) */
  readOnly?: boolean
}

export function IdFormRrn({ mode, values, onChange, onPhoneChangeClick, verified = false, readOnly = false }: IdFormRrnProps) {
  const isSignup = mode === "signup"
  const lockId = readOnly || (!isSignup && verified)
  const readOnlyClass = "bg-gray-100 text-slate-500 pointer-events-none"
  const [nameHint, setNameHint] = useState(false)
  const [nameMaxHint, setNameMaxHint] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const ssnSecondRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSignup) nameRef.current?.focus()
  }, [isSignup])

  const handle = (field: keyof RrnFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // 주민등록번호 칸은 숫자만 허용. 마스킹 글자("*") 가 섞여있는 입력에서도
    // 새로 타이핑한 부분만 숫자로 남도록 단순 필터링.
    // 길이는 JS 에서 slice — maxLength 속성은 일부 모바일 키보드에서 무시됨.
    const max = field === "ssnFirst" ? 6 : 7
    const value = e.target.value.replace(/\D/g, "").slice(0, max)
    onChange(field, value)
    if (field === "ssnFirst" && value.length === 6) ssnSecondRef.current?.focus()
  }

  // 마스킹된 값은 검증 제외 (edit 모드에서 서버가 "1******" 같은 마스킹값을
  // 내려줄 때). 한쪽이라도 마스킹이면 사용자가 아직 손대지 않은 상태로 판단.
  const ssnHasMask = values.ssnFirst.includes("*") || values.ssnSecond.includes("*")
  // 앞 6자리·뒤 7자리를 모두 입력한 뒤에만 검증 — 입력 도중에 에러가 뜨지 않도록.
  const ssnComplete = values.ssnFirst.length === 6 && values.ssnSecond.length === 7
  const ssnInvalid = !lockId && !ssnHasMask && ssnComplete && validateRrn(values.ssnFirst, values.ssnSecond, "domestic") !== null

  return (
    <div className="px-4 py-6 space-y-6">
      {isSignup && (
        <p className="text-lg font-bold text-slate-900 mb-6 leading-tight">
          회원 정보를 입력해주세요
        </p>
      )}

      {/* 이름 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">이름</label>
        <Input
          ref={nameRef}
          inputMode="text"
          lang="ko"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          value={values.name}
          onChange={(e) => {
            const raw = e.target.value.replace(/[A-Za-z0-9]/g, "")
            setNameHint(LATIN.test(e.target.value))
            if (raw.length > 4) {
              setNameMaxHint(true)
              onChange("name", raw.slice(0, 4))
            } else {
              setNameMaxHint(false)
              onChange("name", raw)
            }
          }}
          placeholder="이름 입력"
          readOnly={lockId}
          error={!lockId && nameHint}
          className={lockId ? readOnlyClass : "bg-white"}
        />
        {nameHint && (
          <p className="text-sm text-[#DC2626]">이름을 한국어로 입력해 주세요</p>
        )}
        {!nameHint && nameMaxHint && (
          <p className="text-sm text-red-500">이름은 최대 4글자까지 입력할 수 있습니다</p>
        )}
      </div>

      {/* 주민등록번호 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">주민등록번호</label>
        <div className="flex items-center gap-2">
          <Input
            value={values.ssnFirst}
            onChange={handle("ssnFirst")}
            inputMode="numeric"
            maxLength={6}
            placeholder="앞 6자리"
            readOnly={lockId}
            error={ssnInvalid}
            className={`flex-1 ${lockId ? readOnlyClass : "bg-white"}`}
          />
          <span className="text-slate-400">-</span>
          <Input
            ref={ssnSecondRef}
            value={values.ssnSecond}
            onChange={handle("ssnSecond")}
            inputMode="numeric"
            maxLength={7}
            placeholder="뒤 7자리"
            readOnly={lockId}
            error={ssnInvalid}
            className={`flex-1 ${lockId ? readOnlyClass : "bg-white"}`}
          />
        </div>
        {ssnInvalid && (
          <p className="text-sm text-[#DC2626]">올바른 주민등록번호를 입력해주세요</p>
        )}
      </div>

      {/* 휴대폰 번호 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">휴대폰 번호</label>
        <PhoneField value={values.phone} isSignup={isSignup} onChangeClick={readOnly ? undefined : onPhoneChangeClick} />
      </div>

      {/* 주소 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">주소</label>
        {readOnly ? (
          <Input value={values.address} readOnly className={readOnlyClass} />
        ) : (
          <AddressField value={values.address} onChange={(v) => onChange("address", v)} />
        )}
      </div>

      {/* 상세주소 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">상세주소</label>
        <Input
          value={values.addressDetail}
          onChange={(e) => onChange("addressDetail", e.target.value)}
          placeholder="동/호수 등"
          readOnly={readOnly}
          className={readOnly ? readOnlyClass : "bg-white"}
        />
      </div>
    </div>
  )
}
