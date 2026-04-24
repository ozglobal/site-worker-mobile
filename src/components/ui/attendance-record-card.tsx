import { cn } from "@/lib/utils"
import { formatCurrency } from "@/utils/format"

export interface AttendanceEntryDetail {
  recordType?: string
  workEffort?: number
  dailyWageSnapshot?: number
  expectedWage?: number
  showCorrection?: boolean
  correctionDisabled?: boolean
  onCorrectionClick?: () => void
}

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
  /** Render 정정 요청 as dimmed / non-clickable (e.g. a PENDING request already exists). */
  correctionDisabled?: boolean
  onCorrectionClick?: () => void
  /** Additional work entries to render inside the same card (2nd+ records on the same day). */
  additionalEntries?: AttendanceEntryDetail[]
  className?: string
}

function EntrySection({
  recordType,
  workEffort,
  dailyWageSnapshot,
  expectedWage,
  showCorrection,
  correctionDisabled,
  onCorrectionClick,
}: AttendanceEntryDetail) {
  return (
    <div className="rounded-lg overflow-hidden bg-slate-50">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">{recordType || ""}</span>
        {showCorrection && onCorrectionClick && (
          <button
            type="button"
            onClick={correctionDisabled ? undefined : onCorrectionClick}
            disabled={correctionDisabled}
            className={cn(
              "text-sm font-medium flex items-center gap-0.5",
              correctionDisabled
                ? "text-slate-300 cursor-not-allowed"
                : "text-[#007DCA]"
            )}
          >
            정정 요청 <span>→</span>
          </button>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm text-slate-600">공수</span>
          <span className="text-sm font-medium text-slate-900">
            {workEffort != null ? `${workEffort}공수` : "no data"}
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
  )
}

export function AttendanceRecordCard({
  siteName,
  timeRange,
  recordType,
  workEffort,
  dailyWageSnapshot,
  expectedWage,
  statusBadge,
  statusVariant = "default",
  showCorrection,
  correctionDisabled,
  onCorrectionClick,
  additionalEntries,
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

      <EntrySection
        recordType={recordType}
        workEffort={workEffort}
        dailyWageSnapshot={dailyWageSnapshot}
        expectedWage={expectedWage}
        showCorrection={showCorrection}
        correctionDisabled={correctionDisabled}
        onCorrectionClick={onCorrectionClick}
      />

      {additionalEntries?.map((entry, i) => (
        <EntrySection key={i} {...entry} />
      ))}
    </div>
  )
}
