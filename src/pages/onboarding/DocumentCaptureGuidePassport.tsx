import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { Button } from "@/components/ui/button"
import { DocumentCapture } from "@/components/ui/document-capture/DocumentCapture"
import { uploadDocument } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"

export function OnboardingDocumentCaptureGuidePassportPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showSuccess, showError } = useToast()
  const state = location.state as { docId?: string; title?: string } | null
  const [showCapture, setShowCapture] = useState(false)

  const handleConfirm = async (imageBase64: string) => {
    setShowCapture(false)

    const res = await fetch(imageBase64)
    const blob = await res.blob()
    const file = new File([blob], "passport.jpg", { type: "image/jpeg" })

    const result = await uploadDocument("id_card_front", file)
    if (result.success) {
      showSuccess("여권 등록 완료")
    } else {
      showError("업로드에 실패했습니다.")
    }
    navigate("/onboarding/documents", { replace: true, state: { completed: state?.docId } })
  }

  if (showCapture) {
    return (
      <DocumentCapture
        onConfirm={handleConfirm}
        onClose={() => setShowCapture(false)}
      />
    )
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center h-14 px-4 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-4 pb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">여권 개인정보면 촬영</h1>
          <p className="text-sm text-gray-500">여권의 개인정보면 전체가 잘 보이도록 놓고 촬영해주세요</p>
        </div>

        <div className="px-6 text-center">
          <p className="text-sm text-gray-400 mb-3">촬영 예시</p>
          <img
            src="/images/passport-image.png"
            alt="여권 촬영 예시"
            className="w-full rounded-xl border border-gray-200"
          />
        </div>
      </div>

      {/* Bottom Button */}
      <div className="px-4 py-6">
        <Button variant="primary" size="full" onClick={() => setShowCapture(true)}>
          여권 촬영
        </Button>
      </div>
    </div>
  )
}
