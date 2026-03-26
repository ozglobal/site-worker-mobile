export async function startCamera(video: HTMLVideoElement) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false,
  })
  video.srcObject = stream
  await video.play()
  return stream
}

export function stopCamera(stream?: MediaStream) {
  stream?.getTracks().forEach((t) => t.stop())
}