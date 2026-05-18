import { Input } from "@/components/ui/input"

const readOnlyClass = "bg-gray-100 text-slate-500 pointer-events-none"

interface EnglishNameFieldProps {
  value: string
  isSignup: boolean
  onChange: (value: string) => void
  verified?: boolean
}

// IME 한/영 토글과 무관하게 물리 키(e.code) 로 영문/공백/'/- 만 입력.
// IME 조합 자체를 우회하여 한글 조합 표시·기존 글자 사라짐 문제 회피.
const ALLOWED_NAV = new Set([
  'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End', 'Tab', 'Enter', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape',
])

export function EnglishNameField({ value, isSignup, onChange, verified = false }: EnglishNameFieldProps) {
  const readOnly = !isSignup && verified

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">영문 이름</label>
      <Input
        inputMode="text"
        lang="en"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        value={value}
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey) return
          let insert: string | null = null
          if (/^Key[A-Z]$/.test(e.code)) insert = e.code.slice(3)
          else if (e.code === 'Space') insert = ' '
          else if (e.code === 'Quote') insert = "'"
          else if (e.code === 'Minus') insert = '-'
          if (insert !== null) {
            e.preventDefault()
            const input = e.currentTarget
            const start = input.selectionStart ?? input.value.length
            const end = input.selectionEnd ?? input.value.length
            const nextVal = input.value.slice(0, start) + insert + input.value.slice(end)
            onChange(nextVal.toUpperCase())
            requestAnimationFrame(() => {
              try { input.setSelectionRange(start + 1, start + 1) } catch { /* ignore */ }
            })
            return
          }
          if (ALLOWED_NAV.has(e.code) || ALLOWED_NAV.has(e.key)) return
          e.preventDefault()
        }}
        onChange={(e) => {
          // keydown 으로 막지만 paste / 모바일 키보드 대비 후처리
          const cleaned = e.target.value.replace(/[^A-Za-z\s'-]/g, "").toUpperCase()
          if (cleaned !== value) onChange(cleaned)
        }}
        placeholder={isSignup ? "영문 이름" : undefined}
        readOnly={readOnly}
        className={readOnly ? readOnlyClass : "bg-white"}
      />
    </div>
  )
}
