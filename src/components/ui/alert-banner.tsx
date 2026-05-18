import { cn } from "@/lib/utils"

export interface AlertBannerProps {
  title: string
  description?: string
  variant?: "warning" | "error" | "info"
  onClick?: () => void
  className?: string
}

const variantStyles = {
  warning: {
    container: "bg-amber-50 border-amber-200",
    icon: "#D97706",
    title: "font-bold text-amber-700",
    description: "text-amber-600",
  },
  error: {
    container: "bg-red-50 border-red-200",
    icon: "#DC2626",
    title: "font-bold text-red-600",
    description: "text-red-500",
  },
  info: {
    container: "bg-slate-100 border-slate-200",
    icon: "#94A3B8",
    title: "text-slate-500",
    description: "text-slate-500",
  },
}

export function AlertBanner({
  title,
  description,
  variant = "error",
  onClick,
  className,
}: AlertBannerProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "rounded-xl p-4 flex items-center gap-3 border",
        styles.container,
        onClick && "cursor-pointer active:opacity-80",
        className
      )}
      onClick={onClick}
    >
      {variant === "info" ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
          <path
            d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
            stroke={styles.icon}
            strokeWidth="1.5"
          />
          <path d="M10 6V11" stroke={styles.icon} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="14" r="1" fill={styles.icon} />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0">
          <path d="M10 2L1 18h18L10 2z" stroke={styles.icon} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M10 8v4" stroke={styles.icon} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="14.5" r="0.75" fill={styles.icon} />
        </svg>
      )}
      <div>
        <p className={cn("text-sm", styles.title)}>{title}</p>
        {description && (
          <p className={cn("text-sm mt-1", styles.description)}>{description}</p>
        )}
      </div>
    </div>
  )
}
