/**
 * Crop a video frame to the specified frame rectangle.
 * Returns a base64 JPEG string.
 */
export function cropToFrame(
  video: HTMLVideoElement,
  frameRect: { x: number; y: number; width: number; height: number },
  viewportWidth: number,
  viewportHeight: number,
  quality = 0.92
): string {
  const videoW = video.videoWidth
  const videoH = video.videoHeight

  // Scale factor from viewport (CSS) coordinates to actual video resolution
  const scaleX = videoW / viewportWidth
  const scaleY = videoH / viewportHeight

  const sx = frameRect.x * scaleX
  const sy = frameRect.y * scaleY
  const sw = frameRect.width * scaleX
  const sh = frameRect.height * scaleY

  const canvas = document.createElement("canvas")
  canvas.width = Math.round(sw)
  canvas.height = Math.round(sh)

  const ctx = canvas.getContext("2d")!
  ctx.drawImage(
    video,
    Math.round(sx),
    Math.round(sy),
    Math.round(sw),
    Math.round(sh),
    0,
    0,
    canvas.width,
    canvas.height
  )

  return canvas.toDataURL("image/jpeg", quality)
}
