import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IdCardCamera } from "@/components/ui/id-card-capture/id-card-camera"
import { useToast } from "@/contexts/ToastContext"
import { fetchAlienRegDoc, fetchFileAsObjectUrl, uploadAlienRegDoc } from "@/lib/profile"
import { useDocumentSummary } from "@/lib/queries/useDocumentSummary"

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

  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [cameraSide, setCameraSide] = useState<"front" | "back" | null>(null)
  const [nationality, setNationality] = useState("")
  const [residenceStatus, setResidenceStatus] = useState("")
  const [residencePeriodStart, setResidencePeriodStart] = useState("")
  const [residencePeriodEnd, setResidencePeriodEnd] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null)
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null)
  const [frontFilePreviewUrl, setFrontFilePreviewUrl] = useState<string | null>(null)
  const [backFilePreviewUrl, setBackFilePreviewUrl] = useState<string | null>(null)

  // Build a local blob URL whenever the user picks or captures a file, so
  // the card can show a thumbnail of the selection (not just the filename).
  // Revoke on replace / unmount.
  useEffect(() => {
    if (!frontFile) { setFrontFilePreviewUrl(null); return }
    const url = URL.createObjectURL(frontFile)
    setFrontFilePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [frontFile])

  useEffect(() => {
    if (!backFile) { setBackFilePreviewUrl(null); return }
    const url = URL.createObjectURL(backFile)
    setBackFilePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [backFile])

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
      if (s) setResidencePeriodStart(s)
      if (e) setResidencePeriodEnd(e)

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
      }
      if (backBlob?.success) {
        createdBlobUrls.current.push(backBlob.data.url)
        setBackImageUrl(backBlob.data.url)
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
    residencePeriodStart.length > 0 ||
    residencePeriodEnd.length > 0

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return
    setIsSubmitting(true)
    const payload = {
      ...(frontFile ? { frontFile } : {}),
      ...(backFile ? { backFile } : {}),
      ...(nationality.trim() ? { nationality: nationality.trim() } : {}),
      ...(residenceStatus.trim() ? { residenceStatus: residenceStatus.trim() } : {}),
      ...(residencePeriodStart ? { residencePeriodStart } : {}),
      ...(residencePeriodEnd ? { residencePeriodEnd } : {}),
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
    onCapture: () => void,
    onPick: () => void,
  ) => {
    // Prefer the user's fresh selection; fall back to the server-stored image.
    const displayUrl = file ? filePreviewUrl : existingImageUrl
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm font-semibold text-slate-900 truncate">{label}</p>
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
        </div>
        {displayUrl && (
          <img
            src={displayUrl}
            alt={label}
            className="mt-3 w-full max-h-60 object-contain rounded bg-slate-50"
          />
        )}
        {file && (
          <p className="mt-2 text-xs text-slate-500 truncate">{file.name}</p>
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
            () => setCameraSide("front"),
            () => frontRef.current?.click(),
          )}
          {fileCard(
            "뒷면",
            backFile,
            backFilePreviewUrl,
            backImageUrl,
            () => setCameraSide("back"),
            () => backRef.current?.click(),
          )}
        </div>

        <input
          ref={frontRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            setFrontFile(e.target.files?.[0] ?? null)
            e.target.value = ""
          }}
        />
        <input
          ref={backRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            setBackFile(e.target.files?.[0] ?? null)
            e.target.value = ""
          }}
        />

        {/* Metadata fields */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">국적</label>
          <Input
            type="text"
            value={nationality}
            onChange={(e) => setNationality(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())}
            placeholder="VN, CN 등 (ISO 3166-1 alpha-2)"
            maxLength={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">체류자격</label>
          <Input
            type="text"
            value={residenceStatus}
            onChange={(e) => setResidenceStatus(e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase())}
            placeholder="E-9, H-2, F-4 등"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">체류기간 시작일</label>
          <input
            type="text"
            value={residencePeriodStart}
            onChange={(e) => setResidencePeriodStart(e.target.value)}
            onFocus={(e) => { e.target.type = "date" }}
            onClick={(e) => {
              const el = e.currentTarget
              el.type = "date"
              try { el.showPicker?.() } catch { /* ignore */ }
            }}
            onBlur={(e) => { if (!e.target.value) e.target.type = "text" }}
            placeholder="시작일 입력"
            className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-sm text-slate-900 placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">체류기간 종료일</label>
          <input
            type="text"
            value={residencePeriodEnd}
            onChange={(e) => setResidencePeriodEnd(e.target.value)}
            onFocus={(e) => { e.target.type = "date" }}
            onClick={(e) => {
              const el = e.currentTarget
              el.type = "date"
              try { el.showPicker?.() } catch { /* ignore */ }
            }}
            onBlur={(e) => { if (!e.target.value) e.target.type = "text" }}
            placeholder="종료일 입력"
            className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-sm text-slate-900 placeholder:text-gray-400"
          />
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
