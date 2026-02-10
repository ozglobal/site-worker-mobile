import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { onboardingStorage } from "@/lib/storage"

interface OnboardingSlide {
  id: number
  icon: string
  title: string
  description: string
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    icon: "👷",
    title: "현장 근로자를 위한 앱",
    description: "QR 코드로 간편하게 출퇴근을 기록하고\n근무 현황을 한눈에 확인하세요.",
  },
  {
    id: 2,
    icon: "📱",
    title: "간편한 출퇴근 체크",
    description: "현장의 QR 코드를 스캔하면\n자동으로 출퇴근이 기록됩니다.",
  },
  {
    id: 3,
    icon: "📊",
    title: "근무 기록 관리",
    description: "주간, 월간 근무 기록을 확인하고\n급여 정산에 활용하세요.",
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    onboardingStorage.markCompleted()
    navigate("/profile/my-account")
  }

  const slide = slides[currentSlide]
  const isLastSlide = currentSlide === slides.length - 1

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Skip button */}
      <div className="flex justify-end px-4 py-4 shrink-0">
        {!isLastSlide && (
          <button
            onClick={handleSkip}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            건너뛰기
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Icon */}
        <div className="text-8xl mb-8">{slide.icon}</div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-4">
          {slide.title}
        </h1>

        {/* Description */}
        <p className="text-slate-500 text-center whitespace-pre-line">
          {slide.description}
        </p>
      </div>

      {/* Bottom section */}
      <div className="px-6 pb-8 shrink-0">
        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                currentSlide === index
                  ? "w-6 bg-primary"
                  : "w-2 bg-gray-300"
              )}
            />
          ))}
        </div>

        {/* Button */}
        <Button
          variant="primary"
          size="full"
          onClick={handleNext}
        >
          {isLastSlide ? "시작하기" : "다음"}
        </Button>
      </div>
    </div>
  )
}
