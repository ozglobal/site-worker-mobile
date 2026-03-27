import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import CameraAltIcon from "@mui/icons-material/CameraAlt"
import { Button } from "@/components/ui/button"
import { IdCardCamera } from "@/components/ui/id-card-capture/IdCardCamera"
import { uploadDocument } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"

export function OnboardingPassportPreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showError } = useToast()
  const state = location.state as { docId?: string; title?: string } | null
  const docId = state?.docId || "passport"

  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null)
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFormComplete = !!frontImageUrl

  // Auto-open camera on first load
  useEffect(() => {
    if (!frontImageUrl) {
      setShowCamera(true)
    }
  }, [])

  const handleCameraCapture = (file: File) => {
    setShowCamera(false)
    if (frontImageUrl) URL.revokeObjectURL(frontImageUrl)
    setFrontFile(file)
    setFrontImageUrl(URL.createObjectURL(file))
  }

  const handleRetake = () => {
    setShowCamera(true)
  }

  const handleSubmit = async () => {
    if (!isFormComplete) return
    setIsSubmitting(true)

    if (frontFile) {
      const result = await uploadDocument("id_card_front", frontFile)
      if (!result.success) {
        showError("업로드에 실패했습니다.")
      }
    }

    setIsSubmitting(false)
    navigate("/onboarding/documents", { replace: true, state: { completed: docId } })
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center h-14 px-4 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-slate-900 mr-8">여권 촬영</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="mb-6">
          <p className="font-bold text-slate-900 mb-3">앞면</p>
          {frontImageUrl ? (
            <div className="relative">
              <img
                src={frontImageUrl}
                alt="여권 앞면"
                className="w-full rounded-lg bg-gray-200 object-cover"
                style={{ aspectRatio: "85.6 / 107.96" }}
              />
              <button
                onClick={handleRetake}
                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full"
              >
                다시 촬영
              </button>
            </div>
          ) : (
            <button
              onClick={handleRetake}
              className="w-full rounded-lg bg-gray-200 flex flex-col items-center justify-center"
              style={{ aspectRatio: "85.6 / 107.96" }}
            >
              <CameraAltIcon className="h-8 w-8 text-gray-400 mb-1" />
              <span className="text-sm text-gray-400">앞면 촬영</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom button */}
      <div className="px-4 py-6 shrink-0">
        <Button
          variant={isFormComplete && !isSubmitting ? "primary" : "primaryDisabled"}
          size="full"
          disabled={!isFormComplete || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "등록 중..." : "등록하기"}
        </Button>
      </div>

      {/* Camera */}
      {showCamera && (
        <IdCardCamera
          side="front"
          title="여권 개인정보면"
          showSide={false}
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}
