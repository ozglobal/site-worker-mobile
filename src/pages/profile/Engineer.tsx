import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OptionCard } from "@/components/ui/option-card"
import { StatusListItem } from "@/components/ui/status-list-item"
import { engineerStorage } from "@/lib/storage"
import { updateEngineerCategory } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"
import { useQueryClient } from "@tanstack/react-query"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"

type EngineerType = "representative" | "employee"

export function EngineerPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const queryClient = useQueryClient()
  const saved = engineerStorage.get()
  const initialEngineerType: EngineerType = saved?.engineerType || "representative"
  const initialName = saved?.representativeName || ""
  const [engineerType, setEngineerType] = useState<EngineerType>(initialEngineerType)
  const [representativeName, setRepresentativeName] = useState(initialName)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasChanges =
    engineerType !== initialEngineerType || representativeName !== initialName
  const isFormValid = representativeName.trim().length > 0

  // Focus the input whenever engineer type changes
  useEffect(() => {
    inputRef.current?.focus()
  }, [engineerType])

  const handleSubmit = async () => {
    if (isSubmitting) return
    const isRepresentative = engineerType === "representative"
    setIsSubmitting(true)
    try {
      const result = await updateEngineerCategory({
        equipmentCompanyName: isRepresentative ? "" : representativeName,
        equipmentCompanyOwner: isRepresentative ? representativeName : "",
        isRepresentative,
      })
      if (!result.success) {
        showError(result.error)
        return
      }
      engineerStorage.update({ engineerType, representativeName })
      queryClient.invalidateQueries({ queryKey: ['workerProfile'] })
      showSuccess("[장비기사] 내용이 변경되었습니다.")
      navigate(-1)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNavigation = useBottomNavHandler()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppTopBar title="장비기사" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
        <div className="px-4 py-6 space-y-5">
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

          {/* 장비등록 link */}
          <div className="bg-white rounded-xl border border-gray-300 shadow-sm">
            <StatusListItem
              title="장비등록"
              subtitle="건설 기계 장비"
              onClick={() => navigate("/profile/equipments")}
              className="border-b-0"
            />
          </div>
        </div>

          {/* Save Button */}
          <div className="px-4 py-6 mt-auto">
            <Button
              variant={isFormValid && hasChanges && !isSubmitting ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid || !hasChanges || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </main>

      <AppBottomNav
        active="profile"
        onNavigate={handleNavigation}
        className="shrink-0"
      />
    </div>
  )
}
