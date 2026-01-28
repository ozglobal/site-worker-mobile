import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { AlertBanner } from "@/components/ui/alert-banner"
import { AffiliationCard } from "@/components/ui/affiliation-card"
import { StatusListItem } from "@/components/ui/status-list-item"
import { Button } from "@/components/ui/button"
import { handleLogout } from "@/lib/auth"

export function ProfilePage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  const handleNavigation = (item: NavItem) => {
    if (item === "home") {
      navigate("/home")
    } else if (item === "attendance") {
      navigate("/attendance")
    } else if (item === "contract") {
      navigate("/contract")
    } else if (item === "profile") {
      // Already on profile page
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <AppHeader showLeftAction={false} title="시재건설" showRightAction={true} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <AlertBanner
            variant="error"
            title="필수 정보 입력이 완료되지 않았어요"
            description="급여 지급을 위해 월말까지 반드시 작성을 완료해주세요."
          />
        </div>

        {/* 내 소속 Section */}
        <div className="px-4 mt-2">
          <p className="text-sm font-medium text-slate-500 mb-3">내 소속</p>
          <AffiliationCard
            icon="👷"
            title="일반"
            subtitle="건설사 소속 근로자"
            actionLabel="변경"
            onClick={() => navigate("/profile/affiliation")}
          />
        </div>

        {/* 내 정보 Section */}
        <div className="mt-6">
          <p className="text-sm font-medium text-slate-500 px-4 mb-2">내 정보</p>
          <div className="bg-white rounded-xl mx-4 border border-gray-100">
            <StatusListItem
              title="내 프로필"
              subtitle="연락처 및 기본 정보"
              status="incomplete"
              onClick={() => navigate("/profile/myinfo")}
            />
            <StatusListItem
              title="계좌 정보"
              subtitle="급여 받을 계좌"
              status="incomplete"
              onClick={() => navigate("/profile/account")}
            />
            <StatusListItem
              title="신분증"
              subtitle="연락처 및 기본 정보"
              status="incomplete"
              onClick={() => navigate("/profile/id")}
            />
            <StatusListItem
              title="안전교육 이수증"
              subtitle="기초안전보건교육 이수증"
              status="incomplete"
              onClick={() => navigate("/profile/safety")}
            />
            <StatusListItem
              title="사업자등록증"
              subtitle="법인 사업자등록증"
              status="incomplete"
              onClick={() => navigate("/profile/business")}
            />
            <StatusListItem
              title="위임장"
              subtitle="급여 타인명의 지급 동의서"
              status="incomplete"
              onClick={() => navigate("/profile/delegation")}
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
            className="flex-1 bg-white border-gray-200 text-slate-900 hover:bg-gray-50"
          >
            비밀번호 변경
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={handleLogout}
            className="flex-1 bg-red-50 text-red-500 border border-red-100 hover:bg-red-100"
          >
            로그아웃
          </Button>
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
