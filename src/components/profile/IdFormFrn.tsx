import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"

const HANGUL = /[가-힣ᄀ-ᇿ㄰-㆏]/
const LATIN  = /[A-Za-z]/

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
}

const readOnlyClass = "bg-gray-100 text-slate-500 pointer-events-none"

export function IdFormFrn({ mode, values, onChange }: IdFormFrnProps) {
  const isSignup = mode === "signup"
  const navigate = useNavigate()

  const ssnSecondRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLInputElement>(null)
  const [nameHint, setNameHint]   = useState(false)  // English typed in 한글 field
  const [enHint,   setEnHint]     = useState(false)  // Korean typed in 영문 field

  const handle = (field: keyof FrnFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onChange(field, value)
    if (field === "ssnFirst" && value.length === 6) ssnSecondRef.current?.focus()
    if (field === "ssnSecond" && value.length === 7) addressRef.current?.focus()
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
        <Input
          type="tel"
          value={values.phone}
          readOnly
          className={isSignup ? "bg-gray-100" : readOnlyClass}
        />
      </div>

      {/* 한글 이름 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">한글 이름</label>
        {isSignup && (
          <p className="text-sm text-slate-500">현장에서 사용할 짧은 한글 이름을 입력해 주세요.</p>
        )}
        <Input
          inputMode="text"
          lang="ko"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          maxLength={6}
          value={values.name}
          onChange={(e) => {
            setNameHint(LATIN.test(e.target.value))
            onChange("name", e.target.value.replace(/[A-Za-z0-9]/g, ""))
          }}
          placeholder={isSignup ? "한글 이름" : undefined}
          readOnly={!isSignup}
          className={isSignup ? "bg-white" : readOnlyClass}
        />
        {isSignup && nameHint && (
          <p className="text-sm text-amber-500">한글로 입력해 주세요</p>
        )}
        {isSignup && !nameHint && values.name.length >= 6 && (
          <p className="text-sm text-red-500">한글 이름은 최대 6글자까지 입력할 수 있습니다</p>
        )}
      </div>

      {/* 영문 이름 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">영문 이름</label>
        <Input
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={values.englishName}
          onChange={(e) => {
            setEnHint(HANGUL.test(e.target.value))
            onChange("englishName", e.target.value.replace(/[^A-Za-z\s'-]/g, "").toUpperCase())
          }}
          placeholder={isSignup ? "영문 이름" : undefined}
          readOnly={!isSignup}
          className={isSignup ? "bg-white" : readOnlyClass}
        />
        {isSignup && enHint && (
          <p className="text-sm text-amber-500">영문으로 입력해 주세요</p>
        )}
      </div>

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
        <Input
          ref={addressRef}
          value={values.address}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder={isSignup ? "주소" : "주소 입력"}
          className="bg-white"
        />
      </div>
    </div>
  )
}
