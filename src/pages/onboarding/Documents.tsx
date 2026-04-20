import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import { IconCircleCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/ui/progress-bar"
import { Spinner } from "@/components/ui/spinner"
import { uploadDocument, type DocumentType } from "@/lib/profile"
import { type IdCardType } from "@/components/ui/id-card-upload-dialog"
import { IdCardCamera } from "@/components/ui/id-card-capture/id-card-camera"
import { IdCardPreview } from "@/components/ui/id-card-capture/id-card-preview"
import { DocumentCapture } from "@/components/ui/document-capture/document-capture"
import { useToast } from "@/contexts/ToastContext"
import { workerMetaStorage, type WorkerMeta } from "@/lib/storage"
import { getRequiredDocuments, allDocuments, backendIdTypeToInternal, type DocumentItem } from "@/lib/documents"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"

export function OnboardingDocumentsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showError, showSuccess } = useToast()
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [showDocCapture, setShowDocCapture] = useState(false)
  const [captureDoc, setCaptureDoc] = useState<DocumentItem | null>(null)
  const [idCardType, setIdCardType] = useState<IdCardType | null>(null)
  const [idCardSide, setIdCardSide] = useState<"front" | "back" | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null)
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null)
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  // Capture once at mount so replace-navigations inside the page don't clear it
  const [hideProgress] = useState<boolean>(
    () => (location.state as { hideProgress?: boolean } | null)?.hideProgress === true
  )

  // Resolve which documents to show:
  //   1. If caller explicitly passes docIds, use those (deep-link case).
  //   2. Otherwise derive from effective meta: prefer backend (GET /system/worker/me),
  //      fall back to the localStorage cache.
  const locationState = location.state as { startCapture?: string; completed?: string; docIds?: string[]; hideProgress?: boolean } | null
  const { data: profile } = useWorkerProfile()
  const effectiveMeta: WorkerMeta = {
    ...(workerMetaStorage.get() ?? {}),
    ...(profile?.idType ? { idType: backendIdTypeToInternal(profile.idType) } : {}),
    ...(profile?.wagePaymentTarget === 'SELF' || profile?.wagePaymentTarget === 'PROXY' || profile?.wagePaymentTarget === 'COMPANY'
      ? { wagePaymentTarget: profile.wagePaymentTarget }
      : {}),
  }
  const visibleDocs: DocumentItem[] = locationState?.docIds
    ? allDocuments.filter((d) => locationState.docIds!.includes(d.id))
    : getRequiredDocuments(effectiveMeta)

  // Handle return from capture guide page or auto-start capture
  useEffect(() => {
    const state = location.state as { startCapture?: string; completed?: string } | null
    if (state?.startCapture === "id-card") {
      setIdCardType("id_card")
      setIdCardSide("front")
      setShowCamera(true)
      navigate(location.pathname, { replace: true, state: null })
    } else if (state?.startCapture) {
      const doc = allDocuments.find((d) => d.id === state.startCapture)
      if (doc) {
        setCaptureDoc(doc)
        setShowDocCapture(true)
        navigate(location.pathname, { replace: true, state: null })
      }
    }
    if (state?.completed === "id-card") {
      setUploaded((prev) => ({ ...prev, "id-card-front": true, "id-card-back": true }))
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, navigate, location.pathname])

  const uploadFile = async (documentType: DocumentType, label: string, trackId: string, file: File): Promise<boolean> => {
    setUploading(trackId)
    const result = await uploadDocument(documentType, file)
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
    setCaptureDoc(doc)
    setShowDocCapture(true)
  }

  const handleDocCaptureConfirm = async (imageBase64: string) => {
    if (!captureDoc) return
    setShowDocCapture(false)
    setUploading(captureDoc.id)

    // Convert base64 to File
    const res = await fetch(imageBase64)
    const blob = await res.blob()
    const file = new File([blob], `${captureDoc.id}.jpg`, { type: "image/jpeg" })

    const result = await uploadDocument(captureDoc.apiType, file)
    setUploading(null)
    if (result.success) {
      setUploaded((prev) => ({ ...prev, [captureDoc.id]: true }))
      showSuccess(`${captureDoc.title} 등록 완료`)
    } else {
      showError("업로드에 실패했습니다.")
    }
    setCaptureDoc(null)
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
      <div className="flex items-center px-4 h-14 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Progress bar (hidden when accessed from profile) */}
      {!hideProgress && <ProgressBar value={60} />}

      {/* Title */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="text-lg font-bold text-slate-900">필수 서류를 등록해주세요</h1>
        <p className="mt-1 text-sm text-gray-500">각 항목을 눌러 사진을 촬영하거나 이미지 파일을 업로드해주세요.</p>
      </div>

      {/* Document cards */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-3">
          {visibleDocs.map((doc) => {
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
                  {doc.description && <p className="text-sm text-slate-500 mt-1">{doc.description}</p>}
                </div>
                <div className="flex items-center shrink-0 ml-4">
                  {isUploading ? (
                    <Spinner />
                  ) : isComplete ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <IconCircleCheck className="h-5 w-5" stroke={1.5} />
                      <span className="text-sm font-medium">제출 완료</span>
                    </div>
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
      <div className="px-4 py-6 flex gap-3 shrink-0">
        <Button
          variant="outline"
          size="full"
          className="flex-1 bg-gray-100 border-0 text-slate-900 hover:bg-gray-200"
          onClick={handleRegisterLater}
        >
          나중에 하기
        </Button>
        <Button
          variant="primary"
          size="full"
          className="flex-1"
          onClick={handleComplete}
        >
          다음
        </Button>
      </div>

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

      {showDocCapture && captureDoc && (
        <DocumentCapture
          onConfirm={handleDocCaptureConfirm}
          onClose={() => { setShowDocCapture(false); setCaptureDoc(null) }}
        />
      )}
    </div>
  )
}
