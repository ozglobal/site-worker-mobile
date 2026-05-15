import { Search as SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddressFieldProps {
  value: string
  onChange: (value: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any

function openKakaoPostcode(onSelect: (address: string) => void) {
  const open = () => {
    new w.daum.Postcode({
      oncomplete(data: { roadAddress: string; autoRoadAddress: string }) {
        onSelect(data.roadAddress || data.autoRoadAddress)
      },
    }).open()
  }

  if (w.daum) {
    open()
  } else {
    const script = document.createElement("script")
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
    script.onload = open
    document.head.appendChild(script)
  }
}

export function AddressField({ value, onChange }: AddressFieldProps) {
  return (
    <button
      type="button"
      onClick={() => openKakaoPostcode(onChange)}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-4 text-base font-normal text-[#27272A] text-left shadow-sm",
        "h-12 focus-visible:outline-none focus-visible:border-[#007DCA] focus-visible:ring-[3px] focus-visible:ring-[#007DCA]/25",
        !value && "text-[#9CA3AF]"
      )}
    >
      <span className="flex-1 truncate">{value || "주소를 검색하세요"}</span>
      <SearchIcon size={16} className="shrink-0 text-slate-400" />
    </button>
  )
}
