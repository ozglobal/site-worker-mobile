import { useState } from "react"
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
  /** 백엔드 산출 원래 일당 (공수 × 단가). 미제공 시 null. */
  originalExpectedWage?: number | null
  /** 백엔드 산출 요청 일당 (공수 × 단가). 미제공 시 null. */
  requestedExpectedWage?: number | null
  status?: string
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

function CorrectionButton({
  disabled,
  showPendingTooltip,
  onClick,
}: {
  disabled: boolean
  showPendingTooltip?: boolean
  onClick: () => void
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const showTooltip = showPendingTooltip && tooltipOpen
  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => { if (showPendingTooltip) setTooltipOpen(true) }}
        onMouseLeave={() => setTooltipOpen(false)}
        onClick={() => {
          if (disabled) {
            if (showPendingTooltip) {
              setTooltipOpen(true)
              window.setTimeout(() => setTooltipOpen(false), 2500)
            }
            return
          }
          onClick()
        }}
        className={cn(
          "text-sm font-medium flex items-center gap-0.5 text-[#007DCA]",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        정정 요청 <span>→</span>
      </button>
      {showTooltip && (
        <div className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 whitespace-nowrap rounded-full bg-[#333] px-3 py-1.5 text-xs font-medium text-white">
          이미 신청중인 정정 요청이 있습니다.
        </div>
      )}
    </div>
  )
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
  // 승인/반려된 정정요청은 inline "변경 후" 표시에서 제외 — 처리 완료 후에도 화면에 남아있는 문제 방지.
  const pc = pendingCorrection?.status === 'pending' ? pendingCorrection : undefined
  const affectsEffort = pc && (pc.requestType === "work_effort" || pc.requestType === "work_effort_and_wage")
  const affectsWage = pc && (pc.requestType === "daily_wage" || pc.requestType === "work_effort_and_wage")

  const origEffort = pc ? parseFloat(pc.originalEffort || pc.originalValue || "0") : null
  const reqEffort  = pc ? parseFloat(pc.requestedEffort || pc.requestedValue || "0") : null
  const origWage   = pc ? parseFloat(pc.originalWage || pc.originalValue || "0") : null
  const reqWage    = pc ? parseFloat(pc.requestedWage || pc.requestedValue || "0") : null

  // 예상임금 변경값: 백엔드 산출값(originalExpectedWage / requestedExpectedWage) 우선,
  // 없으면 공수 × 단가로 fallback.
  const origExpectedWage = pc?.originalExpectedWage ?? expectedWage ?? null
  const requestedExpectedWage = pc
    ? (pc.requestedExpectedWage
        ?? (
            ((affectsEffort && reqEffort != null) ? reqEffort : (workEffort ?? 0))
            * ((affectsWage && reqWage != null) ? reqWage : (dailyWageSnapshot ?? 0))
          ))
    : null

  return (
    <div className="rounded-lg overflow-visible" style={{ backgroundColor: "#00000008" }}>
      <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">{recordType || ""}</span>
        {showCorrection && onCorrectionClick && (
          <CorrectionButton
            disabled={!!correctionDisabled || pc?.status === 'pending'}
            showPendingTooltip={pc?.status === 'pending'}
            onClick={onCorrectionClick}
          />
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
          {pc && requestedExpectedWage != null && origExpectedWage != null && requestedExpectedWage !== origExpectedWage ? (
            <CorrectionValue
              original={formatCurrency(origExpectedWage)}
              requested={formatCurrency(requestedExpectedWage)}
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
              : "bg-neutral-100 text-slate-600"
          )}
        >
          {statusBadge}
        </span>
      )}

      <div>
        <h3 className="text-base font-bold text-slate-900">{siteName}</h3>
        {timeRange && <p className="text-sm text-slate-500 mt-1">{timeRange}</p>}
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
