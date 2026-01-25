import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"

export function SignUpPage() {
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

      <main className="flex-1 overflow-y-auto px-4">
        {/* User type selection */}
        <div className="mt-4">
          <p className="text-2xl font-bold text-slate-900 mb-6">회원 유형을 선택해주세요</p>

          <div className="flex gap-4">
            {/* Domestic user */}
            <button
              onClick={() => navigate("/signup/step2", { state: { userType: "domestic" } })}
              className="flex-1 flex flex-col items-center justify-center py-6 rounded-lg border-2 transition-colors border-gray-200 hover:border-gray-300"
            >
              <span className="text-base font-bold text-slate-700">내국인</span>
            </button>

            {/* Foreign user */}
            <button
              onClick={() => navigate("/signup/step2", { state: { userType: "foreign" } })}
              className="flex-1 flex flex-col items-center justify-center py-6 rounded-lg border-2 transition-colors border-gray-200 hover:border-gray-300"
            >
              <span className="text-base font-bold text-slate-700">외국인</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
