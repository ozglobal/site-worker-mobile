import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/ui/progress-bar"

export function OnboardingEquipmentsListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<string[]>(["굴삭기"])

  const handleAdd = () => {
    navigate("/onboarding/equipments")
  }

  const handleDelete = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    navigate("/onboarding/company-account")
  }

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

          <div className="px-4 py-6 space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50"
              >
                <span className="font-medium text-slate-900">{item}</span>
                <button onClick={() => handleDelete(index)} className="p-1">
                  <DeleteOutlineIcon className="h-5 w-5 text-red-500" />
                </button>
              </div>
            ))}

            <button
              onClick={handleAdd}
              className="w-full py-4 rounded-xl bg-blue-50 text-primary font-medium"
            >
              장비 추가 등록
            </button>
          </div>

          {/* Save Button */}
          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant="primary"
              size="full"
              onClick={handleSubmit}
            >
              다음
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
