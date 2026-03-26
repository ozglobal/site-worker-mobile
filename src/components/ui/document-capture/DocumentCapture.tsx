import { useState, useCallback } from "react"
import { CameraView } from "./CameraView"
import { CropView } from "./CropView"
import { PreviewView } from "./PreviewView"

interface DocumentCaptureProps {
  title: string
  onConfirm: (file: File) => void
  onClose: () => void
}

type Step = "camera" | "crop" | "preview"

export function DocumentCapture({ title, onConfirm, onClose }: DocumentCaptureProps) {
  const [step, setStep] = useState<Step>("camera")
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)

  const handleCapture = useCallback((imageSrc: string) => {
    setRawImage(imageSrc)
    setStep("crop")
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

  const handleConfirm = useCallback(() => {
    if (!croppedBlob) return
    const file = new File([croppedBlob], `${title}.jpg`, { type: "image/jpeg" })
    onConfirm(file)
  }, [croppedBlob, title, onConfirm])

  const handleBackToCrop = useCallback(() => {
    if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl)
    setCroppedImageUrl(null)
    setCroppedBlob(null)
    setStep("camera")
  }, [croppedImageUrl])

  if (step === "camera") {
    return <CameraView onCapture={handleCapture} onClose={onClose} />
  }

  if (step === "crop" && rawImage) {
    return <CropView imageSrc={rawImage} onCrop={handleCrop} onBack={handleBackToCrop} />
  }

  if (step === "preview" && croppedImageUrl) {
    return <PreviewView title={title} imageUrl={croppedImageUrl} onRetake={handleRetake} onConfirm={handleConfirm} />
  }

  return null
}
