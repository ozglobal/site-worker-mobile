import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/format"

interface CorrectionDialogProps {
  siteName: string
  timeRange: string
  initialWorkEffort: string
  initialDailyWage: string
  onSubmit: (data: { workEffort: string; dailyWage: string; reason: string }) => Promise<void>
  onBack?: () => void
  onClose: () => void
}

export function CorrectionDialog({
  siteName,
  timeRange,
  initialWorkEffort,
  initialDailyWage,
  onSubmit,
  onBack,
  onClose,
}: CorrectionDialogProps) {
  const [workEffort, setWorkEffort] = useState(initialWorkEffort)
  const [dailyWage, setDailyWage] = useState(initialDailyWage)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const expectedWage = useMemo(() => {
    const effort = parseFloat(workEffort) || 0
    const wage = parseFloat(dailyWage.replace(/,/g, "")) || 0
    return effort * wage
  }, [workEffort, dailyWage])

  const handleSubmit = async () => {
    if (reason.trim().length <= 4 || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit({ workEffort, dailyWage: dailyWage.replace(/,/g, ""), reason: reason.trim() })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center px-5 pt-5 pb-2">
          {onBack ? (
            <button onClick={onBack} className="p-1 -ml-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : (
            <div className="w-8" />
          )}
          <h2 className="text-lg font-bold text-slate-900 ml-2">정정 요청</h2>
          <div className="flex-1" />
          <button onClick={onClose} className="p-1 -mr-1 text-slate-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Site Name & Time */}
          <div>
            <h3 className="text-base font-bold text-slate-900">{siteName}</h3>
            <p className="text-sm text-slate-500 mt-1">{timeRange}</p>
          </div>

          {/* 공수 */}
          <div>
            <p className="text-sm font-bold text-slate-900 mb-3">공수</p>
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 rounded-lg px-4 py-2.5 flex items-center gap-2 min-w-[120px]">
                <span className="text-xs text-slate-500">현재</span>
                <span className="text-base font-bold text-slate-900">{initialWorkEffort}</span>
              </div>
              <span className="text-slate-400">→</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={workEffort}
                  onChange={(e) => setWorkEffort(e.target.value)}
                  className="w-24 h-10 text-center text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007DCA]"
                />
                <span className="text-sm text-slate-600">공수</span>
              </div>
            </div>
          </div>

          {/* 적용단가 */}
          <div>
            <p className="text-sm font-bold text-slate-900 mb-3">적용단가</p>
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 rounded-lg px-4 py-2.5 flex items-center gap-2 min-w-[120px]">
                <span className="text-xs text-slate-500">현재</span>
                <span className="text-base font-bold text-slate-900">{initialDailyWage}원</span>
              </div>
              <span className="text-slate-400">→</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={dailyWage}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "")
                    setDailyWage(raw ? Number(raw).toLocaleString("ko-KR") : "")
                  }}
                  className="w-24 h-10 text-center text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007DCA]"
                />
                <span className="text-sm text-slate-600">원</span>
              </div>
            </div>
          </div>

          {/* Expected Wage */}
          <div className="bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">변경 후 예상 임금(세전)</span>
            <span className="text-sm font-bold text-[#007DCA]">
              {formatCurrency(expectedWage)}
            </span>
          </div>

          {/* Reason */}
          <div>
            <p className="text-sm font-bold text-slate-900 mb-3">정정 사유</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="요청사유를 입력해주세요 (5자 이상)"
              rows={4}
              className="w-full p-4 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#007DCA]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="px-5 pb-5 pt-2">
          <Button
            variant={isSubmitting || reason.trim().length <= 4 ? "primaryDisabled" : "primary"}
            size="full"
            onClick={handleSubmit}
            disabled={isSubmitting || reason.trim().length <= 4}
          >
            {isSubmitting ? "제출 중..." : "요청 제출하기"}
          </Button>
        </div>
      </div>
    </div>
  )
}
