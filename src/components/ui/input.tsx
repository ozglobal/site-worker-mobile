import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-12 w-full rounded-lg border bg-white px-4 py-3",
          "text-base font-normal leading-6 text-[#27272A]",
          "placeholder:text-[#9CA3AF]",
          "transition-all duration-200",
          // Default state
          "border-[#E5E5E5] shadow-sm",
          // Focus state (blue ring)
          "focus:border-[#007DCA] focus:outline-none focus:ring-[3px] focus:ring-[#007DCA]/25",
          // Error state (red ring)
          error && "border-[#DC2626] text-[#DC2626] ring-[3px] ring-[#DC2626]/25 focus:border-[#DC2626] focus:ring-[#DC2626]/25",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
