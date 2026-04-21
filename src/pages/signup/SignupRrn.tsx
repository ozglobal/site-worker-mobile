import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Button } from "@/components/ui/button"
import { signupStorage, workerMetaStorage } from "@/lib/storage"
import { IdFormRrn, type RrnFormValues } from "@/components/profile/IdFormRrn"

export function SignupRrnPage() {
  const navigate = useNavigate()

  const savedPhone = signupStorage.getPhone()
  const savedData = signupStorage.getData()
  const [savedSsnFirst = "", savedSsnSecond = ""] = (savedData.idNumber || "").split("-")
  const [formData, setFormData] = useState<RrnFormValues>({
    name: savedData.nameKo || "",
    ssnFirst: savedSsnFirst,
    ssnSecond: savedSsnSecond,
    phone: savedPhone,
    address: savedData.address || "",
  })
  const allFieldsFilled =
    formData.name.trim() !== "" &&
    formData.ssnFirst.trim().length === 6 &&
    formData.ssnSecond.trim().length === 7 &&
    formData.address.trim() !== ""

  const handleFieldChange = (field: keyof RrnFormValues, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    signupStorage.setData({
      nameKo: formData.name,
      nationalityType: 'domestic',
      idType: 'resident_id',
      idNumber: `${formData.ssnFirst}-${formData.ssnSecond}`,
      address: formData.address,
    })
    workerMetaStorage.patch({ nationalityType: 'domestic', idType: 'resident_id' })
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
          <IdFormRrn mode="signup" values={formData} onChange={handleFieldChange} />

          <div className="px-4 py-6 mt-auto">
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
