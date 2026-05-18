import { useState } from "react"
import { cn } from "@/lib/utils"
import { IconCalendarMonth } from "@tabler/icons-react"
import { List as FormatListBulletedOutlinedIcon, ChevronDown, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type ViewMode = "calendar" | "list"

interface MonthSelectorProps {
  year: number
  month: number
  viewMode: ViewMode
  /** 연도/월 변경 콜백. (드롭다운 선택 시) */
  onYearMonthChange?: (year: number, month: number) => void
  onViewModeChange?: (mode: ViewMode) => void
  className?: string
}

export function MonthSelector({
  year,
  month,
  viewMode,
  onYearMonthChange,
  onViewModeChange,
  className,
}: MonthSelectorProps) {
  // Next-month navigation is capped at the current month — workers can't
  // view attendance for months that haven't happened yet.
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const [open, setOpen] = useState(false)
  const [draftYear, setDraftYear] = useState(year)
  const [yearView, setYearView] = useState(false)
  // year grid 의 시작 연도 (12년 단위로 페이지). 선택된 draftYear 기준 페이지.
  const [yearPageStart, setYearPageStart] = useState(() => year - 11)

  const isFutureMonth = (y: number, m: number) =>
    y > currentYear || (y === currentYear && m > currentMonth)

  return (
    <div className={cn("flex items-center justify-between px-4 py-3", className)}>
      {/* Year/Month dropdown */}
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (o) {
            setDraftYear(year)
            setYearView(false)
            setYearPageStart(year - 11)
          }
        }}
      >
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 text-lg font-bold text-slate-900">
            <span>{year}년 {month}월</span>
            <ChevronDown size={18} className="text-slate-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-3">
          {yearView ? (
            <>
              {/* Year page nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setYearPageStart(yearPageStart - 12)}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100"
                >
                  <ChevronLeftIcon size={18} />
                </button>
                <span className="text-sm font-bold text-slate-900">
                  {yearPageStart} - {yearPageStart + 11}
                </span>
                <button
                  type="button"
                  onClick={yearPageStart + 11 >= currentYear ? undefined : () => setYearPageStart(yearPageStart + 12)}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100",
                    yearPageStart + 11 >= currentYear && "invisible"
                  )}
                >
                  <ChevronRightIcon size={18} />
                </button>
              </div>
              {/* Year grid */}
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 12 }, (_, i) => yearPageStart + i).map((y) => {
                  const disabled = y > currentYear
                  const selected = draftYear === y
                  return (
                    <button
                      key={y}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setDraftYear(y)
                        setYearView(false)
                      }}
                      className={cn(
                        "h-9 rounded-md text-sm font-medium",
                        selected
                          ? "bg-primary text-white"
                          : disabled
                            ? "text-slate-300 cursor-not-allowed"
                            : "text-slate-900 hover:bg-slate-100",
                      )}
                    >
                      {y}년
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              {/* Year header (click to expand year view) */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setDraftYear(draftYear - 1)}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100"
                >
                  <ChevronLeftIcon size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setYearView(true)
                    setYearPageStart(draftYear - 11)
                  }}
                  className="flex items-center gap-1 text-sm font-bold text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100"
                >
                  {draftYear}년
                  <ChevronDown size={14} className="text-slate-500" />
                </button>
                <button
                  type="button"
                  onClick={draftYear >= currentYear ? undefined : () => setDraftYear(draftYear + 1)}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100",
                    draftYear >= currentYear && "invisible"
                  )}
                >
                  <ChevronRightIcon size={18} />
                </button>
              </div>
              {/* Month grid */}
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const disabled = isFutureMonth(draftYear, m)
                  const selected = year === draftYear && month === m
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        onYearMonthChange?.(draftYear, m)
                        setOpen(false)
                      }}
                      className={cn(
                        "h-9 rounded-md text-sm font-medium",
                        selected
                          ? "bg-primary text-white"
                          : disabled
                            ? "text-slate-300 cursor-not-allowed"
                            : "text-slate-900 hover:bg-slate-100",
                      )}
                    >
                      {m}월
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* View mode toggle */}
      <div className="inline-flex items-center h-10 rounded-lg bg-white p-1 border border-neutral-200">
        <button
          aria-label="캘린더 보기"
          onClick={() => onViewModeChange?.("calendar")}
          className={cn(
            "inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-all",
            viewMode === "calendar"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          style={viewMode === "calendar" ? { backgroundColor: "#00000008" } : undefined}
        >
          <IconCalendarMonth size={18} />
        </button>
        <button
          aria-label="목록 보기"
          onClick={() => onViewModeChange?.("list")}
          className={cn(
            "inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-all",
            viewMode === "list"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          style={viewMode === "list" ? { backgroundColor: "#00000008" } : undefined}
        >
          <FormatListBulletedOutlinedIcon size={18} />
        </button>
      </div>
    </div>
  )
}
