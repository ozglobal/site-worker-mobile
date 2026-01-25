import type { CalendarEvent } from "../home.types"

interface WeeklyCalendarProps {
  events?: CalendarEvent[]
  onSelect?: (date: Date) => void
  selectedDate?: Date | null
}

export function WeeklyCalendar({
  events = [],
  onSelect,
  selectedDate,
}: WeeklyCalendarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const weekStart = getWeekStart(today)
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"]

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() === date.getTime()
    })
  }

  const isToday = (date: Date) => {
    return date.getTime() === today.getTime()
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    return date.getTime() === selected.getTime()
  }

  const getColorStyle = (color: string): { className?: string; style?: React.CSSProperties } => {
    switch (color) {
      case "blue":
        return { className: "bg-primary" }
      case "orange":
        return { className: "bg-orange-400" }
      default:
        // For hex colors, use inline style
        return { style: { backgroundColor: color } }
    }
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {weekDays.map((date, index) => {
        const dayEvents = getEventsForDate(date)
        const isTodayDate = isToday(date)
        const isSelectedDate = isSelected(date)

        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect?.(date)}
            className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
              isTodayDate ? "border border-primary" : ""
            } ${isSelectedDate ? "bg-slate-200" : "hover:bg-slate-100"}`}
          >
            <span
              className={`text-xs mb-1 ${
                index === 0
                  ? "text-red-500"
                  : index === 6
                    ? "text-blue-500"
                    : "text-slate-500"
              }`}
            >
              {dayNames[index]}
            </span>
            <span
              className={`text-sm font-medium ${
                index === 0
                  ? "text-red-500"
                  : index === 6
                    ? "text-blue-500"
                    : "text-slate-900"
              }`}
            >
              {date.getDate()}
            </span>
            <div className="flex gap-0.5 mt-3 h-2 items-center">
              {dayEvents.length > 0 &&
                dayEvents.slice(0, 2).map((event, eventIndex) => {
                  const colorProps = getColorStyle(event.color)
                  return (
                    <span
                      key={eventIndex}
                      className={`w-1.5 h-1.5 rounded-full ${colorProps.className || ""}`}
                      style={colorProps.style}
                    />
                  )
                })}
            </div>
          </button>
        )
      })}
    </div>
  )
}
