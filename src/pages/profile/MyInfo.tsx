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
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)

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

  const hasChanges = formData.address !== originalData.address
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
        navigate("/profile")
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
          {/* 이름 */}
          <div className="space-y-2" onClick={() => setShowVerifyDialog(true)}>
            <label className="text-sm font-medium text-slate-700">이름</label>
            <Input
              value={formData.name}
              readOnly
              className="bg-white pointer-events-none"
            />
          </div>

          {/* 주민등록번호 */}
          <div className="space-y-2" onClick={() => setShowVerifyDialog(true)}>
            <label className="text-sm font-medium text-slate-700">주민등록번호</label>
            <div className="flex items-center gap-2">
              <Input
                value={formData.ssnFirst}
                readOnly
                className="flex-1 bg-white pointer-events-none"
              />
              <span className="text-slate-400">-</span>
              <Input
                value={formData.ssnSecond}
                readOnly
                className="flex-1 bg-white pointer-events-none"
              />
            </div>
          </div>

          {/* 연락처 */}
          <div className="space-y-2" onClick={() => setShowVerifyDialog(true)}>
            <label className="text-sm font-medium text-slate-700">연락처</label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              readOnly
              className="bg-white pointer-events-none"
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

      {/* 본인인증 Dialog */}
      {showVerifyDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowVerifyDialog(false)} />
          <div className="relative z-10 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-slate-900 text-center mb-3">정보 변경이 필요하신가요?</h2>
            <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
              인증 완료된 정보는 본인 인증을 다시 진행한 이후 변경할 수 있습니다.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="full"
                onClick={() => setShowVerifyDialog(false)}
                className="flex-1 bg-gray-100 border-0 text-slate-900 hover:bg-gray-200"
              >
                닫기
              </Button>
              <Button
                variant="primary"
                size="full"
                onClick={() => {
                  setShowVerifyDialog(false)
                  navigate("/signup/nice-api")
                }}
                className="flex-1"
              >
                본인인증
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
