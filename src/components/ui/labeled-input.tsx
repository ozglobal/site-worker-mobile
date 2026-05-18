import * as React from "react"
import { Input, InputProps } from "./input"

export interface LabeledInputProps extends InputProps {
  label: string
  helperText?: string
  errorText?: string
}

export const LabeledInput = React.forwardRef<HTMLInputElement, LabeledInputProps>(
  ({ label, helperText, errorText, error, className, ...props }, ref) => {
    const hasError = error || !!errorText

    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
        <Input
          ref={ref}
          error={hasError}
          className={className}
          {...props}
        />
        {helperText && !hasError && (
          <p className="mt-2 text-sm text-slate-500">{helperText}</p>
        )}
        {errorText && hasError && (
          <p className="mt-2 text-sm text-[#DC2626]">{errorText}</p>
        )}
      </div>
    )
  }
)
LabeledInput.displayName = "LabeledInput"
