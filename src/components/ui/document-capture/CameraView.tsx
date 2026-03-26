import { useEffect, useRef, useState, useCallback } from "react"
import CloseIcon from "@mui/icons-material/Close"
import { useDocumentDetection } from "./useDocumentDetection"
import { cropToFrame } from "./utils/cropToFrame"

interface CameraViewProps {
  onCapture: (imageBase64: string) => void
  onClose: () => void
}

const A4_RATIO = 1 / 1.414 // width / height

export function CameraView({ onCapture, onClose }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionLoopRef = useRef<number | null>(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [detected, setDetected] = useState(false)
  const [stable, setStable] = useState(false)
  const [frameRect, setFrameRect] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const { detect, checkStability, resetStability } = useDocumentDetection()

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
      setDetected(result.isDocumentDetected)

      const isStable = checkStability(result.isDocumentDetected)
      setStable(isStable)
    }

    detectionLoopRef.current = window.setInterval(loop, 250)

    return () => {
      if (detectionLoopRef.current) {
        clearInterval(detectionLoopRef.current)
      }
    }
  }, [cameraReady, detect, checkStability, computeFrameRect])

  // Shutter sound
  const shutterSoundRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    // Generate a short shutter click sound using AudioContext
    try {
      const audioCtx = new AudioContext()
      const duration = 0.15
      const sampleRate = audioCtx.sampleRate
      const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate
        data[i] = Math.exp(-t * 40) * (Math.random() * 2 - 1) * 0.5
      }
      const blob = new Blob(
        [encodeWav(buffer)],
        { type: "audio/wav" }
      )
      const url = URL.createObjectURL(blob)
      shutterSoundRef.current = new Audio(url)
      shutterSoundRef.current.volume = 0.6
      audioCtx.close()
    } catch {
      // Audio not supported — silent fallback
    }
  }, [])

  // Handle capture
  const handleCapture = useCallback(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    // Play shutter sound
    if (shutterSoundRef.current) {
      shutterSoundRef.current.currentTime = 0
      shutterSoundRef.current.play().catch(() => {})
    }
    navigator.vibrate?.(50)

    const vw = container.clientWidth
    const vh = container.clientHeight
    const rect = computeFrameRect()

    const base64 = cropToFrame(video, rect, vw, vh, 0.92)
    onCapture(base64)
  }, [computeFrameRect, onCapture])

  // Auto-capture disabled — user must tap capture button
  useEffect(() => {
    if (stable) {
      navigator.vibrate?.(50)
    }
  }, [stable, handleCapture])

  // Guide text
  const getGuideText = () => {
    if (cameraError) return cameraError
    if (!cameraReady) return "카메라 준비 중..."
    if (detected) return "문서가 감지되었습니다. 촬영 버튼을 눌러주세요"
    return "문서를 프레임 안에 맞춰주세요"
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
          문서를 프레임에 맞추고 촬영 버튼을 눌러주세요
        </p>
      </div>
    </div>
  )
}

/** Encode an AudioBuffer as a WAV ArrayBuffer */
function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1
  const sampleRate = buffer.sampleRate
  const data = buffer.getChannelData(0)
  const byteRate = sampleRate * numChannels * 2
  const blockAlign = numChannels * 2
  const dataSize = data.length * 2
  const headerSize = 44
  const buf = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(buf)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, "RIFF")
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, "data")
  view.setUint32(40, dataSize, true)

  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]))
    view.setInt16(headerSize + i * 2, sample * 0x7fff, true)
  }

  return buf
}
