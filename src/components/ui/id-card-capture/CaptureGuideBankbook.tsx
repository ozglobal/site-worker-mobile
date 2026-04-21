import { ArrowLeft as ArrowBackIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CaptureGuideBankbookProps {
  onStart: () => void
  onClose: () => void
}

export function CaptureGuideBankbook({ onStart, onClose }: CaptureGuideBankbookProps) {
  return (
    <div className="fixed inset-0 z-50 flex h-screen flex-col bg-white">
      <div className="flex items-center h-14 px-4 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-4 pb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">통장사본 촬영</h1>
          <p className="text-sm text-gray-500">은행명, 예금주, 계좌번호가 명확히 보이도록 촬영해주세요</p>
        </div>

        <div className="px-6 text-center">
          <p className="text-sm text-gray-400 mb-3">촬영 예시</p>
          <img
            src="/images/bankbook-image.jpeg"
            alt="통장사본 촬영 예시"
            className="w-full rounded-xl border border-gray-200"
          />
        </div>
      </div>

      <div className="px-4 py-6">
        <Button variant="primary" size="full" onClick={onStart}>
          통장사본 촬영
        </Button>
      </div>
    </div>
  )
}
