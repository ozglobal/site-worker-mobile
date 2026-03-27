import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import CameraAltIcon from "@mui/icons-material/CameraAlt"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { Button } from "@/components/ui/button"
import { IdCardCamera } from "@/components/ui/id-card-capture/IdCardCamera"
import { uploadDocument } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"

export function OnboardingIdCardPreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showError, showSuccess } = useToast()
  const state = location.state as { docId?: string; title?: string; frontImageUrl?: string; frontFile?: string } | null
  const docId = state?.docId || "id-card"
  const docTitle = state?.title || "신분증"

  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(state?.frontImageUrl || null)
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null)
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [nationality, setNationality] = useState("")
  const [residenceStatus, setResidenceStatus] = useState("")
  const [permitDate, setPermitDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  const [cameraSide, setCameraSide] = useState<"front" | "back">("front")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nationalityRef = useRef<HTMLSelectElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isFormComplete = frontImageUrl && backImageUrl && nationality && residenceStatus && permitDate && expiryDate

  // Auto-open camera for front side on first load
  useEffect(() => {
    if (!frontImageUrl) {
      setCameraSide("front")
      setShowCamera(true)
    }
  }, [])

  const handleCameraCapture = (file: File) => {
    setShowCamera(false)
    const url = URL.createObjectURL(file)
    if (cameraSide === "front") {
      if (frontImageUrl) URL.revokeObjectURL(frontImageUrl)
      setFrontFile(file)
      setFrontImageUrl(url)
    } else {
      if (backImageUrl) URL.revokeObjectURL(backImageUrl)
      setBackFile(file)
      setBackImageUrl(url)
      setTimeout(() => {
        contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: "smooth" })
        nationalityRef.current?.focus()
      }, 300)
    }
  }

  const handleRetakeFront = () => {
    setCameraSide("front")
    setShowCamera(true)
  }

  const handleTakeBack = () => {
    setCameraSide("back")
    setShowCamera(true)
  }

  const handleRetakeBack = () => {
    setCameraSide("back")
    setShowCamera(true)
  }

  const handleSubmit = async () => {
    if (!isFormComplete) return
    setIsSubmitting(true)

    if (frontFile) {
      const result = await uploadDocument("id_card_front", frontFile)
      if (!result.success) {
        showError("앞면 업로드에 실패했습니다.")
      }
    }
    if (backFile) {
      const result = await uploadDocument("id_card_back", backFile)
      if (!result.success) {
        showError("뒷면 업로드에 실패했습니다.")
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
        <h1 className="flex-1 text-center text-base font-semibold text-slate-900 mr-8">{docTitle} 촬영</h1>
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-4">
        {/* Front */}
        <div className="mb-6">
          <p className="font-bold text-slate-900 mb-3">앞면</p>
          {frontImageUrl ? (
            <div className="relative">
              <img
                src={frontImageUrl}
                alt="신분증 앞면"
                className="w-full rounded-lg bg-gray-200 object-cover"
                style={{ aspectRatio: "85.6 / 58" }}
              />
              <button
                onClick={handleRetakeFront}
                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full"
              >
                다시 촬영
              </button>
            </div>
          ) : (
            <button
              onClick={handleRetakeFront}
              className="w-full rounded-lg bg-gray-200 flex flex-col items-center justify-center"
              style={{ aspectRatio: "85.6 / 58" }}
            >
              <CameraAltIcon className="h-8 w-8 text-gray-400 mb-1" />
              <span className="text-sm text-gray-400">앞면 촬영</span>
            </button>
          )}
        </div>

        {/* Back */}
        <div className="mb-6">
          <p className="font-bold text-slate-900 mb-3">뒷면</p>
          {backImageUrl ? (
            <div className="relative">
              <img
                src={backImageUrl}
                alt="신분증 뒷면"
                className="w-full rounded-lg bg-gray-200 object-cover"
                style={{ aspectRatio: "85.6 / 58" }}
              />
              <button
                onClick={handleRetakeBack}
                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full"
              >
                다시 촬영
              </button>
            </div>
          ) : (
            <button
              onClick={handleTakeBack}
              className="w-full rounded-lg bg-gray-200 flex flex-col items-center justify-center"
              style={{ aspectRatio: "85.6 / 58" }}
            >
              <CameraAltIcon className="h-8 w-8 text-gray-400 mb-1" />
              <span className="text-sm text-gray-400">뒷면 촬영</span>
            </button>
          )}
        </div>

        {/* 국적 */}
        <div className="mb-4">
          <p className="font-bold text-slate-900 mb-2">국적</p>
          <div className="relative">
            <select
              ref={nationalityRef}
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full h-12 px-4 pr-10 rounded-lg border border-gray-200 bg-white text-sm text-slate-900 appearance-none"
            >
              <option value="" disabled>국적 선택</option>
              <option value="KR">대한민국</option>
              <option value="CN">중국</option>
              <option value="VN">베트남</option>
              <option value="TH">태국</option>
              <option value="PH">필리핀</option>
              <option value="ID">인도네시아</option>
              <option value="MM">미얀마</option>
              <option value="KH">캄보디아</option>
              <option value="NP">네팔</option>
              <option value="UZ">우즈베키스탄</option>
              <option value="OTHER">기타</option>
            </select>
            <ExpandMoreIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* 체류자격 */}
        <div className="mb-4">
          <p className="font-bold text-slate-900 mb-2">체류자격</p>
          <input
            type="text"
            value={residenceStatus}
            onChange={(e) => setResidenceStatus(e.target.value)}
            placeholder="체류자격 입력"
            className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-sm text-slate-900 placeholder:text-gray-400"
          />
        </div>

        {/* 체류기간 */}
        <div className="mb-6">
          <p className="font-bold text-slate-900 mb-2">체류기간</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={permitDate}
              onChange={(e) => setPermitDate(e.target.value)}
              onFocus={(e) => { e.target.type = "date" }}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text" }}
              placeholder="허가일자"
              className="flex-1 min-w-0 h-12 pl-3 pr-1 rounded-lg border border-gray-200 bg-white text-sm text-slate-900 placeholder:text-gray-400"
            />
            <span className="text-gray-400 shrink-0">~</span>
            <input
              type="text"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              onFocus={(e) => { e.target.type = "date" }}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text" }}
              placeholder="만료일자"
              className="flex-1 min-w-0 h-12 pl-3 pr-1 rounded-lg border border-gray-200 bg-white text-sm text-slate-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Bottom button */}
        <div className="px-4 py-6">
          <Button
            variant={isFormComplete && !isSubmitting ? "primary" : "primaryDisabled"}
            size="full"
            disabled={!isFormComplete || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "등록 중..." : "등록하기"}
          </Button>
        </div>
      </div>

      {/* Camera */}
      {showCamera && (
        <IdCardCamera
          side={cameraSide}
          title={docTitle}
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}
