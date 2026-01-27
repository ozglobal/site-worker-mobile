import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import { Button } from "@/components/ui/button"
import { fileStorage } from "@/lib/storage"

const equipmentTypes = [
  { id: "excavator", name: "굴삭기" },
  { id: "crane", name: "크레인" },
  { id: "forklift", name: "지게차" },
  { id: "loader", name: "로더" },
  { id: "dozer", name: "불도저" },
  { id: "roller", name: "로울러" },
  { id: "dump", name: "덤프트럭" },
  { id: "mixer", name: "믹서트럭" },
  { id: "pump", name: "펌프카" },
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

  const handleBack = () => {
    navigate(-1)
  }

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

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-4 shrink-0">
        <button onClick={handleBack} className="p-2 -ml-2">
          <ArrowBackIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Title */}
        <h1 className="text-l font-bold text-slate-900 mb-2">장비 정보를 등록해주세요</h1>
        <p className="text-sm text-slate-500 mb-6">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>

        {/* Form */}
        <div className="space-y-5">
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
          저장
        </Button>
      </div>
    </div>
  )
}
