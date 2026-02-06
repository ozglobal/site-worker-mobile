import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { changePassword } from "@/lib/profile"

export function ChangePasswordPage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    currentPassword: "",
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
    formData.currentPassword.length > 0 &&
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

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const [submitting, setSubmitting] = useState(false)

  const handleSave = async () => {
    if (!isFormValid || submitting) return
    setSubmitting(true)

    const res = await changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    })

    setSubmitting(false)

    if (res.success) {
      alert("비밀번호가 변경되었습니다.")
      navigate("/profile")
    } else {
      alert(res.error || "비밀번호 변경에 실패했습니다.")
    }
  }

  const handleNavigation = (item: NavItem) => {
    if (item === "home") {
      navigate("/home")
    } else if (item === "attendance") {
      navigate("/attendance")
    } else if (item === "contract") {
      navigate("/contract")
    } else if (item === "profile") {
      navigate("/profile")
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppTopBar title="비밀번호 변경" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
        <div className="px-4 py-6 space-y-6">
          {/* 현재 비밀번호 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">현재 비밀번호</label>
            <Input
              type="password"
              value={formData.currentPassword}
              onChange={handleChange("currentPassword")}
              placeholder="현재 비밀번호"
              className="bg-white"
            />
          </div>

          {/* 새 비밀번호 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">새 비밀번호</label>
            <Input
              type="password"
              maxLength={64}
              value={formData.newPassword}
              onChange={handleChange("newPassword")}
              placeholder=""
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

          {/* 새 비밀번호 확인 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">새 비밀번호 확인</label>
            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange("confirmPassword")}
              placeholder="새 비밀번호 재입력"
              className="bg-white"
            />
            {formData.confirmPassword.length > 0 && formData.confirmPassword.length >= formData.newPassword.length && formData.newPassword !== formData.confirmPassword && (
              <p className="text-sm text-red-500">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

        </div>

          {/* Save Button */}
          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={isFormValid && !submitting ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid || submitting}
              onClick={handleSave}
            >
              {submitting ? "변경 중..." : "변경"}
            </Button>
          </div>
        </div>
      </main>

      <AppBottomNav
        active="profile"
        onNavigate={handleNavigation}
        className="shrink-0"
      />
    </div>
  )
}
