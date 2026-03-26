interface Props {
  image: string
  onRetake: () => void
  onConfirm: () => void
  onAdjust: () => void
}

export function PreviewView({
  image,
  onRetake,
  onConfirm,
  onAdjust,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col text-white">
      <div className="flex-1 flex items-center justify-center">
        <img
          src={image}
          className="max-w-full max-h-full"
        />
      </div>

      <div className="flex gap-3 p-4">
        <button className="flex-1 bg-gray-700 py-3 rounded-lg" onClick={onRetake}>
          다시 촬영
        </button>

        <button className="flex-1 bg-gray-500 py-3 rounded-lg" onClick={onAdjust}>
          영역 조정
        </button>

        <button className="flex-1 bg-blue-500 py-3 rounded-lg" onClick={onConfirm}>
          제출하기
        </button>
      </div>
    </div>
  )
}
