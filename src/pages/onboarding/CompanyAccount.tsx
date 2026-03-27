import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { ProgressBar } from "@/components/ui/progress-bar"

interface PaymentMethod {
  id: string
  title: string
  subtitle: string
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "personal",
    title: "본인 계좌로 지급",
    subtitle: "본인이 입력한 계좌로 직접 지급",
  },
  {
    id: "family",
    title: "가족 계좌로 지급",
    subtitle: "가족 명의 계좌로 급여 지급",
  },
  {
    id: "company",
    title: "소속 회사로 지급",
    subtitle: "소속된 용역 업체로 급여 지급",
  },
]

export function OnboardingCompanyAccountPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)

  const handleBack = () => {
    navigate(-1)
  }

  const handleSelect = (id: string) => {
    setSelected(id)
    if (id === "company") {
      navigate("/onboarding/documents")
    } else if (id === "personal") {
      navigate("/onboarding/my-account")
    } else if (id === "family") {
      navigate("/onboarding/family-account")
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header with back button */}
      <div className="flex items-center px-4 h-14 shrink-0">
        <button onClick={handleBack} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar value={20} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Title */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-lg font-bold text-slate-900">급여 지급 방식을 알려주세요</h1>
          <p className="mt-1 text-sm text-gray-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
        </div>

        {/* Payment Method Cards */}
        <div className="px-4 pt-4 space-y-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleSelect(method.id)}
              className="w-full text-left"
            >
              <div className={`rounded-xl border p-4 ${
                selected === method.id
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:bg-gray-50"
              }`}>
                <p className="font-semibold text-slate-900">{method.title}</p>
                <p className="text-sm text-gray-500 mt-1">{method.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
