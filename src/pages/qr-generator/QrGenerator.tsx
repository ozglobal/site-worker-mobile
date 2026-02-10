import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Select } from "@/components/ui/select"

const UUIDS = [
  {name: "무안성면개발사업", uuid: "dd878b29-ab7f-4e03-ab93-0c248215e83d"},
  {name: "용인성파라곤건축", uuid: "eb626897-6b45-40fe-888a-8581bd428228"}
]

export function QrGenerator() {
  const [uuid, setUuid] = useState("")
  const [qrPayload, setQrPayload] = useState<string | null>(null)

  const handleSelect = (selectedUuid: string) => {
    setUuid(selectedUuid)
    if (selectedUuid) {
      const payload = `1|${selectedUuid}|${Date.now()}`
      setQrPayload(payload)
    } else {
      setQrPayload(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          현장 출근 QR 코드 생성
        </h1>

        <div className="space-y-3">
          <Select
            options={UUIDS.map((site) => ({ value: site.uuid, label: site.name }))}
            value={uuid}
            onChange={handleSelect}
            placeholder="현장 선택"
          />
        </div>

        {qrPayload && (
          <div className="flex flex-col items-center space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <QRCodeSVG value={qrPayload} size={256} />
            <p className="text-xs text-gray-500 break-all text-center font-mono">
              {qrPayload}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
