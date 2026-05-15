import { useNavigate } from "react-router-dom"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { StatusListItem } from "@/components/ui/status-list-item"
import { Button } from "@/components/ui/button"
import { handleLogout } from "@/lib/auth"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { useDictItems } from "@/lib/queries/useDictItems"
import { useBankNames } from "@/lib/queries/useBankNames"
import { useDocumentSummary } from "@/lib/queries/useDocumentSummary"

export function MyInfoPage() {
  const navigate = useNavigate()
  const { data: profile } = useWorkerProfile()
  const { data: workerCategories = [] } = useDictItems("worker_category")
  const { data: banks = [] } = useBankNames()
  // 계좌 정보 미완료 판단:
  //  - 소속 회사 지급(COMPANY) 인 경우는 별도 계좌 입력이 필요 없으므로 OK
  //  - 그 외(SELF/PROXY) 에서 bankAccount 가 비어있으면 미완료
  const accountIncomplete = profile?.wagePaymentTarget !== 'COMPANY' && !profile?.bankAccount

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
  // bankName은 dict code("004")로 내려오므로 한글명 변환.
  const bankLabel = profile?.bankName
    ? (banks.find((b) => b.code === profile.bankName)?.name
       ?? banks.find((b) => b.name === profile.bankName)?.name
       ?? profile.bankName)
    : ""
  const accountDetail = profile?.bankAccount
    ? [bankLabel, profile.bankAccount].filter(Boolean).join(" ")
      + (profile.accountHolder ? ` (${profile.accountHolder})` : "")
    : ""
  const accountSubtitle = profile?.wagePaymentTarget === 'COMPANY'
    ? "소속 회사로 지급"
    : ([paymentLabel, accountDetail].filter(Boolean).join(" / ") || "예금주 · 계좌")

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
              title="내 정보"
              subtitle={
                (() => {
                  const koName = profile?.workerName || "이름"
                  const enName = profile?.workerNameEn
                  const isForeigner =
                    profile?.nationalityType === 'foreigner_registered'
                    || profile?.nationalityType === 'foreigner_unregistered'
                  return isForeigner && enName ? `${koName}(${enName})` : koName
                })()
              }
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
              statusLabel={accountIncomplete ? "미제출" : undefined}
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
