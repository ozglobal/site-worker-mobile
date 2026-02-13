import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Button } from "@/components/ui/button"
import { signupStorage } from "@/lib/storage"

export function AgreementPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  const handleNext = () => {
    signupStorage.setData({ personalInfoConsent: true })
    navigate("/signup/domestic-foreign")
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

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          <div className="px-4 py-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
              서비스 이용을 위해<br />약관에 동의해주세요
            </h1>

            <h2 className="text-lg font-bold text-primary mb-3">수집하는 개인정보 항목</h2>
            <p className="text-slate-700 mb-2">
              가.회사는 고객문의 응대 및 상담을 위해 아래와 같은 고객정보를 수집하고 있습니다.
            </p>
            <ul className="list-disc list-inside text-slate-700 mb-2 ml-2">
              <li>항목 : 업체명, 담당자명, 연락처, 이메일</li>
            </ul>
            <p className="text-slate-700 mb-2">
              나.서비스 이용과정에서 아래와 같은 정보가 자동적으로 생성되어 수집될 수 있습니다.
            </p>
            <ul className="list-disc list-inside text-slate-700 mb-6 ml-2">
              <li>서비스 이용기록(접속일시), 접속 IP 정보, 통신내용</li>
            </ul>

            <h2 className="text-lg font-bold text-primary mb-3">개인정보의 수집 및 이용목적</h2>
            <p className="text-slate-700 mb-2">
              가.개인정보의 수집 및 이용목적은 시재건설 고객에게 맞춤화된 서비스를 제공하기 위한 것입니다.
            </p>
            <p className="text-slate-700 mb-6">
              나.본인 확인을 통해 고객의 각종 질문 및 요청사항의 민원을 처리하거나 서비스 개선, 변경 등과 같은 전달사항을 고지하기 위한 것입니다.
            </p>

            <h2 className="text-lg font-bold text-primary mb-3">개인정보의 보유 및 이용기간</h2>
            <p className="text-slate-700 mb-4">
              본 사에서 더 이상 개인정보를 보유하기 원치 않을 경우 언제라도 개인정보 삭제를 요청할 수 있으며, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.
            </p>
            <p className="text-slate-700">1.보존 항목 : 업체명, 담당자명, 연락처, 이메일</p>
            <p className="text-slate-700">2.보존 이유 : 서비스 이용의 혼선 방지 및 불법사용자에 대한 수사협조</p>
            <p className="text-slate-700">3.보존 기간 : 개인정보 삭제 요청시까지</p>
          </div>

          <div className="px-4 py-6 mt-auto">
            <Button
              variant="primary"
              size="full"
              onClick={handleNext}
            >
              동의하기
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
