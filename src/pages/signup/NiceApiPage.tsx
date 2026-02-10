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

export function NiceApiPage() {
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
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={handleBack}
        className="shrink-0"
      />

      <main className="flex-1 overflow-hidden">
          <div className="px-4 py-6 space-y-6">
            <p className="text-xl font-bold text-slate-900 leading-tight">
              Backend API call이 보내준 <br></br>NICE 휴대폰 본인확인 서비스 페이지
            </p>

            <p className="text-sm text-slate-600 leading-relaxed">
              Backend는 NICE API 로부터 성명, 성별, 생년월일, 내/외국인, 휴대폰번호, 주민등록번호 값을 받아 frontend로 보내준다.
              <br></br>Frontend는 받은 정보를 서비스 이용약관 동의 페이지 다음에 나올 회원정보 입력 페이지에 표시한다.
            </p>

            {showVerificationInput && (
              <LabeledInput
                label="인증번호"
                type="text"
                placeholder="인증번호 입력"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            )}

            <Button
              variant="primary"
              size="full"
              onClick={() => navigate("/signup/agreement")}
            >
              다음
            </Button>
          </div>
      </main>
    </div>
  )
}
