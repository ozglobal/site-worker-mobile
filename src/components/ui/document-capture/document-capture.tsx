import { useState } from "react"
import { DocumentCamera } from "./document-camera"
import { PreviewView } from "./preview-view"

interface DocumentCaptureProps {
  /** Called with the final base64 JPEG image when user confirms */
  onConfirm: (imageBase64: string) => void
  /** Called when user closes / cancels the capture flow */
  onClose: () => void
  frameAspect?: "a4" | "card"
  documentLabel?: string
}

type Step = "camera" | "preview"

export function DocumentCapture({ onConfirm, onClose, frameAspect, documentLabel }: DocumentCaptureProps) {
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
    return <DocumentCamera onCapture={handleCapture} onClose={onClose} frameAspect={frameAspect} documentLabel={documentLabel} />
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
