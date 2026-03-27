import { useRef, useEffect, useState, useCallback } from "react"
import CloseIcon from "@mui/icons-material/Close"
import { useShutterSound } from "../camera-utils/useShutterSound"

interface IdCardCameraProps {
  side: "front" | "back"
  title?: string
  showSide?: boolean
  onCapture: (file: File) => void
  onClose: () => void
}

const CARD_ASPECT = 85.6 / 53.98 // width / height (~1.586)

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
  const boxW = Math.round(aw * 0.85)
  const boxH = Math.round(boxW / CARD_ASPECT)
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
  const margin = Math.max(Math.round(boxW * 0.14), 3)
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
  const containerRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const detectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stableCountRef = useRef(0)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detected, setDetected] = useState(false)
  const [stable, setStable] = useState(false)
  const [frameRect, setFrameRect] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const { play: playShutter } = useShutterSound()

  // Calculate frame rect based on container size
  const computeFrameRect = useCallback(() => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0, width: 0, height: 0 }

    const vw = container.clientWidth
    const vh = container.clientHeight
    const frameW = Math.min(vw * 0.9, 400)
    const frameH = frameW / CARD_ASPECT
    const x = (vw - frameW) / 2
    const y = (vh - frameH) / 2

    return { x, y, width: frameW, height: frameH }
  }, [])

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
    const container = containerRef.current
    if (!video || !container) return

    playShutter()

    const vw = container.clientWidth
    const vh = container.clientHeight
    const rect = computeFrameRect()

    // Map viewport coords to video resolution
    const scaleX = video.videoWidth / vw
    const scaleY = video.videoHeight / vh
    const sx = Math.round(rect.x * scaleX)
    const sy = Math.round(rect.y * scaleY)
    const sw = Math.round(rect.width * scaleX)
    const sh = Math.round(rect.height * scaleY)

    const canvas = document.createElement("canvas")
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)

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
  }, [side, onCapture, stopCamera, computeFrameRect, playShutter])

  // Start detection loop when camera is ready
  useEffect(() => {
    if (!isReady) return

    if (!detectionCanvasRef.current) {
      detectionCanvasRef.current = document.createElement("canvas")
    }

    const STABLE_THRESHOLD = 6 // ~1.5 seconds at 250ms interval

    detectionTimerRef.current = setInterval(() => {
      const video = videoRef.current
      const canvas = detectionCanvasRef.current
      if (!video || !canvas) return

      const cardDetected = detectCard(video, canvas)

      if (cardDetected) {
        stableCountRef.current++
        setDetected(true)

        if (stableCountRef.current >= STABLE_THRESHOLD) {
          setStable(true)
        }
      } else {
        stableCountRef.current = Math.max(0, stableCountRef.current - 2)
        if (stableCountRef.current === 0) {
          setDetected(false)
        }
        setStable(false)
      }
    }, 250)

    return () => {
      if (detectionTimerRef.current) {
        clearInterval(detectionTimerRef.current)
        detectionTimerRef.current = null
      }
    }
  }, [isReady])

  // Vibrate on stable detection
  useEffect(() => {
    if (stable) {
      navigator.vibrate?.(50)
    }
  }, [stable])

  // Start camera
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

        // Apply 1.5x zoom and continuous autofocus if supported
        const track = stream.getVideoTracks()[0]
        const capabilities = track.getCapabilities?.()
        if (capabilities?.zoom) {
          const maxZoom = capabilities.zoom.max ?? 1
          const targetZoom = Math.min(1.5, maxZoom)
          await track.applyConstraints({ advanced: [{ zoom: targetZoom } as any] })
        }
        if ((capabilities as any)?.focusMode?.includes("continuous")) {
          await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as any] })
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setIsReady(true)

          // Compute frame rect after camera is ready
          const rect = computeFrameRect()
          setFrameRect(rect)
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
  }, [stopCamera, computeFrameRect])

  // Recalculate frame on resize
  useEffect(() => {
    const handleResize = () => {
      const rect = computeFrameRect()
      setFrameRect(rect)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [computeFrameRect])

  const handleCapture = () => {
    doCapture()
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  const borderColor = stable
    ? "border-green-400/80"
    : detected
      ? "border-green-400/80"
      : "border-gray-400/60"

  const cornerColor = detected ? "border-green-400" : "border-yellow-400"

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
      <div ref={containerRef} className="flex-1 relative">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          style={{ display: isReady ? "block" : "none" }}
        />

        {/* Dim overlay with frame cutout */}
        {isReady && frameRect.width > 0 && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Top dim */}
            <div
              className="absolute left-0 right-0 top-0 bg-black/50"
              style={{ height: frameRect.y }}
            />
            {/* Bottom dim */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-black/50"
              style={{ top: frameRect.y + frameRect.height }}
            />
            {/* Left dim */}
            <div
              className="absolute bg-black/50"
              style={{
                left: 0,
                top: frameRect.y,
                width: frameRect.x,
                height: frameRect.height,
              }}
            />
            {/* Right dim */}
            <div
              className="absolute bg-black/50"
              style={{
                right: 0,
                top: frameRect.y,
                width: frameRect.x,
                height: frameRect.height,
              }}
            />

            {/* Frame border */}
            <div
              className={`absolute rounded-xl border-[3px] transition-colors ${borderColor}`}
              style={{
                left: frameRect.x,
                top: frameRect.y,
                width: frameRect.width,
                height: frameRect.height,
              }}
            >
              {/* Corners */}
              <div className={`absolute -top-[3px] -left-[3px] w-6 h-6 border-t-[4px] border-l-[4px] rounded-tl-xl transition-colors ${cornerColor}`} />
              <div className={`absolute -top-[3px] -right-[3px] w-6 h-6 border-t-[4px] border-r-[4px] rounded-tr-xl transition-colors ${cornerColor}`} />
              <div className={`absolute -bottom-[3px] -left-[3px] w-6 h-6 border-b-[4px] border-l-[4px] rounded-bl-xl transition-colors ${cornerColor}`} />
              <div className={`absolute -bottom-[3px] -right-[3px] w-6 h-6 border-b-[4px] border-r-[4px] rounded-br-xl transition-colors ${cornerColor}`} />
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-white text-center px-8">{error}</p>
          </div>
        )}
      </div>

      {/* Guide text */}
      <div className="text-center py-4">
        <p className={`text-sm transition-colors ${detected ? "text-green-400" : "text-gray-400"}`}>
          {detected ? `${title}이 인식되었습니다. 촬영 버튼을 눌러주세요` : `영역 안에 ${title}을 맞춰주세요`}
        </p>
      </div>

      {/* Capture button */}
      <div className="flex justify-center pb-10">
        <button
          onClick={handleCapture}
          disabled={!isReady}
          className={`w-[72px] h-[72px] rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
            detected
              ? "border-green-400 opacity-100"
              : "border-white/80 opacity-100"
          }`}
        >
          <div
            className={`w-14 h-14 rounded-full transition-colors duration-300 ${
              detected ? "bg-green-400" : "bg-white"
            }`}
          />
        </button>
      </div>
    </div>
  )
}
