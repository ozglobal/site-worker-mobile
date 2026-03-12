import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { AffiliationCard } from "@/components/ui/affiliation-card"
import { ProgressBar } from "@/components/ui/progress-bar"

interface AffiliationType {
  id: string
  icon: string
  title: string
  subtitle: string
}

const affiliationTypes: AffiliationType[] = [
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

export function OnboardingAffiliationPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)

  const handleBack = () => {
    navigate(-1)
  }

  const handleSelect = (id: string) => {
    setSelected(id)
    if (id === "general" || id === "specialty") {
      navigate("/onboarding/my-account")
    } else if (id === "service") {
      navigate("/onboarding/outsourcing")
    } else if (id === "equipment") {
      navigate("/onboarding/engineer")
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header with back button */}
      <div className="flex items-center px-4 py-4 shrink-0">
        <button onClick={handleBack} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar value={20} className="mb-6" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">소속을 선택해주세요</h1>
        <p className="text-slate-500 mb-6">선택한 소속은 나중에 언제든지 변경할 수 있어요.</p>

        {/* Affiliation Cards */}
        <div className="space-y-3">
          {affiliationTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSelect(type.id)}
              className="w-full text-left"
            >
              <AffiliationCard
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
