import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import ArrowBack from "@mui/icons-material/ArrowBack"

export function ScheduleAddPage() {
  const navigate = useNavigate()

  const today = new Date()
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")} (${dayNames[today.getDay()]})`

  const [form, setForm] = useState({
    type: "외근" as "외근" | "직출",
    title: "현대차증권 제목",
    project: "NextOf_ 25.07~26.06 현대차증권",
    visitHour: "09",
    visitMinute: "00",
    visitPlace: "현대차증권 주식회사",
    location: "",
    companion: "",
    metPerson: "김용진",
    status: "취소",
    content: "",
  })

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* Custom header with save icon */}
      <header className="flex h-16 w-full items-center justify-between bg-white shrink-0">
        <div className="flex items-center ml-4 gap-2">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center -ml-2">
            <ArrowBack className="h-6 w-6 text-gray-800" />
          </button>
          <h1 className="text-base font-medium text-slate-900">일정 추가</h1>
        </div>
        <button className="w-10 h-10 flex items-center justify-center mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M5 3h14a1 1 0 0 1 1 1v16l-4-3H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          </svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-5">

          {/* Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-slate-900">{dateStr}</span>
              <span className="text-blue-500 font-semibold underline">오늘</span>
            </div>
            <button className="p-1 text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </button>
          </div>

          {/* 직출여부 */}
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-slate-700 w-16 shrink-0">직출여부</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={form.type === "외근"}
                  onChange={() => setForm(prev => ({ ...prev, type: "외근" }))}
                  className="w-5 h-5 accent-blue-500"
                />
                <span className="text-sm text-slate-800">외근</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={form.type === "직출"}
                  onChange={() => setForm(prev => ({ ...prev, type: "직출" }))}
                  className="w-5 h-5 accent-blue-500"
                />
                <span className="text-sm text-slate-800">직출</span>
              </label>
            </div>
          </div>

          {/* 제목 */}
          <FieldRow label="제목">
            <Input value={form.title} onChange={handleChange("title")} placeholder="제목" className="bg-white" />
          </FieldRow>

          {/* 프로젝트 */}
          <FieldRow label="프로젝트">
            <div className="relative">
              <Input value={form.project} onChange={handleChange("project")} placeholder="프로젝트 검색" className="bg-white pr-10" />
              <SearchIcon />
            </div>
          </FieldRow>

          {/* 방문시간 */}
          <FieldRow label="방문시간">
            <div className="flex items-center gap-2">
              <Input
                value={form.visitHour}
                onChange={handleChange("visitHour")}
                inputMode="numeric"
                maxLength={2}
                className="w-16 text-center bg-white"
              />
              <span className="text-slate-500 font-medium">:</span>
              <Input
                value={form.visitMinute}
                onChange={handleChange("visitMinute")}
                inputMode="numeric"
                maxLength={2}
                className="w-16 text-center bg-white"
              />
            </div>
          </FieldRow>

          {/* 방문처 */}
          <FieldRow label="방문처">
            <div className="relative">
              <Input value={form.visitPlace} onChange={handleChange("visitPlace")} placeholder="방문처 검색" className="bg-white pr-10" />
              <SearchIcon />
            </div>
          </FieldRow>

          {/* 위치 */}
          <FieldRow label="위치">
            <div className="relative">
              <Input value={form.location} onChange={handleChange("location")} placeholder="위치" className="bg-white pr-10" />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                </svg>
              </button>
            </div>
          </FieldRow>

          {/* 동행 */}
          <FieldRow label="동행">
            <select
              value={form.companion}
              onChange={(e) => setForm(prev => ({ ...prev, companion: e.target.value }))}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">선택</option>
              <option value="정혁주">정혁주</option>
              <option value="김종민2">김종민2</option>
              <option value="한재상">한재상</option>
              <option value="선우혁">선우혁</option>
              <option value="김도원">김도원</option>
            </select>
          </FieldRow>

          {/* 만난사람 */}
          <FieldRow label="만난사람">
            <Input value={form.metPerson} onChange={handleChange("metPerson")} placeholder="만난사람" className="bg-white" />
          </FieldRow>

          {/* 상태 */}
          <FieldRow label="상태">
            <span className="inline-block px-4 py-1.5 text-sm border border-slate-300 rounded-full text-slate-700 bg-white">
              {form.status}
            </span>
          </FieldRow>

          {/* 내용 */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">내용</span>
            <textarea
              value={form.content}
              onChange={handleChange("content")}
              placeholder="내용"
              rows={8}
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

        </div>
      </main>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-slate-700 w-16 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function SearchIcon() {
  return (
    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </button>
  )
}
