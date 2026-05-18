import { cn } from "@/lib/utils"

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-6 h-6 border-2",
  xl: "w-10 h-10 border-3",
} as const

interface SpinnerProps {
  size?: keyof typeof sizeClasses
  className?: string
}

export function Spinner({ size = "lg", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "rounded-full animate-spin border-slate-900 border-t-transparent",
        sizeClasses[size],
        className,
      )}
    />
  )
}
