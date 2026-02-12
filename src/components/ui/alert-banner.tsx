import * as React from "react"
import { cn } from "@/lib/utils"

export interface AlertBannerProps {
  title: string
  description?: string
  variant?: "warning" | "error" | "info" | "success"
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
}

const variantStyles = {
  warning: {
    container: "bg-amber-50 text-amber-700",
    icon: "text-amber-500",
  },
  error: {
    container: "bg-red-50 text-red-600",
    icon: "text-red-500",
  },
  info: {
    container: "bg-blue-50 text-blue-700",
    icon: "text-blue-500",
  },
  success: {
    container: "bg-green-50 text-green-700",
    icon: "text-green-500",
  },
}

function DefaultIcon({ variant }: { variant: AlertBannerProps["variant"] }) {
  if (variant === "warning" || variant === "error") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    )
  }
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

export function AlertBanner({
  title,
  description,
  variant = "error",
  icon,
  onClick,
  className,
}: AlertBannerProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg p-4",
        styles.container,
        onClick && "cursor-pointer active:opacity-80",
        className
      )}
      onClick={onClick}
    >
      <div className={cn("shrink-0 mt-0.5", styles.icon)}>
        {icon || <DefaultIcon variant={variant} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm mt-1 opacity-90">{description}</p>
        )}
      </div>

      {onClick && (
        <svg
          className={cn("h-5 w-5 shrink-0", styles.icon)}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  )
}
