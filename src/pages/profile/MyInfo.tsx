import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { fetchWorkerMe } from "@/lib/profile"

export function MyInfoPage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: "",
    ssnFirst: "",
    ssnSecond: "",
    phone: "",
    address: "",
  })
  const [originalData, setOriginalData] = useState({ ...formData })
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    fetchWorkerMe().then((res) => {
      if (res.success && res.data) {
        const loaded = {
          name: res.data.workerName,
          ssnFirst: res.data.ssnFirst,
          ssnSecond: res.data.ssnSecond,
          phone: res.data.phone,
          address: res.data.address,
        }
        setFormData(loaded)
        setOriginalData(loaded)
      }
      setLoading(false)
    })
  }, [])

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData)

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

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = () => {
    // TODO: Call profile update API
  }

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
      <AppTopBar title="내 정보" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
        <div className="flex flex-col min-h-full">
        <div className="px-4 py-6 space-y-6">
          {/* 이름 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">이름</label>
            <Input
              value={formData.name}
              onChange={handleChange("name")}
              className="bg-white"
            />
          </div>

          {/* 주민등록번호 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">주민등록번호</label>
            <div className="flex items-center gap-2">
              <Input
                inputMode="numeric"
                maxLength={6}
                value={formData.ssnFirst}
                onChange={handleChange("ssnFirst")}
                className="flex-1 bg-white"
              />
              <span className="text-slate-400">-</span>
              <Input
                inputMode="numeric"
                maxLength={7}
                value={formData.ssnSecond}
                onChange={handleChange("ssnSecond")}
                className="flex-1 bg-white"
              />
            </div>
          </div>

          {/* 연락처 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">연락처</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={handleChange("phone")}
              className="bg-white"
            />
          </div>

          {/* 주소 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">주소</label>
            <Input
              value={formData.address}
              onChange={handleChange("address")}
              className="bg-white"
            />
          </div>

        </div>

          {/* Save Button */}
          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button
              variant={hasChanges ? "primary" : "primaryDisabled"}
              size="full"
              disabled={!hasChanges}
              onClick={handleSave}
            >
              저장
            </Button>
          </div>
        </div>
        )}
      </main>

      <AppBottomNav
        active="profile"
        onNavigate={handleNavigation}
        className="shrink-0"
      />
    </div>
  )
}
