import { cn } from "@/lib/utils"
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"
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
        <button onClick={onNextMonth} className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 active:bg-slate-100">
          <ChevronRightIcon sx={{ fontSize: 20 }} />
        </button>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => onViewModeChange?.("calendar")}
          className={cn(
            "flex items-center justify-center w-10 h-10 transition-colors",
            viewMode === "calendar"
              ? "bg-white text-slate-900"
              : "bg-slate-200 text-slate-400"
          )}
        >
          <CalendarMonthIcon sx={{ fontSize: 20 }} />
        </button>
        <button
          onClick={() => onViewModeChange?.("list")}
          className={cn(
            "flex items-center justify-center w-10 h-10 transition-colors",
            viewMode === "list"
              ? "bg-white text-slate-900"
              : "bg-slate-200 text-slate-400"
          )}
        >
          <FormatListBulletedOutlinedIcon sx={{ fontSize: 20 }} />
        </button>
      </div>
    </div>
  )
}
