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
  fetchMonthlyAttendanceRecords,
  type FetchMonthlyRecordsResult,
} from "./calendar-api.skill"
