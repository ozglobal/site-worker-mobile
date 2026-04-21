import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen"
import { AppHeader } from "@/components/layout/AppHeader"
import { Button } from "@/components/ui/button"
import { signupStorage, workerMetaStorage } from "@/lib/storage"
import { IdFormFrn, type FrnFormValues } from "@/components/profile/IdFormFrn"

export function SignupFrnPage() {
  const navigate = useNavigate()

  const savedPhone = signupStorage.getPhone()
  const [formData, setFormData] = useState<FrnFormValues>({
    name: "",
    englishName: "",
    ssnFirst: "",
    ssnSecond: "",
    phone: savedPhone,
    address: "",
  })
  const allFieldsFilled =
    formData.name.trim() !== "" &&
    formData.ssnFirst.trim().length === 6 &&
    formData.ssnSecond.trim().length === 7 &&
    formData.address.trim() !== ""

  const keyboardOpen = useKeyboardOpen()

  const handleFieldChange = (field: keyof FrnFormValues, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    signupStorage.setData({
      nameKo: formData.name,
      nameEn: formData.englishName.trim() || undefined,
      nationalityType: 'foreigner_registered',
      idType: 'alien_registration',
      idNumber: `${formData.ssnFirst}-${formData.ssnSecond}`,
      address: formData.address,
    })
    workerMetaStorage.patch({ nationalityType: 'foreigner_registered', idType: 'alien_registration' })
    navigate("/signup/set-password")
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={() => navigate(-1)}
        className="shrink-0"
      />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          <IdFormFrn mode="signup" values={formData} onChange={handleFieldChange} />

          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={allFieldsFilled ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!allFieldsFilled}
              onClick={handleSave}
            >
              다음
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
