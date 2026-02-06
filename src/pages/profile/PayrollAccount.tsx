import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"

export function PayrollAccountPage() {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={() => navigate(-1)}
        className="shrink-0"
      />

      <main className="flex-1 overflow-y-auto px-4">
        {/* Progress Bar */}
        <div className="flex h-1.5 rounded-full overflow-hidden mt-2 mb-8">
          <div className="bg-primary w-1/2" />
          <div className="bg-gray-200 w-1/2" />
        </div>

        <p className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
          급여 지급 방식을 알려주세요
        </p>
        <p className="text-sm text-slate-500 mb-8">
          입력한 정보는 나중에 언제든지 변경할 수 있어요.
        </p>

        <div className="space-y-3">
          {/* Option 1: Company */}
          <button
            onClick={() => navigate("/profile/payroll-account/company")}
            className="w-full p-5 rounded-xl border border-gray-200 text-left hover:border-gray-300 transition-colors"
          >
            <p className="font-bold text-slate-900">회사로 지급</p>
            <p className="text-sm text-slate-500 mt-1">
              소속된 용역 업체로 급여 지급
            </p>
          </button>

          {/* Option 2: Personal account */}
          <button
            onClick={() => navigate("/profile/my-account")}
            className="w-full p-5 rounded-xl border border-gray-200 text-left hover:border-gray-300 transition-colors"
          >
            <p className="font-bold text-slate-900">본인 계좌로 지급</p>
            <p className="text-sm text-slate-500 mt-1">
              본인이 입력한 계좌로 직접 지급
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}
