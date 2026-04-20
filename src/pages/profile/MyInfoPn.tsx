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
import { getWorkerName } from "@/lib/auth"

export function MyInfoPnPage() {
  const navigate = useNavigate()
  const { data: profile, isLoading: loading, isError, refetch } = useWorkerProfile()
  const { showSuccess, showError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    englishName: "",
    gender: "",
    passport: "",
    birthdate: "",
    phone: "",
    address: "",
  })
  const [originalData, setOriginalData] = useState({ ...formData })

  useEffect(() => {
    if (profile) {
      // Normalize gender to canonical "male"/"female" regardless of backend
      // shape (M/F, MALE/FEMALE, male/female, 남/여, 남자/여자).
      const rawGender = (profile.gender || "").toString().trim().toUpperCase()
      const genderValue =
        rawGender === "M" || rawGender === "MALE" || rawGender === "남" || rawGender === "남자"
          ? "male"
          : rawGender === "F" || rawGender === "FEMALE" || rawGender === "여" || rawGender === "여자"
          ? "female"
          : ""

      // Normalize birthDate to yyyy-MM-dd in case backend sends yyyymmdd.
      const rawBirth = (profile.birthDate || "").toString().trim()
      const birthDate = /^\d{8}$/.test(rawBirth)
        ? `${rawBirth.slice(0, 4)}-${rawBirth.slice(4, 6)}-${rawBirth.slice(6, 8)}`
        : rawBirth

      const loaded = {
        name: profile.workerName || getWorkerName() || "",
        englishName: profile.workerNameEn || "",
        gender: genderValue,
        // Passport number is a single masked string (no dash).
        passport: profile.idNumberMasked || profile.ssnFirst || "",
        birthdate: birthDate,
        phone: profile.phone,
        address: profile.address,
      }
      setFormData(loaded)
      setOriginalData(loaded)
    }
  }, [profile])

  const hasChanges = formData.address !== originalData.address
  const isFormValid = !!(formData.name && formData.phone && formData.address)

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
    if (item === "home") navigate("/home")
    else if (item === "attendance") navigate("/attendance")
    else if (item === "contract") navigate("/contract")
    else if (item === "profile") navigate("/profile")
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
          {/* 휴대폰 번호 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">휴대폰 번호</label>
            <Input
              type="tel"
              value={formData.phone}
              readOnly
              className="bg-gray-100 text-slate-500 pointer-events-none"
            />
          </div>

          {/* 한글 이름 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">한글 이름</label>
            <Input
              value={formData.name}
              readOnly
              className="bg-gray-100 text-slate-500 pointer-events-none"
            />
          </div>

          {/* 영문 이름 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">영문 이름</label>
            <Input
              value={formData.englishName}
              readOnly
              className="bg-gray-100 text-slate-500 pointer-events-none"
            />
          </div>

          {/* 성별 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">성별</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 w-[150px]">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  disabled
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm text-slate-700">남자</span>
              </label>
              <label className="flex items-center gap-2 w-[150px]">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  disabled
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm text-slate-700">여자</span>
              </label>
            </div>
          </div>

          {/* 여권번호 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">여권번호</label>
            <Input
              value={formData.passport}
              readOnly
              className="bg-gray-100 text-slate-500 pointer-events-none"
            />
          </div>

          {/* 생년월일 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">생년월일</label>
            <Input
              value={formData.birthdate}
              readOnly
              className="bg-gray-100 text-slate-500 pointer-events-none"
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
    </div>
  )
}
