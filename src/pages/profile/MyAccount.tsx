import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import { Button } from "@/components/ui/button"
import { fetchWorkerMe } from "@/lib/profile"

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

export function MyAccountPage() {
  const navigate = useNavigate()
  const [accountHolder, setAccountHolder] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    fetchWorkerMe().then((res) => {
      if (res.success && res.data) {
        setAccountHolder(res.data.accountHolder)
        setSelectedBank(res.data.bankName)
        setAccountNumber(res.data.bankAccountMasked)
      }
      setLoading(false)
    })
  }, [])

  const handleSubmit = () => {
    // TODO: Save account info
    navigate("/profile")
  }

  const handleFamilyProxy = () => {
    navigate("/profile/family-account")
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

  const handleNavigation = (item: NavItem) => {
    if (item === "home") {
      navigate("/home")
    } else if (item === "attendance") {
      navigate("/attendance")
    } else if (item === "contract") {
      navigate("/contract")
    } else if (item === "profile") {
      navigate("/profile")
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppTopBar title="계좌 정보" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
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
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
            >
              <option value="" disabled>은행 선택</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              계좌번호
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="- 없이 숫자만 입력"
              className="w-full h-12 px-4 rounded-lg border border-gray-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
        )}
      </main>

      <AppBottomNav
        active="profile"
        onNavigate={handleNavigation}
        className="shrink-0"
      />
    </div>
  )
}
