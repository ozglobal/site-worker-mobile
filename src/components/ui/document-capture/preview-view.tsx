interface PreviewViewProps {
  image: string
  onRetake: () => void
  onConfirm: () => void
}

const A4_RATIO = 1 / 1.414

export function PreviewView({ image, onRetake, onConfirm }: PreviewViewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Image preview — same size as camera A4 frame */}
      <div className="flex-1 flex items-center justify-center px-[6%]">
        <div
          className="w-[88%] rounded-lg overflow-hidden"
          style={{ aspectRatio: `${A4_RATIO}` }}
        >
          <img
            src={image}
            alt="촬영 결과"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Guide */}
      <p className="text-center text-sm text-white/70 mb-3">
        문서가 잘 보이는지 확인해주세요
      </p>

      {/* Buttons */}
      <div className="flex gap-3 px-4 pb-8">
        <button
          onClick={onRetake}
          className="flex-1 py-3.5 rounded-lg bg-white/10 text-white font-medium text-sm active:bg-white/20 transition-colors"
        >
          다시 촬영
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3.5 rounded-lg bg-[#007DCA] text-white font-medium text-sm active:bg-[#006BB0] transition-colors"
        >
          등록하기
        </button>
      </div>
    </div>
  )
}
