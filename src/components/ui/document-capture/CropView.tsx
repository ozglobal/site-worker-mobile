import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import type { Point, Area } from "react-easy-crop"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { Button } from "@/components/ui/button"
import { cropImage } from "./cropImage"

interface CropViewProps {
  imageSrc: string
  onCrop: (url: string, blob: Blob) => void
  onBack: () => void
}

const A4_ASPECT = 1 / 1.414

export function CropView({ imageSrc, onCrop, onBack }: CropViewProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return
    const blob = await cropImage(imageSrc, croppedAreaPixels)
    const url = URL.createObjectURL(blob)
    onCrop(url, blob)
  }, [imageSrc, croppedAreaPixels, onCrop])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center h-14 px-4 shrink-0 bg-black">
        <button onClick={onBack} className="p-2 -ml-2 text-white">
          <ArrowBackIcon className="h-6 w-6" />
        </button>
        <span className="flex-1 text-center text-white font-medium mr-8">촬영 완료</span>
      </div>

      {/* Crop area */}
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={A4_ASPECT}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={false}
        />
      </div>

      {/* Bottom */}
      <div className="bg-black px-4 py-6">
        <Button variant="primary" size="full" onClick={handleConfirm}>
          확인
        </Button>
      </div>
    </div>
  )
}
