import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Spinner } from "@/components/ui/spinner"
import { loggedFetch } from "@/lib/auth"
import { safeJson } from "@/lib/api-result"
import { API_BASE_URL } from "@/lib/config"
import { signupStorage } from "@/lib/storage"
import { useToast } from "@/contexts/ToastContext"

// Backend redirects here after NICE identity verification succeeds.
// URL: /signup/nice-return?requestNo=xxx
export function NiceReturnPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { showError } = useToast()

  useEffect(() => {
    const requestNo = params.get("requestNo") || ""
    if (!requestNo) {
      showError("본인확인 결과를 가져올 수 없습니다.")
      navigate("/signup", { replace: true })
      return
    }

    loggedFetch(`${API_BASE_URL}/auth/nice/result/${requestNo}`)
      .then(async (res) => {
        const json = await safeJson(res) as Record<string, unknown> | null
        if (!res.ok || !json) throw new Error("bad response")
        const result = (json.data || json) as Record<string, string>
        signupStorage.setPhone(result.mobileno || "")
        signupStorage.setData({
          nameKo: result.name || "",
          nationalityType: "domestic",
          idType: "resident_id",
        })
        navigate("/signup/agreement", { replace: true })
      })
      .catch(() => {
        showError("본인확인 결과를 가져올 수 없습니다.")
        navigate("/signup", { replace: true })
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-dvh items-center justify-center bg-white">
      <Spinner />
    </div>
  )
}
