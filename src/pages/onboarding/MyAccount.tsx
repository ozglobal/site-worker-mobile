import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { ProgressBar } from "@/components/ui/progress-bar"
import { getWorkerName } from "@/lib/auth"

interface Bank {
  id: string
  name: string
}

const banks: Bank[] = [
  { id: "kb", name: "국민은행" },
  { id: "shinhan", name: "신한은행" },
  { id: "woori", name: "우리은행" },
  { id: "hana", name: "하나은행" },
  { id: "nh", name: "농협은행" },
  { id: "ibk", name: "기업은행" },
  { id: "kakao", name: "카카오뱅크" },
  { id: "toss", name: "토스뱅크" },
]

export function OnboardingMyAccountPage() {
  const navigate = useNavigate()
  const [accountHolder] = useState(getWorkerName() || "")
  const [selectedBank, setSelectedBank] = useState("")
  const [accountNumber, setAccountNumber] = useState("")

  const handleSubmit = () => {
    // TODO: Save account info
    navigate("/onboarding/documents")
  }

  const handleFamilyProxy = () => {
    navigate("/onboarding/family-account")
  }

  const isFormValid = selectedBank && accountNumber.length >= 10

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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Header with back button */}
      <div className="flex items-center px-4 py-4 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar value={40} className="mb-6" />

      {/* Title */}
      <div className="px-4 mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">급여 계좌 정보를 입력해주세요</h1>
        <p className="text-slate-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
        <div className="px-4 py-6 space-y-5">
          {/* Account Holder Name (readonly) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              예금주
            </label>
            <div className="w-full h-12 px-4 flex items-center rounded-lg border border-gray-200 bg-gray-50 text-slate-500">
              {accountHolder}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-3">
              <ErrorOutlineIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-700">본인 명의 계좌가 아닌가요?</p>
                <p className="text-sm text-slate-500 mt-1">가족 명의 계좌로 대리 수령이 가능합니다.</p>
                <button
                  onClick={handleFamilyProxy}
                  className="text-sm text-primary font-medium mt-2"
                >
                  가족 대리수령 신청하기
                </button>
              </div>
            </div>
          </div>

          {/* Bank Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              은행명
            </label>
            <Select
              options={banks.map((b) => ({ value: b.id, label: b.name }))}
              value={selectedBank}
              onChange={setSelectedBank}
              placeholder="은행 선택"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              계좌번호
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="- 없이 숫자만 입력"
            />
          </div>

        </div>

          {/* Save Button */}
          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={isFormValid ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid}
              onClick={handleSubmit}
            >
              저장
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
