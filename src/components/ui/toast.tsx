import { useToast } from '@/contexts/ToastContext'

const SuccessIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
    <path
      d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path
      d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M6.5 10L9 12.5L13.5 7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ErrorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
    <path
      d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path
      d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M7 7L13 13M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
    <path
      d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path
      d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M10 9V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10" cy="7" r="1" fill="currentColor" />
  </svg>
)

const bgMap = {
  success: 'bg-slate-800',
  error: 'bg-red-600',
  info: 'bg-slate-800',
} as const

const subtitleMap = {
  success: 'text-slate-300',
  error: 'text-red-200',
  info: 'text-slate-300',
} as const

const iconMap = {
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
} as const

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-24 px-4 pointer-events-none">
      <div className="flex flex-col gap-2 w-full max-w-sm">
        {toasts.map(toast => {
          const Icon = iconMap[toast.type]
          return (
            <div
              key={toast.id}
              className={`${bgMap[toast.type]} text-white rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 pointer-events-auto`}
              onClick={() => dismiss(toast.id)}
            >
              <Icon />
              <div className="flex-1">
                <p className="font-medium text-sm">{toast.title}</p>
                {toast.message && (
                  <p className={`text-xs ${subtitleMap[toast.type]} mt-0.5`}>{toast.message}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
