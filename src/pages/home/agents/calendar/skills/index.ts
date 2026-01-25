// Calendar Skills - barrel export

export {
  getWeekBounds,
  hasEventsInWeek,
  hasEventsThisWeek,
  getSiteColor,
  recordsToCalendarEvents,
  getWeekDays,
  type WeekBounds,
  type AttendanceRecord,
} from "./calendar-compute.skill"

export {
  fetchWeeklyAttendanceRecords,
  type FetchWeeklyRecordsResult,
} from "./calendar-api.skill"
