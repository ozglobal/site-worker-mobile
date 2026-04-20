import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { useActivePartners } from "@/lib/queries/useActivePartners"
import { updateWorkerCategory } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"

export function OutsourcingPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { data: profile } = useWorkerProfile()
  const { data: partners, isLoading, isError, refetch } = useActivePartners()
  const [selectedCompany, setSelectedCompany] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const result = await updateWorkerCategory({
      workerCategory: "labor_service",
      relatedVendorId: selectedCompany,
      ...(profile?.relatedSiteId ? { relatedSiteId: profile.relatedSiteId } : {}),
    })
    setIsSubmitting(false)
    if (!result.success) {
      showError(result.error)
      return
    }
    const companyName =
      partners?.find((p) => p.id === selectedCompany)?.partnerName || selectedCompany
    showSuccess(`[${companyName}]으로 변경되었습니다.`)
    navigate("/profile/worker-type")
  }

  const isFormValid = selectedCompany !== ""

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
      <AppTopBar title="용역회사" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
        <div className="px-4 py-6 space-y-5">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              용역회사
            </label>
            {isLoading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : isError ? (
              <QueryErrorState message="용역회사 목록을 불러오지 못했습니다" onRetry={refetch} />
            ) : (
              <Select
                options={(partners || []).map((p) => ({ value: p.id, label: p.partnerName }))}
                value={selectedCompany}
                onChange={setSelectedCompany}
                placeholder="용역회사 선택"
              />
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-3">
              <ErrorOutlineIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-700">내 용역회사를 찾을 수 없나요?</p>
                <p className="text-sm text-slate-500 mt-1">목록에 용역회사가 보이지 않을 경우 현장 관리자에게 등록을 요청해주세요.</p>
              </div>
            </div>
          </div>
        </div>

          {/* Save Button */}
          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={isFormValid && !isSubmitting ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </div>
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
