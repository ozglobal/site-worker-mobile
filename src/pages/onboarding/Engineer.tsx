import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OptionCard } from "@/components/ui/option-card"
import { ProgressBar } from "@/components/ui/progress-bar"
import { engineerStorage } from "@/lib/storage"
import { useOnboardingDraft } from "@/contexts/OnboardingDraftContext"

type EngineerType = "representative" | "employee"

export function OnboardingEngineerPage() {
  const navigate = useNavigate()
  const { patch: patchDraft } = useOnboardingDraft()
  const saved = engineerStorage.get()
  const [engineerType, setEngineerType] = useState<EngineerType>(saved?.engineerType || "representative")
  const [representativeName, setRepresentativeName] = useState(saved?.representativeName || "")
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input whenever engineer type changes
  useEffect(() => {
    inputRef.current?.focus()
  }, [engineerType])

  const handleSubmit = () => {
    engineerStorage.update({ engineerType, representativeName })
    patchDraft({
      equipmentCompanyOwner: engineerType === "representative" ? representativeName : null,
      equipmentCompanyName: engineerType === "employee" ? representativeName : null,
    })
    navigate("/onboarding/daily-wage")
  }

  const isFormValid = representativeName.trim().length > 0

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
      <div className="flex items-center px-4 h-14 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar value={50} />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
        <div className="px-4 pt-4 pb-6">
          <h1 className="text-lg font-bold text-slate-900">장비기사 분류를 선택해주세요</h1>
          <p className="mt-1 text-sm text-gray-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
        </div>
        <div className="px-4 pt-2 space-y-5">
          {/* Engineer Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              구분
            </label>
            <div className="space-y-3">
              <OptionCard
                title="대표자"
                description="사업자등록증 보유"
                selected={engineerType === "representative"}
                showRadio
                onClick={() => setEngineerType("representative")}
              />
              <OptionCard
                title="직원"
                description="법인 소속 직원"
                selected={engineerType === "employee"}
                showRadio
                onClick={() => setEngineerType("employee")}
              />
            </div>
          </div>

          {/* Name Input (label changes based on engineer type) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {engineerType === "representative" ? "대표자명" : "소속 법인명"}
            </label>
            <Input
              type="text"
              value={representativeName}
              onChange={(e) => setRepresentativeName(e.target.value)}
              ref={inputRef}
              placeholder={engineerType === "representative" ? "대표자명 입력" : "소속 법인명 입력"}
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
              다음
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
