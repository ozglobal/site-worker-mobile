import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from './button'

export const PWAUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const handleUpdate = () => {
    updateServiceWorker(true)
  }

  const handleClose = () => {
    setNeedRefresh(false)
  }

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            새 버전이 있습니다
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            업데이트하여 최신 기능을 사용하세요
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-500"
          >
            나중에
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpdate}
          >
            업데이트
          </Button>
        </div>
      </div>
    </div>
  )
}