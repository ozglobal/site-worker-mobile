import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { StatusListItem, type StatusType } from "@/components/ui/status-list-item"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { ChevronRight as ChevronRightIcon } from "lucide-react"
import { DocumentCapture } from "@/components/ui/document-capture/document-capture"
import { CaptureGuideIdcard } from "@/components/ui/document-capture/CaptureGuideIdcard"
import { CaptureGuidePassport } from "@/components/ui/id-card-capture/CaptureGuidePassport"
import { CaptureGuideBankbook } from "@/components/ui/id-card-capture/CaptureGuideBankbook"
import { useDocumentSummary } from "@/lib/queries/useDocumentSummary"
import { usePendingSignDocuments } from "@/lib/queries/usePendingSignDocuments"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { useToast } from "@/contexts/ToastContext"
import { requiredDocsCatalogue, type RequiredDocMeta } from "@/lib/documents"
import {
  uploadIdCardDoc,
  uploadBankbookDoc,
  uploadSafetyCertDoc,
  uploadFamilyRelationDoc,
  uploadBusinessLicenseDoc,
  uploadHealthCheckupDoc,
} from "@/lib/profile"
import type { ApiResult } from "@/lib/api-result"

const ALIEN_REG_CODES = new Set(["alien_reg", "alien_reg_front", "alien_reg_back"])

function mapStatus(status: string | undefined): { status: StatusType; label: string } {
  switch ((status || "").toUpperCase()) {
    case "APPROVED":
    case "COMPLETED":
      return { status: "complete", label: "제출 완료" }
    case "PENDING":
    case "UNDER_REVIEW":
      return { status: "pending", label: "승인 대기" }
    case "REJECTED":
    case "ERROR":
      return { status: "error", label: "반려" }
    default:
      return { status: "incomplete", label: "미제출" }
  }
}

const badgeClassFor = (status: StatusType): string => {
  switch (status) {
    case "complete":
      return "bg-green-50 text-green-600"
    case "pending":
      return "bg-blue-50 text-blue-600"
    case "error":
      return "bg-red-50 text-red-600"
    default:
      return "bg-slate-50 text-slate-500"
  }
}

