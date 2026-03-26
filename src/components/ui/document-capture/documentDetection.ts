/* eslint-disable @typescript-eslint/no-explicit-any */

// OpenCV.js is loaded globally via CDN
declare const cv: any

export interface Point {
  x: number
  y: number
}

/**
 * Find the largest 4-point polygon contour
 */
export function getQuadContour(contours: any): any | null {
  let best: any = null
  let maxArea = 0

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i)
    const peri = cv.arcLength(cnt, true)

    const approx = new cv.Mat()
    cv.approxPolyDP(cnt, approx, 0.02 * peri, true)

    if (approx.rows === 4 && cv.isContourConvex(approx)) {
      const area = cv.contourArea(approx)
      if (area > maxArea) {
        if (best) best.delete()
        maxArea = area
        best = approx
      } else {
        approx.delete()
      }
    } else {
      approx.delete()
    }
    cnt.delete()
  }

  return best
}

/**
 * Sort 4 points: top-left, top-right, bottom-right, bottom-left
 */
export function sortPoints(pts: any): Point[] {
  const points: Point[] = []

  for (let i = 0; i < pts.data32S.length; i += 2) {
    points.push({
      x: pts.data32S[i],
      y: pts.data32S[i + 1],
    })
  }

  const sum = points.map((p) => p.x + p.y)
  const diff = points.map((p) => p.x - p.y)

  return [
    points[sum.indexOf(Math.min(...sum))],     // top-left
    points[diff.indexOf(Math.max(...diff))],   // top-right
    points[sum.indexOf(Math.max(...sum))],     // bottom-right
    points[diff.indexOf(Math.min(...diff))],   // bottom-left
  ]
}

/**
 * Apply perspective transform to flatten the document
 */
export function warpDocument(src: any, pts: Point[]): any {
  const [tl, tr, br, bl] = pts

  const widthA = Math.hypot(br.x - bl.x, br.y - bl.y)
  const widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y)
  const maxWidth = Math.round(Math.max(widthA, widthB))

  const heightA = Math.hypot(tr.x - br.x, tr.y - br.y)
  const heightB = Math.hypot(tl.x - bl.x, tl.y - bl.y)
  const maxHeight = Math.round(Math.max(heightA, heightB))

  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    maxWidth - 1, 0,
    maxWidth - 1, maxHeight - 1,
    0, maxHeight - 1,
  ])

  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x, tl.y,
    tr.x, tr.y,
    br.x, br.y,
    bl.x, bl.y,
  ])

  const M = cv.getPerspectiveTransform(srcTri, dstTri)
  const dsize = new cv.Size(maxWidth, maxHeight)
  const warped = new cv.Mat()

  cv.warpPerspective(src, warped, M, dsize)

  srcTri.delete()
  dstTri.delete()
  M.delete()

  return warped
}

/**
 * Draw detected polygon overlay on canvas
 */
export function drawContour(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  stable: boolean,
  scaleX: number = 1,
  scaleY: number = 1
) {
  ctx.strokeStyle = stable ? "#00C773" : "#FFFFFF"
  ctx.lineWidth = 3

  ctx.beginPath()
  ctx.moveTo(pts[0].x * scaleX, pts[0].y * scaleY)

  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x * scaleX, pts[i].y * scaleY)
  }

  ctx.closePath()
  ctx.stroke()
}

/**
 * Stability tracker for auto-capture
 */
export function createStabilityTracker(threshold: number = 20, requiredFrames: number = 10) {
  let lastPts: Point[] | null = null
  let stableFrames = 0

  return {
    check(currentPts: Point[]): boolean {
      if (!lastPts) {
        lastPts = currentPts
        return false
      }

      const diff = currentPts.reduce((acc, p, i) => {
        return acc + Math.abs(p.x - lastPts![i].x) + Math.abs(p.y - lastPts![i].y)
      }, 0)

      lastPts = currentPts

      if (diff < threshold) {
        stableFrames++
      } else {
        stableFrames = 0
      }

      return stableFrames > requiredFrames
    },
    reset() {
      lastPts = null
      stableFrames = 0
    },
  }
}

/**
 * Check if OpenCV.js is loaded and ready
 */
export function isOpenCvReady(): boolean {
  return typeof cv !== "undefined" && typeof cv.Mat !== "undefined"
}

/**
 * Convert OpenCV Mat to base64 JPEG
 */
export function matToBase64(mat: any): string {
  const canvas = document.createElement("canvas")
  canvas.width = mat.cols
  canvas.height = mat.rows
  cv.imshow(canvas, mat)
  return canvas.toDataURL("image/jpeg", 0.9)
}
