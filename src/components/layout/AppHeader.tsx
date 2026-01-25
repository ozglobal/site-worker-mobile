import { cn } from "@/lib/utils"
import ArrowBack from "@mui/icons-material/ArrowBack"

// Tabler icon: bell
const BellIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-900"
  >
    <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
    <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
  </svg>
)

interface AppHeaderProps {
  showLeftAction?: boolean
  title: string
  showRightAction?: boolean
  notificationCount?: number
  onLeftActionClick?: () => void
  onRightActionClick?: () => void
  className?: string
}

export function AppHeader({
  showLeftAction = false,
  title,
  showRightAction = true,
  notificationCount = 0,
  onLeftActionClick,
  onRightActionClick,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 w-full items-center justify-between bg-white",
        className
      )}
    >
      {/* Left section */}
      <div className="flex items-center ml-4 gap-2">
        {showLeftAction ? (
          <button
            onClick={onLeftActionClick}
            className="w-10 h-10 flex items-center justify-center -ml-2"
            aria-label="Menu"
          >
            <ArrowBack className="h-6 w-6 text-gray-800" />
          </button>
        ) : null}
        <h1 className="text-base font-medium text-slate-900">{title}</h1>
      </div>

      {/* Right action - Notification bell */}
      {showRightAction ? (
        <button
          onClick={onRightActionClick}
          className="relative w-10 h-10 flex items-center justify-center mr-2"
          aria-label="Notifications"
        >
          <BellIcon />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      ) : (
        <div className="w-10 mr-4" />
      )}
    </header>
  )
}
