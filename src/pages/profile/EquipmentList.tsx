import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { ChevronRight as ChevronRightIcon } from "lucide-react"
import { useWorkerEquipments } from "@/lib/queries/useWorkerEquipments"
import { useDictItems } from "@/lib/queries/useDictItems"
import { useDocumentSummary } from "@/lib/queries/useDocumentSummary"
import { requiredDocsCatalogue } from "@/lib/documents"

export function EquipmentListPage() {
  const navigate = useNavigate()
  const { data: equipments, isLoading, isError, refetch } = useWorkerEquipments()
  const { data: equipmentTypes = [] } = useDictItems("EQUIPMENT_TYPE")
  const { data: docSummary } = useDocumentSummary()
  const pageTitle = docSummary?.find((d) => d.code === "equipment_license")?.label
    || requiredDocsCatalogue["equipment_license"]?.label
    || "장비 정보"

  const resolveLabel = (code: string) =>
    equipmentTypes.find((t) => t.code === code)?.name || code

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppTopBar title={pageTitle} onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          <div className="px-4 py-6 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : isError ? (
              <QueryErrorState onRetry={() => refetch()} message="장비 정보를 불러오지 못했습니다." />
            ) : (
              <>
                {(equipments ?? []).length === 0 ? (
                  <div className="bg-slate-100 rounded-xl p-4 flex items-center justify-center border border-slate-200">
                    <p className="text-sm text-slate-500">등록된 장비가 없습니다.</p>
                  </div>
                ) : (
                  (equipments ?? []).map((item) => {
                    const label = resolveLabel(item.equipmentType)
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-bold text-slate-900">{label}</p>
                          {item.validUntil && (
                            <p className="text-sm text-slate-500 mt-1">자격증 만료일: {item.validUntil}</p>
                          )}
                        </div>
                        {item.licenseDocId && (
                          <button
                            type="button"
                            onClick={() => navigate(
                              `/profile/documents/view/equipment-license/${item.licenseDocId}` +
                              `?name=${encodeURIComponent(label)}&equipmentId=${item.id}`
                            )}
                            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 shrink-0 ml-3"
                          >
                            보기
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )
                  })
                )}

                <button
                  onClick={() => navigate("/profile/equipments")}
                  className="flex items-center justify-center w-full h-12 rounded-lg border border-[#E5E5E5] bg-white text-base font-medium text-slate-900 shadow-sm"
                >
                  장비 추가 등록
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
