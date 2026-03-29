import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { ProgressBar } from "@/components/ui/progress-bar"

const equipmentTypes = [
  { id: "bulldozer", name: "1. 불도저" },
  { id: "excavator", name: "2. 굴착기" },
  { id: "loader", name: "3. 로더" },
  { id: "forklift", name: "4. 지게차" },
  { id: "scraper", name: "5. 스크레이퍼" },
  { id: "dump-truck", name: "6. 덤프트럭" },
  { id: "crane", name: "7. 기중기" },
  { id: "motor-grader", name: "8. 모터그레이더" },
  { id: "roller", name: "9. 롤러" },
  { id: "subgrade-stabilizer", name: "10. 노상안정기" },
  { id: "concrete-batching-plant", name: "11. 콘크리트 뱃칭플랜트" },
  { id: "concrete-finisher", name: "12. 콘크리트 피니셔" },
  { id: "concrete-spreader", name: "13. 콘크리트 살포기" },
  { id: "concrete-mixer-truck", name: "14. 콘크리트 믹서트럭" },
  { id: "concrete-pump", name: "15. 콘크리트 펌프" },
  { id: "asphalt-mixing-plant", name: "16. 아스팔트 믹싱플랜트" },
  { id: "asphalt-finisher", name: "17. 아스팔트 피니셔" },
  { id: "asphalt-spreader", name: "18. 아스팔트 살포기" },
  { id: "aggregate-spreader", name: "19. 골재 살포기" },
  { id: "crusher", name: "20. 쇄석기" },
  { id: "air-compressor", name: "21. 공기압축기" },
  { id: "boring-machine", name: "22. 천공기" },
  { id: "pile-driver", name: "23. 항타 및 항발기" },
  { id: "gravel-collector", name: "24. 자갈채취기" },
  { id: "survey-line", name: "25. 준설선" },
  { id: "special-construction", name: "26. 특수건설기계" },
  { id: "tower-crane", name: "27. 타워크레인" },
]

export function OnboardingEquipmentPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const expiryInputRef = useRef<HTMLInputElement>(null)
  const [selectedEquipment, setSelectedEquipment] = useState("")
  const [certFile, setCertFile] = useState<File | null>(null)
  const [expiryDate, setExpiryDate] = useState("")

  const isFormValid = selectedEquipment && certFile && expiryDate

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
      <ProgressBar value={40} />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
        {/* Title */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-lg font-bold text-slate-900">장비 정보를 등록해주세요</h1>
          <p className="mt-1 text-sm text-gray-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
        </div>

        <div className="px-4 py-6 space-y-5">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              장비 종류
            </label>
            <Select
              options={equipmentTypes.map((t) => ({ value: t.id, label: t.name }))}
              value={selectedEquipment}
              onChange={(v) => { setSelectedEquipment(v); setTimeout(() => fileInputRef.current?.click(), 300) }}
              placeholder="장비 선택"
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-3">
              <ErrorOutlineIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-700">내 장비를 찾을 수 없나요?</p>
                <p className="text-sm text-slate-500 mt-1">목록에 장비가 보이지 않을 경우 현장 관리자에게 등록을 요청해주세요.</p>
              </div>
            </div>
          </div>

          {/* 장비 자격증 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              장비 자격증
            </label>
            <label className="flex items-center w-full h-12 px-4 rounded-lg border border-gray-200 bg-white cursor-pointer">
              <span className="font-medium text-slate-900 mr-2">파일 선택</span>
              <span className="text-sm text-slate-400 truncate">{certFile ? certFile.name : "선택된 파일 없음"}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setCertFile(file)
                  if (file) setTimeout(() => { expiryInputRef.current?.focus() }, 300)
                }}
                className="hidden"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 mt-4 mb-2">
              자격증 만료일
            </label>
            <input
              ref={expiryInputRef}
              type="text"
              value={expiryDate}
              onChange={(e) => { setExpiryDate(e.target.value); if (e.target.value) setTimeout(() => e.target.blur(), 100) }}
              onFocus={(e) => { const el = e.target; el.type = "date"; requestAnimationFrame(() => el.showPicker?.()) }}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text" }}
              placeholder="만료일 입력"
              className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-sm text-slate-900 placeholder:text-gray-400"
            />
          </div>
        </div>
        </div>
      </main>

      <div className="px-4 py-6 shrink-0">
        <Button
          variant={isFormValid ? "primary" : "primaryDisabled"}
          size="full"
          disabled={!isFormValid}
          onClick={() => {
            const equipmentName = equipmentTypes.find((t) => t.id === selectedEquipment)?.name || selectedEquipment
            navigate("/onboarding/equipments-list", { state: { name: equipmentName, expiryDate: expiryDate } })
          }}
        >
          등록하기
        </Button>
      </div>
    </div>
  )
}
