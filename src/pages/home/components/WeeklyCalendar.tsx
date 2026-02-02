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

  const getEventDotColor = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-primary"
      case "yellow":
        return "bg-yellow-400"
      case "orange":
        return "bg-orange-400"
      default:
        return undefined
    }
  }

  return (
    <div>
      {/* Weekday header row - matches MonthlyCalendar */}
      <div className="flex">
        {dayNames.map((name, index) => (
          <div
            key={name}
            className={`flex-1 text-center text-xs font-normal rounded-md ${
              index === 0
                ? "text-red-500"
                : index === 6
                  ? "text-blue-500"
                  : "text-slate-500"
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Day cells row - matches MonthlyCalendar */}
      <div className="flex w-full mt-2">
        {weekDays.map((date, index) => {
          const dayEvents = getEventsForDate(date)
          const isTodayDate = isToday(date)
          const isSelectedDate = isSelected(date)

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelect?.(date)}
              className={`flex-1 text-center text-sm p-0 relative h-16 rounded-lg font-medium flex flex-col items-center justify-start pt-1 ${
                isTodayDate ? "border border-primary" : ""
              } ${isSelectedDate ? "bg-slate-200" : "hover:bg-slate-100"} ${
                index === 0
                  ? "text-red-500"
                  : index === 6
                    ? "text-blue-500"
                    : "text-slate-900"
              }`}
            >
              <span>{date.getDate()}</span>
              <div className="flex flex-col gap-0.5 mt-1 items-center w-full px-0.5">
                {dayEvents.slice(0, 2).map((event, eventIndex) => {
                  const dotClass = getEventDotColor(event.color)
                  return (
                    <div key={eventIndex} className="flex items-center justify-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass || ""}`}
                        style={
                          !dotClass && event.color.startsWith("#")
                            ? { backgroundColor: event.color }
                            : undefined
                        }
                      />
                      {event.label && (
                        <span className="text-xs font-medium text-slate-700 leading-tight">
                          {event.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
