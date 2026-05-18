import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { DocumentCapture } from "@/components/ui/document-capture/document-capture"
import { CaptureGuideBankbook } from "@/components/ui/id-card-capture/CaptureGuideBankbook"
import { CaptureGuideIdcard } from "@/components/ui/document-capture/CaptureGuideIdcard"
import { CaptureGuidePassport } from "@/components/ui/id-card-capture/CaptureGuidePassport"
import { useToast } from "@/contexts/ToastContext"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { useDocumentSummary } from "@/lib/queries/useDocumentSummary"
import {
  fetchAlienRegDoc,
  fetchBankbookDoc,
  fetchEquipmentLicenseDoc,
  fetchFamilyRelationDoc,
  fetchFileAsObjectUrl,
  fetchIdCardDoc,
  fetchPassportDoc,
  fetchSafetyCertDoc,
  reuploadEquipmentLicense,
  uploadBankbookDoc,
  uploadFamilyRelationDoc,
  uploadIdCardDoc,
  uploadPassportDoc,
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
  passport: { title: "여권 사본", load: fetchPassportDoc },
}

// Slugs whose viewer page supports in-place re-upload via 사진 촬영 / 파일 선택.
const UPLOAD_SUPPORTED = new Set(["id-card", "bankbook", "family-relation", "safety-cert", "equipment-license", "passport"])

const SLUG_TO_CODE: Record<string, string> = {
  "id-card": "id_card",
  "bankbook": "bankbook",
  "family-relation": "family_relation",
  "safety-cert": "safety_cert",
  "passport": "passport",
}

