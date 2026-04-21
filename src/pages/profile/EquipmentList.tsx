import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function EquipmentListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const incoming = location.state as { name?: string; expiryDate?: string } | null

  const [items, setItems] = useState<{ name: string; expiryDate: string }[]>(() => {
    if (incoming?.name && incoming?.expiryDate) {
      return [{ name: incoming.name, expiryDate: incoming.expiryDate }]
    }
    return []
  })

  const handleAdd = () => {
    navigate("/profile/equipments")
  }

  const handleDelete = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    navigate("/profile")
  }

  const keyboardOpen = useKeyboardOpen()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppTopBar title="장비 정보" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          <div className="px-4 pt-4 pb-2">
            <h1 className="text-lg font-bold text-slate-900">장비 정보를 입력해주세요</h1>
            <p className="mt-1 text-sm text-gray-500">입력한 정보는 나중에 언제든지 변경할 수 있어요.</p>
          </div>

          <div className="px-4 py-6 space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50"
              >
                <div>
                  <p className="text-base font-bold text-slate-900">{item.name.replace(/^\d+\.\s*/, "")}</p>
                  <p className="text-sm text-slate-500 mt-1">자격증 만료일: {item.expiryDate}</p>
                </div>
                <button onClick={() => handleDelete(index)} className="p-1">
                  <IconTrash className="h-5 w-5 text-red-500" stroke={1.5} />
                </button>
              </div>
            ))}

            <button
              onClick={handleAdd}
              className="flex items-center justify-center w-full h-12 rounded-lg border border-[#E5E5E5] bg-white text-base font-medium text-slate-900 shadow-sm"
            >
              장비 추가 등록
            </button>
          </div>

          <div className={`px-4 py-6 ${keyboardOpen ? "" : "mt-auto"}`}>
            <Button variant="primary" size="full" onClick={handleSubmit}>
              저장
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
