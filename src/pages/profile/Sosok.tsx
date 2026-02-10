import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { OptionCard } from "@/components/ui/option-card"
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
          <Select
            options={affiliationTypes.map((t) => ({ value: t.id, label: `${t.icon} ${t.title} - ${t.subtitle}` }))}
            value={selected}
            onChange={setSelected}
          />
        </div>

        {selected === "service" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">용역회사 선택</label>
            <Select
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              value={selectedCompany}
              onChange={setSelectedCompany}
              placeholder="용역회사 선택"
            />
          </div>
        )}

        {selected === "equipment" && (
          <div className="mb-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">구분</label>
              <div className="space-y-3">
                <OptionCard
                  title="대표자"
                  description="사업자등록증 보유"
                  selected={engineerType === "representative"}
                  showRadio
                  onClick={() => setEngineerType("representative")}
                />
                <OptionCard
                  title="직원"
                  description="법인 소속 직원"
                  selected={engineerType === "employee"}
                  showRadio
                  onClick={() => setEngineerType("employee")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {engineerType === "representative" ? "대표자명" : "소속 법인명"}
              </label>
              <Input
                type="text"
                ref={engineerInputRef}
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                placeholder={engineerType === "representative" ? "대표자명 입력" : "소속 법인명 입력"}
              />
            </div>

            {/* Equipment Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">장비 종류</label>
              <Select
                options={equipmentTypes.map((t) => ({ value: t.id, label: t.name }))}
                value={selectedEquipment}
                onChange={setSelectedEquipment}
                placeholder="장비 선택"
              />
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
