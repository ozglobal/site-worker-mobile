import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { PhoneChangeModal } from "@/components/ui/PhoneChangeModal"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { useGenderDict } from "@/lib/queries/useGenderDict"
import { useToast } from "@/contexts/ToastContext"
import { updateWorkerAddress } from "@/lib/profile"
import { getWorkerName } from "@/lib/auth"
import { usePhoneChange } from "@/hooks/usePhoneChange"
import { IdFormPn, type PnFormValues } from "@/components/profile/IdFormPn"

export function MyInfoPnPage() {
  const navigate = useNavigate()
  const { isSuccess: genderDictReady } = useGenderDict()
  const { data: profile, isLoading: loading, isError, refetch } = useWorkerProfile({ enabled: genderDictReady })
  const { showSuccess, showError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<PnFormValues>({
    name: "",
    englishName: "",
    gender: "",
    passport: "",
    nationality: "",
    birthdate: "",
    phone: "",
    address: "",
  })
  const [originalAddress, setOriginalAddress] = useState("")

  useEffect(() => {
    if (profile) {
      const rawBirth = (profile.birthDate || "").toString().trim()
      const birthDate = /^\d{8}$/.test(rawBirth)
        ? `${rawBirth.slice(0, 4)}-${rawBirth.slice(4, 6)}-${rawBirth.slice(6, 8)}`
        : rawBirth

      const loaded: PnFormValues = {
        name: profile.workerName || getWorkerName() || "",
        englishName: profile.workerNameEn || "",
        gender: profile.gender || "",
        passport: profile.idNumberMasked || profile.ssnFirst || "",
        nationality: profile.nationality || "",
        birthdate: birthDate,
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

  const handleFieldChange = (field: keyof PnFormValues, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value as never }))
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

  const phoneChange = usePhoneChange()

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
          <IdFormPn
            mode="edit"
            values={formData}
            onChange={handleFieldChange}
            onPhoneChangeClick={phoneChange.openModal}
          />

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

      <PhoneChangeModal
        {...phoneChange}
        onPhoneInput={phoneChange.handlePhoneInput}
        onSendCode={phoneChange.handleSendCode}
        onChangePhone={phoneChange.handleChangePhone}
        onClose={phoneChange.closeModal}
        onVerificationCodeChange={phoneChange.setVerificationCode}
      />
    </div>
  )
}
