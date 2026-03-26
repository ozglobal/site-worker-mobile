import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function OnboardingDocumentCaptureGuideIdcardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { docId?: string; title?: string } | null
  const docTitle = state?.title || "신분증"

  const steps = [
    `가이드 영역에 맞추어 반드시 ${docTitle} 원본으로 촬영해주세요.`,
    `${docTitle} 표면에 빛이 반사되지 않도록 주의해주세요.`,
    "훼손이 심하거나 알아보기 어려운 사진의 경우 다시 제출해야할 수 있습니다.",
  ]

  const handleCapture = () => {
    let route = "/onboarding/documents/id-card-preview"
    if (state?.title === "주민등록증") {
      route = "/onboarding/documents/id-card-preview-kr"
    } else if (state?.title === "여권") {
      route = "/onboarding/documents/passport-preview"
    }
    navigate(route, {
      replace: true,
      state: { docId: state?.docId, title: state?.title },
    })
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* ID Card Illustration */}
        <div className="mb-6">
          <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
            <rect x="5" y="10" width="110" height="70" rx="8" fill="#E8F0FE" stroke="#B8D4F0" strokeWidth="1.5" />
            <rect x="0" y="0" width="110" height="70" rx="8" fill="#F0F6FF" stroke="#B8D4F0" strokeWidth="1.5" />
            <circle cx="35" cy="30" r="12" fill="#B8D4F0" />
            <path d="M25 50C25 44.477 29.477 40 35 40C40.523 40 45 44.477 45 50V52H25V50Z" fill="#B8D4F0" />
            <rect x="55" y="25" width="40" height="4" rx="2" fill="#B8D4F0" />
            <rect x="55" y="35" width="30" height="4" rx="2" fill="#D4E4F4" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-slate-900 mb-2">{docTitle} 촬영</h1>
        <p className="text-sm text-gray-500 mb-8">본인의 {docTitle}을 준비해주세요.</p>

        {/* Instruction Box */}
        <div className="w-full bg-gray-50 rounded-xl p-5 space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="px-4 py-6">
        <Button variant="primary" size="full" onClick={handleCapture}>
          {docTitle} 촬영
        </Button>
      </div>
    </div>
  )
}
