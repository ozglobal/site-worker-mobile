import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AlertCircle as ErrorOutlineIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { useDictItems } from "@/lib/queries/useDictItems"
import { uploadEquipment } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"

export function EquipmentPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { data: equipmentTypes = [] } = useDictItems("EQUIPMENT_TYPE")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const validFromInputRef = useRef<HTMLInputElement>(null)
  const expiryInputRef = useRef<HTMLInputElement>(null)
  const [selectedEquipment, setSelectedEquipment] = useState("")
  const [certFile, setCertFile] = useState<File | null>(null)
  const [validFrom, setValidFrom] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFormValid = selectedEquipment && certFile && validFrom && expiryDate

  const keyboardOpen = useKeyboardOpen()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppTopBar title="장비 정보" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          <div className="px-4 pt-4 pb-2">
            <h1 className="text-lg font-bold text-slate-900">장비 정보를 등록해주세요</h1>
            <p className="mt-1 text-sm text-gray-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
          </div>

          <div className="px-4 py-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">장비 종류</label>
              <Select
                options={equipmentTypes.map((t) => ({ value: t.code, label: t.name }))}
                value={selectedEquipment}
                onChange={(v) => { setSelectedEquipment(v); setTimeout(() => fileInputRef.current?.click(), 300) }}
                placeholder="장비 선택"
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-3">
                <ErrorOutlineIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">내 장비를 찾을 수 없나요?</p>
                  <p className="text-sm text-slate-500 mt-1">목록에 장비가 보이지 않을 경우 현장 관리자에게 등록을 요청해주세요.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">장비 자격증</label>
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
                    if (file) setTimeout(() => { validFromInputRef.current?.focus() }, 300)
                  }}
                  className="hidden"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 mt-4 mb-2">자격증 발급일</label>
              <input
                ref={validFromInputRef}
                type="text"
                value={validFrom}
                onChange={(e) => { setValidFrom(e.target.value); if (e.target.value) setTimeout(() => expiryInputRef.current?.focus(), 100) }}
                onFocus={(e) => { e.target.type = "date" }}
                onClick={(e) => {
                  const el = e.currentTarget
                  el.type = "date"
                  try { el.showPicker?.() } catch { /* ignore */ }
                }}
                onBlur={(e) => { if (!e.target.value) e.target.type = "text" }}
                placeholder="발급일 입력"
                className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-sm text-slate-900 placeholder:text-gray-400"
              />
              <label className="block text-sm font-medium text-slate-700 mt-4 mb-2">자격증 만료일</label>
              <input
                ref={expiryInputRef}
                type="text"
                value={expiryDate}
                onChange={(e) => { setExpiryDate(e.target.value); if (e.target.value) setTimeout(() => e.target.blur(), 100) }}
                onFocus={(e) => { e.target.type = "date" }}
                onClick={(e) => {
                  const el = e.currentTarget
                  el.type = "date"
                  try { el.showPicker?.() } catch { /* ignore */ }
                }}
                onBlur={(e) => { if (!e.target.value) e.target.type = "text" }}
                placeholder="만료일 입력"
                className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-sm text-slate-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={isFormValid && !isSubmitting ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!isFormValid || isSubmitting}
              onClick={async () => {
                if (!certFile) return
                setIsSubmitting(true)
                const result = await uploadEquipment({
                  equipmentType: selectedEquipment,
                  licenseFile: certFile,
                  validFrom,
                  validUntil: expiryDate,
                })
                setIsSubmitting(false)
                if (!result.success) {
                  showError(result.error)
                  return
                }
                const equipmentName = equipmentTypes.find((t) => t.code === selectedEquipment)?.name || selectedEquipment
                showSuccess(`[${equipmentName}] 장비가 등록되었습니다.`)
                navigate("/profile/equipments-list", { state: { name: equipmentName, expiryDate } })
              }}
            >
              {isSubmitting ? "등록 중..." : "등록하기"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
