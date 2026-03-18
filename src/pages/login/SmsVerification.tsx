import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { LabeledInput } from "@/components/ui/labeled-input"
import { Button } from "@/components/ui/button"
import { useHoneypot } from "@/hooks/useHoneypot"
import { useToast } from "@/contexts/ToastContext"
import { sendPasswordCode } from "@/lib/auth"

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function SmsVerificationPage() {
  const navigate = useNavigate()
  const { showError } = useToast()
  const { honeypotProps, isBotDetected } = useHoneypot()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [showVerificationInput, setShowVerificationInput] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleBack = () => {
    navigate(-1)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  const isPhoneComplete = phoneNumber.replace(/\D/g, "").length === 11

  const handleRequestCode = async () => {
    if (isBotDetected) return
    if (!isPhoneComplete || isSending) return

    setIsSending(true)
    const result = await sendPasswordCode(phoneNumber)
    setIsSending(false)

    if (result.success) {
      setShowVerificationInput(true)
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
                variant={isPhoneComplete && !isSending ? "primary" : "primaryDisabled"}
                onClick={handleRequestCode}
                disabled={!isPhoneComplete || isSending}
                className="h-12 w-[190px] whitespace-nowrap"
              >
                {isSending ? "발송 중..." : "인증번호 받기"}
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
                  navigate("/login/set-password", { state: { phone: phoneNumber, code: verificationCode } })
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
