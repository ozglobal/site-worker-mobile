import { useEffect, useRef, useState } from "react"
import { format, parse, isValid } from "date-fns"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { DateInput } from "@/components/ui/date-input"
import { IdCardCamera } from "@/components/ui/id-card-capture/id-card-camera"
import { CaptureGuidePassport } from "@/components/ui/id-card-capture/CaptureGuidePassport"
import { useToast } from "@/contexts/ToastContext"
import { fetchPassportDoc, fetchFileAsObjectUrl, uploadPassportDoc } from "@/lib/profile"
import { useDocumentSummary } from "@/lib/queries/useDocumentSummary"
import { useNationalities } from "@/lib/queries/useNationalities"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { useBlobUrl } from "@/hooks/useBlobUrl"

export function PassportRegistrationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  const fileRef = useRef<HTMLInputElement>(null)

  const { data: summary } = useDocumentSummary()
  const alreadyUploaded = (summary || []).some(
    (d) => d.code === "passport" && d.state === "completed",
  )
  const { data: nationalities = [] } = useNationalities()
  const { data: profile } = useWorkerProfile()

  const [file, setFile] = useState<File | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [nationality, setNationality] = useState("")
  const [nationalityHydratedFromDoc, setNationalityHydratedFromDoc] = useState(false)

  // 기존 가입 시 입력한 국적을 기본값으로 — 단, 여권 doc 에 저장된 값이 있으면 그쪽 우선.
  useEffect(() => {
    if (nationalityHydratedFromDoc) return
    if (!nationality && profile?.nationality) {
      setNationality(profile.nationality)
    }
  }, [profile?.nationality, nationality, nationalityHydratedFromDoc])
  const [expiryDate, setExpiryDate] = useState<Date | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [existingMimeType, setExistingMimeType] = useState<string>("")
  // 이미 업로드된 doc 일 때 '재업로드' 누르기 전까지는 촬영/파일선택 버튼 숨김.
  const [showUploadButtons, setShowUploadButtons] = useState(false)

  const filePreviewUrl = useBlobUrl(file)

  const createdBlobUrls = useRef<string[]>([])

  useEffect(() => {
    if (!alreadyUploaded || hydrated) return
    let cancelled = false
    ;(async () => {
      const result = await fetchPassportDoc()
      if (cancelled || !result.success) return
      const d = result.data as Record<string, unknown>

      const n = (d.nationality as string) || ""
      const e = (d.passportExpiryDate as string) || ""
      if (n) {
        setNationality(n)
        setNationalityHydratedFromDoc(true)
      }
      if (e) {
        const parsed = parse(e, "yyyy-MM-dd", new Date())
        if (isValid(parsed)) setExpiryDate(parsed)
      }

      const doc = d.document as Record<string, unknown> | undefined
      const fileUrl = (doc?.fileUrl as string | undefined) ?? (d.fileUrl as string | undefined)
      if (fileUrl) {
        const blob = await fetchFileAsObjectUrl(fileUrl)
        if (cancelled) {
          if (blob.success) URL.revokeObjectURL(blob.data.url)
          return
        }
        if (blob.success) {
          createdBlobUrls.current.push(blob.data.url)
          setExistingImageUrl(blob.data.url)
          setExistingMimeType(blob.data.mimeType)
        }
      }

      setHydrated(true)
    })()
    return () => {
      cancelled = true
    }
  }, [alreadyUploaded, hydrated])

  useEffect(() => {
    return () => {
      createdBlobUrls.current.forEach((url) => URL.revokeObjectURL(url))
      createdBlobUrls.current = []
    }
  }, [])

  // 파일(새 선택 또는 기존 업로드본) + 국적 + 만료일 모두 필수
  const hasFileOrExisting = !!file || !!existingImageUrl
  const isFormValid =
    hasFileOrExisting &&
    nationality.trim().length > 0 &&
    !!expiryDate

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return
    setIsSubmitting(true)
    const payload = {
      ...(file ? { file } : {}),
      ...(nationality.trim() ? { nationality: nationality.trim() } : {}),
      ...(expiryDate ? { passportExpiryDate: format(expiryDate, "yyyy-MM-dd") } : {}),
    }
    const result = await uploadPassportDoc(payload)
    setIsSubmitting(false)

    if (!result.success) {
      showError(result.error)
      return
    }
    showSuccess("여권 사본이 제출되었습니다.")
    queryClient.invalidateQueries({ queryKey: ["documentSummary"] })
    queryClient.invalidateQueries({ queryKey: ["workerProfile"] })
    navigate(-1)
  }

  const displayUrl = file ? filePreviewUrl : existingImageUrl
  const isPdf = file
    ? file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    : existingMimeType === 'application/pdf'

  return (
    <div className="flex h-screen flex-col bg-white">
      <AppTopBar title="여권 사본" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="flex-1 text-sm font-semibold text-slate-900 truncate">여권 사본</p>
            {existingImageUrl && !file && !showUploadButtons ? (
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
                  onClick={() => setShowGuide(true)}
                  className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90"
                >
                  사진 촬영
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  파일 선택
                </button>
              </>
            )}
          </div>
          {displayUrl && !isPdf && (
            <img
              src={displayUrl}
              alt="여권 사본"
              className="mt-3 w-full max-h-60 object-contain rounded bg-slate-50"
            />
          )}
          {displayUrl && isPdf && (
            <iframe
              src={displayUrl}
              title="여권 사본"
              className="mt-3 w-full aspect-[210/297] rounded bg-slate-50"
            />
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            e.target.value = ""
          }}
        />

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
          <label className="block text-sm font-medium text-slate-700 mb-2">여권 만료일</label>
          <DateInput value={expiryDate} onChange={setExpiryDate} />
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

      {showGuide && (
        <CaptureGuidePassport
          onStart={() => { setShowGuide(false); setShowCamera(true) }}
          onClose={() => setShowGuide(false)}
        />
      )}

      {showCamera && (
        <IdCardCamera
          side="front"
          title="여권 사본"
          onCapture={(captured) => {
            setFile(captured)
            setShowCamera(false)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}
