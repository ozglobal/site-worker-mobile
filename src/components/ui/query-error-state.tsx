interface QueryErrorStateProps {
  onRetry: () => void
  message?: string
}

export function QueryErrorState({ onRetry, message = "데이터를 불러오지 못했습니다." }: QueryErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-4">
      <p className="text-sm text-slate-500 text-center">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white"
      >
        다시 시도
      </button>
    </div>
  )
}
