import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"

const UUIDS = [
  "dd878b29-ab7f-4e03-ab93-0c248215e83d",
  "eb626897-6b45-40fe-888a-8581bd428228",
]

export function QrGenerator() {
  const [uuid, setUuid] = useState("")
  const [qrPayload, setQrPayload] = useState<string | null>(null)

  const handleGenerate = () => {
    if (!uuid) return
    const payload = `1|${uuid}|${Date.now()}`
    setQrPayload(payload)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          현장 출근 QR 코드 생성
        </h1>

        <div className="space-y-3">
          <label htmlFor="uuid" className="block text-sm font-medium text-gray-700">
            현장 코드
          </label>
          <select
            id="uuid"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">현장 코드 선택</option>
            {UUIDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={!uuid}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            QR 코드 생성
          </button>
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
