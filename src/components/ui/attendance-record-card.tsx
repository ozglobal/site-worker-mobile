import { cn } from "@/lib/utils"
import { formatCurrency } from "@/utils/format"

interface AttendanceRecordCardProps {
  siteName: string
  timeRange: string
  recordType?: string
  workEffort?: number
  dailyWageSnapshot?: number
  expectedWage?: number
  statusBadge?: string
  statusVariant?: "default" | "active"
  showCorrection?: boolean
  onCorrectionClick?: () => void
  className?: string
}

export function AttendanceRecordCard({
  siteName,
  timeRange,
  recordType = "일반",
  workEffort,
  dailyWageSnapshot,
  expectedWage,
  statusBadge,
  statusVariant = "default",
  showCorrection,
  onCorrectionClick,
  className,
}: AttendanceRecordCardProps) {
  return (
    <div className={cn("bg-white rounded-xl p-4 shadow-sm space-y-3", className)}>
      {statusBadge && (
        <span
          className={cn(
            "inline-block text-xs font-medium px-2.5 py-1 rounded",
            statusVariant === "active"
              ? "text-green-700 bg-green-100"
              : "text-slate-600 bg-slate-100"
          )}
        >
          {statusBadge}
        </span>
      )}

      <div>
        <h3 className="text-base font-bold text-slate-900">{siteName}</h3>
        <p className="text-sm text-slate-500 mt-1">{timeRange}</p>
      </div>

      <div className="rounded-lg overflow-hidden bg-slate-50">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">{recordType}</span>
          {showCorrection && onCorrectionClick && (
            <button
              onClick={onCorrectionClick}
              className="text-sm font-medium text-[#007DCA] flex items-center gap-0.5"
            >
              정정 요청 <span>→</span>
            </button>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-slate-600">공수</span>
            <span className="text-sm font-medium text-slate-900">
              {workEffort != null ? `${workEffort}공수` : "-"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-slate-600">적용 단가</span>
            <span className="text-sm font-medium text-slate-900">
              {formatCurrency(dailyWageSnapshot)}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200">
            <span className="text-sm text-slate-600">예상 임금(세전)</span>
            <span className="text-sm font-medium text-slate-900">
              {formatCurrency(expectedWage)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
