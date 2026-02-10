import { cn } from "@/lib/utils"

interface OptionCardProps {
  title: string
  description?: string
  selected?: boolean
  showRadio?: boolean
  onClick?: () => void
  className?: string
}

export function OptionCard({
  title,
  description,
  selected,
  showRadio = false,
  onClick,
  className,
}: OptionCardProps) {
  const isSelectable = selected !== undefined

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl text-left transition-colors",
        isSelectable
          ? [
              "border-2",
              selected
                ? "border-primary bg-primary/5"
                : "border-gray-200 bg-white",
            ]
          : "border border-gray-200 hover:border-gray-300",
        className,
      )}
    >
      {showRadio ? (
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0",
              selected ? "border-primary" : "border-gray-300",
            )}
          >
            {selected && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </div>
          <div>
            <p className="font-medium text-slate-900">{title}</p>
            {description && (
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="font-bold text-slate-900">{title}</p>
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>
      )}
    </button>
  )
}
