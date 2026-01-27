import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { MonthSelector, ViewMode } from "@/components/ui/MonthSelector"
import { SiteCombobox, SiteOption } from "@/components/ui/SiteCombobox"
import { Calendar } from "@/components/ui/calendar"
import { ko } from "react-day-picker/locale"

const siteOptions: SiteOption[] = [
  { value: "site-a", label: "현장 A" },
  { value: "site-b", label: "현장 B" },
]

export function AttendancePage() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const [selectedSite, setSelectedSite] = useState("")

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const handleNavigation = (item: NavItem) => {
    if (item === "home") {
      navigate("/home")
    } else if (item === "profile") {
      navigate("/profile")
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader showLeftAction={false} title="시재건설" showRightAction={true} className="shrink-0" />

      <MonthSelector
        year={year}
        month={month}
        viewMode={viewMode}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onViewModeChange={setViewMode}
        className="shrink-0"
      />

      <div className="px-4 shrink-0">
        <SiteCombobox
          options={siteOptions}
          value={selectedSite}
          onChange={setSelectedSite}
        />
      </div>

      <div className="flex-1 overflow-y-auto mt-3">
        {viewMode === "calendar" && (
          <Calendar
            mode="single"
            month={new Date(year, month - 1)}
            onMonthChange={(d) => {
              setYear(d.getFullYear())
              setMonth(d.getMonth() + 1)
            }}
            locale={ko}
            className="w-full"
          />
        )}
      </div>

      <AppBottomNav active="attendance" className="shrink-0" onNavigate={handleNavigation} />
    </div>
  )
}
