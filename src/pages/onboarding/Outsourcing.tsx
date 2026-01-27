import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import { Button } from "@/components/ui/button"

const companies = [
  { id: "lotte", name: "롯데건설" },
  { id: "kyungnam", name: "경남기업" },
  { id: "kyeryong", name: "계룡건설산업" },
  { id: "kwangshin", name: "광신종합건설" },
]

export function OutsourcingPage() {
  const navigate = useNavigate()
  const [selectedCompany, setSelectedCompany] = useState("")

  const handleBack = () => {
    navigate(-1)
  }

  const handleSubmit = () => {
    // TODO: Save outsourcing info
    console.log({ selectedCompany })
    navigate("/profile")
  }

  const isFormValid = selectedCompany !== ""

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-4 shrink-0">
        <button onClick={handleBack} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-4 mb-6">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-primary rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Title */}
        <h1 className="text-l font-bold text-slate-900 mb-2">용역회사 정보를 입력해주세요</h1>
        <p className="text-sm text-slate-500 mb-6">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>

        {/* Form */}
        <div className="space-y-5">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              용역회사
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
            >
              <option value="" disabled>용역회사 선택</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-3">
              <ErrorOutlineIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-700">내 용역회사를 찾을 수 없나요?</p>
                <p className="text-sm text-slate-500 mt-1">목록에 용역회사가 보이지 않을 경우 현장 관리자에게 등록을 요청해주세요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="px-4 py-6 shrink-0">
        <Button
          variant={isFormValid ? "primary" : "primaryDisabled"}
          size="full"
          onClick={handleSubmit}
          disabled={!isFormValid}
        >
          다음
        </Button>
      </div>
    </div>
  )
}
