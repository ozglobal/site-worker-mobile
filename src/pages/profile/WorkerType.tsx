import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { WorkerTypeCard } from "@/components/ui/worker-type-card"
import { Spinner } from "@/components/ui/spinner"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { updateWorkerCategory } from "@/lib/profile"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { useDictItems } from "@/lib/queries/useDictItems"
import { useToast } from "@/contexts/ToastContext"
import { useQueryClient } from "@tanstack/react-query"

// Presentation lookup for dict codes (icon + extra subtitle). The dict only
// supplies { code, name }; this table fills in the visual metadata we want
// on each card. Keys are lowercased so lookups are case-insensitive
// (backend mixes lower_snake_case with UPPER_SNAKE_CASE).
const cardMeta: Record<string, { icon: string; subtitle: string }> = {
  general: { icon: "👷", subtitle: "건설사 소속 직영 근로자" },
  major_work: { icon: "🔧", subtitle: "전문 공종 근로자" },
  labor_service: { icon: "🏢", subtitle: "용역업체 소속 근로자" },
  equipment_driver: { icon: "🚜", subtitle: "건설 기계 운전 기사" },
  trainee: { icon: "🎓", subtitle: "연수 중 근로자" },
}

const lookupMeta = (code: string) =>
  cardMeta[code.toLowerCase()] ?? { icon: "", subtitle: "" }

// Profile-mode navigation per category code.
// Match is case-insensitive (backend sometimes ships lower_snake_case, sometimes UPPER).
// Codes not listed stay on /profile/worker-type (no navigation).
const profileRouteEntries: Array<[string, string]> = [
  ["general", "/profile"],
  ["major_work", "/profile"],
  ["labor_service", "/profile/outsourcing"],
  ["equipment_driver", "/profile/engineer"],
]

const findProfileRoute = (code: string): string | undefined => {
  const key = code.toLowerCase()
  return profileRouteEntries.find(([k]) => k === key)?.[1]
}

interface WorkerTypePageProps {
  mode?: "onboarding" | "profile"
}

export function WorkerTypePage({ mode = "profile" }: WorkerTypePageProps) {
  const navigate = useNavigate()
  const { showError, showSuccess } = useToast()
  const { data: profile } = useWorkerProfile()
  const { data: workerTypes, isLoading, isError, refetch } = useDictItems("worker_category")
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-select from backend-reported workerCategory when the profile loads.
  useEffect(() => {
    if (profile?.workerCategory) {
      setSelected(profile.workerCategory)
    }
  }, [profile?.workerCategory])

  const handleBack = () => {
    if (mode === "profile") {
      navigate("/profile")
      return
    }
    navigate(-1)
  }

  // Onboarding: every code → daily-wage.
  // Profile: only service / equipment_driver navigate; others stay on page.
  const resolveRoute = (code: string): string | undefined => {
    if (mode === "onboarding") return "/onboarding/daily-wage"
    return findProfileRoute(code)
  }

  const performSelect = async (code: string) => {
    const previous = selected
    setSelected(code)
    setIsSubmitting(true)
    const result = await updateWorkerCategory(code)
    setIsSubmitting(false)
    if (!result.success) {
      setSelected(previous)
      showError(result.error)
      return
    }
    queryClient.invalidateQueries({ queryKey: ["workerProfile"] })
    const route = resolveRoute(code)
    if (route) {
      navigate(route)
      return
    }
    // No navigation (profile mode, general/major_work/trainee) — confirm via toast.
    if (mode === "profile") {
      const label = workerTypes?.find((t) => t.code === code)?.name ?? code
      showSuccess(`[${label}]으로 변경되었습니다.`)
    }
  }

  const handleSelect = (code: string) => {
    if (isSubmitting) return
    if (selected === code) {
      const route = resolveRoute(code)
      if (route) navigate(route)
      return
    }
    performSelect(code)
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={handleBack}
        className="shrink-0"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-6">
          <h1 className="text-lg font-bold text-slate-900">회원 유형</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : isError ? (
          <QueryErrorState onRetry={() => refetch()} message="회원 유형을 불러오지 못했습니다." />
        ) : (
          <div className="px-4 space-y-3">
            {(workerTypes ?? []).filter((t) => t.code.toLowerCase() !== "trainee").map((type) => {
              const meta = lookupMeta(type.code)
              const isActive = selected === type.code
              return (
                <button
                  key={type.code}
                  onClick={() => handleSelect(type.code)}
                  className="w-full text-left"
                >
                  <WorkerTypeCard
                    icon={meta.icon}
                    title={type.name}
                    subtitle={meta.subtitle}
                    className={
                      isActive
                        ? "border-primary bg-white"
                        : mode === "onboarding"
                          ? "border-gray-200 bg-white"
                          : "border-gray-200 bg-gray-100 text-slate-500"
                    }
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
