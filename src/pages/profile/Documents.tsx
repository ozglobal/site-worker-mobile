import { useNavigate } from "react-router-dom"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { StatusListItem } from "@/components/ui/status-list-item"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { resolveRequiredDocs } from "@/lib/documents"

export function ProfileDocumentsPage() {
  const navigate = useNavigate()
  const { data: profile, isLoading, isError, refetch } = useWorkerProfile()

  const handleNavigation = (item: NavItem) => {
    if (item === "home") navigate("/home")
    else if (item === "attendance") navigate("/attendance")
    else if (item === "contract") navigate("/contract")
    else if (item === "profile") navigate("/profile")
  }

  const docs = resolveRequiredDocs(profile?.missingRequiredDocs)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <AppTopBar title="제출서류" onBack={() => navigate(-1)} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : isError ? (
          <QueryErrorState onRetry={() => refetch()} message="제출서류 정보를 불러오지 못했습니다." />
        ) : docs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            제출이 필요한 서류가 없습니다.
          </div>
        ) : (
          <div className="mt-6 mx-4 bg-white rounded-xl border border-gray-300 shadow-sm">
            {docs.map((doc, idx) => (
              <StatusListItem
                key={doc.code}
                title={doc.label}
                subtitle={
                  doc.method === "eformsign"
                    ? `eformsign${doc.perSite ? " · 현장별" : ""}`
                    : doc.perSite
                      ? "현장별"
                      : ""
                }
                status="incomplete"
                statusLabel="미제출"
                onClick={() => navigate("/onboarding/documents", {
                  state: { hideProgress: true, startCapture: doc.code },
                })}
                className={idx === docs.length - 1 ? "border-b-0" : ""}
              />
            ))}
          </div>
        )}
      </main>

      <AppBottomNav active="profile" onNavigate={handleNavigation} className="shrink-0" />
    </div>
  )
}
