import { MapPin as MapPinIcon } from "lucide-react"
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
        "flex w-full items-center gap-2 rounded-md border border-input bg-white px-3 py-2 text-sm text-left",
        "min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !value && "text-slate-400"
      )}
    >
      <MapPinIcon size={16} className="shrink-0 text-slate-400" />
      <span className="flex-1 truncate">{value || "주소 검색"}</span>
    </button>
  )
}
