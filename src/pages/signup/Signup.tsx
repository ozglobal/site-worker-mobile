import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { OptionCard } from "@/components/ui/option-card"
import { signupStorage } from "@/lib/storage"
import { loggedFetch } from "@/lib/auth"
import { safeJson } from "@/lib/api-result"
import { API_BASE_URL } from "@/lib/config"
import { useToast } from "@/contexts/ToastContext"

export function SignUpPage() {
  const navigate = useNavigate()
  const { showError } = useToast()
  const popupRef = useRef<Window | null>(null)

  const handleBack = () => navigate(-1)

  const handleNiceAuth = () => {
    // Step 2 — open popup
    const popup = window.open("", "nicePopup", "width=500,height=600,left=200,top=100")
    popupRef.current = popup

    // Step 3 — POST to NICE inside the popup (tokens left empty for now)
    const form = document.createElement("form")
    form.method = "POST"
    form.action = "https://nice.checkplus.co.kr/CheckPlusSafeModel/service.cb"
    form.target = "nicePopup"
    const fields: Record<string, string> = {
      m: "service",
      token_version_id: "",
      enc_data: "",
      integrity_value: "",
    }
    Object.entries(fields).forEach(([key, val]) => {
      const input = document.createElement("input")
      input.type = "hidden"
      input.name = key
      input.value = val
      form.appendChild(input)
    })
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  // Step 4 — receive postMessage from NICE callback popup
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "NICE_AUTH_SUCCESS") return
      const requestNo: string = event.data.requestNo || sessionStorage.getItem("_nice_requestNo") || ""
      sessionStorage.removeItem("_nice_requestNo")
      popupRef.current?.close()

      // Step 5 — fetch result
      try {
        const res = await loggedFetch(`${API_BASE_URL}/auth/nice/result/${requestNo}`)
        const json = await safeJson(res) as Record<string, unknown> | null
        if (!res.ok || !json) { showError("본인확인 결과를 가져올 수 없습니다."); return }
        const result = (json.data || json) as Record<string, string>

        // Step 6 — store and continue signup
        signupStorage.setPhone(result.mobileno || "")
        signupStorage.setData({
          nameKo: result.name || "",
          nationalityType: "domestic",
          idType: "resident_id",
        })
        navigate("/signup/agreement")
      } catch {
        showError("본인확인 결과를 가져올 수 없습니다.")
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [navigate, showError])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={handleBack}
        className="shrink-0"
      />

      <main className="flex-1 overflow-hidden px-4">
        <div className="mt-4">
          <p className="text-lg font-bold text-slate-900 mb-6 leading-tight">
            회원 가입을 위해 본인 인증을<br />진행해 주세요
          </p>

          <div className="space-y-3">
            <OptionCard
              title="내 명의 휴대폰이 있어요"
              description="내 명의 휴대폰 번호로 가입합니다."
              onClick={handleNiceAuth}
            />
            <OptionCard
              title="타인 명의 휴대폰이 있어요"
              description="타인 명의 휴대폰 번호로 가입합니다."
              onClick={() => navigate("/signup/sms-verification", { state: { phoneType: "other" } })}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
