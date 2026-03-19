import { useRef, useEffect, useState, useCallback } from "react"
import CloseIcon from "@mui/icons-material/Close"
import CameraAltIcon from "@mui/icons-material/CameraAlt"

interface IdCardCameraProps {
  side: "front" | "back"
  onCapture: (file: File) => void
  onClose: () => void
}

export function IdCardCamera({ side, onCapture, onClose }: IdCardCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setIsReady(true)
        }
      } catch {
        if (!cancelled) {
          setError("카메라를 사용할 수 없습니다. 카메라 권한을 확인해주세요.")
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [stopCamera])

  const handleCapture = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const fileName = side === "front" ? "id_card_front.jpg" : "id_card_back.jpg"
          const file = new File([blob], fileName, { type: "image/jpeg" })
          stopCamera()
          onCapture(file)
        }
      },
      "image/jpeg",
      0.9,
    )
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={handleClose} className="p-2 text-white">
          <CloseIcon className="h-6 w-6" />
        </button>
        <span className="text-white font-medium">
          신분증 {side === "front" ? "앞면" : "뒷면"}
        </span>
        <div className="w-10" />
      </div>

      {/* Camera area */}
      <div className="flex-1 relative flex items-center justify-center">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          style={{ display: isReady ? "block" : "none" }}
        />

        {/* Card guide overlay */}
        {isReady && (
          <div className="relative z-10 w-[90%] max-w-[400px]" style={{ aspectRatio: "85.6 / 53.98" }}>
            {/* Gray border */}
            <div className="absolute inset-0 rounded-xl border-2 border-gray-400/60" />

            {/* Blue corners */}
            {/* Top-left */}
            <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-[3px] border-l-[3px] border-primary rounded-tl-xl" />
            {/* Top-right */}
            <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-[3px] border-r-[3px] border-primary rounded-tr-xl" />
            {/* Bottom-left */}
            <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-[3px] border-l-[3px] border-primary rounded-bl-xl" />
            {/* Bottom-right */}
            <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-[3px] border-r-[3px] border-primary rounded-br-xl" />
          </div>
        )}

        {error && (
          <div className="relative z-10 text-white text-center px-8">
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Guide text */}
      <div className="text-center py-4">
        <p className="text-gray-400 text-sm">영역 안에 신분증을 맞춰주세요</p>
      </div>

      {/* Capture button */}
      <div className="flex justify-center pb-10">
        <button
          onClick={handleCapture}
          disabled={!isReady}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
        >
          <CameraAltIcon className="h-7 w-7 text-slate-900" />
        </button>
      </div>
    </div>
  )
}
