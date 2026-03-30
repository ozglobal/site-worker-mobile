import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { useToast } from "@/contexts/ToastContext"
import { updateWorkerAddress } from "@/lib/profile"
// TODO: uncomment when 주소검색 API is ready
// import { AddressSearchDialog } from "@/components/ui/address-search-dialog"
// import SearchIcon from "@mui/icons-material/Search"

export function MyInfoPage() {
  const navigate = useNavigate()
  const { data: profile, isLoading: loading, isError, refetch } = useWorkerProfile()
  const { showSuccess, showError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    ssnFirst: "",
    ssnSecond: "",
    phone: "",
    address: "",
  })
  const [originalData, setOriginalData] = useState({ ...formData })

  useEffect(() => {
    if (profile) {
      const loaded = {
        name: profile.workerName,
        ssnFirst: profile.ssnFirst || "590905",
        ssnSecond: profile.ssnSecond || "1009824",
        phone: profile.phone,
        address: profile.address,
      }
      setFormData(loaded)
      setOriginalData(loaded)
    }
  }, [profile])

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData)
  const isFormValid = !!(formData.name && formData.ssnFirst && formData.ssnSecond && formData.phone && formData.address)

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

  // TODO: uncomment when 주소검색 API is ready
  // const [showAddressSearch, setShowAddressSearch] = useState(false)
  // const handleAddressSelect = (address: string) => {
  //   setFormData(prev => ({ ...prev, address }))
  //   setShowAddressSearch(false)
  // }

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const result = await updateWorkerAddress(formData.address)
      if (result.success) {
        await refetch()
        showSuccess("저장되었습니다.")
      } else {
        showError(result.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

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
      <AppTopBar title="내 정보" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : isError ? (
          <QueryErrorState onRetry={() => refetch()} message="내 정보를 불러오지 못했습니다." />
        ) : (
        <div className="flex flex-col min-h-full">
        <div className="px-4 py-6 space-y-6">
          {/* 회원 유형 */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">회원 유형</p>
            <button
              onClick={() => navigate("/profile/worker-type")}
              className="w-full bg-amber-50 border border-amber-500 rounded-xl p-4 flex items-center gap-3 text-left"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
                <path
                  d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                  stroke="#D97706"
                  strokeWidth="1.5"
                />
                <path d="M10 6V11" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="14" r="1" fill="#D97706" />
              </svg>
              <div className="flex-1">
                <p className="text-base font-bold text-slate-900">회원 유형을 먼저 선택해주세요</p>
                <p className="text-sm text-slate-500 mt-0.5">기본 유형에 따라 제출할 서류가 달라져요</p>
              </div>
              <svg className="h-5 w-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 이름 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">이름</label>
            <Input
              inputMode="text"
              enterKeyHint="next"
              autoComplete="name"
              lang="ko"
              maxLength={7}
              value={formData.name}
              onChange={handleChange("name")}
              placeholder="이름"
            />
            {formData.name.length >= 7 && (
              <p className="text-sm text-red-500">한글 이름은 최대 6글자까지 입력할 수 있습니다.</p>
            )}
          </div>

          {/* 주민등록번호 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">주민등록번호</label>
            <div className="flex items-center gap-2">
              <Input
                inputMode="numeric"
                maxLength={6}
                value={formData.ssnFirst}
                onChange={handleChange("ssnFirst")}
                placeholder="앞 6자리"
                className="flex-1"
              />
              <span className="text-slate-400">-</span>
              <div className="relative flex-1">
                <Input
                  inputMode="numeric"
                  maxLength={7}
                  value={formData.ssnSecond}
                  onChange={handleChange("ssnSecond")}
                  placeholder="뒤 7자리"
                  className="text-transparent caret-slate-900"
                />
                <div className="absolute inset-0 flex items-center px-4 pointer-events-none text-base text-slate-900">
                  {formData.ssnSecond.length > 0
                    ? formData.ssnSecond[0] + "●".repeat(formData.ssnSecond.length - 1)
                    : ""}
                </div>
              </div>
            </div>
          </div>

          {/* 연락처 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">연락처</label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              disabled
              className="bg-gray-100"
            />
          </div>

          {/* 주소 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">주소</label>
            <Input
              id="address"
              value={formData.address}
              onChange={handleChange("address")}
              placeholder="주소 입력"
              className="bg-white"
            />
          </div>

        </div>

          {/* Save Button */}
          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={isFormValid && hasChanges && !isSubmitting ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid || !hasChanges || isSubmitting}
              onClick={handleSave}
            >
              {isSubmitting ? "저장 중..." : "저장"}
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

      {/* TODO: uncomment when 주소검색 API is ready
      {showAddressSearch && (
        <AddressSearchDialog
          onSelect={handleAddressSelect}
          onClose={() => setShowAddressSearch(false)}
        />
      )}
      */}
    </div>
  )
}
