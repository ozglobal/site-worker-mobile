import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { ProgressBar } from "@/components/ui/progress-bar"

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

export function OnboardingFamilyAccountPage() {
  const navigate = useNavigate()
  const [familyName, setFamilyName] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [certificateFile, setCertificateFile] = useState<File | null>(null)

  const handleSubmit = () => {
    // TODO: Save family account info
    navigate("/onboarding/documents")
  }

  const isFormValid = familyName && selectedBank && accountNumber.length >= 10

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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">가족 명의 계좌 정보를 입력해주세요</h1>
        <p className="text-slate-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
        <div className="px-4 py-6 space-y-5">
          {/* Family Member Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              예금주
            </label>
            <Input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="예금주 이름"
            />
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

          {/* Bankbook Copy */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              통장사본
            </label>
            <label className="flex items-center w-full h-12 px-4 rounded-lg border border-gray-200 bg-white cursor-pointer">
              <span className="font-medium text-slate-900 mr-2">파일 선택</span>
              <span className="text-sm text-slate-400 truncate">
                {certificateFile ? certificateFile.name : "선택된 파일 없음"}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
              />
            </label>
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
