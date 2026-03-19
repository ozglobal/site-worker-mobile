import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/ui/progress-bar"
import { Spinner } from "@/components/ui/spinner"
import { uploadDocument, type DocumentType } from "@/lib/profile"
import { IdCardTypeDialog, type IdCardType } from "@/components/ui/id-card-upload-dialog"
import { IdCardCamera } from "@/components/ui/IdCardCamera"
import { IdCardPreview } from "@/components/ui/IdCardPreview"
import { useToast } from "@/contexts/ToastContext"

interface DocumentItem {
  id: string
  apiType: DocumentType
  title: string
  description: string
}

const documents: DocumentItem[] = [
  {
    id: "id-card",
    apiType: "id_card_front",
    title: "신분증",
    description: "주민등록증, 외국인등록증 또는 여권",
  },
  {
    id: "business-license",
    apiType: "business_license",
    title: "사업자등록증",
    description: "사업자등록증 사본",
  },
  {
    id: "safety-cert",
    apiType: "safety_cert",
    title: "안전교육이수증",
    description: "건설업 기초안전보건교육",
  },
  {
    id: "bankbook",
    apiType: "bankbook",
    title: "통장사본",
    description: "본인이 입력한 계좌로 직접 지급",
  },
]

export function OnboardingOutsourcingDocumentsPage() {
  const navigate = useNavigate()
  const { showError, showSuccess } = useToast()
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [showIdCardTypeDialog, setShowIdCardTypeDialog] = useState(false)
  const [idCardType, setIdCardType] = useState<IdCardType | null>(null)
  const [idCardSide, setIdCardSide] = useState<"front" | "back" | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null)
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null)
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)

  const pickAndUpload = (documentType: DocumentType, label: string, trackId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*,.pdf"
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) { resolve(false); return }
        setUploading(trackId)
        // TODO: uncomment when upload API is ready
        // const result = await uploadDocument(documentType, file)
        const result = { success: true } as const
        setUploading(null)
        if (result.success) {
          setUploaded((prev) => ({ ...prev, [trackId]: true }))
          showSuccess(`${label} 등록 완료`)
          resolve(true)
        } else {
          showError("업로드에 실패했습니다.")
          resolve(false)
        }
      }
      input.click()
    })
  }

  const uploadFile = async (documentType: DocumentType, label: string, trackId: string, file: File): Promise<boolean> => {
    setUploading(trackId)
    // TODO: uncomment when upload API is ready
    // const result = await uploadDocument(documentType, file)
    const result = { success: true } as const
    setUploading(null)
    if (result.success) {
      setUploaded((prev) => ({ ...prev, [trackId]: true }))
      showSuccess(`${label} 등록 완료`)
      return true
    } else {
      showError("업로드에 실패했습니다.")
      return false
    }
  }

  const handleIdCardTypeSelect = (type: IdCardType) => {
    setShowIdCardTypeDialog(false)
    setIdCardType(type)
    setIdCardSide("front")
    setShowCamera(true)
  }

  const handleCameraCapture = (file: File) => {
    const side = idCardSide!
    setShowCamera(false)
    const url = URL.createObjectURL(file)
    if (side === "front") {
      setFrontFile(file)
      setFrontImageUrl(url)
    } else {
      setBackFile(file)
      setBackImageUrl(url)
    }
    setIdCardSide(null)
    setShowPreview(true)
  }

  const handlePreviewConfirm = async () => {
    setShowPreview(false)
    if (frontFile) {
      await uploadFile("id_card_front", "신분증(앞면)", "id-card-front", frontFile)
    }
    if (backFile) {
      await uploadFile("id_card_back", "신분증(뒷면)", "id-card-back", backFile)
    }
    setFrontFile(null)
    setBackFile(null)
    setFrontImageUrl(null)
    setBackImageUrl(null)
  }

  const handlePreviewClose = () => {
    setShowPreview(false)
    setFrontFile(null)
    setBackFile(null)
    if (frontImageUrl) URL.revokeObjectURL(frontImageUrl)
    if (backImageUrl) URL.revokeObjectURL(backImageUrl)
    setFrontImageUrl(null)
    setBackImageUrl(null)
  }

  const handleUpload = async (doc: DocumentItem) => {
    if (doc.id === "id-card") {
      setShowIdCardTypeDialog(true)
    } else {
      await pickAndUpload(doc.apiType, doc.title, doc.id)
    }
  }

  const handleRegisterLater = () => {
    navigate("/home")
  }

  const handleComplete = () => {
    navigate("/home")
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header with back button */}
      <div className="flex items-center px-4 py-4 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar value={60} className="mb-6" />

      {/* Title */}
      <div className="px-4 mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">필수 서류를 등록해주세요</h1>
        <p className="text-slate-500">각 항목을 눌러 사진을 촬영하거나 파일을 업로드해주세요.</p>
      </div>

      {/* Document cards */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-3">
          {documents.map((doc) => {
            const isIdCard = doc.id === "id-card"
            const isUploading = isIdCard
              ? uploading === "id-card-front" || uploading === "id-card-back"
              : uploading === doc.id
            const isComplete = isIdCard
              ? uploaded["id-card-front"] && uploaded["id-card-back"]
              : uploaded[doc.id]

            return (
              <button
                key={doc.id}
                onClick={() => handleUpload(doc)}
                disabled={!!isUploading}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white text-left disabled:opacity-60"
              >
                <div>
                  <p className="font-bold text-slate-900">{doc.title}</p>
                  <p className="text-sm text-slate-500 mt-1">{doc.description}</p>
                </div>
                <div className="flex items-center shrink-0 ml-4">
                  {isUploading ? (
                    <Spinner />
                  ) : isComplete ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="flex items-center text-slate-400">
                      <span className="text-sm">등록</span>
                      <ChevronRightIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-4 pb-8 pt-4 space-y-3 shrink-0">
        <Button variant="neutral" size="full" onClick={handleRegisterLater}>
          나중에 등록하기
        </Button>
        <Button variant="primary" size="full" onClick={handleComplete}>
          등록 완료하기
        </Button>
      </div>

      {showIdCardTypeDialog && (
        <IdCardTypeDialog
          onSelect={handleIdCardTypeSelect}
          onCancel={() => setShowIdCardTypeDialog(false)}
        />
      )}

      {showCamera && idCardSide && (
        <IdCardCamera
          side={idCardSide}
          onCapture={handleCameraCapture}
          onClose={() => { setShowCamera(false); setIdCardSide(null); setShowPreview(!!frontImageUrl) }}
        />
      )}

      {showPreview && (
        <IdCardPreview
          frontImage={frontImageUrl}
          backImage={backImageUrl}
          needsBack={idCardType === "id_card"}
          onTakeBack={() => { setShowPreview(false); setIdCardSide("back"); setShowCamera(true) }}
          onRetakeFront={() => { setShowPreview(false); setIdCardSide("front"); setShowCamera(true) }}
          onRetakeBack={() => { setShowPreview(false); setIdCardSide("back"); setShowCamera(true) }}
          onConfirm={handlePreviewConfirm}
          onClose={handlePreviewClose}
        />
      )}
    </div>
  )
}
