import { cn } from "@/lib/utils"
import { IconCalendarMonth } from "@tabler/icons-react"
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"

export type ViewMode = "calendar" | "list"

interface MonthSelectorProps {
  year: number
  month: number
  viewMode: ViewMode
  onPrevMonth?: () => void
  onNextMonth?: () => void
  onViewModeChange?: (mode: ViewMode) => void
  className?: string
}

export function MonthSelector({
  year,
  month,
  viewMode,
  onPrevMonth,
  onNextMonth,
  onViewModeChange,
  className,
}: MonthSelectorProps) {
  // Next-month navigation is capped at the current month — workers can't
  // view attendance for months that haven't happened yet.
  const now = new Date()
  const isAtCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const nextDisabled = isAtCurrentMonth

  return (
    <div className={cn("flex items-center justify-between px-4 py-3", className)}>
      {/* Year/Month navigation */}
      <div className="flex items-center gap-1">
        <button onClick={onPrevMonth} className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 active:bg-slate-100">
          <ChevronLeftIcon sx={{ fontSize: 20 }} />
        </button>
        <span className="text-lg font-bold text-slate-900 min-w-[100px] text-center">
          {year}년 {month}월
        </span>
        {!nextDisabled && (
          <button
            onClick={onNextMonth}
            className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 active:bg-slate-100"
          >
            <ChevronRightIcon sx={{ fontSize: 20 }} />
          </button>
        )}
      </div>

      {/* View mode toggle */}
      <div className="inline-flex items-center rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => onViewModeChange?.("calendar")}
          className={cn(
            "inline-flex items-center justify-center w-9 h-9 rounded-md text-sm font-medium transition-all",
            viewMode === "calendar"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <IconCalendarMonth size={18} />
        </button>
        <button
          onClick={() => onViewModeChange?.("list")}
          className={cn(
            "inline-flex items-center justify-center w-9 h-9 rounded-md text-sm font-medium transition-all",
            viewMode === "list"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FormatListBulletedOutlinedIcon sx={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  )
}
