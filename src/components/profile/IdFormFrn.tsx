import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { PhoneField } from "@/components/ui/PhoneField"
import { KoreanNameField } from "@/components/ui/KoreanNameField"
import { EnglishNameField } from "@/components/ui/EnglishNameField"
import { AddressField } from "@/components/ui/AddressField"
import { validateRrn } from "@/utils/rrn"

export interface FrnFormValues {
  name: string
  englishName: string
  ssnFirst: string
  ssnSecond: string
  phone: string
  address: string
  addressDetail: string
}

interface IdFormFrnProps {
  mode: "signup" | "edit"
  values: FrnFormValues
  onChange: (field: keyof FrnFormValues, value: string) => void
  onPhoneChangeClick?: () => void
  /** NICE 본인인증 완료된 워커는 이름/외국인등록번호 수정 불가 */
  verified?: boolean
  /** 전체 폼을 읽기 전용으로 표시. */
  readOnly?: boolean
}

export function IdFormFrn({ mode, values, onChange, onPhoneChangeClick, verified = false, readOnly = false }: IdFormFrnProps) {
  const isSignup = mode === "signup"
  const lockId = readOnly || verified  // 인증된 워커는 이름/번호 수정 불가
  const readOnlyClass = "bg-gray-100 text-slate-500 pointer-events-none"
  const navigate = useNavigate()

  const ssnSecondRef = useRef<HTMLInputElement>(null)

  const handle = (field: keyof FrnFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // 외국인등록번호 칸은 숫자만 허용. 마스킹("*") 입력 차단.
    const value = e.target.value.replace(/\D/g, "")
    onChange(field, value)
    if (field === "ssnFirst" && value.length === 6) ssnSecondRef.current?.focus()
  }

  // 마스킹된 값은 검증 제외 (edit 모드에서 서버가 "5******" 같은 마스킹값을
  // 내려줄 때). 한쪽이라도 마스킹이면 사용자가 아직 손대지 않은 상태로 판단.
  const ssnHasMask = values.ssnFirst.includes("*") || values.ssnSecond.includes("*")
  const ssnTouched = !ssnHasMask && (values.ssnFirst.length > 0 || values.ssnSecond.length > 0)
  const ssnInvalid = !lockId && ssnTouched && validateRrn(values.ssnFirst, values.ssnSecond, "foreigner_registered") !== null

  return (
    <div className="px-4 py-6 space-y-6">
      {isSignup && (
        <p className="text-lg font-bold text-slate-900 mb-6 leading-tight">
          회원 정보를 입력해주세요
        </p>
      )}

      {/* 휴대폰 번호 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">휴대폰 번호</label>
        <PhoneField value={values.phone} isSignup={isSignup} onChangeClick={readOnly ? undefined : onPhoneChangeClick} />
      </div>

      <KoreanNameField value={values.name} isSignup={isSignup} verified={verified || readOnly} onChange={(v) => onChange("name", v)} />

      <EnglishNameField value={values.englishName} isSignup={isSignup} verified={verified || readOnly} onChange={(v) => onChange("englishName", v)} />

      {/* 외국인등록번호 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">외국인등록번호</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <Input
              inputMode="numeric"
              maxLength={6}
              value={values.ssnFirst}
              onChange={handle("ssnFirst")}
              placeholder="앞 6자리"
              readOnly={lockId}
              error={ssnInvalid}
              className={lockId ? readOnlyClass : "bg-white"}
            />
          </div>
          <span className="text-slate-400">-</span>
          <div className="flex-1 min-w-0">
            <Input
              ref={ssnSecondRef}
              inputMode="numeric"
              maxLength={7}
              value={values.ssnSecond}
              onChange={handle("ssnSecond")}
              placeholder="뒤 7자리"
              readOnly={lockId}
              error={ssnInvalid}
              className={lockId ? readOnlyClass : "bg-white"}
            />
          </div>
        </div>
        {ssnInvalid && (
          <p className="text-sm text-[#DC2626]">올바른 외국인등록번호를 입력해주세요</p>
        )}
      </div>

      {isSignup && (
        <div className="flex items-start gap-2 rounded-lg bg-neutral-100 p-3">
          <svg className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">외국인등록번호가 없다면 여권번호로 가입할 수 있어요.</span>
            <button
              onClick={() => navigate("/signup/signup-pn")}
              className="text-sm font-medium text-blue-500 text-left"
            >
              여권번호로 가입하기
            </button>
          </div>
        </div>
      )}

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
