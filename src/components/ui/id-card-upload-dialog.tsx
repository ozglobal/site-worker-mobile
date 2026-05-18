import { Button } from "@/components/ui/button"
import { CreditCard as CreditCardIcon, IdCard as BadgeIcon, Plane as FlightIcon } from "lucide-react"

export type IdCardType = "id_card" | "passport"

interface IdCardTypeDialogProps {
  onSelect: (type: IdCardType) => void
  onCancel: () => void
}

export function IdCardTypeDialog({ onSelect, onCancel }: IdCardTypeDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl w-[90%] max-w-sm mx-auto overflow-hidden">
        <div className="px-6 pt-6 pb-4 text-center">
          <h3 className="text-lg font-bold text-slate-900 mb-1">신분증 종류 선택</h3>
          <p className="text-sm text-slate-500">등록할 신분증 종류를 선택해주세요.</p>
        </div>

        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={() => onSelect("id_card")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white text-left hover:bg-slate-50 active:bg-slate-100"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <BadgeIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">신분증</p>
              <p className="text-xs text-slate-500 mt-0.5">앞면, 뒷면 촬영</p>
            </div>
          </button>
          <button
            onClick={() => onSelect("passport")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white text-left hover:bg-slate-50 active:bg-slate-100"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <FlightIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">여권</p>
              <p className="text-xs text-slate-500 mt-0.5">정보면 촬영</p>
            </div>
          </button>
          <Button variant="neutral" size="full" onClick={onCancel}>
            취소
          </Button>
        </div>
      </div>
    </div>
  )
}

interface IdCardUploadDialogProps {
  side: "front" | "back"
  onSelect: () => void
  onCancel: () => void
}

export function IdCardUploadDialog({ side, onSelect, onCancel }: IdCardUploadDialogProps) {
  const isFront = side === "front"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl w-[90%] max-w-sm mx-auto overflow-hidden">
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <CreditCardIcon className={`h-8 w-8 text-primary ${!isFront ? "scale-x-[-1]" : ""}`} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            신분증 {isFront ? "앞면" : "뒷면"}
          </h3>
          <p className="text-sm text-slate-500">
            {isFront
              ? "신분증의 앞면을 촬영하거나 파일을 선택해주세요."
              : "신분증의 뒷면을 촬영하거나 파일을 선택해주세요."}
          </p>
        </div>

        <div className="px-6 pb-6 space-y-2">
          <Button variant="primary" size="full" onClick={onSelect}>
            {isFront ? "앞면 촬영 / 선택" : "뒷면 촬영 / 선택"}
          </Button>
          <Button variant="neutral" size="full" onClick={onCancel}>
            취소
          </Button>
        </div>
      </div>
    </div>
  )
}
