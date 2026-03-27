import { useEffect, useRef, useState, useCallback } from "react"
import CloseIcon from "@mui/icons-material/Close"
import { useDocumentDetection } from "./useDocumentDetection"
import { cropToFrame } from "./cropToFrame"
import { useShutterSound } from "../camera-utils/useShutterSound"

interface DocumentCameraProps {
  onCapture: (imageBase64: string) => void
  onClose: () => void
}

const A4_RATIO = 1 / 1.414 // width / height

export function DocumentCamera({ onCapture, onClose }: DocumentCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionLoopRef = useRef<number | null>(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [detected, setDetected] = useState(false)
  const [stable, setStable] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const detectCountRef = useRef(0)
  const capturedRef = useRef(false)
  const [frameRect, setFrameRect] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const { detect, checkStability, resetStability } = useDocumentDetection()
  const { play: playShutter } = useShutterSound()

  // Calculate frame rect based on container size
  const computeFrameRect = useCallback(() => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0, width: 0, height: 0 }

    const vw = container.clientWidth
    const vh = container.clientHeight
    const frameW = vw * 0.88
    const frameH = frameW / A4_RATIO
    const maxH = vh * 0.75

    const finalH = Math.min(frameH, maxH)
    const finalW = finalH * A4_RATIO

    const x = (vw - finalW) / 2
    const y = (vh - finalH) / 2

    return { x, y, width: finalW, height: finalH }
  }, [])

  // Start camera
  useEffect(() => {
    let cancelled = false

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream

        // Enable continuous autofocus if supported
        const track = stream.getVideoTracks()[0]
        const capabilities = track.getCapabilities?.()
        if ((capabilities as any)?.focusMode?.includes("continuous")) {
          await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as any] })
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute("playsinline", "true")
          await videoRef.current.play()
          setCameraReady(true)

          // Compute frame rect after camera is ready
          const rect = computeFrameRect()
          setFrameRect(rect)
        }
      } catch (err) {
        if (!cancelled) {
          setCameraError("카메라 접근 권한이 필요합니다.")
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (detectionLoopRef.current) {
        clearInterval(detectionLoopRef.current)
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [computeFrameRect])

  // Recalculate frame on resize
  useEffect(() => {
    const handleResize = () => {
      const rect = computeFrameRect()
      setFrameRect(rect)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [computeFrameRect])

  // Detection loop
  useEffect(() => {
    if (!cameraReady || !videoRef.current) return

    const video = videoRef.current
    const container = containerRef.current
    if (!container) return

    const loop = () => {
      const vw = container.clientWidth
      const vh = container.clientHeight
      const rect = computeFrameRect()

      const result = detect(video, rect, vw, vh)
      const isStable = checkStability(result.isDocumentDetected)

      if (result.isDocumentDetected) {
        detectCountRef.current++
        const remaining = Math.ceil((10 - detectCountRef.current) / 10 * 3)
        setCountdown(Math.max(remaining, 1))
      } else {
        detectCountRef.current = 0
        setCountdown(null)
      }

      setDetected(result.isDocumentDetected)
      setStable(isStable)
    }

    detectionLoopRef.current = window.setInterval(loop, 250)

    return () => {
      if (detectionLoopRef.current) {
        clearInterval(detectionLoopRef.current)
      }
    }
  }, [cameraReady, detect, checkStability, computeFrameRect])

  // Handle capture
  const handleCapture = useCallback(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    playShutter()

    const vw = container.clientWidth
    const vh = container.clientHeight
    const rect = computeFrameRect()

    const base64 = cropToFrame(video, rect, vw, vh, 0.92)
    onCapture(base64)
  }, [computeFrameRect, onCapture, playShutter])

  // Auto-capture on stable detection
  useEffect(() => {
    if (stable && !capturedRef.current) {
      capturedRef.current = true
      navigator.vibrate?.(50)
      handleCapture()
    }
  }, [stable, handleCapture])

  // Guide text
  const getGuideText = () => {
    if (cameraError) return cameraError
    if (!cameraReady) return "카메라 준비 중..."
    if (stable) return "촬영 중..."
    if (countdown !== null) return `${countdown}`
    return "문서를 영역 안에 맞춰주세요"
  }

  const borderColor = stable
    ? "border-green-400"
    : detected
      ? "border-green-400/70"
      : "border-white/60"

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Dim overlay with frame cutout */}
      {frameRect.width > 0 && (
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
            className={`absolute border-[3px] rounded-lg transition-colors duration-300 ${borderColor}`}
            style={{
              left: frameRect.x,
              top: frameRect.y,
              width: frameRect.width,
              height: frameRect.height,
            }}
          >
            {/* Corner markers */}
            <div className={`absolute -top-[7px] -left-[7px] w-6 h-6 border-t-[4px] border-l-[4px] rounded-tl-lg transition-colors ${detected ? "border-green-400" : "border-yellow-400"}`} />
            <div className={`absolute -top-[7px] -right-[7px] w-6 h-6 border-t-[4px] border-r-[4px] rounded-tr-lg transition-colors ${detected ? "border-green-400" : "border-yellow-400"}`} />
            <div className={`absolute -bottom-[7px] -left-[7px] w-6 h-6 border-b-[4px] border-l-[4px] rounded-bl-lg transition-colors ${detected ? "border-green-400" : "border-yellow-400"}`} />
            <div className={`absolute -bottom-[7px] -right-[7px] w-6 h-6 border-b-[4px] border-r-[4px] rounded-br-lg transition-colors ${detected ? "border-green-400" : "border-yellow-400"}`} />

            {/* Countdown */}
            {countdown !== null && !stable && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl font-bold text-green-400 drop-shadow-lg">{countdown}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center text-white"
      >
        <CloseIcon className="h-6 w-6" />
      </button>

      {/* Guide text */}
      <div className="absolute top-12 left-0 right-0 z-20 text-center">
        <p
          className={`text-sm font-medium px-4 py-2 inline-block rounded-full transition-colors duration-300 ${
            detected
              ? "bg-green-500/20 text-green-300"
              : "bg-black/40 text-white/80"
          }`}
        >
          {getGuideText()}
        </p>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 pt-4">
        {/* Capture button */}
        <div className="flex justify-center">
          <button
            onClick={handleCapture}
            disabled={!cameraReady}
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

        {/* Hint */}
        <p className="text-center text-xs text-white/50 mt-3">
          문서를 프레임에 맞추면 자동으로 촬영됩니다
        </p>
      </div>
    </div>
  )
}
