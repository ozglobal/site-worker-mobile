import { cn } from "@/lib/utils"
import { formatCurrency } from "@/utils/format"

export interface PendingCorrection {
  requestType: string
  originalValue: string
  requestedValue: string
  originalEffort: string
  requestedEffort: string
  originalWage: string
  requestedWage: string
}

export interface AttendanceEntryDetail {
  recordType?: string
  workEffort?: number
  dailyWageSnapshot?: number
  expectedWage?: number
  showCorrection?: boolean
  correctionDisabled?: boolean
  pendingCorrection?: PendingCorrection
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
  correctionDisabled?: boolean
  pendingCorrection?: PendingCorrection
  onCorrectionClick?: () => void
  /** Additional work entries to render inside the same card (2nd+ records on the same day). */
  additionalEntries?: AttendanceEntryDetail[]
  className?: string
}

function CorrectionValue({ original, requested }: { original: string; requested: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-sm text-slate-400 line-through">{original}</span>
      <span className="text-sm font-medium text-[#007DCA]">{requested}</span>
    </span>
  )
}

function EntrySection({
  recordType,
  workEffort,
  dailyWageSnapshot,
  expectedWage,
  showCorrection,
  correctionDisabled,
  pendingCorrection,
  onCorrectionClick,
}: AttendanceEntryDetail) {
  const pc = pendingCorrection
  const affectsEffort = pc && (pc.requestType === "work_effort" || pc.requestType === "work_effort_and_wage")
  const affectsWage = pc && (pc.requestType === "daily_wage" || pc.requestType === "work_effort_and_wage")

  const origEffort = pc ? parseFloat(pc.originalEffort || pc.originalValue || "0") : null
  const reqEffort  = pc ? parseFloat(pc.requestedEffort || pc.requestedValue || "0") : null
  const origWage   = pc ? parseFloat(pc.originalWage || pc.originalValue || "0") : null
  const reqWage    = pc ? parseFloat(pc.requestedWage || pc.requestedValue || "0") : null

  const origExpected = origEffort != null && origWage != null ? origEffort * origWage : null
  const reqExpected  = reqEffort  != null && reqWage  != null ? reqEffort  * reqWage  : null

  return (
    <div className="rounded-lg overflow-hidden bg-slate-50">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">{recordType || ""}</span>
        {showCorrection && onCorrectionClick && (
          <button
            type="button"
            onClick={correctionDisabled && !pc ? undefined : pc ? undefined : onCorrectionClick}
            disabled={correctionDisabled}
            className={cn(
              "text-sm font-medium flex items-center gap-0.5 text-[#007DCA]",
              correctionDisabled && !pc && "text-slate-300 cursor-not-allowed"
            )}
          >
            정정 요청 <span>→</span>
          </button>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm text-slate-600">공수</span>
          {affectsEffort && origEffort != null && reqEffort != null ? (
            <CorrectionValue
              original={`${origEffort}공수`}
              requested={`${reqEffort}공수`}
            />
          ) : (
            <span className="text-sm font-medium text-slate-900">
              {workEffort != null ? `${workEffort}공수` : "no data"}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm text-slate-600">적용 단가</span>
          {affectsWage && origWage != null && reqWage != null ? (
            <CorrectionValue
              original={formatCurrency(origWage)}
              requested={formatCurrency(reqWage)}
            />
          ) : (
            <span className="text-sm font-medium text-slate-900">
              {formatCurrency(dailyWageSnapshot)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200">
          <span className="text-sm text-slate-600">예상 임금(세전)</span>
          {pc && origExpected != null && reqExpected != null ? (
            <CorrectionValue
              original={formatCurrency(origExpected)}
              requested={formatCurrency(reqExpected)}
            />
          ) : (
            <span className="text-sm font-medium text-slate-900">
              {formatCurrency(expectedWage)}
            </span>
          )}
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
  pendingCorrection,
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
        pendingCorrection={pendingCorrection}
        onCorrectionClick={onCorrectionClick}
      />

      {additionalEntries?.map((entry, i) => (
        <EntrySection key={i} {...entry} />
      ))}
    </div>
  )
}
