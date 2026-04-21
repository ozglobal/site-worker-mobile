import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { submitCorrection, submitOvertime, type SubmitCorrectionInput } from './skills/correction-api.skill'
import { reportError } from '@/lib/errorReporter'

export function useCorrectionAgent() {
  const queryClient = useQueryClient()

  const submit = useCallback(
    async (input: SubmitCorrectionInput) => {
      const result = await submitCorrection(input)
      if (!result.success) {
        reportError('CORRECTION_SUBMIT_FAIL', result.error)
        return result
      }
      queryClient.invalidateQueries({ queryKey: ['todayAttendance'] })
      return result
    },
    [queryClient],
  )

  const overtime = useCallback(async (attendanceId: string) => {
    return submitOvertime(attendanceId)
  }, [])

  return { submit, overtime }
}
