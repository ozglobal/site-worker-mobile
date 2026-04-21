import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { DocumentCapture } from "@/components/ui/document-capture/document-capture"
import { CaptureGuideBankbook } from "@/components/ui/id-card-capture/CaptureGuideBankbook"
import { useToast } from "@/contexts/ToastContext"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import {
  fetchAlienRegDoc,
  fetchBankbookDoc,
  fetchEquipmentLicenseDoc,
  fetchFamilyRelationDoc,
  fetchFileAsObjectUrl,
  fetchIdCardDoc,
  fetchSafetyCertDoc,
  reuploadEquipmentLicense,
  uploadBankbookDoc,
  uploadIdCardDoc,
  uploadSafetyCertDoc,
  type DocumentDetail,
} from "@/lib/profile"
import type { ApiResult } from "@/lib/api-result"

type DocLoader = () => Promise<ApiResult<DocumentDetail>>

const LOADERS: Record<string, { title: string; load: DocLoader }> = {
  "id-card": { title: "신분증 사본", load: fetchIdCardDoc },
  bankbook: { title: "통장사본", load: fetchBankbookDoc },
  "family-relation": { title: "가족관계증명서", load: fetchFamilyRelationDoc },
  "alien-reg": { title: "외국인등록증", load: fetchAlienRegDoc },
  "safety-cert": { title: "기초안전보건교육 이수증", load: fetchSafetyCertDoc },
}

// Slugs whose viewer page supports in-place re-upload via 사진 촬영 / 파일 선택.
const UPLOAD_SUPPORTED = new Set(["id-card", "bankbook", "safety-cert", "equipment-license"])

