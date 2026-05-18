import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  className?: string
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  return (
    <div className={cn("w-full shrink-0 h-12 flex items-center px-5", className)}>
      <div className="w-full h-1 bg-gray-200">
        <div
          className="h-full bg-primary rounded-r-full transition-all"
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    </div>
  )
}
