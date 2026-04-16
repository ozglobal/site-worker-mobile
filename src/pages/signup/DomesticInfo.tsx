import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signupStorage, workerMetaStorage } from "@/lib/storage"

export function DomesticInfoPage() {
  const navigate = useNavigate()

  const savedPhone = signupStorage.getPhone()
  const savedData = signupStorage.getData()
  const [savedSsnFirst = "", savedSsnSecond = ""] = (savedData.idNumber || "").split("-")
  const [formData, setFormData] = useState({
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

  const nameRef = useRef<HTMLInputElement>(null)
  const ssnSecondRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (field === "ssnFirst" && e.target.value.length === 6) {
      ssnSecondRef.current?.focus()
    }
    if (field === "ssnSecond" && e.target.value.length === 7) {
      addressRef.current?.focus()
    }
  }

  const handleSave = () => {
    signupStorage.setData({
      nameKo: formData.name,
      nationalityType: 'domestic',
      idType: 'resident_id',
      idNumber: `${formData.ssnFirst}-${formData.ssnSecond}`,
      address: formData.address,
    })
    workerMetaStorage.patch({ nationalityType: '내국인', idType: 'resident' })
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
          <div className="px-4 py-6 space-y-6">
            <p className="text-lg font-bold text-slate-900 mb-6 leading-tight">
              회원 정보를 입력해주세요
            </p>

            {/* 이름 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">이름</label>
              <Input
                ref={nameRef}
                value={formData.name}
                onChange={handleChange("name")}
                placeholder="이름 입력"
              />
            </div>

            {/* 주민등록번호 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">주민등록번호</label>
              <div className="flex items-center gap-2">
                <Input
                  value={formData.ssnFirst}
                  onChange={handleChange("ssnFirst")}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="앞 6자리"
                  className="flex-1"
                />
                <span className="text-slate-400">-</span>
                <Input
                  ref={ssnSecondRef}
                  value={formData.ssnSecond}
                  onChange={handleChange("ssnSecond")}
                  inputMode="numeric"
                  maxLength={7}
                  placeholder="뒤 7자리"
                  className="flex-1"
                />
              </div>
            </div>

            {/* 휴대폰 번호 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">휴대폰 번호</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={handleChange("phone")}
                disabled
                className="bg-gray-100"
              />
            </div>

            {/* 주소 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">주소</label>
              <Input
                ref={addressRef}
                value={formData.address}
                onChange={handleChange("address")}
                placeholder="주소"
                className="bg-white"
              />
            </div>

          </div>

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
