import { useState, useEffect } from "react"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import CameraAltIcon from "@mui/icons-material/CameraAlt"
import { Button } from "@/components/ui/button"

interface IdCardPreviewProps {
  frontImage: string | null
  backImage: string | null
  needsBack?: boolean
  onTakeBack: () => void
  onRetakeFront: () => void
  onRetakeBack: () => void
  onConfirm: () => void
  onClose: () => void
}

export function IdCardPreview({
  frontImage,
  backImage,
  needsBack = true,
  onTakeBack,
  onRetakeFront,
  onRetakeBack,
  onConfirm,
  onClose,
}: IdCardPreviewProps) {
  const [showBackGuide, setShowBackGuide] = useState(false)

  // Show back guide dialog after front photo is taken (only if back is needed)
  useEffect(() => {
    if (needsBack && frontImage && !backImage) {
      const timer = setTimeout(() => setShowBackGuide(true), 500)
      return () => clearTimeout(timer)
    }
  }, [needsBack, frontImage, backImage])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-4 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Front */}
        <div className="mb-8">
          <p className="text-center font-bold text-slate-900 mb-3">앞면</p>
          {frontImage ? (
            <div className="relative">
              <img
                src={frontImage}
                alt="신분증 앞면"
                className="w-full rounded-lg bg-gray-200 object-cover"
                style={{ aspectRatio: "85.6 / 53.98" }}
              />
              <button
                onClick={onRetakeFront}
                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full"
              >
                다시 촬영
              </button>
            </div>
          ) : (
            <div
              className="w-full rounded-lg bg-gray-200"
              style={{ aspectRatio: "85.6 / 53.98" }}
            />
          )}
        </div>

        {/* Back */}
        {needsBack && <div className="mb-8">
          <p className="text-center font-bold text-slate-900 mb-3">뒷면</p>
          {backImage ? (
            <div className="relative">
              <img
                src={backImage}
                alt="신분증 뒷면"
                className="w-full rounded-lg bg-gray-200 object-cover"
                style={{ aspectRatio: "85.6 / 53.98" }}
              />
              <button
                onClick={onRetakeBack}
                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full"
              >
                다시 촬영
              </button>
            </div>
          ) : (
            <button
              onClick={onTakeBack}
              className="w-full rounded-lg bg-gray-200 flex flex-col items-center justify-center"
              style={{ aspectRatio: "85.6 / 53.98" }}
            >
              <CameraAltIcon className="h-8 w-8 text-gray-400 mb-1" />
              <span className="text-sm text-gray-400">뒷면 촬영</span>
            </button>
          )}
        </div>}
      </div>

      {/* Bottom button */}
      {frontImage && (!needsBack || backImage) && (
        <div className="px-4 pb-8 pt-4 shrink-0">
          <Button variant="primary" size="full" onClick={onConfirm}>
            등록 완료
          </Button>
        </div>
      )}

      {/* Back guide dialog */}
      {needsBack && showBackGuide && !backImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBackGuide(false)} />
          <div className="relative bg-white rounded-2xl w-[90%] max-w-sm mx-auto overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center">
              <p className="text-lg font-bold text-slate-900 mb-1">앞면 촬영 완료</p>
              <p className="text-sm text-slate-500">이제 신분증의 뒷면을 촬영해주세요.</p>
            </div>
            <div className="px-6 pb-6">
              <Button
                variant="primary"
                size="full"
                onClick={() => {
                  setShowBackGuide(false)
                  onTakeBack()
                }}
              >
                뒷면 촬영하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
