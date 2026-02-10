import { useMutation } from '@tanstack/react-query'
import { changePassword, type ChangePasswordRequest } from '@/lib/profile'

export function useChangePassword() {
  return useMutation({
    mutationFn: async (params: ChangePasswordRequest) => {
      const result = await changePassword(params)
      if (!result.success) {
        throw new Error(result.error || '비밀번호 변경에 실패했습니다.')
      }
      return result
    },
  })
}
