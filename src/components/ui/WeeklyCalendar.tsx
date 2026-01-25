"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  addDays,
  format,
  startOfWeek,
  isSameDay,
} from "date-fns"
import { ko } from "date-fns/locale"
import { useState } from "react"

type DayEvent = {
  date: Date
  color?: "blue" | "orange"
}

interface WeeklyCalendarProps {
  events?: DayEvent[]
  onSelect?: (date: Date) => void
}

export function WeeklyCalendar({
  events = [],
  onSelect,
}: WeeklyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
  const days = Array.from({ length: 7 }).map((_, i) =>
    addDays(weekStart, i)
  )

  return (
    <div className="flex justify-between gap-1 px-2">
      {days.map((day) => {
        const isSelected = isSameDay(day, selectedDate)
        const dayEvents = events.filter((e) =>
          isSameDay(e.date, day)
        )

        return (
          <Button
            key={day.toISOString()}
            variant="ghost"
            onClick={() => {
              setSelectedDate(day)
              onSelect?.(day)
            }}
            className={cn(
              "flex h-20 w-12 flex-col items-center justify-center rounded-xl p-0",
              isSelected &&
                "bg-blue-600 text-white hover:bg-blue-600"
            )}
          >
            {/* Weekday */}
            <span
              className={cn(
                "text-xs",
                isSelected ? "text-white" : "text-muted-foreground"
              )}
            >
              {format(day, "EEE", { locale: ko })}
            </span>

            {/* Date */}
            <span className="text-lg font-semibold">
              {format(day, "d")}
            </span>

            {/* Dots */}
            <div className="mt-1 flex gap-1">
              {dayEvents.map((e, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-2 w-2 rounded-full",
                    e.color === "orange"
                      ? "bg-orange-400"
                      : "bg-blue-500"
                  )}
                />
              ))}
            </div>
          </Button>
        )
      })}
    </div>
  )
}
