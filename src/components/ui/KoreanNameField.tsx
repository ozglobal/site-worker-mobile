import { useState } from "react"
import { Input } from "@/components/ui/input"

const LATIN = /[A-Za-z]/
const readOnlyClass = "bg-gray-100 text-slate-500 pointer-events-none"

interface KoreanNameFieldProps {
  value: string
  isSignup: boolean
  onChange: (value: string) => void
  /** NICE 본인인증 완료된 워커는 이름 수정 불가 */
  verified?: boolean
}

export function KoreanNameField({ value, isSignup, onChange, verified = false }: KoreanNameFieldProps) {
  const readOnly = !isSignup && verified
  const [hint, setHint] = useState(false)
  const [maxHint, setMaxHint] = useState(false)

  return (
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
        value={value}
        onChange={(e) => {
          const raw = e.target.value.replace(/[A-Za-z0-9]/g, "")
          setHint(LATIN.test(e.target.value))
          if (raw.length > 4) {
            setMaxHint(true)
            onChange(raw.slice(0, 4))
          } else {
            setMaxHint(false)
            onChange(raw)
          }
        }}
        placeholder={isSignup ? "한글 이름" : undefined}
        readOnly={readOnly}
        error={isSignup && (hint || maxHint)}
        className={readOnly ? readOnlyClass : "bg-white"}
      />
      {isSignup && (hint || maxHint) && (
        <p className="text-sm text-[#DC2626]">한국어 이름을 4글자 이내로 입력해주세요</p>
      )}
    </div>
  )
}
