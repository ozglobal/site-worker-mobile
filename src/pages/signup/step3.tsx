import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav } from "@/components/layout/AppBottomNav"

export function SignUpStep3Page() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    password: "",
    passwordConfirm: "",
  })

  const handleBack = () => {
    navigate(-1)
  }

  const handleSubmit = () => {
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
    <div className="flex h-screen flex-col overflow-hidden">
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={formData.password}
                onChange={handleChange("password")}
                placeholder="비밀번호를 입력해주세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호 확인</label>
              <input
                type="password"
                value={formData.passwordConfirm}
                onChange={handleChange("passwordConfirm")}
                placeholder="비밀번호를 다시 입력해주세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
              {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                <p className="text-red-500 text-sm mt-1">비밀번호가 일치하지 않습니다</p>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`w-full mt-8 py-4 rounded-lg font-medium transition-colors ${
              isFormValid
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            가입하기
          </button>
        </div>
      </main>

      <AppBottomNav className="shrink-0" />
    </div>
  )
}
