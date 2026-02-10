import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useHoneypot } from "@/hooks/useHoneypot"

export function SignUpStep3Page() {
  const navigate = useNavigate()
  const { honeypotProps, isBotDetected } = useHoneypot()
  const [formData, setFormData] = useState({
    password: "",
    passwordConfirm: "",
  })

  const handleBack = () => {
    navigate(-1)
  }

  const handleSubmit = () => {
    if (isBotDetected) return
    // TODO: Call signup API
    navigate("/signup/complete")
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const isFormValid =
    formData.password &&
    formData.passwordConfirm &&
    formData.password === formData.passwordConfirm

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={handleBack}
        className="shrink-0"
      />

      <main className="flex-1 overflow-y-auto bg-white px-4">
        <div className="mt-4">
          <p className="text-2xl font-bold text-slate-900 mb-6">비밀번호를 설정해주세요</p>

          <input {...honeypotProps} />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
              <Input
                type="password"
                value={formData.password}
                onChange={handleChange("password")}
                placeholder="비밀번호를 입력해주세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호 확인</label>
              <Input
                type="password"
                value={formData.passwordConfirm}
                onChange={handleChange("passwordConfirm")}
                placeholder="비밀번호를 다시 입력해주세요"
              />
              {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                <p className="text-red-500 text-sm mt-1">비밀번호가 일치하지 않습니다</p>
              )}
            </div>
          </div>

          <Button
            variant={isFormValid ? "primary" : "primaryDisabled"}
            size="full"
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="mt-8"
          >
            가입하기
          </Button>
        </div>
      </main>

      <AppBottomNav className="shrink-0" />
    </div>
  )
}
