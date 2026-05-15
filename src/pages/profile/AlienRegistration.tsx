import { useEffect, useRef, useState } from "react"
import { format, parse, isValid } from "date-fns"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { DateInput } from "@/components/ui/date-input"
import { IdCardCamera } from "@/components/ui/id-card-capture/id-card-camera"
import { CaptureGuideIdcard } from "@/components/ui/document-capture/CaptureGuideIdcard"
import { useToast } from "@/contexts/ToastContext"
import { fetchAlienRegDoc, fetchFileAsObjectUrl, uploadAlienRegDoc } from "@/lib/profile"
import { useDocumentSummary } from "@/lib/queries/useDocumentSummary"
import { useNationalities } from "@/lib/queries/useNationalities"
import { useResidenceStatus } from "@/lib/queries/useResidenceStatus"
import { useBlobUrl } from "@/hooks/useBlobUrl"

export function AlienRegistrationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)

  // Flag whether the worker has already submitted the alien-reg document.
  // `/profile/documents` already fetches the summary; re-using the cached
  // query key here is free.
  const { data: summary } = useDocumentSummary()
  const alreadyUploaded = (summary || []).some(
    (d) => d.code === "alien_reg" && d.state === "completed",
  )
  const { data: nationalities = [] } = useNationalities()
  const { data: residenceStatuses = [] } = useResidenceStatus()

  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [cameraSide, setCameraSide] = useState<"front" | "back" | null>(null)
  const [guideSide, setGuideSide] = useState<"front" | "back" | null>(null)
  const [nationality, setNationality] = useState("")
  const [residenceStatus, setResidenceStatus] = useState("")
  const [residencePeriodStart, setResidencePeriodStart] = useState<Date | undefined>()
  const [residencePeriodEnd, setResidencePeriodEnd] = useState<Date | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  // 이미 업로드된 doc 일 때 '재업로드' 누르기 전까지는 촬영/파일선택 버튼 숨김.
  const [showFrontUploadButtons, setShowFrontUploadButtons] = useState(false)
  const [showBackUploadButtons, setShowBackUploadButtons] = useState(false)
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null)
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null)
  const [frontMimeType, setFrontMimeType] = useState<string>("")
  const [backMimeType, setBackMimeType] = useState<string>("")

  // Local blob URL for the just-picked file, so the card can show a
  // thumbnail. Auto-revoked on replace / unmount by the hook.
  const frontFilePreviewUrl = useBlobUrl(frontFile)
  const backFilePreviewUrl = useBlobUrl(backFile)

  // Blob URLs we created — survive dep-change cleanups via a ref so the
  // effect below doesn't revoke URLs that are still in use. Revoked only
  // once on unmount (see second effect).
  const createdBlobUrls = useRef<string[]>([])

  // Hydrate metadata + load front/back images from the existing alien-reg
  // record when the doc is already submitted. `fetchAlienRegDoc` returns
  // `{ frontDocument, backDocument, nationality, ... }`; each document's
  // `fileUrl` is pulled as a blob so the <img> tags can render without
  // needing cookies on the file endpoint.
  useEffect(() => {
    if (!alreadyUploaded || hydrated) return
    let cancelled = false
    ;(async () => {
      const result = await fetchAlienRegDoc()
      if (cancelled || !result.success) return
      const d = result.data as Record<string, unknown>

      // Metadata
      const n = (d.nationality as string) || ""
      const r = (d.residenceStatus as string) || ""
      const s = (d.residencePeriodStart as string) || ""
      const e = (d.residencePeriodEnd as string) || ""
      if (n) setNationality(n)
      if (r) setResidenceStatus(r)
      if (s) {
        const d = parse(s, "yyyy-MM-dd", new Date())
        if (isValid(d)) setResidencePeriodStart(d)
      }
      if (e) {
        const d = parse(e, "yyyy-MM-dd", new Date())
        if (isValid(d)) setResidencePeriodEnd(d)
      }

      // Front / back images
      const frontDoc = d.frontDocument as Record<string, unknown> | null | undefined
      const backDoc = d.backDocument as Record<string, unknown> | null | undefined
      const frontUrl = frontDoc?.fileUrl as string | undefined
      const backUrl = backDoc?.fileUrl as string | undefined

      // Fetch front + back in parallel — these are independent binaries.
      const [frontBlob, backBlob] = await Promise.all([
        frontUrl ? fetchFileAsObjectUrl(frontUrl) : Promise.resolve(null),
        backUrl ? fetchFileAsObjectUrl(backUrl) : Promise.resolve(null),
      ])
      if (cancelled) return

      if (frontBlob?.success) {
        createdBlobUrls.current.push(frontBlob.data.url)
        setFrontImageUrl(frontBlob.data.url)
        setFrontMimeType(frontBlob.data.mimeType)
      }
      if (backBlob?.success) {
        createdBlobUrls.current.push(backBlob.data.url)
        setBackImageUrl(backBlob.data.url)
        setBackMimeType(backBlob.data.mimeType)
      }

      setHydrated(true)
    })()
    return () => {
      cancelled = true
    }
  }, [alreadyUploaded, hydrated])

  // Revoke any blob URLs only when the page truly unmounts.
  useEffect(() => {
    return () => {
      createdBlobUrls.current.forEach((url) => URL.revokeObjectURL(url))
      createdBlobUrls.current = []
    }
  }, [])

  // Allow save as soon as the user has entered or uploaded anything —
  // the backend accepts partial payloads, so don't block on the full set.
  const isFormValid =
    !!frontFile ||
    !!backFile ||
    nationality.trim().length > 0 ||
    residenceStatus.trim().length > 0 ||
    !!residencePeriodStart ||
    !!residencePeriodEnd

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return
    setIsSubmitting(true)
    const payload = {
      ...(frontFile ? { frontFile } : {}),
      ...(backFile ? { backFile } : {}),
      ...(nationality.trim() ? { nationality: nationality.trim() } : {}),
      ...(residenceStatus.trim() ? { residenceStatus: residenceStatus.trim() } : {}),
      ...(residencePeriodStart ? { residencePeriodStart: format(residencePeriodStart, "yyyy-MM-dd") } : {}),
      ...(residencePeriodEnd ? { residencePeriodEnd: format(residencePeriodEnd, "yyyy-MM-dd") } : {}),
    }
    const result = await uploadAlienRegDoc(payload)
    setIsSubmitting(false)

    if (!result.success) {
      showError(result.error)
      return
    }
    showSuccess("외국인등록증이 제출되었습니다.")
    queryClient.invalidateQueries({ queryKey: ["documentSummary"] })
    queryClient.invalidateQueries({ queryKey: ["workerProfile"] })
    navigate(-1)
  }

  const fileCard = (
    label: string,
    file: File | null,
    filePreviewUrl: string | null,
    existingImageUrl: string | null,
    existingMimeType: string,
    showUploadButtons: boolean,
    setShowUploadButtons: (v: boolean) => void,
    onCapture: () => void,
    onPick: () => void,
  ) => {
    // Prefer the user's fresh selection; fall back to the server-stored image.
    const displayUrl = file ? filePreviewUrl : existingImageUrl
    const isPdf = file
      ? file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
      : existingMimeType === 'application/pdf'
    // 이미 업로드되어있고 사용자가 새 파일 안 골랐고 재업로드 모드 아니면 '재업로드' 버튼만.
    const showReuploadOnly = !!existingImageUrl && !file && !showUploadButtons
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm font-semibold text-slate-900 truncate">{label}</p>
          {showReuploadOnly ? (
            <button
              type="button"
              onClick={() => setShowUploadButtons(true)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              재업로드
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onCapture}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                사진 촬영
              </button>
              <button
                type="button"
                onClick={onPick}
                className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                파일 선택
              </button>
            </>
          )}
        </div>
        {displayUrl && !isPdf && (
          <img
            src={displayUrl}
            alt={label}
            className="mt-3 w-full max-h-60 object-contain rounded bg-slate-50"
          />
        )}
        {displayUrl && isPdf && (
          <iframe
            src={displayUrl}
            title={label}
            className="mt-3 w-full aspect-[210/297] rounded bg-slate-50"
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <AppTopBar title="외국인등록증" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {/* Front / Back image pickers */}
        <div className="space-y-3">
          {fileCard(
            "앞면",
            frontFile,
            frontFilePreviewUrl,
            frontImageUrl,
            frontMimeType,
            showFrontUploadButtons,
            setShowFrontUploadButtons,
            () => setGuideSide("front"),
            () => frontRef.current?.click(),
          )}
          {fileCard(
            "뒷면",
            backFile,
            backFilePreviewUrl,
            backImageUrl,
            backMimeType,
            showBackUploadButtons,
            setShowBackUploadButtons,
            () => setGuideSide("back"),
            () => backRef.current?.click(),
          )}
        </div>

        <input
          ref={frontRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            setFrontFile(e.target.files?.[0] ?? null)
            e.target.value = ""
          }}
        />
        <input
          ref={backRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            setBackFile(e.target.files?.[0] ?? null)
            e.target.value = ""
          }}
        />

        {/* Metadata fields */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">국적</label>
          <Select
            value={nationality}
            onChange={setNationality}
            options={nationalities.map((n) => ({ value: n.code, label: n.name }))}
            placeholder="국적 선택"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">체류자격</label>
          <Select
            value={residenceStatus}
            onChange={setResidenceStatus}
            options={residenceStatuses.map((s) => ({ value: s.code, label: s.name }))}
            placeholder="체류자격 선택"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">체류기간 시작일</label>
          <DateInput value={residencePeriodStart} onChange={setResidencePeriodStart} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">체류기간 종료일</label>
          <DateInput value={residencePeriodEnd} onChange={setResidencePeriodEnd} />
        </div>
      </main>

      <div className="px-4 py-4 shrink-0">
        <Button
          variant={isFormValid && !isSubmitting ? "primary" : "primaryDisabled"}
          size="full"
          disabled={!isFormValid || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "제출 중..." : "제출"}
        </Button>
      </div>

      {guideSide && (
        <CaptureGuideIdcard
          title="외국인등록증"
          onStart={() => { setCameraSide(guideSide); setGuideSide(null) }}
          onClose={() => setGuideSide(null)}
        />
      )}

      {cameraSide && (
        <IdCardCamera
          side={cameraSide}
          title="외국인등록증"
          onCapture={(file) => {
            if (cameraSide === "front") setFrontFile(file)
            else setBackFile(file)
            setCameraSide(null)
          }}
          onClose={() => setCameraSide(null)}
        />
      )}
    </div>
  )
}
