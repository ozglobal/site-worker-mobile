import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"

export function DomesticForeignPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={handleBack}
        className="shrink-0"
      />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          <div className="px-4 py-6">
            <p className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
              회원 유형을 선택해주세요.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/signup/domestic-info")}
                className="flex-1 py-4 rounded-lg font-bold transition-colors bg-white text-slate-700 border border-gray-200 shadow-sm"
              >
                내국인
              </button>
              <button
                onClick={() => navigate("/signup/foreign-info")}
                className="flex-1 py-4 rounded-lg font-bold transition-colors bg-white text-slate-700 border border-gray-200 shadow-sm"
              >
                외국인
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
