import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import {
  fetchAlienRegDoc,
  fetchBankbookDoc,
  fetchFamilyRelationDoc,
  fetchFileAsObjectUrl,
  fetchIdCardDoc,
  type DocumentDetail,
} from "@/lib/profile"
import type { ApiResult } from "@/lib/api-result"

type DocLoader = () => Promise<ApiResult<DocumentDetail>>

const LOADERS: Record<string, { title: string; load: DocLoader }> = {
  "id-card": { title: "신분증 사본", load: fetchIdCardDoc },
  bankbook: { title: "통장사본", load: fetchBankbookDoc },
  "family-relation": { title: "가족관계증명서", load: fetchFamilyRelationDoc },
  "alien-reg": { title: "외국인등록증", load: fetchAlienRegDoc },
}

export function DocumentViewerPage() {
  const navigate = useNavigate()
  const { slug = "" } = useParams<{ slug: string }>()
  const entry = LOADERS[slug]

  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(!!entry)

  useEffect(() => {
    if (!entry) return
    let cancelled = false
    let createdUrl: string | null = null

    ;(async () => {
      const meta = await entry.load()
      if (cancelled) return
      if (!meta.success) {
        setError(meta.error)
        setIsLoading(false)
        return
      }
      const fileUrl = meta.data?.fileUrl
      if (!fileUrl) {
        setError("파일을 찾을 수 없습니다.")
        setIsLoading(false)
        return
      }
      const blob = await fetchFileAsObjectUrl(fileUrl)
      if (cancelled) {
        if (blob.success) URL.revokeObjectURL(blob.data.url)
        return
      }
      if (!blob.success) {
        setError(blob.error)
        setIsLoading(false)
        return
      }
      createdUrl = blob.data.url
      setMimeType(meta.data?.mimeType || blob.data.mimeType || "")
      setBlobUrl(blob.data.url)
      setIsLoading(false)
    })()

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [entry])

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

  return (
    <div className="flex h-screen flex-col bg-white">
      <AppTopBar title={entry.title} onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-auto flex items-center justify-center p-4">
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
      </main>
    </div>
  )
}
