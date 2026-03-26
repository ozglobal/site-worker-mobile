import { useRef, useEffect, useState, useCallback } from "react"
import CloseIcon from "@mui/icons-material/Close"
import {
  getQuadContour,
  sortPoints,
  warpDocument,
  drawContour,
  createStabilityTracker,
  isOpenCvReady,
  matToBase64,
  type Point,
} from "./documentDetection"

declare const cv: any

interface CameraViewProps {
  onCapture: (imageSrc: string) => void
  onClose: () => void
}

export function CameraView({ onCapture, onClose }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stabilityRef = useRef(createStabilityTracker(20, 10))
  const detectedPtsRef = useRef<Point[] | null>(null)
  const capturedRef = useRef(false)

  const [isReady, setIsReady] = useState(false)
  const [detected, setDetected] = useState(false)
  const [stable, setStable] = useState(false)
  const [statusText, setStatusText] = useState("문서를 맞춰주세요")
  const [cvLoaded, setCvLoaded] = useState(isOpenCvReady())

  // Wait for OpenCV to load
  useEffect(() => {
    if (cvLoaded) return
    const interval = setInterval(() => {
      if (isOpenCvReady()) {
        setCvLoaded(true)
        clearInterval(interval)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [cvLoaded])

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setIsReady(true)
        }
      } catch {
        setStatusText("카메라를 사용할 수 없습니다")
      }
    }
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // Detection loop
  useEffect(() => {
    if (!isReady || !cvLoaded) return

    const video = videoRef.current!
    const canvas = canvasRef.current!
    const overlay = overlayRef.current!
    const ctx = canvas.getContext("2d")!
    const overlayCtx = overlay.getContext("2d")!

    let animId: number

    const detect = () => {
      if (capturedRef.current) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      overlay.width = overlay.clientWidth
      overlay.height = overlay.clientHeight

      ctx.drawImage(video, 0, 0)
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height)

      try {
        const src = cv.imread(canvas)
        const gray = new cv.Mat()
        const blurred = new cv.Mat()
        const edges = new cv.Mat()
        const contours = new cv.MatVector()
        const hierarchy = new cv.Mat()

        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
        cv.GaussianBlur(gray, blurred, new cv.Size(7, 7), 0)
        cv.Canny(blurred, edges, 30, 100)

        // Strong morphological closing to merge outer document edge and suppress internal lines
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(9, 9))
        cv.dilate(edges, edges, kernel)
        cv.erode(edges, edges, kernel)
        kernel.delete()

        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

        const quad = getQuadContour(contours)

        if (quad) {
          const pts = sortPoints(quad)
          detectedPtsRef.current = pts

          // Document must be at least 15% of frame to avoid detecting small internal elements
          const area = cv.contourArea(quad)
          const frameArea = canvas.width * canvas.height
          const isLargeEnough = area > frameArea * 0.15

          if (isLargeEnough) {
            setDetected(true)

            const scaleX = overlay.width / canvas.width
            const scaleY = overlay.height / canvas.height
            const isStable = stabilityRef.current.check(pts)

            drawContour(overlayCtx, pts, isStable, scaleX, scaleY)

            if (isStable) {
              setStable(true)
              setStatusText("자동 촬영 중...")
              capturedRef.current = true

              // Warp and capture
              const warped = warpDocument(src, pts)
              const base64 = matToBase64(warped)
              warped.delete()
              quad.delete()
              src.delete()
              gray.delete()
              blurred.delete()
              edges.delete()
              contours.delete()
              hierarchy.delete()
              onCapture(base64)
              return
            } else {
              setStable(false)
              setStatusText("촬영 준비 완료")
            }
          } else {
            setDetected(false)
            setStatusText("문서를 더 가까이 맞춰주세요")
            stabilityRef.current.reset()
          }

          quad.delete()
        } else {
          detectedPtsRef.current = null
          setDetected(false)
          setStable(false)
          setStatusText("문서를 맞춰주세요")
          stabilityRef.current.reset()
        }

        src.delete()
        gray.delete()
        blurred.delete()
        edges.delete()
        contours.delete()
        hierarchy.delete()
      } catch {
        // OpenCV processing error — silently continue
      }

      animId = requestAnimationFrame(detect)
    }

    // Start detection with slight delay
    const timeout = setTimeout(() => {
      animId = requestAnimationFrame(detect)
    }, 500)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(animId)
    }
  }, [isReady, cvLoaded, onCapture])

  // Manual capture fallback
  const handleManualCapture = useCallback(() => {
    if (capturedRef.current) return
    capturedRef.current = true

    const video = videoRef.current!
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // If we have detected points, warp; otherwise capture raw
    if (detectedPtsRef.current && cvLoaded) {
      try {
        const src = cv.imread(canvas)
        const warped = warpDocument(src, detectedPtsRef.current)
        const base64 = matToBase64(warped)
        warped.delete()
        src.delete()
        onCapture(base64)
        return
      } catch {
        // Fall through to raw capture
      }
    }

    onCapture(canvas.toDataURL("image/jpeg", 0.9))
  }, [cvLoaded, onCapture])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Camera + overlay */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Default guide frame (shown when no document detected) */}
        {!detected && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div
              className="border-2 border-white/60 rounded-lg"
              style={{
                width: "85%",
                aspectRatio: `${1 / 1.414}`,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)",
              }}
            />
          </div>
        )}

        {/* Detection overlay canvas */}
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        />

        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center text-white"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

      </div>

      {/* Status text + Capture button */}
      <div className="bg-black pt-3 pb-6 flex flex-col items-center gap-3 z-20">
        <p className={`text-sm transition-colors ${
          stable ? "text-green-400" : detected ? "text-white" : "text-gray-300"
        }`}>
          {!cvLoaded ? "문서 인식 준비 중..." : statusText}
        </p>
        <button
          onClick={handleManualCapture}
          className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center"
        >
          <div className={`w-12 h-12 rounded-full transition-colors ${
            stable ? "bg-green-400" : "bg-white"
          }`} />
        </button>
      </div>
    </div>
  )
}
