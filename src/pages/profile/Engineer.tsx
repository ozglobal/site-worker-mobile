import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OptionCard } from "@/components/ui/option-card"
import { StatusListItem } from "@/components/ui/status-list-item"
import { engineerStorage } from "@/lib/storage"

type EngineerType = "representative" | "employee"

export function EngineerPage() {
  const navigate = useNavigate()
  const saved = engineerStorage.get()
  const initialEngineerType: EngineerType = saved?.engineerType || "representative"
  const initialName = saved?.representativeName || ""
  const [engineerType, setEngineerType] = useState<EngineerType>(initialEngineerType)
  const [representativeName, setRepresentativeName] = useState(initialName)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasChanges =
    engineerType !== initialEngineerType || representativeName !== initialName

  // Focus the input whenever engineer type changes
  useEffect(() => {
    inputRef.current?.focus()
  }, [engineerType])

  const handleSubmit = () => {
    engineerStorage.update({ engineerType, representativeName })
    navigate(-1)
  }

  const isFormValid = representativeName.trim().length > 0

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

          {/* Save Button */}
          <div className="pt-2">
            <Button
              variant={isFormValid && hasChanges ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid || !hasChanges}
              onClick={handleSubmit}
            >
              저장
            </Button>
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
