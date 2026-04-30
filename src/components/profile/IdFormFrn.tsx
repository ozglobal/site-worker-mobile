import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { PhoneField } from "@/components/ui/PhoneField"
import { KoreanNameField } from "@/components/ui/KoreanNameField"
import { EnglishNameField } from "@/components/ui/EnglishNameField"
import { AddressField } from "@/components/ui/AddressField"

export interface FrnFormValues {
  name: string
  englishName: string
  ssnFirst: string
  ssnSecond: string
  phone: string
  address: string
}

interface IdFormFrnProps {
  mode: "signup" | "edit"
  values: FrnFormValues
  onChange: (field: keyof FrnFormValues, value: string) => void
  onPhoneChangeClick?: () => void
}

const readOnlyClass = "bg-gray-100 text-slate-500 pointer-events-none"

export function IdFormFrn({ mode, values, onChange, onPhoneChangeClick }: IdFormFrnProps) {
  const isSignup = mode === "signup"
  const navigate = useNavigate()

  const ssnSecondRef = useRef<HTMLInputElement>(null)

  const handle = (field: keyof FrnFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onChange(field, value)
    if (field === "ssnFirst" && value.length === 6) ssnSecondRef.current?.focus()
  }

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
        <PhoneField value={values.phone} isSignup={isSignup} onChangeClick={onPhoneChangeClick} />
      </div>

      <KoreanNameField value={values.name} isSignup={isSignup} onChange={(v) => onChange("name", v)} />

      <EnglishNameField value={values.englishName} isSignup={isSignup} onChange={(v) => onChange("englishName", v)} />

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
              placeholder={isSignup ? "앞 6자리" : undefined}
              readOnly={!isSignup}
              className={isSignup ? "bg-white" : readOnlyClass}
            />
          </div>
          <span className="text-slate-400">-</span>
          {isSignup ? (
            <div className="relative flex-1 min-w-0">
              <Input
                ref={ssnSecondRef}
                inputMode="numeric"
                maxLength={7}
                value={values.ssnSecond}
                onChange={handle("ssnSecond")}
                placeholder="뒤 7자리"
                className="bg-white text-transparent caret-slate-900"
              />
              <div className="absolute inset-0 flex items-center px-4 pointer-events-none text-base text-slate-900">
                {values.ssnSecond.length > 0
                  ? values.ssnSecond[0] + "●".repeat(values.ssnSecond.length - 1)
                  : ""}
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <Input
                value={values.ssnSecond}
                readOnly
                className={readOnlyClass}
              />
            </div>
          )}
        </div>
      </div>

      {isSignup && (
        <div className="flex items-start gap-2 rounded-lg bg-gray-100 p-3">
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
        <AddressField value={values.address} onChange={(v) => onChange("address", v)} />
      </div>
    </div>
  )
}
