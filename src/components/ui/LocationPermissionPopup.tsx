import { useState } from 'react'
import { IconMapPin, IconX, IconSettings } from '@tabler/icons-react'
import { checkLocationPermission } from '@/utils/geolocation'

interface LocationPermissionPopupProps {
  /** Called when permission is granted with location data */
  onGranted: (location: { latitude: number; longitude: number; accuracy: number }) => void
  /** Called when permission is denied */
  onDenied: () => void
  /** Called when popup is closed without action */
  onClose: () => void
  /** Whether this is a retry after denial (shows settings guidance) */
  isDenied?: boolean
}

export function LocationPermissionPopup({
  onGranted,
  onDenied,
  onClose,
  isDenied = false,
}: LocationPermissionPopupProps) {
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      onGranted({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      })
    } catch (err) {
      const geoError = err as GeolocationPositionError
      if (geoError.code === geoError.PERMISSION_DENIED) {
        // Check actual permission state - PERMISSION_DENIED error can occur
        // even when site has permission if system location services are disabled
        const permissionStatus = await checkLocationPermission()
        if (permissionStatus === 'denied') {
          onDenied()
        } else {
          // Permission is granted/prompt but geolocation still failed
          // This usually means system-level location services are disabled
          setError('위치 정보를 가져올 수 없습니다.\n기기의 위치 서비스가 켜져 있는지 확인해주세요.')
        }
      } else if (geoError.code === geoError.TIMEOUT) {
        setError('위치 정보 요청 시간이 초과되었습니다. 다시 시도해주세요.')
      } else {
        setError('위치 정보를 가져올 수 없습니다. 다시 시도해주세요.')
      }
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
        >
          <IconX size={20} className="text-slate-500" />
        </button>

        {/* Content */}
        <div className="px-6 pt-8 pb-6">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            {isDenied ? (
              <IconSettings size={32} className="text-blue-600" />
            ) : (
              <IconMapPin size={32} className="text-blue-600" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-center text-slate-900 mb-2">
            {isDenied ? '위치 권한 설정 필요' : '위치 권한 요청'}
          </h2>

          {/* Description */}
          <p className="text-sm text-slate-600 text-center mb-6">
            {isDenied ? (
              <>
                위치 권한이 거부되어 있습니다.<br />
                출근 처리를 위해 브라우저 설정에서<br />
                위치 권한을 허용해주세요.
              </>
            ) : (
              <>
                출근 처리를 위해 현재 위치가 필요합니다.<br />
                위치 정보는 출근 기록에만 사용됩니다.
              </>
            )}
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            {isDenied ? (
              <>
                <button
                  onClick={() => {
                    // Try to open browser settings or show guidance
                    alert('브라우저 설정에서 위치 권한을 허용해주세요.\n\n• Chrome: 주소창 왼쪽 자물쇠 아이콘 클릭 → 위치 → 허용\n• Safari: 설정 → Safari → 위치 → 허용')
                  }}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  설정 방법 보기
                </button>
                <button
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="w-full py-3 px-4 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {isRequesting ? '확인 중...' : '다시 시도'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isRequesting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      위치 확인 중...
                    </span>
                  ) : (
                    '위치 권한 허용'
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 text-slate-500 font-medium rounded-xl hover:bg-slate-100 transition-colors"
                >
                  취소
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
