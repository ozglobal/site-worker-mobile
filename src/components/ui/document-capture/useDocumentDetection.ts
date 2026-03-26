import { useRef, useCallback } from "react"

interface DetectionResult {
  isDocumentDetected: boolean
  confidence: number
}

interface FrameRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Minimal document detection hook.
 *
 * Analyses the frame region of a video feed by checking:
 * 1. Edge density — documents have clear edges compared to empty surfaces
 * 2. Brightness contrast — paper is typically brighter than the background
 *
 * Returns detection state + confidence (0–1).
 */
export function useDocumentDetection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stableCountRef = useRef(0)
  const STABLE_THRESHOLD = 10 // ~2.5s at 250ms interval

  const getCanvas = () => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
    }
    return canvasRef.current
  }

  /**
   * Detect whether a document is present inside the frame region.
   */
  const detect = useCallback(
    (
      video: HTMLVideoElement,
      frameRect: FrameRect,
      viewportWidth: number,
      viewportHeight: number
    ): DetectionResult => {
      if (video.readyState < 2) {
        return { isDocumentDetected: false, confidence: 0 }
      }

      const canvas = getCanvas()
      const videoW = video.videoWidth
      const videoH = video.videoHeight

      const scaleX = videoW / viewportWidth
      const scaleY = videoH / viewportHeight

      // Sample region (centre of frame, slightly inset)
      const inset = 0.1
      const sx = (frameRect.x + frameRect.width * inset) * scaleX
      const sy = (frameRect.y + frameRect.height * inset) * scaleY
      const sw = frameRect.width * (1 - inset * 2) * scaleX
      const sh = frameRect.height * (1 - inset * 2) * scaleY

      // Use a small sample size for performance
      const sampleW = 120
      const sampleH = Math.round(sampleW * (sh / sw))

      canvas.width = sampleW
      canvas.height = sampleH

      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      ctx.drawImage(
        video,
        Math.round(sx),
        Math.round(sy),
        Math.round(sw),
        Math.round(sh),
        0,
        0,
        sampleW,
        sampleH
      )

      const imageData = ctx.getImageData(0, 0, sampleW, sampleH)
      const data = imageData.data

      // 1. Calculate average brightness of frame area
      let totalBrightness = 0
      const pixelCount = sampleW * sampleH

      for (let i = 0; i < data.length; i += 4) {
        totalBrightness += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      }
      const avgBrightness = totalBrightness / pixelCount

      // 2. Calculate edge density using simple Sobel-like horizontal gradient
      let edgeSum = 0
      let edgeCount = 0

      for (let y = 1; y < sampleH - 1; y++) {
        for (let x = 1; x < sampleW - 1; x++) {
          const idx = (y * sampleW + x) * 4
          const left = data[idx - 4] * 0.299 + data[idx - 3] * 0.587 + data[idx - 2] * 0.114
          const right = data[idx + 4] * 0.299 + data[idx + 5] * 0.587 + data[idx + 6] * 0.114
          const top = data[((y - 1) * sampleW + x) * 4] * 0.299 +
            data[((y - 1) * sampleW + x) * 4 + 1] * 0.587 +
            data[((y - 1) * sampleW + x) * 4 + 2] * 0.114
          const bottom = data[((y + 1) * sampleW + x) * 4] * 0.299 +
            data[((y + 1) * sampleW + x) * 4 + 1] * 0.587 +
            data[((y + 1) * sampleW + x) * 4 + 2] * 0.114

          const gx = Math.abs(right - left)
          const gy = Math.abs(bottom - top)
          const gradient = Math.sqrt(gx * gx + gy * gy)

          if (gradient > 15) edgeSum++
          edgeCount++
        }
      }

      const edgeDensity = edgeCount > 0 ? edgeSum / edgeCount : 0

      // 3. Score: bright surface (paper) with meaningful edges (text/lines) = document
      // A blank table is bright but has no edges — must have both.
      const isBright = avgBrightness > 120
      const hasEdges = edgeDensity > 0.03 && edgeDensity < 0.5

      // Both conditions must be true for detection
      if (!isBright || !hasEdges) {
        return { isDocumentDetected: false, confidence: 0 }
      }

      const brightnessScore = Math.min(avgBrightness / 200, 1)
      const edgeScore = Math.min(edgeDensity / 0.12, 1)

      const confidence = brightnessScore * 0.3 + edgeScore * 0.7
      const isDocumentDetected = confidence > 0.55

      return { isDocumentDetected, confidence }
    },
    []
  )

  /**
   * Track stability: returns true when document has been steadily detected.
   */
  const checkStability = useCallback(
    (detected: boolean): boolean => {
      if (detected) {
        stableCountRef.current++
      } else {
        stableCountRef.current = 0
      }
      return stableCountRef.current >= STABLE_THRESHOLD
    },
    []
  )

  const resetStability = useCallback(() => {
    stableCountRef.current = 0
  }, [])

  return { detect, checkStability, resetStability }
}
