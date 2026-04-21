import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DateInputProps {
  value?: Date
  onChange?: (date?: Date) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateInput({ value, onChange, placeholder = "YYYY-MM-DD", disabled, className }: DateInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [open, setOpen] = React.useState(false)

  const normalize = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 8)
    if (digits.length <= 4) return digits
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  }

  const parseStrict = (val: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return undefined
    const parsed = parse(val, "yyyy-MM-dd", new Date())
    return isValid(parsed) ? parsed : undefined
  }

  React.useEffect(() => {
    setInputValue(value ? format(value, "yyyy-MM-dd") : "")
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = normalize(e.target.value)
    setInputValue(normalized)
    const parsed = parseStrict(normalized)
    if (parsed) onChange?.(parsed)
  }

  const handleBlur = () => {
    const parsed = parseStrict(inputValue)
    if (!parsed) {
      setInputValue(value ? format(value, "yyyy-MM-dd") : "")
    } else {
      setInputValue(format(parsed, "yyyy-MM-dd"))
    }
  }

  const handleSelect = (date?: Date) => {
    onChange?.(date)
    setOpen(false)
  }

  const isInvalid = inputValue.length > 0 && !parseStrict(inputValue)

  return (
    <div className={cn("flex gap-2", className)}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        inputMode="numeric"
        className={cn("flex-1", isInvalid && "border-red-500")}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="flex items-center justify-center w-12 h-12 rounded-lg border border-gray-200 bg-white text-slate-500 shrink-0 active:bg-slate-50 disabled:opacity-50"
          >
            <CalendarIcon size={18} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            defaultMonth={value}
            classNames={{
              month_caption: "flex justify-center pt-1 relative items-center",
              nav: "flex items-center gap-1 absolute right-1 top-1",
              day_button: "h-9 w-full rounded-md font-normal flex flex-col items-center justify-center hover:bg-slate-100",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
