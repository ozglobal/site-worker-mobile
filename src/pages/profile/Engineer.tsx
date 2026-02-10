import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { Button } from "@/components/ui/button"
import { OptionCard } from "@/components/ui/option-card"
import { engineerStorage } from "@/lib/storage"

type EngineerType = "representative" | "employee"

export function EngineerPage() {
  const navigate = useNavigate()
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
    navigate("/profile/equipments")
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
            <input
              type="text"
              value={representativeName}
              onChange={(e) => setRepresentativeName(e.target.value)}
              ref={inputRef}
              placeholder={engineerType === "representative" ? "대표자명 입력" : "소속 법인명 입력"}
              className="w-full h-12 px-4 rounded-lg border border-gray-200 text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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

      <AppBottomNav
        active="profile"
        onNavigate={handleNavigation}
        className="shrink-0"
      />
    </div>
  )
}
