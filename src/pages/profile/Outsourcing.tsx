import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
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

  const handleSubmit = () => {
    // TODO: Save outsourcing info
    navigate("/profile")
  }

  const isFormValid = selectedCompany !== ""

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

  const handleNavigation = (item: NavItem) => {
    if (item === "home") {
      navigate("/home")
    } else if (item === "attendance") {
      navigate("/attendance")
    } else if (item === "contract") {
      navigate("/contract")
    } else if (item === "profile") {
      navigate("/profile")
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppTopBar title="용역회사" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
        <div className="px-4 py-6 space-y-5">
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

          {/* Save Button */}
          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={isFormValid ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid}
              onClick={handleSubmit}
            >
              저장
            </Button>
          </div>
        </div>
      </main>

      <AppBottomNav
        active="profile"
        onNavigate={handleNavigation}
        className="shrink-0"
      />
    </div>
  )
}
