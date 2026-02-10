import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DCA] disabled:pointer-events-none",
  {
    variants: {
      variant: {
        // Figma button variants
        primary:
          "bg-[#007DCA] text-white hover:bg-[#006BB0] active:bg-[#005A99]",
        primaryDisabled:
          "bg-[#007DCA]/30 text-white cursor-not-allowed",
        dark:
          "bg-[#065486] text-white hover:bg-[#054A75] active:bg-[#043F64]",
        // Legacy variants
        secondary:
          "bg-secondary text-black hover:bg-secondary-active active:bg-secondary-active",
        outline:
          "border border-[#007DCA] text-[#007DCA] hover:bg-[#007DCA]/10",
        ghost:
          "text-[#007DCA] hover:bg-[#007DCA]/10",
        destructive:
          "bg-error text-white hover:bg-error/90",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-14 px-6", // 56px height as per Figma
        full: "h-14 w-full", // Full width, 56px height
        icon: "h-8 w-8 p-0", // 32x32 icon button
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

