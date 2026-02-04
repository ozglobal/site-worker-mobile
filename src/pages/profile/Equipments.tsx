import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import { Button } from "@/components/ui/button"
import { fileStorage } from "@/lib/storage"

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

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const CERT_FILE_KEY = "equipment-cert"

export function EquipmentsPage() {
  const navigate = useNavigate()
  const engineer = JSON.parse(localStorage.getItem("engineer") || "null")
  const [selectedEquipment, setSelectedEquipment] = useState(engineer?.machine || "")
  const [certFile, setCertFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cachedFileName, setCachedFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  // Load cached file from IndexedDB on mount
  useEffect(() => {
    if (engineer?.representativeName) {
      fileStorage.get(CERT_FILE_KEY).then((file) => {
        if (file) {
          setCertFile(file)
          setCachedFileName(file.name)
          if (file.type.startsWith("image/")) {
            setPreviewUrl(URL.createObjectURL(file))
          }
        }
      })
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [])

  const handleSubmit = async () => {
    const existing = JSON.parse(localStorage.getItem("engineer") || "{}")
    localStorage.setItem("engineer", JSON.stringify({ ...existing, machine: selectedEquipment }))

    if (certFile) {
      try {
        await fileStorage.save(CERT_FILE_KEY, certFile)
      } catch {
        setFileError("파일 저장에 실패했습니다.")
        return
      }
    }

    navigate("/profile")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFileError(null)

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError("파일 크기가 10MB를 초과합니다.")
        setCertFile(null)
        return
      }
    }

    setCertFile(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (file && file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  const isFormValid = selectedEquipment !== ""

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
      <AppTopBar title="장비 정보" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
        <div className="px-4 py-6 space-y-5">
          {/* Equipment Type Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              장비 종류
            </label>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
            >
              <option value="" disabled>장비 선택</option>
              {equipmentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-3">
              <ErrorOutlineIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-700">내 장비를 찾을 수 없나요?</p>
                <p className="text-sm text-slate-500 mt-1">목록에 장비가 보이지 않을 경우 현장 관리자에게 등록을 요청해주세요.</p>
              </div>
            </div>
          </div>

          {/* Certificate File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              장비 자격증
            </label>
            <label className="flex items-center w-full h-12 px-4 rounded-lg border border-gray-200 bg-white cursor-pointer">
              <span className="font-medium text-slate-900 mr-2">파일 선택</span>
              <span className="text-sm text-slate-400 truncate">
                {certFile ? certFile.name : cachedFileName ? cachedFileName : "선택된 파일 없음"}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {fileError && (
              <p className="text-sm text-red-500 mt-2">{fileError}</p>
            )}
            {previewUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                <img src={previewUrl} alt="자격증 미리보기" className="w-full object-contain max-h-60" />
              </div>
            )}
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
              저장
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
