import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { LabeledInput } from "@/components/ui/labeled-input"
import { Button } from "@/components/ui/button"
import { useHoneypot } from "@/hooks/useHoneypot"

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function SmsVerificationPage() {
  const navigate = useNavigate()
  const { honeypotProps, isBotDetected } = useHoneypot()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [showVerificationInput, setShowVerificationInput] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")

  const handleBack = () => {
    navigate(-1)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  const isPhoneComplete = phoneNumber.replace(/\D/g, "").length === 11

  const handleRequestCode = () => {
    if (isBotDetected) return
    if (isPhoneComplete) {
      alert("Backend에 NICE SMS 소지확인 API 요청.")
      setShowVerificationInput(true)
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={handleBack}
        className="shrink-0"
      />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          <div className="px-4 py-6">
            <p className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
              현재 이용중인 휴대폰 번호를<br /> 인증해주세요.
            </p>

            <input {...honeypotProps} />

            <div className="flex items-end gap-2">
              <LabeledInput
                label="휴대폰 번호"
                type="tel"
                placeholder="010-0000-0000"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="w-[190px]"
              />
              <Button
                variant={isPhoneComplete ? "primary" : "primaryDisabled"}
                onClick={handleRequestCode}
                disabled={!isPhoneComplete}
                className="h-12 w-[190px] whitespace-nowrap"
              >
                인증번호 받기
              </Button>
            </div>

            {showVerificationInput && (
              <div className="mt-4">
                <LabeledInput
                  label="인증번호"
                  type="text"
                  placeholder="인증번호 입력"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
            )}
          </div>

          {showVerificationInput && (
            <div className="px-4 py-6 mt-auto">
              <Button
                variant={verificationCode.length === 6 ? "primary" : "primaryDisabled"}
                size="full"
                disabled={verificationCode.length !== 6}
                onClick={() => {
                  navigate("/login/set-password")
                }}
              >
                다음
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
