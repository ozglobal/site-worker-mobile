import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { handleLogout } from "@/lib/auth"

interface PhoneChangeModalProps {
  showModal: boolean
  newPhone: string
  codeSent: boolean
  verificationCode: string
  isSendingCode: boolean
  isChangingPhone: boolean
  changedPhone: string
  isNewPhoneComplete: boolean
  onPhoneInput: (value: string) => void
  onSendCode: () => void
  onChangePhone: () => void
  onClose: () => void
  onVerificationCodeChange: (value: string) => void
}

export function PhoneChangeModal({
  showModal,
  newPhone,
  codeSent,
  verificationCode,
  isSendingCode,
  isChangingPhone,
  changedPhone,
  isNewPhoneComplete,
  onPhoneInput,
  onSendCode,
  onChangePhone,
  onClose,
  onVerificationCodeChange,
}: PhoneChangeModalProps) {
  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="relative z-10 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900">휴대폰 번호 변경</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">새 휴대폰 번호</label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => onPhoneInput(e.target.value)}
                  placeholder="010-0000-0000"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={onSendCode}
                  disabled={!isNewPhoneComplete || isSendingCode}
                  className={`shrink-0 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isNewPhoneComplete && !isSendingCode
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isSendingCode ? "발송 중..." : "인증번호 받기"}
                </button>
              </div>
            </div>

            {codeSent && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">인증번호</label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => onVerificationCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="인증번호 입력"
                />
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                size="full"
                onClick={onClose}
                className="flex-1 border-slate-200 text-slate-700"
              >
                취소
              </Button>
              <Button
                variant={codeSent && verificationCode.length === 6 && !isChangingPhone ? "primary" : "primaryDisabled"}
                size="full"
                disabled={!codeSent || verificationCode.length !== 6 || isChangingPhone}
                onClick={onChangePhone}
                className="flex-1"
              >
                {isChangingPhone ? "변경 중..." : "변경하기"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {changedPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-5">
            <p className="text-base text-slate-900 leading-relaxed">
              전화번호가 <span className="font-bold">{changedPhone}</span> 으로 변경되었습니다.<br />
              다시 로그인 하시겠습니까?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="full"
                onClick={() => window.close()}
                className="flex-1 border-slate-200 text-slate-700"
              >
                아니오
              </Button>
              <Button
                variant="primary"
                size="full"
                onClick={handleLogout}
                className="flex-1"
              >
                예
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
