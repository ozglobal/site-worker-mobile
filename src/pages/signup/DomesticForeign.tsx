import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Button } from "@/components/ui/button"

export function DomesticForeignPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={handleBack}
        className="shrink-0"
      />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          <div className="px-4 py-6">
            <p className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
              회원 유형을 선택해주세요.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 py-4 font-bold shadow-sm text-slate-700 border-gray-200"
                onClick={() => navigate("/signup/domestic-info")}>
                내국인
              </Button>
              <Button variant="outline" className="flex-1 py-4 font-bold shadow-sm text-slate-700 border-gray-200"
                onClick={() => navigate("/signup/foreign-info")}>
                외국인
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
