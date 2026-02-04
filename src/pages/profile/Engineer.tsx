import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { Button } from "@/components/ui/button"

type EngineerType = "representative" | "employee"

export function EngineerPage() {
  const navigate = useNavigate()
  const saved = JSON.parse(localStorage.getItem("engineer") || "null")
  const [engineerType, setEngineerType] = useState<EngineerType>(saved?.engineerType || "representative")
  const [representativeName, setRepresentativeName] = useState(saved?.representativeName || "")
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input whenever engineer type changes
  useEffect(() => {
    inputRef.current?.focus()
  }, [engineerType])

  const handleSubmit = () => {
    const existing = JSON.parse(localStorage.getItem("engineer") || "{}")
    localStorage.setItem("engineer", JSON.stringify({ ...existing, engineerType, representativeName }))
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
              {/* Representative Option */}
              <button
                type="button"
                onClick={() => setEngineerType("representative")}
                className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                  engineerType === "representative"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                      engineerType === "representative"
                        ? "border-primary"
                        : "border-gray-300"
                    }`}
                  >
                    {engineerType === "representative" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">대표자</p>
                    <p className="text-sm text-slate-500 mt-0.5">사업자등록증 보유</p>
                  </div>
                </div>
              </button>

              {/* Employee Option */}
              <button
                type="button"
                onClick={() => setEngineerType("employee")}
                className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                  engineerType === "employee"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                      engineerType === "employee"
                        ? "border-primary"
                        : "border-gray-300"
                    }`}
                  >
                    {engineerType === "employee" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">직원</p>
                    <p className="text-sm text-slate-500 mt-0.5">법인 소속 직원</p>
                  </div>
                </div>
              </button>
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
