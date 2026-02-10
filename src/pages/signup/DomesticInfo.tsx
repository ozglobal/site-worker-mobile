import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signupStorage } from "@/lib/storage"

export function DomesticInfoPage() {
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

  // Shrink <main> via DOM when keyboard opens so content overflows and becomes scrollable.
  // Direct DOM manipulation avoids React state re-render delay.
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const handleResize = () => {
      const main = mainRef.current
      if (!main) return
      const kbHeight = window.innerHeight - viewport.height
      if (kbHeight > 150) {
        const headerHeight = main.getBoundingClientRect().top
        main.style.maxHeight = `${viewport.height - headerHeight}px`
      } else {
        main.style.maxHeight = ""
      }
    }
    viewport.addEventListener("resize", handleResize)
    return () => {
      viewport.removeEventListener("resize", handleResize)
      if (mainRef.current) mainRef.current.style.maxHeight = ""
    }
  }, [])

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
    <div className="flex h-screen flex-col overflow-hidden bg-white">
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

            {/* 이름 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">이름</label>
              <Input
                maxLength={6}
                value={formData.name}
                onChange={handleChange("name")}
                placeholder="이름"
                className="bg-white"
              />
              {formData.name.length >= 6 && (
                <p className="text-sm text-red-500">한글 이름은 최대 6글자까지 입력할 수 있습니다</p>
              )}
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
                  ref={ssnSecondRef}
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
