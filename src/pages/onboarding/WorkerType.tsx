import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { WorkerTypeCard } from "@/components/ui/worker-type-card"
import { ProgressBar } from "@/components/ui/progress-bar"

interface WorkerTypeOption {
  id: string
  icon: string
  title: string
  subtitle: string
}

const workerTypes: WorkerTypeOption[] = [
  {
    id: "general",
    icon: "👷",
    title: "일반",
    subtitle: "건설사 소속 직영 근로자",
  },
  {
    id: "service",
    icon: "🏢",
    title: "용역",
    subtitle: "용역업체 소속 근로자",
  },
  {
    id: "specialty",
    icon: "🔧",
    title: "주요공종",
    subtitle: "전문 공종 근로자",
  },
  {
    id: "equipment",
    icon: "🚜",
    title: "장비기사",
    subtitle: "건설 기계 운전 기사",
  },
]

export function OnboardingWorkerTypePage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)

  const handleBack = () => {
    navigate(-1)
  }

  const handleSelect = (id: string) => {
    setSelected(id)
    if (id === "general" || id === "specialty") {
      navigate("/onboarding/payroll-account")
    } else if (id === "service") {
      navigate("/onboarding/outsourcing")
    } else if (id === "equipment") {
      navigate("/onboarding/engineer")
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={handleBack}
        className="shrink-0"
      />

      {/* Progress bar */}
      <ProgressBar value={20} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Title */}
        <div className="px-4 pt-4 pb-6">
          <h1 className="text-lg font-bold text-slate-900">회원 유형을 선택해주세요</h1>
          <p className="mt-1 text-sm text-gray-500">선택한 소속은 나중에 언제든지 변경할 수 있어요.</p>
        </div>

        {/* Worker Type Cards */}
        <div className="px-4 space-y-3">
          {workerTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSelect(type.id)}
              className="w-full text-left"
            >
              <WorkerTypeCard
                icon={type.icon}
                title={type.title}
                subtitle={type.subtitle}
                className={
                  selected === type.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:bg-gray-50"
                }
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
