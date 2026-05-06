import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { OptionCard } from "@/components/ui/option-card"
import { loggedFetch } from "@/lib/auth"
import { safeJson } from "@/lib/api-result"
import { API_BASE_URL } from "@/lib/config"
import { useToast } from "@/contexts/ToastContext"

export function SignUpPage() {
  const navigate = useNavigate()
  const { showError } = useToast()

  const handleBack = () => navigate(-1)

  const handleNiceAuth = async () => {
    // Fetch NICE token from backend
    try {
      const res = await loggedFetch(`${API_BASE_URL}/auth/nice/token`)
      const json = await safeJson(res) as Record<string, unknown> | null
      if (!res.ok || !json) { showError("본인확인 서비스를 시작할 수 없습니다."); return }
      const data = (json.data || json) as Record<string, string>

      // POST to NICE — redirects current tab away
      const form = document.createElement("form")
      form.method = "POST"
      form.action = "https://nice.checkplus.co.kr/CheckPlusSafeModel/service.cb"
      const fields: Record<string, string> = {
        m: "service",
        token_version_id: data.token_version_id || "",
        enc_data: data.enc_data || "",
        integrity_value: data.integrity_value || "",
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
    } catch {
      showError("본인확인 서비스를 시작할 수 없습니다.")
    }
  }

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
