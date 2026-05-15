import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen"
import { AppHeader } from "@/components/layout/AppHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/contexts/ToastContext"
import { signupStorage } from "@/lib/storage"
import { registerWorker } from "@/lib/auth"

export function SetPasswordPage() {
  const navigate = useNavigate()
  const { showError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const keyboardOpen = useKeyboardOpen()

  const confirmRef = useRef<HTMLInputElement>(null)

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = async () => {
    if (!isFormValid || isSubmitting) return

    const phone = signupStorage.getPhone()
    const data = signupStorage.getData()

    setIsSubmitting(true)
    // 여권으로 가입(외국인 미등록자) → 회원 유형 자동 '연수생(trainee)' 으로 지정.
    const isPassportSignup = data.idType === 'passport' || data.nationalityType === 'foreigner_unregistered'
    const result = await registerWorker({
      password: formData.newPassword,
      nameKo: data.nameKo || '',
      ...(data.nameEn ? { nameEn: data.nameEn } : {}),
      mobilePhone: phone,
      nationalityType: data.nationalityType || '',
      ...(data.nationality ? { nationality: data.nationality } : {}),
      idType: data.idType || '',
      ...(data.nationalIdNumber ? { nationalIdNumber: data.nationalIdNumber } : {}),
      ...(data.idNumber ? { idNumber: data.idNumber } : {}),
      ...(data.passportNumber ? { passportNumber: data.passportNumber } : {}),
      address: data.address || '',
      addressDetail: data.addressDetail || '',
      ...(data.gender ? { gender: data.gender } : {}),
      ...(data.birthDate ? { birthDate: data.birthDate } : {}),
      personalInfoConsent: data.personalInfoConsent ?? false,
      registrationToken: data.registrationToken || '',
      ...(isPassportSignup ? { workerCategory: 'trainee' } : {}),
    })
    setIsSubmitting(false)

    if (result.success) {
      signupStorage.clear()
      navigate("/signup/complete")
    } else {
      showError(result.error)
    }
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
              로그인에 사용할 비밀번호를 설정해주세요
            </p>

            {/* Chrome 의 "암호 업데이트?" 휴리스틱을 속이는 미끼 input.
                 username + current-password 가 form 에 이미 있으면 Chrome 은
                 "신규 등록" 으로 판단하지 않아 prompt 가 뜨지 않음. */}
            <input type="text" name="dummy-username" autoComplete="username" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }} readOnly />
            <input type="password" name="dummy-current-password" autoComplete="current-password" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }} readOnly />

            {/* 비밀번호 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">비밀번호</label>
              <Input
                type="text"
                value={formData.newPassword}
                onChange={handleChange("newPassword")}
                placeholder=""
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                name="signup-pw"
                aria-label="비밀번호"
                style={{ WebkitTextSecurity: "disc", textSecurity: "disc" } as React.CSSProperties}
                className="bg-white"
              />
              {formData.newPassword.length > 64 && (
                <p className="text-sm text-red-500">패스워드는 최대 64자까지 설정할 수 있습니다.</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <span className={`text-sm ${formData.newPassword.length >= 8 ? "text-green-600" : "text-red-500"}`}>
                  {formData.newPassword.length >= 8 ? "\u2713" : "\u2022"} 8자 이상
                </span>
                <span className={`text-sm ${hasAlphabet ? "text-green-600" : "text-red-500"}`}>
                  {hasAlphabet ? "\u2713" : "\u2022"} 영문 포함
                </span>
                <span className={`text-sm ${hasNumeric ? "text-green-600" : "text-red-500"}`}>
                  {hasNumeric ? "\u2713" : "\u2022"} 숫자 포함
                </span>
                <span className={`text-sm ${hasSpecial ? "text-green-600" : "text-red-500"}`}>
                  {hasSpecial ? "\u2713" : "\u2022"} 특수문자 포함
                </span>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">비밀번호 확인</label>
              <Input
                ref={confirmRef}
                type="text"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                placeholder="비밀번호 재입력"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                name="signup-pw-confirm"
                aria-label="비밀번호 확인"
                style={{ WebkitTextSecurity: "disc", textSecurity: "disc" } as React.CSSProperties}
                error={formData.confirmPassword.length > 0 && formData.confirmPassword.length >= formData.newPassword.length && formData.newPassword !== formData.confirmPassword}
                className="bg-white"
              />
              {formData.confirmPassword.length > 64 && (
                <p className="text-sm text-red-500">패스워드는 최대 64자까지 설정할 수 있습니다.</p>
              )}
              {formData.confirmPassword.length > 0 && formData.confirmPassword.length >= formData.newPassword.length && formData.newPassword !== formData.confirmPassword && (
                <p className="text-sm text-red-500">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

          </div>

          {/* Save Button */}
          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={isFormValid && !isSubmitting ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid || isSubmitting}
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
