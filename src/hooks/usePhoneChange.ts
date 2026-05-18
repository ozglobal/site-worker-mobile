import { useState } from "react"
import { sendPhoneChangeCode, changePhone } from "@/lib/profile"
import { useToast } from "@/contexts/ToastContext"

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

export function usePhoneChange() {
  const { showSuccess, showError } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isChangingPhone, setIsChangingPhone] = useState(false)
  const [changedPhone, setChangedPhone] = useState("")

  const openModal = () => {
    setNewPhone("")
    setCodeSent(false)
    setVerificationCode("")
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const handlePhoneInput = (value: string) => setNewPhone(formatPhone(value))

  const handleSendCode = async () => {
    if (isSendingCode) return
    setIsSendingCode(true)
    const result = await sendPhoneChangeCode(newPhone)
    setIsSendingCode(false)
    if (result.success) {
      showSuccess("인증번호가 발송되었습니다.")
      setCodeSent(true)
    } else {
      showError(result.error)
    }
  }

  const handleChangePhone = async () => {
    if (isChangingPhone) return
    setIsChangingPhone(true)
    const result = await changePhone(newPhone, verificationCode)
    setIsChangingPhone(false)
    if (result.success) {
      setChangedPhone(newPhone)
      setShowModal(false)
    } else {
      showError(result.error)
    }
  }

  const isNewPhoneComplete = newPhone.replace(/\D/g, "").length === 11

  return {
    showModal,
    newPhone,
    codeSent,
    verificationCode,
    isSendingCode,
    isChangingPhone,
    changedPhone,
    isNewPhoneComplete,
    openModal,
    closeModal,
    handlePhoneInput,
    handleSendCode,
    handleChangePhone,
    setVerificationCode,
  }
}
