import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useNationalities } from "@/lib/queries/useNationalities"

const HANGUL = /[가-힣ᄀ-ᇿ㄰-㆏]/
const LATIN  = /[A-Za-z]/

export interface PnFormValues {
  name: string
  englishName: string
  gender: "" | "male" | "female"
  passport: string
  nationality: string
  birthdate: string
  phone: string
  address: string
}

interface IdFormPnProps {
  mode: "signup" | "edit"
  values: PnFormValues
  onChange: (field: keyof PnFormValues, value: string) => void
}

const readOnlyClass = "bg-gray-100 text-slate-500 pointer-events-none"

export function IdFormPn({ mode, values, onChange }: IdFormPnProps) {
  const isSignup = mode === "signup"
  const navigate = useNavigate()
  const [nameHint, setNameHint] = useState(false)
  const [enHint,   setEnHint]   = useState(false)
  const { data: nationalities = [] } = useNationalities()

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

      {/* 성별 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">성별</label>
        <div className="flex gap-4">
          <label className={`flex items-center gap-2 w-[150px] ${isSignup ? "cursor-pointer" : ""}`}>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={values.gender === "male"}
              onChange={(e) => onChange("gender", e.target.value)}
              disabled={!isSignup}
              className="w-4 h-4 text-primary"
            />
            <span className="text-sm text-slate-700">남자</span>
          </label>
          <label className={`flex items-center gap-2 w-[150px] ${isSignup ? "cursor-pointer" : ""}`}>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={values.gender === "female"}
              onChange={(e) => onChange("gender", e.target.value)}
              disabled={!isSignup}
              className="w-4 h-4 text-primary"
            />
            <span className="text-sm text-slate-700">여자</span>
          </label>
        </div>
      </div>

      {/* 여권번호 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">여권번호</label>
        <Input
          maxLength={12}
          value={values.passport}
          onChange={(e) => {
            const v = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
            onChange("passport", v)
          }}
          placeholder={isSignup ? "여권번호" : undefined}
          readOnly={!isSignup}
          className={isSignup ? "bg-white" : readOnlyClass}
        />
        {isSignup && (
          <div className="flex items-start gap-2 rounded-lg bg-gray-100 p-3">
            <svg className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">외국인등록번호가 없는 경우에만 여권번호로 가입할 수 있어요</span>
              <button
                onClick={() => navigate(-1)}
                className="text-sm font-medium text-blue-500 text-left"
              >
                외국인등록번호로 가입하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 국적 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">국적</label>
        {isSignup ? (
          <Select
            value={values.nationality}
            onChange={(v) => onChange("nationality", v)}
            options={nationalities.map((n) => ({ value: n.code, label: n.name }))}
            placeholder="국적 선택"
          />
        ) : (
          <Input
            value={nationalities.find((n) => n.code === values.nationality)?.name ?? values.nationality}
            readOnly
            className={readOnlyClass}
          />
        )}
      </div>

      {/* 생년월일 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">생년월일</label>
        <Input
          inputMode="numeric"
          maxLength={10}
          value={values.birthdate}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 8)
            let formatted = digits
            if (digits.length > 4) formatted = digits.slice(0, 4) + "-" + digits.slice(4)
            if (digits.length > 6) formatted = digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6)
            onChange("birthdate", formatted)
          }}
          placeholder={isSignup ? "yyyy-mm-dd" : undefined}
          readOnly={!isSignup}
          className={isSignup ? "bg-white" : readOnlyClass}
        />
      </div>

      {/* 주소 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">주소</label>
        <Input
          value={values.address}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder={isSignup ? "주소" : "주소 입력"}
          className="bg-white"
        />
      </div>
    </div>
  )
}
