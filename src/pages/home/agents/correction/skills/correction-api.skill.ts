import { submitCorrectionRequest, requestOvertime } from '@/lib/attendance'

export interface SubmitCorrectionInput {
  attendanceId: string
  workEntryId: string
  requestType: 'work_effort' | 'daily_wage' | 'work_effort_and_wage'
  requestedValue?: string
  requestedEffort?: string
  requestedWage?: string
  reason: string
}

export function submitCorrection(input: SubmitCorrectionInput) {
  return submitCorrectionRequest({
    attendanceId: input.attendanceId,
    workEntryId: input.workEntryId,
    requestType: input.requestType,
    requestedValue: input.requestedValue,
    requestedEffort: input.requestedEffort,
    requestedWage: input.requestedWage,
    reason: input.reason,
  })
}

export function submitOvertime(attendanceId: string) {
  return requestOvertime(attendanceId)
}
