import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { ProgressBar } from "@/components/ui/progress-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

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

interface FamilyAccountPageProps {
  mode?: "onboarding" | "profile"
}

export function FamilyAccountPage({ mode = "profile" }: FamilyAccountPageProps) {
  const navigate = useNavigate()
  const [familyName, setFamilyName] = useState("")
  const [relationship, setRelationship] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [certificateFile, setCertificateFile] = useState<File | null>(null)

  const handleSubmit = () => {
    // TODO: Save family account info
    navigate(mode === "onboarding" ? "/onboarding/documents" : "/profile")
  }

  const isFormValid = familyName && relationship && selectedBank && accountNumber.length >= 10

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

  const handleNavigation = (item: NavItem) => {
    if (item === "home") navigate("/home")
    else if (item === "attendance") navigate("/attendance")
    else if (item === "contract") navigate("/contract")
    else if (item === "profile") navigate("/profile")
  }

  const content = (
    <>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-slate-900">가족 명의 계좌 정보를 입력해주세요</h1>
        <p className="mt-1 text-sm text-gray-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
      </div>
      <div className="px-4 py-6 space-y-5">
        {/* Family Member Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">예금주</label>
          <Input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="예금주 이름"
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">예금주와의 관계</label>
          <Select
            options={[
              { value: "parent", label: "부모" },
              { value: "spouse", label: "배우자" },
              { value: "child", label: "자녀" },
            ]}
            value={relationship}
            onChange={setRelationship}
            placeholder="관계 선택"
          />
        </div>

        {/* Bank Select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">은행명</label>
          <Select
            options={banks.map((b) => ({ value: b.id, label: b.name }))}
            value={selectedBank}
            onChange={setSelectedBank}
            placeholder="은행 선택"
          />
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">계좌번호</label>
          <Input
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="- 없이 숫자만 입력"
          />
        </div>

      </div>
    </>
  )

  if (mode === "onboarding") {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        <AppHeader
          showLeftAction={true}
          title=""
          showRightAction={false}
          onLeftActionClick={() => navigate(-1)}
          className="shrink-0"
        />
        <ProgressBar value={40} />
        <main className="flex-1 overflow-y-auto">
          <div className="flex flex-col min-h-full">
            {content}
            <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
              <Button
                variant={isFormValid ? "primary" : "primaryDisabled"}
                size="full"
                disabled={!isFormValid}
                onClick={handleSubmit}
              >
                다음
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction={true}
        title="가족 대리수령"
        showRightAction={false}
        onLeftActionClick={() => navigate(-1)}
        className="shrink-0"
      />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          {content}
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
      <AppBottomNav active="profile" onNavigate={handleNavigation} className="shrink-0" />
    </div>
  )
}
