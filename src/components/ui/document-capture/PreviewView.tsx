import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { Button } from "@/components/ui/button"

interface PreviewViewProps {
  title: string
  imageUrl: string
  onRetake: () => void
  onConfirm: () => void
}

export function PreviewView({ title, imageUrl, onRetake, onConfirm }: PreviewViewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center h-14 px-4 shrink-0">
        <button onClick={onRetake} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-slate-900 mr-8">{title}</h1>
      </div>

      {/* Image preview */}
      <div className="flex-1 flex items-center justify-center px-4">
        <img
          src={imageUrl}
          alt={title}
          className="w-full rounded-lg object-contain max-h-[70vh]"
        />
      </div>

      {/* Buttons */}
      <div className="px-4 py-6 flex gap-3">
        <Button
          variant="outline"
          size="full"
          className="flex-1 bg-gray-100 border-0 text-slate-900 hover:bg-gray-200"
          onClick={onRetake}
        >
          다시 촬영
        </Button>
        <Button variant="primary" size="full" className="flex-1" onClick={onConfirm}>
          확인
        </Button>
      </div>
    </div>
  )
}
