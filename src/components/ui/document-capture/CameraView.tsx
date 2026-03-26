import { useEffect, useRef, useState } from "react"

interface Props {
  onCapture: (base64: string) => void
}

export function CameraView({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [status, setStatus] = useState<string>("문서를 화면 안에 맞춰주세요")
  const [progress, setProgress] = useState<number>(0)
  const [countdown, setCountdown] = useState<number | null>(null)

  const stableRef = useRef<number>(0)
  const runningRef = useRef<boolean>(true)
  const lastRunRef = useRef<number>(0)

  const STABLE_THRESHOLD = 8
  const FPS = 10

  useEffect(() => {
    startCamera()
    return stopCamera
  }, [])

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    })

    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    }

    requestAnimationFrame(loop)
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((t) => t.stop())
  }

  const loop = (time: number) => {
    if (!runningRef.current) return

    if (time - lastRunRef.current > 1000 / FPS) {
      lastRunRef.current = time
      detect()
    }

    requestAnimationFrame(loop)
  }

  // 🔁 Replace with OpenCV detection
  const detect = () => {
    const detected = true
    const stable = Math.random() > 0.3

    if (!detected) {
      setStatus("문서를 화면 안에 맞춰주세요")
      stableRef.current = 0
      setProgress(0)
      return
    }

    if (!stable) {
      setStatus("좋아요! 조금만 더 가까이")
      stableRef.current = 0
      setProgress(0)
      return
    }

    stableRef.current++
    setProgress((stableRef.current / STABLE_THRESHOLD) * 100)
    setStatus("움직이지 마세요")

    if (stableRef.current >= STABLE_THRESHOLD) {
      startCountdown()
    }
  }

  const startCountdown = () => {
    runningRef.current = false
    navigator.vibrate?.(50)

    let count = 3
    setCountdown(count)

    const tick = () => {
      count--
      if (count === 0) {
        capture()
      } else {
        setCountdown(count)
        setTimeout(tick, 300)
      }
    }

    setTimeout(tick, 300)
  }

  const capture = () => {
    navigator.vibrate?.([50, 30, 80])

    const canvas = canvasRef.current!
    const video = videoRef.current!

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")!
    ctx.filter = "contrast(1.1) brightness(1.05)"
    ctx.drawImage(video, 0, 0)

    const base64 = canvas.toDataURL("image/jpeg", 0.85)
    onCapture(base64)
  }

  return (
    <div className="fixed inset-0 bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute inset-0 flex flex-col justify-between text-white">
        <div className="text-center mt-10 text-sm">{status}</div>

        <div className="flex justify-center">
          <div className="w-40 h-1 bg-white/20 rounded">
            <div
              className="h-full bg-green-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {countdown !== null && (
          <div className="text-center text-6xl mb-20 animate-pulse">
            {countdown}
          </div>
        )}

        <div className="text-center mb-10 text-xs opacity-70">
          자동으로 촬영됩니다
        </div>
      </div>
    </div>
  )
}