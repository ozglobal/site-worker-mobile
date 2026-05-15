import { Input } from "@/components/ui/input"

// 비활성화 상태: text gray-400 (#9CA3AF) · bg neutral-100 (#F5F5F5) · border neutral-200 (#E5E5E5)
const disabledClass = "pointer-events-none"
const disabledStyle = {
  color: "#9CA3AF",
  backgroundColor: "#F5F5F5",
  borderColor: "#E5E5E5",
} as const

interface PhoneFieldProps {
  value: string
  isSignup: boolean
  onChangeClick?: () => void
}

export function PhoneField({ value, isSignup, onChangeClick }: PhoneFieldProps) {
  return (
    <div className="relative">
      <Input
        type="tel"
        value={value}
        readOnly
        style={disabledStyle}
        className={isSignup ? disabledClass : `${disabledClass}${onChangeClick ? " pr-16" : ""}`}
      />
      {!isSignup && onChangeClick && (
        <button
          type="button"
          onClick={onChangeClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#007DCA]"
        >
          수정
        </button>
      )}
    </div>
  )
}
