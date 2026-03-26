import { useState } from "react"
import { CameraView } from "./CameraView"
import { PreviewView } from "./PreviewView"

interface DocumentCaptureProps {
  /** Called with the final base64 JPEG image when user confirms */
  onConfirm: (imageBase64: string) => void
  /** Called when user closes / cancels the capture flow */
  onClose: () => void
}

type Step = "camera" | "preview"

export function DocumentCapture({ onConfirm, onClose }: DocumentCaptureProps) {
  const [step, setStep] = useState<Step>("camera")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const handleCapture = (imageBase64: string) => {
    setCapturedImage(imageBase64)
    setStep("preview")
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setStep("camera")
  }

  const handleConfirm = () => {
    if (capturedImage) {
      onConfirm(capturedImage)
    }
  }

  if (step === "camera") {
    return <CameraView onCapture={handleCapture} onClose={onClose} />
  }

  if (step === "preview" && capturedImage) {
    return (
      <PreviewView
        image={capturedImage}
        onRetake={handleRetake}
        onConfirm={handleConfirm}
      />
    )
  }

  return null
}
