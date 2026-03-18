import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import { Select } from "@/components/ui/select"
import { ProgressBar } from "@/components/ui/progress-bar"

const companies = [
  { id: "lotte", name: "롯데건설" },
  { id: "kyungnam", name: "경남기업" },
  { id: "kyeryong", name: "계룡건설산업" },
  { id: "kwangshin", name: "광신종합건설" },
]

export function OnboardingEquipmentsPage() {
  const navigate = useNavigate()
  const [selectedCompany, setSelectedCompany] = useState("")

  const [keyboardOpen, setKeyboardOpen] = useState(false)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const handleResize = () => {
      setKeyboardOpen(window.innerHeight - viewport.height > 150)
    }
    viewport.addEventListener("resize", handleResize)
    return () => viewport.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Header with back button */}
      <div className="flex items-center px-4 py-4 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar value={40} className="mb-6" />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
        {/* Title */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold text-slate-900">장비 정보를 입력해주세요</h1>
          <p className="mt-1 text-sm text-gray-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
        </div>

        <div className="px-4 py-6 space-y-5">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              장비 종류
            </label>
            <Select
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              value={selectedCompany}
              onChange={setSelectedCompany}
              placeholder="장비 선택"
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-3">
              <ErrorOutlineIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-700">내 장비를 찾을 수 없나요?</p>
                <p className="text-sm text-slate-500 mt-1">목록에 장비가 보이지 않을 경우 현장 관리자에게 등록을 요청해주세요.</p>
              </div>
            </div>
          </div>

          {/* 장비 자격증 */}
          <button
            onClick={() => navigate("/onboarding/equipments-list")}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white text-left"
          >
            <div>
              <p className="font-bold text-slate-900">장비 자격증</p>
              <p className="text-sm text-slate-500 mt-1">선택된 파일 없음</p>
            </div>
            <div className="flex items-center shrink-0 ml-4">
              <div className="flex items-center text-slate-400">
                <span className="text-sm">등록</span>
                <ChevronRightIcon className="h-5 w-5" />
              </div>
            </div>
          </button>
        </div>
        </div>
      </main>
    </div>
  )
}
