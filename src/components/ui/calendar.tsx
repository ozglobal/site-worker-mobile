import * as React from "react"
import { DayPicker, type CalendarDay, type Modifiers } from "react-day-picker"
import { cn } from "@/lib/utils"

export interface CalendarEvent {
  date: Date
  color: "blue" | "yellow" | "orange" | string
  label: string
}

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  events?: CalendarEvent[]
}

const SUNDAY_LABELS = ["일", "日", "Su", "Sun", "Sunday"]
const SATURDAY_LABELS = ["토", "土", "Sa", "Sat", "Saturday"]

function isLabelMatch(text: string, labels: string[]) {
  return labels.some((l) => text.startsWith(l))
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getEventDotColor(color: string) {
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

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  modifiers,
  modifiersClassNames,
  events = [],
  ...props
}: CalendarProps) {
  const getEventsForDate = (date: Date) =>
    events.filter((e) => isSameDay(new Date(e.date), date))

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center hidden",
        caption_label: "text-sm font-medium",
        nav: "hidden",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-slate-500 rounded-md w-10 font-normal text-xs flex-1 text-center",
        week: "flex w-full mt-2",
        day: "flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(
          "h-16 w-full rounded-lg font-medium flex flex-col items-center justify-start pt-1",
          "hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
        ),
        selected: "bg-slate-200 rounded-lg",
        today: "border border-primary rounded-lg",
        outside: "text-slate-300",
        disabled: "text-slate-300",
        hidden: "invisible",
        range_middle:
          "aria-selected:bg-slate-100 aria-selected:text-slate-900",
        range_start: "rounded-l-lg",
        range_end: "rounded-r-lg",
        ...classNames,
      }}
      modifiers={{
        sunday: (date) => date.getDay() === 0,
        saturday: (date) => date.getDay() === 6,
        ...modifiers,
      }}
      modifiersClassNames={{
        sunday: "text-red-500",
        saturday: "text-blue-500",
        ...modifiersClassNames,
      }}
      components={{
        Weekday: ({ className: weekdayClassName, children, ...rest }) => {
          const text = String(children ?? "")
          let colorClass = ""
          if (isLabelMatch(text, SUNDAY_LABELS)) {
            colorClass = "text-red-500"
          } else if (isLabelMatch(text, SATURDAY_LABELS)) {
            colorClass = "text-blue-500"
          }
          return (
            <th className={cn(weekdayClassName, colorClass)} {...rest}>
              {children}
            </th>
          )
        },
        DayButton: ({
          day,
          modifiers: _modifiers,
          children,
          className: btnClassName,
          ...buttonProps
        }: {
          day: CalendarDay
          modifiers: Modifiers
          children?: React.ReactNode
          className?: string
        } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
          const dayEvents = getEventsForDate(day.date)
          return (
            <button className={btnClassName} {...buttonProps}>
              <span>{children}</span>
              <div className="flex flex-col gap-0.5 mt-1 items-start w-full px-0.5">
                {dayEvents.slice(0, 2).map((event, i) => {
                  const dotClass = getEventDotColor(event.color)
                  return (
                    <div key={i} className="flex items-center gap-0.5">
                      <span
                        className={cn("w-2 h-2 rounded-full shrink-0", dotClass)}
                        style={
                          !dotClass && event.color.startsWith("#")
                            ? { backgroundColor: event.color }
                            : undefined
                        }
                      />
                      <span className="text-[10px] text-slate-700 leading-tight">
                        {event.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </button>
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