export function ProfileDocumentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showInfo } = useToast()
  const { data: summary, isLoading, isError, refetch } = useDocumentSummary()
  const { data: profile } = useWorkerProfile()
  // Fire-and-forget: surfaces any eformsign documents the worker still needs
  // to sign. Payload consumed elsewhere once the UI for it is designed.
  usePendingSignDocuments()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingCodeRef = useRef<string | null>(null)
  const [uploadingCode, setUploadingCode] = useState<string | null>(null)
  const [captureCode, setCaptureCode] = useState<string | null>(null)
  const [guideCode, setGuideCode] = useState<string | null>(null)

  const handleNavigation = useBottomNavHandler()

  const docs = (summary || []).map((item) => {
    const catalogue: RequiredDocMeta | undefined = requiredDocsCatalogue[item.code]
    return {
      code: item.code,
      label: item.label || catalogue?.label || item.code,
      method: item.method || catalogue?.method || "upload",
      status: item.status,
      state: item.state,
    }
  })

  const dispatchUpload = async (code: string, file: File): Promise<ApiResult<void>> => {
    switch (code) {
      case "id_card":
        return uploadIdCardDoc(file)
      case "bankbook":
        return uploadBankbookDoc({
          file,
          accountHolder: profile?.accountHolder || profile?.workerName || undefined,
          bankName: profile?.bankName || undefined,
          bankAccount: profile?.bankAccount || undefined,
        })
      case "safety_cert":
        return uploadSafetyCertDoc(file)
      case "family_relation":
        return uploadFamilyRelationDoc(file)
      case "business_license":
        return uploadBusinessLicenseDoc(file)
      case "health_checkup":
        return uploadHealthCheckupDoc(file)
      default:
        return {
          success: false,
          error: `No single-file upload flow for "${code}" — needs a dedicated form page.`,
        }
    }
  }

  const viewerSlugByCode: Record<string, string> = {
    id_card: "id-card",
    bankbook: "bankbook",
    family_relation: "family-relation",
    safety_cert: "safety-cert",
  }

  const runUpload = async (code: string, file: File) => {
    setUploadingCode(code)
    const result = await dispatchUpload(code, file)
    setUploadingCode(null)

    if (!result.success) {
      showError(result.error)
      return
    }
    const label = docs.find((d) => d.code === code)?.label || code
    showSuccess(`[${label}] 제출되었습니다.`)
    queryClient.invalidateQueries({ queryKey: ["documentSummary"] })
    queryClient.invalidateQueries({ queryKey: ["workerProfile"] })
  }

  const handleView = (code: string) => {
    if (ALIEN_REG_CODES.has(code)) {
      navigate("/profile/documents/alien-reg")
      return
    }
    const slug = viewerSlugByCode[code]
    if (slug) {
      navigate(`/profile/documents/view/${slug}`)
      return
    }
    showInfo("미리보기는 준비 중입니다.")
  }

  // "사진 촬영" — opens the capture guide, then the camera.
  const handleCapture = (code: string, method: string) => {
    if (uploadingCode) return
    if (method === "eformsign") {
      showInfo("전자서명 서류는 별도 진행이 필요합니다.")
      return
    }
    if (code === "equipment_license") {
      navigate("/profile/equipments")
      return
    }
    if (code === "passport" || code === "id_card" || code === "bankbook") {
      setGuideCode(code)
      return
    }
    setCaptureCode(code)
  }

  // "파일 선택" — opens the native file picker.
  const handlePickFile = (code: string, method: string) => {
    if (uploadingCode) return
    if (method === "eformsign") {
      showInfo("전자서명 서류는 별도 진행이 필요합니다.")
      return
    }
    if (code === "equipment_license") {
      navigate("/profile/equipments")
      return
    }
    pendingCodeRef.current = code
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const code = pendingCodeRef.current
    pendingCodeRef.current = null
    e.target.value = ""
    if (!file || !code) return
    await runUpload(code, file)
  }

  const handleCaptureConfirm = async (imageBase64: string) => {
    const code = captureCode
    setCaptureCode(null)
    if (!code) return
    const res = await fetch(imageBase64)
    const blob = await res.blob()
    const file = new File([blob], `${code}.jpg`, { type: "image/jpeg" })
    await runUpload(code, file)
  }

  const handleGuideStart = () => {
    const code = guideCode
    setGuideCode(null)
    if (!code) return
    setCaptureCode(code)
  }

  const guideDocLabel = guideCode
    ? (docs.find((d) => d.code === guideCode)?.label || guideCode)
    : ""

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <AppTopBar title="제출서류" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : isError ? (
          <QueryErrorState onRetry={() => refetch()} message="제출서류 정보를 불러오지 못했습니다." />
        ) : docs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            제출이 필요한 서류가 없습니다.
          </div>
        ) : (
          <div className="mt-6 mx-4 bg-white rounded-xl border border-gray-300 shadow-sm">
            {docs.map((doc, idx) => {
              const { status, label } = mapStatus(doc.status)
              const isUploading = uploadingCode === doc.code
              const isCompleted = doc.state === "completed"
              const showBadge = isUploading || status !== "incomplete"
              const isLast = idx === docs.length - 1

              // 외국인등록증 keeps the legacy status-list-item style.
              if (ALIEN_REG_CODES.has(doc.code)) {
                const trailing = (
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => navigate("/profile/documents/alien-reg")}
                    className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
                  >
                    {isUploading ? (
                      "업로드 중..."
                    ) : isCompleted ? (
                      <>
                        보기
                        <ChevronRightIcon className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        제출
                        <ChevronRightIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )
                return (
                  <StatusListItem
                    key={doc.code}
                    title={doc.label}
                    subtitle=""
                    status={showBadge ? (isUploading ? "pending" : status) : undefined}
                    statusLabel={showBadge ? (isUploading ? "업로드 중..." : label) : undefined}
                    hideChevron
                    trailing={trailing}
                    className={isLast ? "border-b-0" : ""}
                  />
                )
              }

              // New card style for all other documents.
              return (
                <div
                  key={doc.code}
                  className={`flex items-center justify-between gap-3 px-4 py-4 ${isLast ? "" : "border-b border-gray-200"}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-slate-900">{doc.label}</p>
                    {showBadge && (
                      <span
                        className={`mt-1 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${badgeClassFor(isUploading ? "pending" : status)}`}
                      >
                        {isUploading ? "업로드 중..." : label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isCompleted ? (
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => handleView(doc.code)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
                      >
                        보기
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => handleCapture(doc.code, doc.method)}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                          사진 촬영
                        </button>
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => handlePickFile(doc.code, doc.method)}
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          파일 선택
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {guideCode === "passport" && (
        <CaptureGuidePassport
          onStart={handleGuideStart}
          onClose={() => setGuideCode(null)}
        />
      )}

      {guideCode === "bankbook" && (
        <CaptureGuideBankbook
          onStart={handleGuideStart}
          onClose={() => setGuideCode(null)}
        />
      )}

      {guideCode && guideCode !== "passport" && guideCode !== "bankbook" && (
        <CaptureGuideIdcard
          title={guideDocLabel}
          onStart={handleGuideStart}
          onClose={() => setGuideCode(null)}
        />
      )}

      {captureCode && (
        <DocumentCapture
          onConfirm={handleCaptureConfirm}
          onClose={() => setCaptureCode(null)}
        />
      )}

      <AppBottomNav active="profile" onNavigate={handleNavigation} className="shrink-0" />
    </div>
  )
}
