import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function MyInfoPage() {
  const navigate = useNavigate()

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
      <AppTopBar title="내 정보" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-6">
          {/* 이름 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">이름</label>
            <Input value={JSON.parse(localStorage.getItem("profile") || "{}").workerName || ""} readOnly className="bg-white" />
          </div>

          {/* 주민등록번호 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">주민등록번호</label>
            <div className="flex items-center gap-2">
              <Input value="990123" readOnly className="flex-1 bg-white" />
              <span className="text-slate-400">-</span>
              <Input value="1●●●●●●" readOnly className="flex-1 bg-white" />
            </div>
          </div>

          {/* 연락처 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">연락처</label>
            <Input value="01012345678" readOnly className="bg-white" />
          </div>

          {/* 주소 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">주소</label>
            <Input value="서울특별시 강남구 논현로 646 포시에스빌딩" readOnly className="bg-white" />
          </div>
        </div>
      </main>

      {/* Bottom Button */}
      <div className="px-4 py-6 shrink-0">
        <Button
          variant="primaryDisabled"
          size="full"
          disabled
        >
          저장
        </Button>
      </div>

      <AppBottomNav
        active="profile"
        onNavigate={handleNavigation}
        className="shrink-0"
      />
    </div>
  )
}
