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
 * Document detection hook.
 *
 * Detects a document that COMPLETELY fills the frame by checking
 * all 4 inner edge strips of the frame. Each strip must be bright
 * and uniform (paper), not dark (background). If any edge shows
 * background, detection fails — meaning the document only partially
 * covers the frame.
 */
export function useDocumentDetection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stableCountRef = useRef(0)
  const STABLE_THRESHOLD = 10

  const getCanvas = () => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
    }
    return canvasRef.current
  }

  const getBrightness = (data: Uint8ClampedArray, idx: number) =>
    data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114

  /**
   * Sample average brightness of a rectangular region in the image data.
   */
  const sampleRegion = (
    data: Uint8ClampedArray,
    stride: number,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    maxW: number,
    maxH: number
  ) => {
    let sum = 0
    let count = 0
    for (let y = ry; y < ry + rh && y < maxH; y++) {
      for (let x = rx; x < rx + rw && x < maxW; x++) {
        sum += getBrightness(data, (y * stride + x) * 4)
        count++
      }
    }
    return count > 0 ? sum / count : 0
  }

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

      const sampleW = 160
      const sampleH = Math.round(sampleW * (videoH / videoW))

      canvas.width = sampleW
      canvas.height = sampleH

      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      ctx.drawImage(video, 0, 0, sampleW, sampleH)

      const imageData = ctx.getImageData(0, 0, sampleW, sampleH)
      const data = imageData.data

      const scaleX = sampleW / viewportWidth
      const scaleY = sampleH / viewportHeight

      const fx = Math.round(frameRect.x * scaleX)
      const fy = Math.round(frameRect.y * scaleY)
      const fw = Math.round(frameRect.width * scaleX)
      const fh = Math.round(frameRect.height * scaleY)

      // Inner edge strips: inset 18% from frame border — allows ~80-85% fill
      const insetX = Math.round(fw * 0.18)
      const insetY = Math.round(fh * 0.18)
      const stripW = Math.max(Math.round(fw * 0.08), 2)
      const stripH = Math.max(Math.round(fh * 0.08), 2)

      // Sample 4 inner edge strips (inset from border to avoid fingers)
      const topStrip = sampleRegion(data, sampleW, fx + insetX, fy + insetY, fw - insetX * 2, stripH, sampleW, sampleH)
      const bottomStrip = sampleRegion(data, sampleW, fx + insetX, fy + fh - insetY - stripH, fw - insetX * 2, stripH, sampleW, sampleH)
      const leftStrip = sampleRegion(data, sampleW, fx + insetX, fy + insetY, stripW, fh - insetY * 2, sampleW, sampleH)
      const rightStrip = sampleRegion(data, sampleW, fx + fw - insetX - stripW, fy + insetY, stripW, fh - insetY * 2, sampleW, sampleH)

      // Sample outside strips for contrast comparison
      const outsideStripW = Math.max(Math.round(fw * 0.1), 3)
      const outsideStripH = Math.max(Math.round(fh * 0.1), 3)

      const outsideTop = sampleRegion(data, sampleW, fx, Math.max(fy - outsideStripH, 0), fw, outsideStripH, sampleW, sampleH)
      const outsideBottom = sampleRegion(data, sampleW, fx, fy + fh, fw, outsideStripH, sampleW, sampleH)
      const outsideLeft = sampleRegion(data, sampleW, Math.max(fx - outsideStripW, 0), fy, outsideStripW, fh, sampleW, sampleH)
      const outsideRight = sampleRegion(data, sampleW, fx + fw, fy, outsideStripW, fh, sampleW, sampleH)

      // Each inner edge must be brighter than its corresponding outer edge
      // This means the document paper extends all the way to each frame edge
      const MIN_CONTRAST = 8
      const edgeScores = [
        topStrip - outsideTop,
        bottomStrip - outsideBottom,
        leftStrip - outsideLeft,
        rightStrip - outsideRight,
      ]

      const passingEdges = edgeScores.filter((s) => s > MIN_CONTRAST).length

      // ALL 4 edges must show document-vs-background contrast
      if (passingEdges < 4) {
        return { isDocumentDetected: false, confidence: 0 }
      }

      // Also check that inner edges are bright enough (paper ≥ 70 for dim lighting)
      const minEdgeBrightness = Math.min(topStrip, bottomStrip, leftStrip, rightStrip)
      if (minEdgeBrightness < 70) {
        return { isDocumentDetected: false, confidence: 0 }
      }

      // Center content check — must have some text/lines (not blank)
      const cx = Math.round(fx + fw * 0.2)
      const cy = Math.round(fy + fh * 0.2)
      const cw = Math.round(fw * 0.6)
      const ch = Math.round(fh * 0.6)

      let edgePixels = 0
      let centerCount = 0
      for (let y = cy; y < cy + ch && y < sampleH; y++) {
        for (let x = cx + 1; x < cx + cw && x < sampleW; x++) {
          const b = getBrightness(data, (y * sampleW + x) * 4)
          const left = getBrightness(data, (y * sampleW + x - 1) * 4)
          if (Math.abs(b - left) > 18) edgePixels++
          centerCount++
        }
      }

      const edgeDensity = centerCount > 0 ? edgePixels / centerCount : 0
      if (edgeDensity < 0.005) {
        return { isDocumentDetected: false, confidence: 0 }
      }

      // Confidence
      const avgContrast = edgeScores.reduce((a, b) => a + b, 0) / 4
      const contrastScore = Math.min(avgContrast / 40, 1)
      const brightScore = Math.min(minEdgeBrightness / 160, 1)
      const contentScore = Math.min(edgeDensity / 0.06, 1)

      const confidence = contrastScore * 0.5 + brightScore * 0.3 + contentScore * 0.2

      return { isDocumentDetected: confidence > 0.4, confidence }
    },
    []
  )

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
