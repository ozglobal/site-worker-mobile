import ArrowBackSharp from "@mui/icons-material/ArrowBackSharp"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AppTopBarProps {
  title: string
  onBack?: () => void
  onForward?: () => void
  className?: string
}

export function AppTopBar({
  title,
  onBack,
  onForward,
  className,
}: AppTopBarProps) {
  return (
    <header
      className={cn(
        "flex h-12 w-full items-center justify-between px-2 bg-white",
        className
      )}
    >
      {onBack ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-10 w-10 p-0"
          aria-label="Go back"
        >
          <ArrowBackSharp className="h-6 w-6 text-black" />
        </Button>
      ) : (
        <div className="h-10 w-10" />
      )}

      <h1 className="text-base font-bold">{title}</h1>

      {onForward ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onForward}
          className="h-10 w-10 p-0"
          aria-label="Go forward"
        >
          <ArrowBackSharp className="h-6 w-6 text-black" />
        </Button>
      ) : (
        <div className="h-10 w-10" />
      )}
    </header>
  )
}
