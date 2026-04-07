import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { AlertBanner } from "@/components/ui/alert-banner"
import { StatusListItem, type StatusType } from "@/components/ui/status-list-item"
import { Button } from "@/components/ui/button"
import { IdCardTypeDialog, type IdCardType } from "@/components/ui/id-card-upload-dialog"
import { IdCardCamera } from "@/components/ui/id-card-capture/id-card-camera"
import { IdCardPreview } from "@/components/ui/id-card-capture/id-card-preview"
import { handleLogout } from "@/lib/auth"
import { useWorkerProfile } from "@/lib/queries/useWorkerProfile"
import { uploadDocument, type DocumentType } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"
import { useWorkerDocuments } from "@/lib/queries/useWorkerDocuments"
import { workerTypeStorage } from "@/lib/storage"
import { useAuth } from "@/contexts/AuthContext"

export function MyInfoPage() {
  const navigate = useNavigate()
  const { data: profile } = useWorkerProfile()
  const { showSuccess, showError } = useToast()
  const { worker } = useAuth()
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

  const mapDocStatus = (status: string): { status: StatusType; label: string } => {
    switch (status) {
      case "COMPLETED": case "APPROVED": return { status: "complete", label: "완료" }
      case "PENDING": return { status: "pending", label: "승인 대기" }
      default: return { status: "incomplete", label: "미제출" }
    }
  }

  const isMyInfoComplete = !!(
    workerTypeStorage.get()
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
        <div className="px-4 pt-4">
          <AlertBanner
            title="필수 정보 입력이 완료되지 않았어요"
            description="프로필 설정을 눌러 회원 정보 입력을 완료해주세요."
          />
        </div>

        {/* 내 정보 Section */}
        <div className="mt-6">
          <div className="bg-white rounded-xl mx-4 border border-gray-300 shadow-sm">
            <StatusListItem
              title="프로필 설정"
              subtitle="내 정보 · 유형 관리"
              onClick={() => navigate("/profile/myinfo")}
            />
            <StatusListItem
              title="계좌 설정"
              subtitle="급여 받을 계좌"
              status="incomplete"
              onClick={isMyInfoComplete ? () => navigate("/profile/payroll-account") : undefined}
              className={`border-b-0 ${isMyInfoComplete ? "" : "bg-neutral-50 opacity-40 pointer-events-none"}`}
            />
          </div>
        </div>

        {/* 제출 서류 Section */}
        <div className="mt-6 mx-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">제출 서류</h3>
          {isMyInfoComplete ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {(documents.length > 0 ? documents.map(doc => ({
                id: doc.id, name: doc.documentName, status: doc.status,
              })) : [
                { id: "id_card", name: "주민등록증(운전면허증)", status: "NOT_SUBMITTED" },
                { id: "alien_card", name: "외국인등록증", status: "NOT_SUBMITTED" },
                { id: "passport", name: "여권", status: "NOT_SUBMITTED" },
                { id: "bankbook", name: "통장", status: "NOT_SUBMITTED" },
                { id: "family_cert", name: "가족관계증명서", status: "NOT_SUBMITTED" },
                { id: "safety_cert", name: "기초안전보건교육 이수증", status: "NOT_SUBMITTED" },
                { id: "business_cert", name: "사업자등록증", status: "NOT_SUBMITTED" },
              ]).map((doc, index, arr) => {
                const { status, label } = mapDocStatus(doc.status)
                const docIdMap: Record<string, string> = {
                  id_card: "id-card", alien_card: "foreign-card", passport: "passport",
                  bankbook: "bankbook", family_cert: "family-cert",
                  safety_cert: "safety-cert", business_cert: "business-cert",
                }
                const handleDocClick = () => {
                  if (doc.id === "id_card" || doc.id === "alien_card") {
                    navigate("/onboarding/documents/capture-guide-idcard", {
                      state: { docId: docIdMap[doc.id], title: doc.name },
                    })
                  } else if (doc.id === "passport") {
                    navigate("/onboarding/documents/capture-guide-passport", {
                      state: { docId: "passport", title: doc.name },
                    })
                  } else {
                    navigate("/onboarding/documents", {
                      state: { startCapture: docIdMap[doc.id] },
                    })
                  }
                }
                return (
                  <StatusListItem
                    key={doc.id}
                    title={doc.name}
                    subtitle=""
                    status={status}
                    statusLabel={label}
                    onClick={handleDocClick}
                    className={index === arr.length - 1 ? "border-b-0" : ""}
                  />
                )
              })}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg px-4 py-5">
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                프로필 설정을 눌러 기본 회원 유형을 설정하면 제출 서류 목록이 업데이트됩니다.
              </p>
            </div>
          )}
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
