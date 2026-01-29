import * as React from "react"
import { cn } from "@/lib/utils"

export type StatusType = "incomplete" | "complete" | "pending" | "error"

export interface StatusListItemProps {
  title: string
  subtitle: string
  status?: StatusType
  statusLabel?: string
  onClick?: () => void
  className?: string
}

const statusStyles: Record<StatusType, { badge: string; icon: string }> = {
  incomplete: {
    badge: "bg-red-50 text-red-500",
    icon: "text-red-500",
  },
  complete: {
    badge: "bg-green-50 text-green-600",
    icon: "text-green-500",
  },
  pending: {
    badge: "bg-amber-50 text-amber-600",
    icon: "text-amber-500",
  },
  error: {
    badge: "bg-red-50 text-red-500",
    icon: "text-red-500",
  },
}

const defaultStatusLabels: Record<StatusType, string> = {
  incomplete: "미완료",
  complete: "완료",
  pending: "대기중",
  error: "오류",
}

function StatusIcon({ status }: { status: StatusType }) {
  if (status === "complete") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-1">
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  }
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export function StatusListItem({
  title,
  subtitle,
  status = "incomplete",
  statusLabel,
  onClick,
  className,
}: StatusListItemProps) {
  const styles = statusStyles[status]
  const label = statusLabel || defaultStatusLabels[status]

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-b border-gray-200 px-4 py-5 text-left transition-colors hover:bg-gray-50",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            styles.badge
          )}
        >
          <StatusIcon status={status} />
          {label}
        </span>
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
