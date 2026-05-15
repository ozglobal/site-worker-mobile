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
import { updateMyInfo } from "@/lib/profile"
import { getWorkerName } from "@/lib/auth"
import { usePhoneChange } from "@/hooks/usePhoneChange"
import { PhoneChangeModal } from "@/components/ui/PhoneChangeModal"
import { IdFormRrn, type RrnFormValues } from "@/components/profile/IdFormRrn"

export function MyInfoRrnPage() {
  const navigate = useNavigate()
  const { data: profile, isLoading: loading, isError, refetch } = useWorkerProfile()
  const { showSuccess, showError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)

  const [formData, setFormData] = useState<RrnFormValues>({
    name: "",
    ssnFirst: "",
    ssnSecond: "",
    phone: "",
    address: "",
    addressDetail: "",
  })
  const [original, setOriginal] = useState<RrnFormValues>({ name: "", ssnFirst: "", ssnSecond: "", phone: "", address: "", addressDetail: "" })

  useEffect(() => {
    if (profile) {
      // Backend ships the masked ID as one string like "901010-1******";
      // split by `-` into the two inputs.
      // 내국인 → nationalIdNumberMasked, 외국인 등록자 → idNumberMasked.
      const maskedSource = profile.nationalIdNumberMasked || profile.idNumberMasked || ""
      const [maskedFirst = "", maskedSecond = ""] = maskedSource.split("-")
      const loaded: RrnFormValues = {
        name: profile.workerName || getWorkerName() || "",
        ssnFirst: profile.ssnFirst || maskedFirst || "",
        ssnSecond: profile.ssnSecond || maskedSecond || "",
        phone: profile.phone,
        address: profile.address,
        addressDetail: profile.addressDetail || "",
      }
      setFormData(loaded)
      setOriginal(loaded)
    }
  }, [profile])

  const hasChanges =
    formData.name !== original.name ||
    formData.ssnFirst !== original.ssnFirst ||
    formData.ssnSecond !== original.ssnSecond ||
    formData.address !== original.address ||
    formData.addressDetail !== original.addressDetail
  const isFormValid = !!(formData.name && formData.ssnFirst && formData.ssnSecond && formData.phone && formData.address)

  const keyboardOpen = useKeyboardOpen()

  const handleFieldChange = (field: keyof RrnFormValues, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const payload: Parameters<typeof updateMyInfo>[0] = {}
      if (formData.name !== original.name) payload.nameKo = formData.name
      if (formData.address !== original.address) payload.address = formData.address
      if (formData.addressDetail !== original.addressDetail) payload.addressDetail = formData.addressDetail
      const ssnChanged =
        (formData.ssnFirst !== original.ssnFirst || formData.ssnSecond !== original.ssnSecond) &&
        !formData.ssnFirst.includes("*") &&
        !formData.ssnSecond.includes("*")
      if (ssnChanged) {
        payload.nationalIdNumber = `${formData.ssnFirst}${formData.ssnSecond}`
      }
      const result = await updateMyInfo(payload)
      if (result.success) {
        await refetch()
        showSuccess("저장되었습니다.")
        setEditing(false)
      } else {
        showError(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData(original)
    setEditing(false)
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
          <IdFormRrn mode="edit" values={formData} onChange={handleFieldChange} onPhoneChangeClick={phoneChange.openModal} verified={profile?.isVerified ?? false} readOnly={!editing} />

          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            {editing ? (
              <div className="flex gap-3">
                <Button variant="outline" size="full" onClick={handleCancel} disabled={isSubmitting} className="flex-1 bg-white border-gray-200 text-slate-900 hover:bg-gray-50">
                  취소
                </Button>
                <Button
                  variant={isFormValid && hasChanges && !isSubmitting ? "primary" : "primaryDisabled"}
                  size="full"
                  disabled={!isFormValid || !hasChanges || isSubmitting}
                  onClick={handleSave}
                  className="flex-1"
                >
                  {isSubmitting ? "저장 중..." : "저장"}
                </Button>
              </div>
            ) : (
              <Button variant="primary" size="full" onClick={() => setEditing(true)}>
                내 정보 수정
              </Button>
            )}
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
