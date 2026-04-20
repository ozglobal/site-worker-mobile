import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signupStorage, workerMetaStorage } from "@/lib/storage"

export function SignupPnPage() {
  const navigate = useNavigate()

  const savedPhone = signupStorage.getPhone()
  const [formData, setFormData] = useState({
    name: "",
    englishName: "",
    ssnFirst: "",
    ssnSecond: "",
    phone: savedPhone,
    address: "",
    gender: "",
    passport: "",
    birthdate: "",
  })
  const allFieldsFilled =
    formData.name.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.gender.trim() !== "" &&
    formData.passport.trim() !== "" &&
    formData.birthdate.trim() !== "" &&
    formData.address.trim() !== ""

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

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = () => {
    signupStorage.setData({
      nameKo: formData.name,
      nameEn: formData.englishName.trim() || undefined,
      nationalityType: 'foreigner_unregistered',
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
          <div className="px-4 py-6 space-y-6">
            <p className="text-lg font-bold text-slate-900 mb-6 leading-tight">
              회원 정보를 입력해주세요
            </p>

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

            {/* 한글 이름 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">한글 이름</label>
              <p className="text-sm text-slate-500">현장에서 사용할 짧은 한글 이름을 입력해 주세요.</p>
              <Input
                maxLength={6}
                value={formData.name}
                onChange={handleChange("name")}
                placeholder="한글 이름"
                className="bg-white"
              />
              {formData.name.length >= 6 && (
                <p className="text-sm text-red-500">한글 이름은 최대 6글자까지 입력할 수 있습니다</p>
              )}
            </div>

            {/* 영문 이름 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">영문 이름</label>
              <Input
                value={formData.englishName}
                onChange={handleChange("englishName")}
                placeholder="영문 이름"
                className="bg-white"
              />
            </div>

            {/* 성별 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">성별</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer w-[150px]">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-slate-700">남자</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-[150px]">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === "female"}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-slate-700">여자</span>
                </label>
              </div>
            </div>

            {/* 여권번호 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">여권번호</label>
              <Input
                maxLength={12}
                value={formData.passport}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
                  setFormData(prev => ({ ...prev, passport: value }))
                }}
                placeholder="여권번호"
                className="bg-white"
              />
              <div className="flex items-start gap-2 rounded-lg bg-gray-100 p-3">
                <svg className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-600">외국인등록번호가 없는 경우에만 여권번호로 가입할 수 있어요</span>
                  <button
                    onClick={() => navigate(-1)}
                    className="text-sm font-medium text-blue-500 text-left"
                  >
                    외국인등록번호로 가입하기
                  </button>
                </div>
              </div>
            </div>

            {/* 생년월일 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">생년월일</label>
              <Input
                inputMode="numeric"
                maxLength={10}
                value={formData.birthdate}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 8)
                  let formatted = digits
                  if (digits.length > 4) formatted = digits.slice(0, 4) + "-" + digits.slice(4)
                  if (digits.length > 6) formatted = digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6)
                  setFormData(prev => ({ ...prev, birthdate: formatted }))
                }}
                placeholder="yyyy-mm-dd"
                className="bg-white"
              />
            </div>

            {/* 주소 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">주소</label>
              <Input
                value={formData.address}
                onChange={handleChange("address")}
                placeholder="주소"
                className="bg-white"
              />
            </div>

          </div>

          {/* Save Button */}
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
