import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/ui/progress-bar"
import { Spinner } from "@/components/ui/spinner"
import { uploadDocument, type DocumentType } from "@/lib/profile"
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

export function OnboardingDocumentsPage() {
  const navigate = useNavigate()
  const { showError, showSuccess } = useToast()
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({})
  const [uploading, setUploading] = useState<string | null>(null)

  const handleUpload = (doc: DocumentItem) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*,.pdf"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setUploading(doc.id)
      const result = await uploadDocument(doc.apiType, file)
      setUploading(null)

      if (result.success) {
        setUploaded((prev) => ({ ...prev, [doc.id]: true }))
        showSuccess(`${doc.title} 등록 완료`)
      } else {
        showError(result.error || "업로드에 실패했습니다.")
      }
    }
    input.click()
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
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleUpload(doc)}
              disabled={uploading === doc.id}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white text-left disabled:opacity-60"
            >
              <div>
                <p className="font-bold text-slate-900">{doc.title}</p>
                <p className="text-sm text-slate-500 mt-1">{doc.description}</p>
              </div>
              <div className="flex items-center shrink-0 ml-4">
                {uploading === doc.id ? (
                  <Spinner />
                ) : uploaded[doc.id] ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="flex items-center text-slate-400">
                    <span className="text-sm">등록</span>
                    <ChevronRightIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
            </button>
          ))}
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
    </div>
  )
}
