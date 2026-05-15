import { format, parse, isValid } from "date-fns"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { DateInput } from "@/components/ui/date-input"
import { useNationalities } from "@/lib/queries/useNationalities"
import { useGenderDict } from "@/lib/queries/useGenderDict"
import { PhoneField } from "@/components/ui/PhoneField"
import { KoreanNameField } from "@/components/ui/KoreanNameField"
import { EnglishNameField } from "@/components/ui/EnglishNameField"
import { AddressField } from "@/components/ui/AddressField"

export interface PnFormValues {
  name: string
  englishName: string
  gender: string
  passport: string
  nationality: string
  birthdate: string
  phone: string
  address: string
  addressDetail: string
}

interface IdFormPnProps {
  mode: "signup" | "edit"
  values: PnFormValues
  onChange: (field: keyof PnFormValues, value: string) => void
  onPhoneChangeClick?: () => void
  /** NICE 본인인증 완료된 워커는 신원 필드 수정 불가 */
  verified?: boolean
  /** 전체 폼을 읽기 전용으로 표시. */
  readOnly?: boolean
}

const readOnlyClass = "bg-gray-100 text-slate-500 pointer-events-none"

export function IdFormPn({ mode, values, onChange, onPhoneChangeClick, verified = false, readOnly = false }: IdFormPnProps) {
  const isSignup = mode === "signup"
  const lockId = readOnly || (!isSignup && verified)
  const navigate = useNavigate()
  const { data: nationalities = [] } = useNationalities()
  const { data: rawGenderDict = [] } = useGenderDict()
  const genderDict = rawGenderDict.filter((g) => g.name.trim() !== '알 수 없음')

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

      {/* 성별 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">성별</label>
        <div className="flex gap-4">
          {genderDict.map((g) => (
            <label key={g.code} className={`flex items-center gap-2 w-[150px] ${isSignup ? "cursor-pointer" : ""}`}>
              <input
                type="radio"
                name="gender"
                value={g.code}
                checked={String(values.gender ?? '').toUpperCase() === g.code.toUpperCase()}
                onChange={(e) => onChange("gender", e.target.value)}
                disabled={lockId}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm text-slate-700">{g.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 여권번호 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">여권번호</label>
        {/* hidden dummy — absorbs Chrome's credential-manager popup */}
        <input type="password" autoComplete="new-password" style={{ display: "none" }} aria-hidden="true" tabIndex={-1} readOnly />
        <Input
          maxLength={12}
          autoComplete="new-password"
          value={values.passport}
          onChange={(e) => {
            const v = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
            onChange("passport", v)
          }}
          placeholder={isSignup ? "여권번호" : undefined}
          readOnly={lockId}
          className={lockId ? readOnlyClass : "bg-white"}
        />
        {isSignup && (
          <div className="flex items-start gap-2 rounded-lg bg-neutral-100 p-3">
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
        {lockId ? (
          <Input
            value={nationalities.find((n) => n.code === values.nationality)?.name ?? values.nationality}
            readOnly
            className={readOnlyClass}
          />
        ) : (
          <Select
            value={values.nationality}
            onChange={(v) => onChange("nationality", v)}
            options={nationalities.map((n) => ({ value: n.code, label: n.name }))}
            placeholder="국적 선택"
          />
        )}
      </div>

      {/* 생년월일 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">생년월일</label>
        {lockId ? (
          <Input value={values.birthdate} readOnly className={readOnlyClass} />
        ) : (
          <DateInput
            value={(() => { const d = parse(values.birthdate, "yyyy-MM-dd", new Date()); return isValid(d) ? d : undefined })()}
            onChange={(d) => onChange("birthdate", d ? format(d, "yyyy-MM-dd") : "")}
          />
        )}
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
