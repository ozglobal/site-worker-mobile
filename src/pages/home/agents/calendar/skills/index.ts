// Calendar Skills - barrel export

export {
  getWeekBounds,
  hasEventsInWeek,
  hasEventsThisWeek,
  getSiteColor,
  recordsToCalendarEvents,
  recordsToSites,
  getWeekDays,
  type WeekBounds,
  type AttendanceRecord,
} from "./calendar-compute.skill"

export {
  fetchWeeklyAttendanceRecords,
  fetchMonthlyAttendanceRecords,
  type FetchWeeklyRecordsResult,
  type FetchMonthlyRecordsResult,
} from "./calendar-api.skill"
