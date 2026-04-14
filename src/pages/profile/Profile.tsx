import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { StatusListItem } from "@/components/ui/status-list-item"
import { Button } from "@/components/ui/button"
import { handleLogout, authFetch } from "@/lib/auth"
import { useToast } from "@/contexts/ToastContext"

export function MyInfoPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()

  const handleNavigation = (item: NavItem) => {
    if (item === "home") navigate("/home")
    else if (item === "attendance") navigate("/attendance")
    else if (item === "contract") navigate("/contract")
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <AppHeader showLeftAction={false} title="시재건설" showRightAction={true} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="mt-6">
          <div className="bg-white rounded-xl mx-4 border border-gray-300 shadow-sm">
            <StatusListItem
              title="개인정보"
              subtitle="이름 · 연락처 · 주소"
              onClick={() => navigate("/profile/myinfo")}
            />
            <StatusListItem
              title="회원유형"
              subtitle="근로자 유형 관리"
              onClick={() => navigate("/profile/worker-type")}
            />
            <StatusListItem
              title="계좌정보"
              subtitle="급여 지급 방식 · 계좌"
              onClick={() => navigate("/profile/payroll-account")}
            />
            <StatusListItem
              title="제출서류"
              subtitle="필수 서류 제출 · 확인"
              onClick={() => navigate("/onboarding/documents", { state: { hideProgress: true } })}
              className="border-b-0"
            />
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-3 px-4 py-6 mt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/change-password")}
            className="flex-1 bg-white border-gray-200 text-slate-600 hover:bg-gray-50 font-semibold"
          >
            비밀번호 변경
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={handleLogout}
            className="flex-1 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 font-semibold"
          >
            로그아웃
          </Button>
        </div>

        {/* Test: Purge user data */}
        <div className="px-4 pb-4">
          <button
            onClick={async () => {
              const id = 1455
              const res = await authFetch(`/api/system/user/${id}/purge`, { method: "DELETE" })
              if (res.ok) {
                showSuccess("사용자 데이터가 초기화되었습니다.")
              } else {
                showError("초기화 실패")
              }
            }}
            className="text-xs text-slate-400 underline"
          >
            [TEST] 사용자 삭제
          </button>
        </div>
      </main>

      <AppBottomNav active="profile" onNavigate={handleNavigation} className="shrink-0" />
    </div>
  )
}
