import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function SetPasswordPage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  const hasAlphabet = /[a-zA-Z]/.test(formData.newPassword)
  const hasNumeric = /[0-9]/.test(formData.newPassword)
  const hasSpecial = /[^a-zA-Z0-9]/.test(formData.newPassword)
  const isPasswordValid =
    formData.newPassword.length >= 8 &&
    formData.newPassword.length <= 64 &&
    hasAlphabet && hasNumeric && hasSpecial

  const isFormValid =
    isPasswordValid &&
    formData.newPassword === formData.confirmPassword

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

  const confirmRef = useRef<HTMLInputElement>(null)
  const [passwordWasValid, setPasswordWasValid] = useState(false)

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setFormData(prev => ({ ...prev, [field]: newValue }))

    if (field === "newPassword") {
      const valid =
        newValue.length >= 8 &&
        newValue.length <= 64 &&
        /[a-zA-Z]/.test(newValue) &&
        /[0-9]/.test(newValue) &&
        /[^a-zA-Z0-9]/.test(newValue)
      if (valid && !passwordWasValid) {
        setPasswordWasValid(true)
        setTimeout(() => confirmRef.current?.focus(), 0)
      } else if (!valid) {
        setPasswordWasValid(false)
      }
    }
  }

  const handleSave = () => {
    if (!isFormValid) return
    navigate("/signup/complete")
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
          <form autoComplete="off" onSubmit={e => e.preventDefault()} className="px-4 py-6 space-y-6">
            <p className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
              비밀번호를 설정해주세요
            </p>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">비밀번호</label>
              <Input
                type="password"
                maxLength={64}
                value={formData.newPassword}
                onChange={handleChange("newPassword")}
                placeholder=""
                autoComplete="off"
                data-lpignore="true"
                name="signup-pw"
                className="bg-white"
              />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <span className={`text-xs ${formData.newPassword.length >= 8 ? "text-green-500" : "text-slate-400"}`}>
                  {formData.newPassword.length >= 8 ? "\u2713" : "\u2022"} 8자 이상
                </span>
                <span className={`text-xs ${hasAlphabet ? "text-green-500" : "text-slate-400"}`}>
                  {hasAlphabet ? "\u2713" : "\u2022"} 영문 포함
                </span>
                <span className={`text-xs ${hasNumeric ? "text-green-500" : "text-slate-400"}`}>
                  {hasNumeric ? "\u2713" : "\u2022"} 숫자 포함
                </span>
                <span className={`text-xs ${hasSpecial ? "text-green-500" : "text-slate-400"}`}>
                  {hasSpecial ? "\u2713" : "\u2022"} 특수문자 포함
                </span>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">비밀번호 확인</label>
              <Input
                ref={confirmRef}
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                placeholder="비밀번호 재입력"
                autoComplete="off"
                data-lpignore="true"
                name="signup-pw-confirm"
                disabled={!isPasswordValid}
                className={isPasswordValid ? "bg-white" : "bg-gray-100"}
              />
              {formData.confirmPassword.length > 0 && formData.confirmPassword.length >= formData.newPassword.length && formData.newPassword !== formData.confirmPassword && (
                <p className="text-sm text-red-500">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

          </form>

          {/* Save Button */}
          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={isFormValid ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid}
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