export function DocumentViewerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { slug = "", docId } = useParams<{ slug: string; docId?: string }>()
  const [searchParams] = useSearchParams()
  const equipmentId = searchParams.get("equipmentId") ?? undefined
  const entry = useMemo<{ title: string; load: DocLoader } | undefined>(() => {
    if (slug === "equipment-license" && docId) {
      const name = searchParams.get("name") || "장비 자격증"
      return { title: name, load: () => fetchEquipmentLicenseDoc(docId) }
    }
    return LOADERS[slug]
  }, [slug, docId, searchParams])
  const { showSuccess, showError } = useToast()
  const { data: profile } = useWorkerProfile()

  const [reloadKey, setReloadKey] = useState(0)

  const { data: docMeta, isLoading: metaLoading, error: metaErr } = useQuery({
    queryKey: ["docDetail", slug, docId ?? "", reloadKey],
    queryFn: async () => {
      const result = await entry!.load()
      if (!result.success) throw new Error(result.error)
      if (!result.data?.fileUrl) throw new Error("파일을 찾을 수 없습니다.")
      return result.data
    },
    enabled: !!entry,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })

  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>("")
  const [blobError, setBlobError] = useState<string | null>(null)
  const [blobLoading, setBlobLoading] = useState(false)

  const isLoading = metaLoading || blobLoading
  const error = (metaErr as Error | null)?.message ?? blobError

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [showCapture, setShowCapture] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const fileUrl = docMeta?.fileUrl
    if (!fileUrl) {
      setBlobUrl(null)
      return
    }
    let cancelled = false
    let createdUrl: string | null = null
    setBlobLoading(true)
    setBlobError(null)
    setBlobUrl(null)

    ;(async () => {
      const blob = await fetchFileAsObjectUrl(fileUrl)
      if (cancelled) {
        if (blob.success) URL.revokeObjectURL(blob.data.url)
        return
      }
      if (!blob.success) {
        setBlobError(blob.error)
        setBlobLoading(false)
        return
      }
      createdUrl = blob.data.url
      setMimeType(blob.data.mimeType || "")
      setBlobUrl(blob.data.url)
      setBlobLoading(false)
    })()

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [docMeta?.fileUrl])

  const runUpload = async (file: File): Promise<ApiResult<void>> => {
    if (slug === "id-card") {
      return uploadIdCardDoc(file)
    }
    if (slug === "bankbook") {
      return uploadBankbookDoc({
        file,
        accountHolder: profile?.accountHolder || profile?.workerName || undefined,
        bankName: profile?.bankName || undefined,
        bankAccount: profile?.bankAccount || undefined,
      })
    }
    if (slug === "safety-cert") {
      return uploadSafetyCertDoc(file)
    }
    if (slug === "equipment-license" && equipmentId) {
      return reuploadEquipmentLicense(equipmentId, file)
    }
    return { success: false, error: "지원되지 않는 서류입니다." }
  }

  const submitFile = async (file: File) => {
    setIsUploading(true)
    const result = await runUpload(file)
    setIsUploading(false)
    if (!result.success) {
      showError(result.error)
      return
    }
    showSuccess(`${entry?.title ?? "서류"}이(가) 업데이트되었습니다.`)
    queryClient.invalidateQueries({ queryKey: ["documentSummary"] })
    queryClient.invalidateQueries({ queryKey: ["workerProfile"] })
    if (slug === "equipment-license") {
      queryClient.invalidateQueries({ queryKey: ["workerEquipments"] })
    }
    setReloadKey((k) => k + 1)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    await submitFile(file)
  }

  const handleCaptureConfirm = async (imageBase64: string) => {
    setShowCapture(false)
    const res = await fetch(imageBase64)
    const blob = await res.blob()
    const file = new File([blob], `${slug}.jpg`, { type: "image/jpeg" })
    await submitFile(file)
  }

  if (!entry) {
    return (
      <div className="flex h-screen flex-col bg-white">
        <AppTopBar title="서류 보기" onBack={() => navigate(-1)} className="shrink-0" />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-sm text-slate-600">알 수 없는 서류입니다.</p>
          <Button variant="primary" size="sm" onClick={() => navigate(-1)}>
            돌아가기
          </Button>
        </main>
      </div>
    )
  }

  const supportsUpload = UPLOAD_SUPPORTED.has(slug)
  const hasGuide = slug === "bankbook"
  const [showUploadButtons, setShowUploadButtons] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-white">
      <AppTopBar title={entry.title} onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-auto p-4">
        {supportsUpload ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-end gap-2">
              {!showUploadButtons ? (
                <button
                  type="button"
                  onClick={() => setShowUploadButtons(true)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  재등록
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => (hasGuide ? setShowGuide(true) : setShowCapture(true))}
                    className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isUploading ? "업로드 중..." : "사진 촬영"}
                  </button>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    파일 선택
                  </button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div className="mt-3">
              {isLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : error ? (
                <div className="flex flex-col items-center gap-3 text-center py-6">
                  <p className="text-sm text-slate-600">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                    돌아가기
                  </Button>
                </div>
              ) : blobUrl && mimeType.startsWith("image/") ? (
                <img src={blobUrl} alt={entry.title} className="w-full max-h-[70vh] object-contain rounded bg-slate-50" />
              ) : blobUrl && mimeType === "application/pdf" ? (
                <iframe src={blobUrl} title={entry.title} className="w-full h-[70vh] bg-white" />
              ) : blobUrl ? (
                <div className="flex flex-col items-center gap-3 text-center py-6">
                  <p className="text-sm text-slate-700">이 파일은 앱에서 바로 미리볼 수 없습니다.</p>
                  <a
                    href={blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded bg-primary px-4 py-2 text-sm font-medium text-white"
                  >
                    새 창에서 열기
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            {isLoading ? (
              <Spinner />
            ) : error ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-slate-600">{error}</p>
                <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                  돌아가기
                </Button>
              </div>
            ) : blobUrl && mimeType.startsWith("image/") ? (
              <img src={blobUrl} alt={entry.title} className="max-h-full max-w-full rounded shadow" />
            ) : blobUrl && mimeType === "application/pdf" ? (
              <iframe src={blobUrl} title={entry.title} className="w-full h-full bg-white" />
            ) : blobUrl ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-slate-700">이 파일은 앱에서 바로 미리볼 수 없습니다.</p>
                <a
                  href={blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded bg-primary px-4 py-2 text-sm font-medium text-white"
                >
                  새 창에서 열기
                </a>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {hasGuide && showGuide && (
        <CaptureGuideBankbook
          onStart={() => { setShowGuide(false); setShowCapture(true) }}
          onClose={() => setShowGuide(false)}
        />
      )}

      {showCapture && (
        <DocumentCapture
          onConfirm={handleCaptureConfirm}
          onClose={() => setShowCapture(false)}
        />
      )}
    </div>
  )
}
