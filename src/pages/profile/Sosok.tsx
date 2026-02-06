import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Button } from "@/components/ui/button"
import { StatusListItem } from "@/components/ui/status-list-item"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"

interface AffiliationType {
  id: string
  icon: string
  title: string
  subtitle: string
}

const affiliationTypes: AffiliationType[] = [
  {
    id: "general",
    icon: "👷",
    title: "일반",
    subtitle: "건설사 소속 직영 근로자",
  },
  {
    id: "service",
    icon: "🏢",
    title: "용역",
    subtitle: "용역업체 소속 근로자",
  },
  {
    id: "specialty",
    icon: "🔧",
    title: "주요공종",
    subtitle: "전문 공종 근로자",
  },
  {
    id: "equipment",
    icon: "🚜",
    title: "장비기사",
    subtitle: "건설 기계 운전 기사",
  },
]

const equipmentTypes = [
  { id: "bulldozer", name: "1. 불도저" },
  { id: "excavator", name: "2. 굴착기" },
  { id: "loader", name: "3. 로더" },
  { id: "forklift", name: "4. 지게차" },
  { id: "scraper", name: "5. 스크레이퍼" },
  { id: "dump-truck", name: "6. 덤프트럭" },
  { id: "crane", name: "7. 기중기" },
  { id: "motor-grader", name: "8. 모터그레이더" },
  { id: "roller", name: "9. 롤러" },
  { id: "subgrade-stabilizer", name: "10. 노상안정기" },
  { id: "concrete-batching-plant", name: "11. 콘크리트 뱃칭플랜트" },
  { id: "concrete-finisher", name: "12. 콘크리트 피니셔" },
  { id: "concrete-spreader", name: "13. 콘크리트 살포기" },
  { id: "concrete-mixer-truck", name: "14. 콘크리트 믹서트럭" },
  { id: "concrete-pump", name: "15. 콘크리트 펌프" },
  { id: "asphalt-mixing-plant", name: "16. 아스팔트 믹싱플랜트" },
  { id: "asphalt-finisher", name: "17. 아스팔트 피니셔" },
  { id: "asphalt-spreader", name: "18. 아스팔트 살포기" },
  { id: "aggregate-spreader", name: "19. 골재 살포기" },
  { id: "crusher", name: "20. 쇄석기" },
  { id: "air-compressor", name: "21. 공기압축기" },
  { id: "boring-machine", name: "22. 천공기" },
  { id: "pile-driver", name: "23. 항타 및 항발기" },
  { id: "gravel-collector", name: "24. 자갈채취기" },
  { id: "survey-line", name: "25. 준설선" },
  { id: "special-construction", name: "26. 특수건설기계" },
  { id: "tower-crane", name: "27. 타워크레인" },
]

const companies = [
  { id: "lotte", name: "롯데건설" },
  { id: "kyungnam", name: "경남기업" },
  { id: "kyeryong", name: "계룡건설산업" },
  { id: "kwangshin", name: "광신종합건설" },
]

export function SosokPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string>("general")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [engineerType, setEngineerType] = useState<"representative" | "employee">("representative")
  const [representativeName, setRepresentativeName] = useState("")
  const engineerInputRef = useRef<HTMLInputElement>(null)
  const [selectedEquipment, setSelectedEquipment] = useState("")
  const [certFile, setCertFile] = useState<File | null>(null)

  useEffect(() => {
    if (selected === "equipment") {
      engineerInputRef.current?.focus()
    }
  }, [engineerType, selected])

  const handleNext = () => {
    if (selected === "general" || selected === "specialty") {
      navigate("/profile/payroll-account")
    } else if (selected === "service") {
      navigate("/profile/outsourcing")
    } else if (selected === "equipment") {
      navigate("/profile/engineer")
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <AppHeader
        showLeftAction={true}
        title=""
        showRightAction={false}
        onLeftActionClick={() => navigate(-1)}
        className="shrink-0"
      />

      <div className="flex-1 overflow-y-auto px-4">
 
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <StatusListItem
            title="내 프로필"
            subtitle="연락처 및 기본 정보"
            status="incomplete"
            onClick={() => navigate("/profile/myinfo")}
            className="border-b-0"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">소속 선택</label>
          <div className="relative">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full h-12 px-4 pr-10 rounded-lg border border-gray-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
            >
              {affiliationTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.title} - {type.subtitle}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {selected === "service" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">용역회사 선택</label>
            <div className="relative">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full h-12 px-4 pr-10 rounded-lg border border-gray-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
              >
                <option value="" disabled>용역회사 선택</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {selected === "equipment" && (
          <div className="mb-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">구분</label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setEngineerType("representative")}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                    engineerType === "representative"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                      engineerType === "representative" ? "border-primary" : "border-gray-300"
                    }`}>
                      {engineerType === "representative" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">대표자</p>
                      <p className="text-sm text-slate-500 mt-0.5">사업자등록증 보유</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEngineerType("employee")}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                    engineerType === "employee"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                      engineerType === "employee" ? "border-primary" : "border-gray-300"
                    }`}>
                      {engineerType === "employee" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">직원</p>
                      <p className="text-sm text-slate-500 mt-0.5">법인 소속 직원</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {engineerType === "representative" ? "대표자명" : "소속 법인명"}
              </label>
              <input
                type="text"
                ref={engineerInputRef}
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                placeholder={engineerType === "representative" ? "대표자명 입력" : "소속 법인명 입력"}
                className="w-full h-12 px-4 rounded-lg border border-gray-200 text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Equipment Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">장비 종류</label>
              <div className="relative">
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  className="w-full h-12 px-4 pr-10 rounded-lg border border-gray-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                >
                  <option value="" disabled>장비 선택</option>
                  {equipmentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-3">
                <ErrorOutlineIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-700">내 장비를 찾을 수 없나요?</p>
                  <p className="text-sm text-slate-500 mt-1">목록에 장비가 보이지 않을 경우 현장 관리자에게 등록을 요청해주세요.</p>
                </div>
              </div>
            </div>

            {/* Certificate File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">장비 자격증</label>
              <label className="flex items-center w-full h-12 px-4 rounded-lg border border-gray-200 bg-white cursor-pointer">
                <span className="font-medium text-slate-900 mr-2">파일 선택</span>
                <span className="text-sm text-slate-400 truncate">
                  {certFile ? certFile.name : "선택된 파일 없음"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {(selected === "general" || selected === "specialty") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
            <StatusListItem
              title="계좌 정보"
              subtitle="급여 받을 계좌"
              status="incomplete"
              onClick={() => navigate("/profile/my-account")}
            />
            <StatusListItem
              title="신분증"
              subtitle="연락처 및 기본 정보"
              status="incomplete"
              onClick={() => navigate("/profile/id")}
            />
            <StatusListItem
              title="안전교육 이수증"
              subtitle="기초안전보건교육 이수증"
              status="incomplete"
              onClick={() => navigate("/profile/safety")}
            />
            <StatusListItem
              title="사업자등록증"
              subtitle="법인 사업자등록증"
              status="incomplete"
              onClick={() => navigate("/profile/business")}
            />
            <StatusListItem
              title="위임장"
              subtitle="급여 타인명의 지급 동의서"
              status="incomplete"
              onClick={() => navigate("/profile/delegation")}
              className="border-b-0"
            />
          </div>
        )}
      </div>

      <div className="px-4 py-6">
        <Button
          variant="primary"
          size="full"
          onClick={handleNext}
        >
          다음
        </Button>
      </div>
    </div>
  )
}
