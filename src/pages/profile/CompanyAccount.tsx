import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { AlertCircle as ErrorOutlineIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useActivePartners } from "@/lib/queries/useActivePartners"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { updatePayment } from "@/lib/profile"
import { workerMetaStorage } from "@/lib/storage"
import { useToast } from "@/contexts/ToastContext"
import { useQueryClient } from "@tanstack/react-query"

/**
 * 급여 지급 방식 → 소속 회사 선택 시 노출되는 확인 페이지.
 * 근로자가 worker 토큰으로 vendor 의 계좌 정보를 직접 조회할 수 없어서
 * 회사명만 read-only 로 표시하고, 선택 버튼으로 wagePaymentTarget=COMPANY 저장.
 */
export function CompanyAccountPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  const { data: profile } = useWorkerProfile()
  const { data: partners } = useActivePartners()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const vendorName =
    partners?.find((p) => p.id === profile?.relatedVendorId)?.partnerName ?? ""

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const result = await updatePayment({
      wagePaymentTarget: "COMPANY",
      bankName: null,
      bankAccount: null,
      accountHolder: null,
      accountHolderRelation: null,
    })
    setIsSubmitting(false)
    if (!result.success) {
      showError(result.error)
      return
    }
    workerMetaStorage.patch({ wagePaymentTarget: "COMPANY" })
    await queryClient.invalidateQueries({ queryKey: ["workerProfile"] })
    showSuccess("급여를 소속 회사로 지급합니다.")
    navigate("/profile")
  }

  const handleNavigation = useBottomNavHandler()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction
        title=""
        showRightAction={false}
        onLeftActionClick={() => navigate(-1)}
        className="shrink-0"
      />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          <div className="px-4 py-6 space-y-5">
            <div>
              <h1 className="text-lg font-bold text-slate-900">용역회사 정보를 확인하세요</h1>
              <p className="mt-1 text-sm text-gray-500">소속 회사로 급여를 지급받습니다.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">소속 회사</label>
              <div className="h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center text-sm text-slate-500 cursor-not-allowed">
                {vendorName || "-"}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-3">
                <ErrorOutlineIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-700">소속 회사가 다른가요?</p>
                  <p className="text-sm text-slate-500 mt-1">
                    내 정보 &gt; 회원 유형에서 소속 회사를 수정해주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto px-4 py-6">
            <Button
              variant={vendorName && !isSubmitting ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!vendorName || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "저장 중..." : "선택"}
            </Button>
          </div>
        </div>
      </main>

      <AppBottomNav active="profile" onNavigate={handleNavigation} className="shrink-0" />
    </div>
  )
}
