import { useState } from "react"
import { ArrowLeft as ArrowBackIcon, Camera as CameraAltIcon, ChevronDown as ExpandMoreIcon } from "lucide-react"
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
  const [nationality, setNationality] = useState("")
  const [residenceStatus, setResidenceStatus] = useState("")

  const isFormComplete = frontImage && (!needsBack || backImage) && nationality && residenceStatus

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center h-14 px-4 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-slate-900 mr-8">신분증 촬영</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Front */}
        <div className="mb-6">
          <p className="font-bold text-slate-900 mb-3">앞면</p>
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
        {needsBack && <div className="mb-6">
          <p className="font-bold text-slate-900 mb-3">뒷면</p>
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

        {/* 국적 */}
        <div className="mb-4">
          <p className="font-bold text-slate-900 mb-2">국적</p>
          <div className="relative">
            <select
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
        <div className="mb-6">
          <p className="font-bold text-slate-900 mb-2">체류자격</p>
          <input
            type="text"
            value={residenceStatus}
            onChange={(e) => setResidenceStatus(e.target.value)}
            placeholder="체류자격 입력"
            className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-sm text-slate-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Bottom button */}
      <div className="px-4 py-6 shrink-0">
        <Button
          variant={isFormComplete ? "primary" : "primaryDisabled"}
          size="full"
          disabled={!isFormComplete}
          onClick={onConfirm}
        >
          다음
        </Button>
      </div>

    </div>
  )
}
