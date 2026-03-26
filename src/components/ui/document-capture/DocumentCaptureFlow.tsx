import { useState, useCallback } from "react"
import { CameraView } from "./CameraView"
import { CropView } from "./CropView"
import { PreviewView } from "./PreviewView"

interface DocumentCaptureFlowProps {
  title: string
  onConfirm: (file: File) => void
  onClose: () => void
}

type Step = "camera" | "crop" | "preview"

export function DocumentCaptureFlow({ title, onConfirm, onClose }: DocumentCaptureFlowProps) {
  const [step, setStep] = useState<Step>("camera")
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)

  const handleCapture = useCallback((base64: string) => {
    setRawImage(base64)
    setStep("preview")
  }, [])

  const handleCrop = useCallback((url: string, blob: Blob) => {
    setCroppedImageUrl(url)
    setCroppedBlob(blob)
    setStep("preview")
  }, [])

  const handleRetake = useCallback(() => {
    if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl)
    setRawImage(null)
    setCroppedImageUrl(null)
    setCroppedBlob(null)
    setStep("camera")
  }, [croppedImageUrl])

  const handleAdjust = useCallback(() => {
    if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl)
    setCroppedImageUrl(null)
    setCroppedBlob(null)
    if (rawImage) {
      setStep("crop")
    }
  }, [croppedImageUrl, rawImage])

  const handleConfirm = useCallback(() => {
    const blob = croppedBlob
    const src = croppedImageUrl || rawImage
    if (blob) {
      const file = new File([blob], `${title}.jpg`, { type: "image/jpeg" })
      onConfirm(file)
    } else if (src) {
      // Convert base64 to file
      fetch(src)
        .then((res) => res.blob())
        .then((b) => {
          const file = new File([b], `${title}.jpg`, { type: "image/jpeg" })
          onConfirm(file)
        })
    }
  }, [croppedBlob, croppedImageUrl, rawImage, title, onConfirm])

  if (step === "camera") {
    return <CameraView onCapture={handleCapture} />
  }

  if (step === "crop" && rawImage) {
    return <CropView imageSrc={rawImage} onCrop={handleCrop} onBack={handleRetake} />
  }

  if (step === "preview" && (croppedImageUrl || rawImage)) {
    return (
      <PreviewView
        image={(croppedImageUrl || rawImage)!}
        onRetake={handleRetake}
        onConfirm={handleConfirm}
        onAdjust={handleAdjust}
      />
    )
  }

  return null
}
