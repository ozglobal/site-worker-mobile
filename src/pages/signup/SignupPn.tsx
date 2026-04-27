import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen"
import { AppHeader } from "@/components/layout/AppHeader"
import { Button } from "@/components/ui/button"
import { signupStorage, workerMetaStorage } from "@/lib/storage"
import { IdFormPn, type PnFormValues } from "@/components/profile/IdFormPn"

export function SignupPnPage() {
  const navigate = useNavigate()

  const savedPhone = signupStorage.getPhone()
  const [formData, setFormData] = useState<PnFormValues>({
    name: "",
    englishName: "",
    gender: "",
    passport: "",
    nationality: "",
    birthdate: "",
    phone: savedPhone,
    address: "",
  })
  const allFieldsFilled =
    formData.name.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.passport.trim() !== "" &&
    formData.nationality.trim() !== "" &&
    formData.birthdate.trim() !== "" &&
    formData.address.trim() !== ""

  const keyboardOpen = useKeyboardOpen()

  const handleFieldChange = (field: keyof PnFormValues, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value as never }))
  }

  const handleSave = () => {
    signupStorage.setData({
      nameKo: formData.name,
      nameEn: formData.englishName.trim() || undefined,
      nationalityType: 'foreigner_unregistered',
      nationality: formData.nationality.trim() || undefined,
      idType: 'passport',
      idNumber: formData.passport,
      address: formData.address,
      gender: formData.gender || undefined,
      birthDate: formData.birthdate || undefined,
    })
    workerMetaStorage.patch({ nationalityType: 'foreigner_unregistered', idType: 'passport' })
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
          <IdFormPn mode="signup" values={formData} onChange={handleFieldChange} />

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
