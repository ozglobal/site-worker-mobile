import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function DomesticInfoPage() {
  const navigate = useNavigate()

  const savedPhone = sessionStorage.getItem("signup_phone") || ""
  const [formData, setFormData] = useState({
    name: "",
    ssnFirst: "",
    ssnSecond: "",
    phone: savedPhone,
    address: "",
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

            {/* 이름 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">이름</label>
              <Input
                value={formData.name}
                onChange={handleChange("name")}
                placeholder="이름"
                className="bg-white"
              />
            </div>

            {/* 주민등록번호 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">주민등록번호</label>
              <div className="flex items-center gap-2">
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={formData.ssnFirst}
                  onChange={handleChange("ssnFirst")}
                  placeholder="앞 6자리"
                  className="flex-1 bg-white"
                />
                <span className="text-slate-400">-</span>
                <Input
                  inputMode="numeric"
                  maxLength={7}
                  value={formData.ssnSecond}
                  onChange={handleChange("ssnSecond")}
                  placeholder="뒤 7자리"
                  className="flex-1 bg-white"
                />
              </div>
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
