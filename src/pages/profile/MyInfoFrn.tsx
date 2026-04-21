import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { useToast } from "@/contexts/ToastContext"
import { updateWorkerAddress } from "@/lib/profile"
import { getWorkerName } from "@/lib/auth"
import { IdFormFrn, type FrnFormValues } from "@/components/profile/IdFormFrn"

export function MyInfoFrnPage() {
  const navigate = useNavigate()
  const { data: profile, isLoading: loading, isError, refetch } = useWorkerProfile()
  const { showSuccess, showError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<FrnFormValues>({
    name: "",
    englishName: "",
    ssnFirst: "",
    ssnSecond: "",
    phone: "",
    address: "",
  })
  const [originalAddress, setOriginalAddress] = useState("")

  useEffect(() => {
    if (profile) {
      // Backend ships the masked ID as one string like "901010-5******";
      // split by `-` into the two inputs.
      const [maskedFirst = "", maskedSecond = ""] = (profile.idNumberMasked || "").split("-")
      const loaded: FrnFormValues = {
        name: profile.workerName || getWorkerName() || "",
        englishName: profile.workerNameEn || "",
        ssnFirst: profile.ssnFirst || maskedFirst || "",
        ssnSecond: profile.ssnSecond || maskedSecond || "",
        phone: profile.phone,
        address: profile.address,
      }
      setFormData(loaded)
      setOriginalAddress(loaded.address)
    }
  }, [profile])

  const hasChanges = formData.address !== originalAddress
  const isFormValid = !!(formData.name && formData.phone && formData.address)

  const keyboardOpen = useKeyboardOpen()

  const handleFieldChange = (field: keyof FrnFormValues, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const result = await updateWorkerAddress(formData.address)
      if (result.success) {
        await refetch()
        showSuccess("저장되었습니다.")
        navigate("/profile")
      } else {
        showError(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNavigation = useBottomNavHandler()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppTopBar title="내 정보" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : isError ? (
          <QueryErrorState onRetry={() => refetch()} message="내 정보를 불러오지 못했습니다." />
        ) : (
        <div className="flex flex-col min-h-full">
          <IdFormFrn mode="edit" values={formData} onChange={handleFieldChange} />

          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={isFormValid && hasChanges && !isSubmitting ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid || !hasChanges || isSubmitting}
              onClick={handleSave}
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
        )}
      </main>

      <AppBottomNav
        active="profile"
        onNavigate={handleNavigation}
        className="shrink-0"
      />
    </div>
  )
}
