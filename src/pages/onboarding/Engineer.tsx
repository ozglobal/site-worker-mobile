import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
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

  const handleBack = () => {
    navigate(-1)
  }

  const handleSubmit = () => {
    const existing = JSON.parse(localStorage.getItem("engineer") || "{}")
    localStorage.setItem("engineer", JSON.stringify({ ...existing, engineerType, representativeName }))
    navigate("/onboarding/equipments")
  }

  const isFormValid = representativeName.trim().length > 0

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-4 shrink-0">
        <button onClick={handleBack} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-4 mb-6">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-primary rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Title */}
        <h1 className="text-l font-bold text-slate-900 mb-2">장비기사 분류를 선택해주세요</h1>
        <p className="text-sm text-slate-500 mb-6">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>

        {/* Form */}
        <div className="space-y-5">
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

        {/* Bottom spacer for scroll */}
        <div className="h-8" />
      </div>

      {/* Bottom Button */}
      <div className="px-4 py-6 shrink-0">
        <Button
          variant={isFormValid ? "primary" : "primaryDisabled"}
          size="full"
          onClick={handleSubmit}
          disabled={!isFormValid}
        >
          다음
        </Button>
      </div>
    </div>
  )
}
