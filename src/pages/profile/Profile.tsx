import { useNavigate } from "react-router-dom"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { StatusListItem } from "@/components/ui/status-list-item"
import { Button } from "@/components/ui/button"
import { handleLogout } from "@/lib/auth"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { useDictItems } from "@/lib/queries/useDictItems"
import { useDocumentSummary } from "@/lib/queries/useDocumentSummary"

export function MyInfoPage() {
  const navigate = useNavigate()
  const { data: profile } = useWorkerProfile()
  const { data: workerCategories = [] } = useDictItems("worker_category")
  const accountIncomplete = !profile?.accountHolder

  const workerCategoryLabel = profile?.workerCategory
    ? workerCategories.find((c) => c.code === profile.workerCategory)?.name
      ?? profile.workerCategory
    : ""

  const paymentLabels: Record<string, string> = {
    SELF: "본인 계좌",
    PROXY: "가족 계좌",
    COMPANY: "소속 회사",
  }
  const paymentLabel = profile?.wagePaymentTarget
    ? paymentLabels[profile.wagePaymentTarget] ?? profile.wagePaymentTarget
    : ""
  const accountSubtitle = [
    paymentLabel,
    profile?.accountHolder && profile?.bankAccount
      ? `${profile.accountHolder} · ${profile.bankAccount}`
      : "",
  ].filter(Boolean).join(" · ") || "예금주 · 계좌"

  const { requiredDocsCompleted: docsCompleted } = useDocumentSummary()
  const docsIncomplete = docsCompleted === false

  const handleNavigation = useBottomNavHandler()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <AppHeader showLeftAction={false} title="시재건설" showRightAction={true} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="mt-6">
          <div className="bg-white rounded-xl mx-4 border border-gray-300 shadow-sm">
            <StatusListItem
              title="개인정보"
              subtitle={profile?.workerName || "이름"}
              onClick={() => {
                const path =
                  profile?.idType === "alien_registration" ? "/profile/myinfo-frn"
                  : profile?.idType === "passport"         ? "/profile/myinfo-pn"
                  : "/profile/myinfo-rrn"
                navigate(path)
              }}
            />
            <StatusListItem
              title="회원유형"
              subtitle={workerCategoryLabel || "근로자 유형"}
              onClick={() => navigate("/profile/worker-type")}
            />
            <StatusListItem
              title="계좌정보"
              subtitle={accountSubtitle}
              status={accountIncomplete ? "incomplete" : undefined}
              statusLabel={accountIncomplete ? "미완료" : undefined}
              onClick={() => navigate("/profile/payroll-account")}
            />
            <StatusListItem
              title="제출서류"
              subtitle="필수 서류 제출 · 확인"
              status={docsIncomplete ? "incomplete" : undefined}
              statusLabel={docsIncomplete ? "미제출" : undefined}
              onClick={() => navigate("/profile/documents")}
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

      </main>

      <AppBottomNav active="profile" onNavigate={handleNavigation} className="shrink-0" />
    </div>
  )
}