export function DocumentViewerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { slug = "", docId } = useParams<{ slug: string; docId?: string }>()
  const [searchParams] = useSearchParams()
  const equipmentId = searchParams.get("equipmentId") ?? undefined
  const equipmentType = searchParams.get("equipmentType") ?? undefined
  // 현장별 서류(bankbook 등) 조회/업로드 시 함께 보낼 siteId.
  const siteId = searchParams.get("siteId") ?? undefined
  const { showSuccess, showError } = useToast()
  const { data: profile } = useWorkerProfile()
  // id-card 슬러그 제목은 근로자의 nationalityType 에 따라 동적으로 표시.
  const idCardTitleByNationality: Record<string, string> = {
    domestic: '주민등록증',
    foreigner_registered: '외국인등록증',
    foreigner_unregistered: '여권 사본',
  }
  const entry = useMemo<{ title: string; load: DocLoader } | undefined>(() => {
    if (slug === "equipment-license" && docId) {
      const name = searchParams.get("name") || "장비 자격증"
      return { title: name, load: () => fetchEquipmentLicenseDoc(docId) }
    }
    const base = LOADERS[slug]
    if (!base) return undefined
    // bankbook 은 현장별 doc이므로 siteId 가 있으면 함께 전달.
    const load: DocLoader = slug === "bankbook" ? () => fetchBankbookDoc(siteId) : base.load
    if (slug === "id-card" && profile?.nationalityType && idCardTitleByNationality[profile.nationalityType]) {
      return { title: idCardTitleByNationality[profile.nationalityType], load }
    }
    return { title: base.title, load }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, docId, searchParams, profile?.nationalityType, siteId])
  const { data: docSummary, documents: rawDocs } = useDocumentSummary()
  const docCode = SLUG_TO_CODE[slug]
  const docMatch = docSummary?.find((d) => d.code === docCode)
  // 현장별 서류(siteId 지정)는 rawDocs 에서 (documentType, siteId) 로 status 판정 —
  // 글로벌 summary item 을 쓰면 한 현장 상태가 다른 현장까지 물듦.
  const perSiteDoc = siteId
    ? rawDocs.find((d) => d.documentType === docCode && d.siteId === siteId)
    : undefined
  const docStatus = siteId ? perSiteDoc?.status : docMatch?.status
  const isApproved = docStatus === "approved"
  // 미제출이면 파일 fetch 시도 안 함 — 곧장 사진촬영/파일선택 UI 노출.
  const isMissing = siteId
    ? !perSiteDoc
    : !docStatus && docMatch?.state !== "completed"

  const [reloadKey, setReloadKey] = useState(0)

  const { data: docMeta, isLoading: metaLoading, error: metaErr } = useQuery({
    queryKey: ["docDetail", slug, docId ?? "", siteId ?? "", reloadKey],
    queryFn: async () => {
      const result = await entry!.load()
      if (!result.success) throw new Error(result.error)
      if (!result.data?.fileUrl) throw new Error("파일을 찾을 수 없습니다.")
      return result.data
    },
    enabled: !!entry && !isMissing,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })

  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>("")
  const [blobError, setBlobError] = useState<string | null>(null)
  const [blobLoading, setBlobLoading] = useState(false)

  const isMobileBrowser = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

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
        siteId,
      })
    }
    if (slug === "family-relation") {
      return uploadFamilyRelationDoc(file)
    }
    if (slug === "safety-cert") {
      return uploadSafetyCertDoc(file)
    }
    if (slug === "passport") {
      return uploadPassportDoc({ file })
    }
    if (slug === "equipment-license" && equipmentId) {
      return reuploadEquipmentLicense(equipmentId, file, equipmentType)
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
      <div className="flex h-dvh flex-col bg-white">
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
  const guideSlug: "bankbook" | "passport" | "idcard" | null =
    slug === "bankbook" ? "bankbook"
    : slug === "passport" ? "passport"
    : slug === "id-card" ? "idcard"
    : null
  // 재업로드 버튼 누른 후에만 true로 토글. 미제출 상태는 isMissing 으로 자동 노출되므로
  // useState 초기값에 isMissing 을 넣지 않음 (초기 렌더 시 docSummary 미로드라 isMissing=true
  // 였다가 로드 후 false 가 되어도 setState 안 따라가는 문제 회피).
  const [forceShowUploadButtons, setForceShowUploadButtons] = useState(false)
  const showUploadButtons = isMissing || forceShowUploadButtons
  const setShowUploadButtons = setForceShowUploadButtons
  // 승인 완료 서류 재업로드 시 확인 모달 게이트.
  const [showApprovedConfirm, setShowApprovedConfirm] = useState(false)
  const handleReuploadClick = () => {
    if (isApproved) setShowApprovedConfirm(true)
    else setShowUploadButtons(true)
  }

  const startCapture = () => {
    if (guideSlug) setShowGuide(true)
    else setShowCapture(true)
  }

  // 미리보기 상단 상태 안내문 — 승인 대기 / 승인 완료 / 반려 알림.
  const statusBanner: { text: string; className: string } | null =
    docStatus === "uploaded"
      ? { text: "승인 대기 중인 서류입니다.", className: "bg-[#EA580C1A] text-[#EA580C]" }
    : docStatus === "approved"
      ? { text: "승인 완료된 서류입니다.", className: "bg-green-50 text-green-600" }
    : docStatus === "rejected" || docStatus === "resubmission_requested"
      ? { text: "반려된 서류입니다. 재업로드 해주세요.", className: "bg-red-50 text-red-600" }
    : null

  return (
    <div className="flex h-dvh flex-col bg-white">
      <AppTopBar title={entry.title} onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-auto p-4">
        {supportsUpload ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-end gap-2">
              {showUploadButtons ? (
                <>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={startCapture}
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
              ) : (
                <button
                  type="button"
                  onClick={handleReuploadClick}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  재업로드
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {statusBanner && !isMissing && (
              <div className={`mt-3 rounded-md px-3 py-2 text-xs font-medium ${statusBanner.className}`}>
                {statusBanner.text}
              </div>
            )}
            <div className="mt-3">
              {isMissing ? (
                <div className="flex flex-col items-center gap-2 text-center py-10">
                  <p className="text-sm text-slate-500">아직 제출하지 않은 서류입니다.</p>
                  <p className="text-xs text-slate-400">위의 사진 촬영 또는 파일 선택으로 제출해주세요.</p>
                </div>
              ) : isLoading ? (
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
                isMobileBrowser ? (
                  <embed key={blobUrl} src={blobUrl} type="application/pdf" className="w-full h-[70vh]" />
                ) : (
                  <iframe key={blobUrl} src={`${blobUrl}#view=FitH&toolbar=0`} title={entry.title} className="w-full aspect-[210/297] bg-white" />
                )
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
              isMobileBrowser ? (
                <embed key={blobUrl} src={blobUrl} type="application/pdf" className="w-full h-full" />
              ) : (
                <iframe src={blobUrl} title={entry.title} className="w-full h-full bg-white" />
              )
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

      {showGuide && guideSlug === "bankbook" && (
        <CaptureGuideBankbook
          onStart={() => { setShowGuide(false); setShowCapture(true) }}
          onClose={() => setShowGuide(false)}
        />
      )}

      {showGuide && guideSlug === "passport" && (
        <CaptureGuidePassport
          onStart={() => { setShowGuide(false); setShowCapture(true) }}
          onClose={() => setShowGuide(false)}
        />
      )}

      {showGuide && guideSlug === "idcard" && (
        <CaptureGuideIdcard
          title={entry.title}
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

      {showApprovedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h3 className="text-base font-bold text-slate-900">승인이 완료된 서류입니다</h3>
            <p className="mt-2 text-sm text-slate-600">진짜 재업로드를 하시겠습니까?</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowApprovedConfirm(false)}
                className="flex-1 rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowApprovedConfirm(false)
                  setShowUploadButtons(true)
                }}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white"
              >
                재업로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
