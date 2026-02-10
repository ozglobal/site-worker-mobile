import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signupStorage } from "@/lib/storage"

export function SmsPage() {
  const navigate = useNavigate()

  const savedPhone = signupStorage.getPhone()
  const [formData, setFormData] = useState({
    name: "",
    ssnFirst: "",
    ssnSecond: "",
    phone: savedPhone,
    address: "",
  })
  const allFieldsFilled =
    formData.name.trim() !== "" &&
    formData.ssnFirst.trim().length === 6 &&
    formData.ssnSecond.trim().length === 7 &&
    formData.phone.trim() !== "" &&
    formData.address.trim() !== ""

  const mainRef = useRef<HTMLElement>(null)
  const ssnSecondRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLInputElement>(null)

  const handleFieldFocus = (e: React.FocusEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName !== "INPUT" || target.hasAttribute("disabled")) return

    setTimeout(() => {
      const main = mainRef.current
      if (!main) return
      const wrapper = target.closest(".space-y-2") as HTMLElement
      if (!wrapper) return
      const containerTop = main.getBoundingClientRect().top
      const wrapperTop = wrapper.getBoundingClientRect().top
      const scrollDelta = wrapperTop - containerTop - 8
      if (scrollDelta > 10) {
        main.scrollBy({ top: scrollDelta, behavior: "smooth" })
      }
    }, 300)
  }

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

      <main ref={mainRef} className="flex-1 overflow-y-auto" onFocus={handleFieldFocus}>
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

          {/* Save Button */}
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
