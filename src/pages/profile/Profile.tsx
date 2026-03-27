import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { AlertBanner } from "@/components/ui/alert-banner"
import { AffiliationCard } from "@/components/ui/affiliation-card"
import { StatusListItem } from "@/components/ui/status-list-item"
import { Button } from "@/components/ui/button"
import { IdCardTypeDialog, type IdCardType } from "@/components/ui/id-card-upload-dialog"
import { IdCardCamera } from "@/components/ui/id-card-capture/IdCardCamera"
import { IdCardPreview } from "@/components/ui/id-card-capture/IdCardPreview"
import { handleLogout } from "@/lib/auth"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { uploadDocument, type DocumentType } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"
import { useWorkerDocuments } from "@/lib/queries/useWorkerDocuments"

export function MyInfoPage() {
  const navigate = useNavigate()
  const { data: profile } = useWorkerProfile()
  const { showSuccess, showError } = useToast()
  const { data: documents = [] } = useWorkerDocuments()
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [showIdCardTypeDialog, setShowIdCardTypeDialog] = useState(false)
  const [idCardType, setIdCardType] = useState<IdCardType | null>(null)
  const [idCardSide, setIdCardSide] = useState<"front" | "back" | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null)
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null)
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)

  const pickAndUpload = (documentType: DocumentType, label: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*,.pdf"
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) { resolve(false); return }
        setUploading(documentType)
        const result = await uploadDocument(documentType, file)
        setUploading(null)
        if (result.success) {
          setUploaded((prev) => ({ ...prev, [documentType]: true }))
          showSuccess(`${label} 등록 완료`)
          resolve(true)
        } else {
          showError("업로드에 실패했습니다.")
          resolve(false)
        }
      }
      input.click()
    })
  }

  const handleUpload = (documentType: DocumentType, title: string) => {
    pickAndUpload(documentType, title)
  }

  const handleIdCardUpload = () => {
    setShowIdCardTypeDialog(true)
  }

  const uploadFile = async (documentType: DocumentType, label: string, file: File): Promise<boolean> => {
    setUploading(documentType)
    const result = await uploadDocument(documentType, file)
    setUploading(null)
    if (result.success) {
      setUploaded((prev) => ({ ...prev, [documentType]: true }))
      showSuccess(`${label} 등록 완료`)
      return true
    } else {
      showError("업로드에 실패했습니다.")
      return false
    }
  }

  const handleIdCardTypeSelect = (type: IdCardType) => {
    setShowIdCardTypeDialog(false)
    setIdCardType(type)
    setIdCardSide("front")
    setShowCamera(true)
  }

  const handleCameraCapture = (file: File) => {
    const side = idCardSide!
    setShowCamera(false)
    const url = URL.createObjectURL(file)
    if (side === "front") {
      setFrontFile(file)
      setFrontImageUrl(url)
    } else {
      setBackFile(file)
      setBackImageUrl(url)
    }
    setIdCardSide(null)
    setShowPreview(true)
  }

  const handlePreviewConfirm = async () => {
    setShowPreview(false)
    if (frontFile) {
      await uploadFile("id_card_front", "신분증(앞면)", frontFile)
    }
    if (backFile) {
      await uploadFile("id_card_back", "신분증(뒷면)", backFile)
    }
    setFrontFile(null)
    setBackFile(null)
    setFrontImageUrl(null)
    setBackImageUrl(null)
  }

  const handlePreviewClose = () => {
    setShowPreview(false)
    setFrontFile(null)
    setBackFile(null)
    if (frontImageUrl) URL.revokeObjectURL(frontImageUrl)
    if (backImageUrl) URL.revokeObjectURL(backImageUrl)
    setFrontImageUrl(null)
    setBackImageUrl(null)
  }
  const hasDocument = (type: string) =>
    uploaded[type] || documents.some(d => d.documentType === type)

  const isMyInfoComplete = !!(
    profile?.workerName &&
    profile?.ssnFirst &&
    profile?.ssnSecond &&
    profile?.phone &&
    profile?.address
  )

  const handleNavigation = (item: NavItem) => {
    if (item === "home") {
      navigate("/home")
    } else if (item === "attendance") {
      navigate("/attendance")
    } else if (item === "contract") {
      navigate("/contract")
    } else if (item === "profile") {
      // Already on profile page
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <AppHeader showLeftAction={false} title="시재건설" showRightAction={true} className="shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <AlertBanner
            variant="error"
            title="필수 정보 입력이 완료되지 않았어요"
            description="급여 지급을 위해 월말까지 반드시 작성을 완료해주세요."
          />
        </div>

        {/* 내 소속 Section */}
        <div className="px-4 mt-2">
          <p className="text-sm font-medium text-slate-500 mb-3">내 소속</p>
          <AffiliationCard
            icon="👷"
            title="일반"
            subtitle="건설사 소속 근로자"
            actionLabel="변경"
            onClick={() => navigate("/profile/affiliation")}
          />
        </div>

        {/* 내 정보 Section */}
        <div className="mt-6">
          <p className="text-sm font-medium text-slate-500 px-4 mb-2">내 정보</p>
          <div className="bg-white rounded-xl mx-4 border border-gray-100">
            <StatusListItem
              title="내 프로필"
              subtitle="연락처 및 기본 정보"
              status={isMyInfoComplete ? "complete" : "incomplete"}
              onClick={() => navigate("/profile/myinfo")}
            />
            <StatusListItem
              title="계좌 정보"
              subtitle="급여 받을 계좌"
              status="incomplete"
              onClick={() => navigate("/profile/my-account")}
            />
            <StatusListItem
              title="신분증"
              subtitle="주민등록증, 외국인등록증 또는 여권"
              status={
                uploading === "id_card_front" || uploading === "id_card_back"
                  ? "pending"
                  : hasDocument("id_card_front") && hasDocument("id_card_back")
                    ? "complete"
                    : "incomplete"
              }
              onClick={handleIdCardUpload}
            />
            <StatusListItem
              title="안전교육 이수증"
              subtitle="기초안전보건교육 이수증"
              status={uploading === "safety_cert" ? "pending" : hasDocument("safety_cert") ? "complete" : "incomplete"}
              onClick={() => handleUpload("safety_cert", "안전교육 이수증")}
            />
            <StatusListItem
              title="사업자등록증"
              subtitle="법인 사업자등록증"
              status={uploading === "business_license" ? "pending" : hasDocument("business_license") ? "complete" : "incomplete"}
              onClick={() => handleUpload("business_license", "사업자등록증")}
            />
            <StatusListItem
              title="위임장"
              subtitle="급여 타인명의 지급 동의서"
              status={uploading === "proxy_general" ? "pending" : hasDocument("proxy_general") ? "complete" : "incomplete"}
              onClick={() => handleUpload("proxy_general", "위임장")}
              className="border-b-0"
            />
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-3 px-4 py-6 mt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/change-password")}
            className="flex-1 bg-white border-gray-200 text-slate-600 hover:bg-gray-50 font-semibold"
          >
            비밀번호 변경
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={handleLogout}
            className="flex-1 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 font-semibold"
          >
            로그아웃
          </Button>
        </div>
      </main>

      <AppBottomNav
        active="profile"
        onNavigate={handleNavigation}
        className="shrink-0"
      />

      {showIdCardTypeDialog && (
        <IdCardTypeDialog
          onSelect={handleIdCardTypeSelect}
          onCancel={() => setShowIdCardTypeDialog(false)}
        />
      )}

      {showCamera && idCardSide && (
        <IdCardCamera
          side={idCardSide}
          onCapture={handleCameraCapture}
          onClose={() => { setShowCamera(false); setIdCardSide(null); setShowPreview(!!frontImageUrl) }}
        />
      )}

      {showPreview && (
        <IdCardPreview
          frontImage={frontImageUrl}
          backImage={backImageUrl}
          needsBack={idCardType === "id_card"}
          onTakeBack={() => { setShowPreview(false); setIdCardSide("back"); setShowCamera(true) }}
          onRetakeFront={() => { setShowPreview(false); setIdCardSide("front"); setShowCamera(true) }}
          onRetakeBack={() => { setShowPreview(false); setIdCardSide("back"); setShowCamera(true) }}
          onConfirm={handlePreviewConfirm}
          onClose={handlePreviewClose}
        />
      )}
    </div>
  )
}
