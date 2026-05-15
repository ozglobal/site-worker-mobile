import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { LabeledInput } from "@/components/ui/labeled-input"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signupStorage } from "@/lib/storage"
import { validateRrn } from "@/utils/rrn"

const KOREAN_ONLY = /^[가-힣ㄱ-ㅎㅏ-ㅣ\s]*$/

export function NiceApiPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [ssnFirst, setSsnFirst] = useState("")
  const [ssnSecond, setSsnSecond] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")

  const nameInvalid = name.length > 0 && !KOREAN_ONLY.test(name)
  const ssnTouched = ssnFirst.length > 0 || ssnSecond.length > 0
  // 내국인 NICE 본인확인 → kind=domestic (뒷자리 첫숫자 1·2·3·4)
  const ssnError = ssnTouched ? validateRrn(ssnFirst, ssnSecond, 'domestic') : null
  const ssnInvalid = ssnError !== null

  const handleBack = () => {
    navigate(-1)
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

      <main className="flex-1 overflow-hidden">
          <div className="px-4 py-6 space-y-6">
            <p className="text-lg font-bold text-slate-900 leading-tight">
              Backend API call이 보내준 <br></br>NICE 휴대폰 본인확인 서비스 페이지
            </p>

            {/* 이름 */}
            <LabeledInput
              label="이름"
              inputMode="text"
              placeholder="이름 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameInvalid}
              errorText={nameInvalid ? "이름을 한국어로 입력해 주세요" : undefined}
            />

            {/* 주민등록번호 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">주민등록번호</label>
              <div className="flex items-center gap-2">
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={ssnFirst}
                  onChange={(e) => setSsnFirst(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="앞 6자리"
                  className="flex-1"
                  error={ssnInvalid}
                />
                <span className="text-slate-400">-</span>
                <Input
                  inputMode="numeric"
                  maxLength={7}
                  value={ssnSecond}
                  onChange={(e) => setSsnSecond(e.target.value.replace(/\D/g, "").slice(0, 7))}
                  placeholder="뒤 7자리"
                  className="flex-1"
                  error={ssnInvalid}
                />
              </div>
              {ssnInvalid && (
                <p className="mt-2 text-sm text-[#DC2626]">올바른 주민등록번호를 입력해주세요</p>
              )}
            </div>

            {/* 휴대폰번호 */}
            <LabeledInput
              label="휴대폰번호"
              inputMode="numeric"
              placeholder="숫자만 입력"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
            />

            <Button
              variant={!nameInvalid && !ssnInvalid && name && ssnFirst.length === 6 && ssnSecond.length === 7 && phoneNumber.length === 11 ? "primary" : "primaryDisabled"}
              size="full"
              disabled={nameInvalid || ssnInvalid || !name || ssnFirst.length !== 6 || ssnSecond.length !== 7 || phoneNumber.length !== 11}
              onClick={() => {
                signupStorage.setPhone(phoneNumber)
                signupStorage.setData({
                  nameKo: name,
                  nationalIdNumber: `${ssnFirst}-${ssnSecond}`,
                })
                navigate("/signup/agreement")
              }}
            >
              다음
            </Button>
          </div>
      </main>
    </div>
  )
}
