import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { LabeledInput } from "@/components/ui/labeled-input"
import { Button } from "@/components/ui/button"
import { useHoneypot } from "@/hooks/useHoneypot"
import { signupStorage } from "@/lib/storage"

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

  // Position the button fixed above keyboard when it opens.
  // On Android, 100vh doesn't shrink with keyboard, so flex/mt-auto can't reach visible bottom.
  // Instead, detect keyboard via visualViewport and fix-position the button above it.
  const buttonRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const sync = () => {
      const btn = buttonRef.current
      if (!btn) return
      const kbHeight = window.innerHeight - vv.height
      if (kbHeight > 150) {
        const bottomOffset = window.innerHeight - vv.offsetTop - vv.height
        btn.style.position = "fixed"
        btn.style.left = "0"
        btn.style.right = "0"
        btn.style.bottom = `${bottomOffset}px`
        btn.style.zIndex = "50"
        btn.style.backgroundColor = "white"
      } else {
        btn.style.position = ""
        btn.style.left = ""
        btn.style.right = ""
        btn.style.bottom = ""
        btn.style.zIndex = ""
        btn.style.backgroundColor = ""
      }
    }
    vv.addEventListener("resize", sync)
    vv.addEventListener("scroll", sync)
    return () => {
      vv.removeEventListener("resize", sync)
      vv.removeEventListener("scroll", sync)
    }
  }, [])

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
            <div ref={buttonRef} className="px-4 py-6 mt-auto">
              <Button
                variant={verificationCode.length === 6 ? "primary" : "primaryDisabled"}
                size="full"
                disabled={verificationCode.length !== 6}
                onClick={() => {
                  signupStorage.setPhone(phoneNumber)
                  navigate("/signup/agreement")
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
