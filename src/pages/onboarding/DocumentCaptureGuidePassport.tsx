import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function OnboardingDocumentCaptureGuidePassportPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { docId?: string; title?: string } | null

  const handleCapture = () => {
    navigate("/onboarding/documents/passport-preview", {
      replace: true,
      state: { docId: state?.docId, title: state?.title },
    })
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-12 pb-6 text-center">
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
        <Button variant="primary" size="full" onClick={handleCapture}>
          여권 촬영
        </Button>
      </div>
    </div>
  )
}
