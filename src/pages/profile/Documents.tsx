import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { StatusListItem, type StatusType } from "@/components/ui/status-list-item"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { useDocumentSummary } from "@/lib/queries/useDocumentSummary"
import { usePendingSignDocuments } from "@/lib/queries/usePendingSignDocuments"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
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

  const handleNavigation = (item: NavItem) => {
    if (item === "home") navigate("/home")
    else if (item === "attendance") navigate("/attendance")
    else if (item === "contract") navigate("/contract")
    else if (item === "profile") navigate("/profile")
  }

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

  // Upload dispatch — picks the right endpoint for the document code and
  // invalidates the summary cache on success so the list refreshes.
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

  // Viewer-slug map — codes with a dedicated /profile/documents/view/:slug
  // route. Completed rows for codes in this map open the viewer; others
  // fall through to an "under construction" toast.
  const viewerSlugByCode: Record<string, string> = {
    id_card: "id-card",
    bankbook: "bankbook",
    family_relation: "family-relation",
  }

  const handleRowClick = (code: string, method: string, isCompleted: boolean) => {
    if (uploadingCode) return
    if (isCompleted) {
      // alien-reg uses the same submit page for viewing — the page flips into
      // "already uploaded" mode and swaps its buttons to 보기 automatically.
      if (code === "alien_reg" || code === "alien_reg_front" || code === "alien_reg_back") {
        navigate("/profile/documents/alien-reg")
        return
      }
      const slug = viewerSlugByCode[code]
      if (slug) {
        navigate(`/profile/documents/view/${slug}`)
        return
      }
      showInfo("미리보기는 준비 중입니다.")
      return
    }
    if (method === "eformsign") {
      // TODO: redirect to eformsign flow once backend provides a signing URL.
      showInfo("전자서명 서류는 별도 진행이 필요합니다.")
      return
    }
    // Multi-file / metadata flows — defer to dedicated pages.
    if (code === "alien_reg" || code === "alien_reg_front" || code === "alien_reg_back") {
      navigate("/profile/documents/alien-reg")
      return
    }
    if (code === "passport") {
      showInfo("여권은 별도 입력 화면에서 업로드해주세요.")
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
    e.target.value = "" // allow re-selecting the same file
    if (!file || !code) return

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
              const actionLabel = isCompleted ? "보기" : "제출"
              // 미제출 badge is redundant now that the 제출 button expresses
              // the same thing — drop the badge in that case.
              const showBadge = isUploading || status !== "incomplete"
              const trailing = (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => handleRowClick(doc.code, doc.method, isCompleted)}
                  className={
                    isCompleted
                      ? "rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      : "rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                  }
                >
                  {isUploading ? "업로드 중..." : actionLabel}
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
                  className={idx === docs.length - 1 ? "border-b-0" : ""}
                />
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

      <AppBottomNav active="profile" onNavigate={handleNavigation} className="shrink-0" />
    </div>
  )
}
