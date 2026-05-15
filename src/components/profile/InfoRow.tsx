interface InfoRowProps {
  label: string
  value: string
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start px-4 py-3.5">
      <span className="text-sm text-slate-500 w-28 shrink-0">{label}</span>
      <span className="text-sm text-slate-900 flex-1 break-words">{value || "—"}</span>
    </div>
  )
}
