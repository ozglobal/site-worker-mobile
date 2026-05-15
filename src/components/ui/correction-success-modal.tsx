interface CorrectionSuccessModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function CorrectionSuccessModal({
  open,
  onClose,
  title = "정정 요청 완료",
  description = "담당자 확인 후 처리 결과를\n알림으로 안내드릴게요.",
}: CorrectionSuccessModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl px-6 pt-8 pb-5">
        {/* Checkmark icon */}
        <div className="flex justify-center mb-5">
          <div className="w-10 h-10 rounded-full bg-[#007DCA] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 12.5L9.5 18L20 7.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h3 className="text-lg leading-[28px] font-bold text-slate-900 text-center mb-2">{title}</h3>
        <p className="text-sm text-slate-500 text-center whitespace-pre-line">{description}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full h-12 rounded-lg bg-neutral-100 text-slate-900 text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
