import { Input } from "@/components/ui/input"

const readOnlyClass = "bg-gray-100 text-slate-500 pointer-events-none"

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
        className={isSignup ? "bg-gray-100" : `${readOnlyClass}${onChangeClick ? " pr-16" : ""}`}
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
