import { useState } from "react"
import { Input } from "@/components/ui/input"

const HANGUL = /[가-힣ᄀ-ᇿ㄰-㆏]/
const readOnlyClass = "bg-gray-100 text-slate-500 pointer-events-none"

interface EnglishNameFieldProps {
  value: string
  isSignup: boolean
  onChange: (value: string) => void
}

export function EnglishNameField({ value, isSignup, onChange }: EnglishNameFieldProps) {
  const [hint, setHint] = useState(false)

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">영문 이름</label>
      <Input
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        value={value}
        onChange={(e) => {
          setHint(HANGUL.test(e.target.value))
          onChange(e.target.value.replace(/[^A-Za-z\s'-]/g, "").toUpperCase())
        }}
        placeholder={isSignup ? "영문 이름" : undefined}
        readOnly={!isSignup}
        className={isSignup ? "bg-white" : readOnlyClass}
      />
      {isSignup && hint && (
        <p className="text-sm text-amber-500">영문으로 입력해 주세요</p>
      )}
    </div>
  )
}
