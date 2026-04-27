import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"

const LATIN = /[A-Za-z]/

export interface RrnFormValues {
  name: string
  ssnFirst: string
  ssnSecond: string
  phone: string
  address: string
}

interface IdFormRrnProps {
  mode: "signup" | "edit"
  values: RrnFormValues
  onChange: (field: keyof RrnFormValues, value: string) => void
}


export function IdFormRrn({ mode, values, onChange }: IdFormRrnProps) {
  const isSignup = mode === "signup"
  const [nameHint, setNameHint] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const ssnSecondRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSignup) nameRef.current?.focus()
  }, [isSignup])

  const handle = (field: keyof RrnFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
          maxLength={6}
          value={values.name}
          onChange={(e) => {
            setNameHint(LATIN.test(e.target.value))
            onChange("name", e.target.value.replace(/[A-Za-z0-9]/g, ""))
          }}
          placeholder="이름 입력"
          className="bg-white"
        />
        {nameHint && (
          <p className="text-sm text-amber-500">한글로 입력해 주세요</p>
        )}
        {!nameHint && values.name.length >= 6 && (
          <p className="text-sm text-red-500">이름은 최대 6글자까지 입력할 수 있습니다</p>
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
            className="flex-1 bg-white"
          />
          <span className="text-slate-400">-</span>
          <Input
            ref={ssnSecondRef}
            value={values.ssnSecond}
            onChange={handle("ssnSecond")}
            inputMode="numeric"
            maxLength={7}
            placeholder="뒤 7자리"
            className="flex-1 bg-white"
          />
        </div>
      </div>

      {/* 휴대폰 번호 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">휴대폰 번호</label>
        <Input
          type="tel"
          value={values.phone}
          readOnly
          className="bg-gray-100 text-slate-500 pointer-events-none"
        />
      </div>

      {/* 주소 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">주소</label>
        <Input
          ref={addressRef}
          value={values.address}
          onChange={handle("address")}
          placeholder={isSignup ? "주소" : "주소 입력"}
          className="bg-white"
        />
      </div>
    </div>
  )
}
