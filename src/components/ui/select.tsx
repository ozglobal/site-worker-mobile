import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function Select({ options, value, onChange, placeholder, disabled, className }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedLabel = options.find((o) => o.value === value)?.label

  React.useEffect(() => {
    if (!open) return
    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [open])

  const handleSelect = (optValue: string) => {
    onChange(optValue)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-lg border bg-white px-4",
          "text-base font-normal text-left",
          "border-[#E5E5E5] shadow-sm",
          "focus:border-[#007DCA] focus:outline-none focus:ring-[3px] focus:ring-[#007DCA]/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          selectedLabel ? "text-slate-900" : "text-slate-400",
        )}
      >
        <span className="truncate">{selectedLabel ?? placeholder ?? ""}</span>
        <ChevronDown
          className={cn("w-5 h-5 text-slate-400 shrink-0 ml-2 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-[#E5E5E5] bg-white shadow-lg overflow-y-auto max-h-60">
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  data-value={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-base text-left min-h-[44px]",
                    "hover:bg-slate-50 active:bg-slate-100",
                    isSelected ? "text-primary font-medium" : "text-slate-900",
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
