import { useRef, useEffect, useState, useCallback } from "react"
import CloseIcon from "@mui/icons-material/Close"
import CameraAltIcon from "@mui/icons-material/CameraAlt"

interface IdCardCameraProps {
  side: "front" | "back"
  title?: string
  showSide?: boolean
  onCapture: (file: File) => void
  onClose: () => void
}

/**
 * Detect if a card-like rectangle exists inside the guide box area.
 * Samples edges of a centered card-shaped region and checks for
 * contrast (brightness difference) between inside and border pixels.
 */
function detectCard(video: HTMLVideoElement, canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return false

  const vw = video.videoWidth
  const vh = video.videoHeight
  if (vw === 0 || vh === 0) return false

  // Use a small analysis canvas for performance
  const aw = 320
  const ah = Math.round((vh / vw) * aw)
  canvas.width = aw
  canvas.height = ah
  ctx.drawImage(video, 0, 0, aw, ah)

  // Guide box region (matching the 90% width, card aspect ratio centered)
  const cardAspect = 85.6 / 53.98
  const boxW = Math.round(aw * 0.85)
  const boxH = Math.round(boxW / cardAspect)
  const boxX = Math.round((aw - boxW) / 2)
  const boxY = Math.round((ah - boxH) / 2)

  const imageData = ctx.getImageData(0, 0, aw, ah)
  const data = imageData.data

  const brightness = (x: number, y: number): number => {
    const i = (y * aw + x) * 4
    return (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
  }

  // Sample points along the edges of the guide box
  // Compare pixels just inside vs just outside the box
  const margin = 3
  const samples = 16
  let edgeContrast = 0
  let sampleCount = 0

  // Top and bottom edges
  for (let i = 0; i < samples; i++) {
    const x = boxX + Math.round((boxW * (i + 0.5)) / samples)
    // Top edge
    const topIn = brightness(x, boxY + margin)
    const topOut = brightness(x, boxY - margin)
    if (boxY - margin >= 0) {
      edgeContrast += Math.abs(topIn - topOut)
      sampleCount++
    }
    // Bottom edge
    const botIn = brightness(x, boxY + boxH - margin)
    const botOut = brightness(x, boxY + boxH + margin)
    if (boxY + boxH + margin < ah) {
      edgeContrast += Math.abs(botIn - botOut)
      sampleCount++
    }
  }

  // Left and right edges
  for (let i = 0; i < samples; i++) {
    const y = boxY + Math.round((boxH * (i + 0.5)) / samples)
    // Left edge
    const leftIn = brightness(boxX + margin, y)
    const leftOut = brightness(boxX - margin, y)
    if (boxX - margin >= 0) {
      edgeContrast += Math.abs(leftIn - leftOut)
      sampleCount++
    }
    // Right edge
    const rightIn = brightness(boxX + boxW - margin, y)
    const rightOut = brightness(boxX + boxW + margin, y)
    if (boxX + boxW + margin < aw) {
      edgeContrast += Math.abs(rightIn - rightOut)
      sampleCount++
    }
  }

  if (sampleCount === 0) return false
  const avgContrast = edgeContrast / sampleCount

  // Threshold: card edges typically have contrast > 15
  return avgContrast > 15
}

export function IdCardCamera({ side, title = "신분증", showSide = true, onCapture, onClose }: IdCardCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const detectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stableCountRef = useRef(0)
  const capturedRef = useRef(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detected, setDetected] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  const stopCamera = useCallback(() => {
    if (detectionTimerRef.current) {
      clearInterval(detectionTimerRef.current)
      detectionTimerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const doCapture = useCallback(() => {
    const video = videoRef.current
    if (!video || capturedRef.current) return
    capturedRef.current = true

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
  }, [side, onCapture, stopCamera])

  // Start detection loop when camera is ready
  useEffect(() => {
    if (!isReady) return

    if (!detectionCanvasRef.current) {
      detectionCanvasRef.current = document.createElement("canvas")
    }

    const STABLE_THRESHOLD = 6 // ~1.5 seconds at 250ms interval
    let countdownValue = 0

    detectionTimerRef.current = setInterval(() => {
      const video = videoRef.current
      const canvas = detectionCanvasRef.current
      if (!video || !canvas || capturedRef.current) return

      const cardDetected = detectCard(video, canvas)

      if (cardDetected) {
        stableCountRef.current++
        setDetected(true)

        if (stableCountRef.current >= STABLE_THRESHOLD) {
          // Start countdown
          if (countdownValue === 0) {
            countdownValue = 3
            setCountdown(3)
          }
        }

        if (countdownValue > 0) {
          countdownValue--
          setCountdown(countdownValue)
          if (countdownValue === 0) {
            doCapture()
          }
        }
      } else {
        stableCountRef.current = Math.max(0, stableCountRef.current - 2)
        countdownValue = 0
        setCountdown(null)
        if (stableCountRef.current === 0) {
          setDetected(false)
        }
      }
    }, 250)

    return () => {
      if (detectionTimerRef.current) {
        clearInterval(detectionTimerRef.current)
        detectionTimerRef.current = null
      }
    }
  }, [isReady, doCapture])

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
    doCapture()
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
          {title}{showSide ? ` ${side === "front" ? "앞면" : "뒷면"}` : ""}
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
            <div className={`absolute inset-0 rounded-xl border-2 transition-colors ${detected ? "border-green-400/80" : "border-gray-400/60"}`} />

            {/* Corners */}
            <div className={`absolute -top-0.5 -left-0.5 w-8 h-8 border-t-[3px] border-l-[3px] rounded-tl-xl transition-colors ${detected ? "border-green-400" : "border-primary"}`} />
            <div className={`absolute -top-0.5 -right-0.5 w-8 h-8 border-t-[3px] border-r-[3px] rounded-tr-xl transition-colors ${detected ? "border-green-400" : "border-primary"}`} />
            <div className={`absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-[3px] border-l-[3px] rounded-bl-xl transition-colors ${detected ? "border-green-400" : "border-primary"}`} />
            <div className={`absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-[3px] border-r-[3px] rounded-br-xl transition-colors ${detected ? "border-green-400" : "border-primary"}`} />

            {/* Countdown overlay */}
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-5xl font-bold drop-shadow-lg">{countdown}</span>
              </div>
            )}
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
        <p className={`text-sm transition-colors ${detected ? "text-green-400" : "text-gray-400"}`}>
          {detected ? `${title}이 인식되었습니다` : `영역 안에 ${title}을 맞춰주세요`}
        </p>
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
