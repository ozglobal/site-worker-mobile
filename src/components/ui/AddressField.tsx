import { useEffect, useRef, useState } from "react"
import { Search as SearchIcon, X as XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

interface AddressFieldProps {
  value: string
  onChange: (value: string) => void
}

interface DaumPostcodeData {
  roadAddress: string
  autoRoadAddress: string
  jibunAddress: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any

const DAUM_POSTCODE_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"

// 스크립트 로드를 모듈 레벨 싱글톤으로 관리해 중복 로드를 막는다.
let scriptPromise: Promise<void> | null = null

function loadDaumPostcode(): Promise<void> {
  if (w.daum?.Postcode) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = DAUM_POSTCODE_SRC
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null // 다음 시도에서 재로드할 수 있게 초기화
      reject(new Error("Daum 우편번호 스크립트 로드 실패"))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export function AddressField({ value, onChange }: AddressFieldProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const embedRef = useRef<HTMLDivElement>(null)

  // onChange 가 인라인 함수로 전달돼도 임베드 effect 가 재실행되지 않도록 ref 로 보관.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // 팝업창(.open) 대신 인앱 모달에 iframe 임베드(.embed) 방식을 사용한다.
  // 팝업 차단·사용자 제스처 컨텍스트 문제가 없어 모든 기종에서 일관되게 동작한다.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(false)

    loadDaumPostcode()
      .then(() => {
        if (cancelled || !embedRef.current) return
        embedRef.current.innerHTML = "" // 재진입 시 이전 iframe 제거
        new w.daum.Postcode({
          oncomplete: (data: DaumPostcodeData) => {
            onChangeRef.current(data.roadAddress || data.autoRoadAddress || data.jibunAddress || "")
            setOpen(false)
          },
          width: "100%",
          height: "100%",
        }).embed(embedRef.current)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
        setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [open, retry])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-4 text-base font-normal text-[#27272A] text-left shadow-sm",
          "h-12 focus-visible:outline-none focus-visible:border-[#007DCA] focus-visible:ring-[3px] focus-visible:ring-[#007DCA]/25",
          !value && "text-[#9CA3AF]"
        )}
      >
        <span className="flex-1 truncate">{value || "주소를 검색하세요"}</span>
        <SearchIcon size={16} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E5E5] px-4">
            <h2 className="text-base font-semibold text-[#27272A]">주소 검색</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="닫기" className="-mr-2 p-2">
              <XIcon size={20} className="text-[#27272A]" />
            </button>
          </div>

          <div className="relative flex-1">
            <div ref={embedRef} className="absolute inset-0" />

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <Spinner />
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white px-6 text-center">
                <p className="text-sm text-[#9CA3AF]">
                  주소 검색을 불러오지 못했습니다.
                  <br />
                  네트워크 상태를 확인한 뒤 다시 시도해주세요.
                </p>
                <button
                  type="button"
                  onClick={() => setRetry((r) => r + 1)}
                  className="rounded-lg bg-[#007DCA] px-4 py-2 text-sm font-medium text-white"
                >
                  다시 시도
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
