import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
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

const YEARS = Array.from({ length: 2040 - 2010 + 1 }, (_, i) => 2010 + i)

export function DateInput({ value, onChange, placeholder = "YYYY-MM-DD", disabled, className }: DateInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(() => value ?? new Date())

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
    if (value) setCalendarMonth(value)
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

  // Layout: [ 2025년 ▼   <   5월   > ]
  // Nav is hidden; prev/next are rendered here so they share the same row as the year select.
  // setCalendarMonth and YEARS are stable references, so [] deps is safe.
  const MonthCaption = React.useCallback(
    ({ calendarMonth: cm }: { calendarMonth: { date: Date }; displayIndex: number }) => {
      const d = cm.date
      const year = d.getFullYear()
      const month = d.getMonth()
      return (
        <div className="flex items-center justify-between w-full">
          {/* Year select — left */}
          <div className="relative flex items-center ml-4">
            <select
              value={year}
              onChange={(e) => setCalendarMonth(new Date(Number(e.target.value), month, 1))}
              className="appearance-none text-sm font-semibold bg-transparent border-none outline-none cursor-pointer pr-5"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-0 pointer-events-none text-slate-500" />
          </div>

          {/* Month navigation — right */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="w-8 text-center text-sm font-semibold">{format(d, "M월")}</span>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )
    },
    [],
  )

  const isInvalid = inputValue.length > 0 && !parseStrict(inputValue)

  return (
    <div className={cn("relative", className)}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        inputMode="numeric"
        className={cn("pr-10", isInvalid && "border-red-500")}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <CalendarIcon size={18} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            classNames={{
              month_caption: "flex items-center w-full px-1 pt-1 pb-1",
              nav: "hidden",
              day_button: "h-9 w-full rounded-md font-normal flex flex-col items-center justify-center hover:bg-slate-100",
            }}
            components={{ MonthCaption }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
