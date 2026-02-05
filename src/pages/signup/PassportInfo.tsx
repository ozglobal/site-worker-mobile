import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function PassportInfoPage() {
  const navigate = useNavigate()

  const savedPhone = sessionStorage.getItem("signup_phone") || ""
  const [formData, setFormData] = useState({
    name: "",
    ssnFirst: "",
    ssnSecond: "",
    phone: savedPhone,
    address: "",
    gender: "",
    passport: "",
    birthdate: "",
  })
  const [originalData, setOriginalData] = useState({ ...formData })

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData)

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
    // Do nothing
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
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
            <p className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
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
                value={formData.name}
                onChange={handleChange("name")}
                placeholder="한글 이름"
                className="bg-white"
              />
            </div>

            {/* 영문 이름 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">영문 이름</label>
              <Input
                value={formData.name}
                onChange={handleChange("name")}
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
                    value="남자"
                    checked={formData.gender === "남자"}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-slate-700">남자</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-[150px]">
                  <input
                    type="radio"
                    name="gender"
                    value="여자"
                    checked={formData.gender === "여자"}
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
                value={formData.passport}
                onChange={handleChange("passport")}
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
                value={formData.birthdate}
                onChange={handleChange("birthdate")}
                placeholder="생년월일"
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
              variant={hasChanges ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!hasChanges}
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
