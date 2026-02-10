import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { IconEye, IconEyeClosed } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { useHoneypot } from "@/hooks/useHoneypot"

export function LoginPage() {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { honeypotProps, isBotDetected } = useHoneypot()

  const handleLogin = async () => {
    if (isBotDetected || isSubmitting) return
    if (!phone || !password) {
      setError("휴대폰 번호와 비밀번호를 입력해주세요")
      return
    }

    setError("")
    setIsSubmitting(true)
    const result = await login({
      username: phone,
      password: password,
    })
    setIsSubmitting(false)

    if (result.success) {
      navigate('/')
    } else {
      setError(result.error || "로그인에 실패했습니다")
    }
  }

  const handleSignUp = () => {
    navigate('/signup')
  }

  return (
    <div className="flex min-h-screen flex-col bg-white px-5">

      {/* Logo */}
      <div className="mt-[180px]">
        <div className="flex items-center gap-2">
          <span className="text-3xl">👷</span>
          <h1 className="text-2xl font-bold text-slate-900">건설인 C-Worker</h1>
        </div>
      </div>

      {/* Form */}
      <div className="mt-8 flex flex-col gap-3">
        {/* Phone Input */}
        <Input
          type="tel"
          placeholder="휴대폰 번호"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-[52px] rounded-lg border-gray-300 px-4 text-base placeholder:text-gray-400"
        />

        {/* Password Input with Eye Icon - Figma style */}
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-[52px] rounded-lg border-gray-300 px-4 pr-12 text-base placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <IconEye className="w-6 h-6" stroke={1.5} />
            ) : (
              <IconEyeClosed className="w-6 h-6" stroke={1.5} />
            )}
          </button>
        </div>

        {/* Honeypot */}
        <input {...honeypotProps} />

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {/* Login Button - Figma style */}
        <Button
          variant={isSubmitting ? "primaryDisabled" : "primary"}
          size="full"
          className="mt-3"
          disabled={isSubmitting}
          onClick={handleLogin}
        >
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </div>

      {/* Helper Links */}
      <div className="mt-5 flex items-center justify-center gap-4 text-sm text-gray-500">
        <button type="button" className="hover:underline" onClick={handleSignUp}>
          회원 가입
        </button>
        <span>·</span>
        <button type="button" className="hover:underline" onClick={() => navigate("/login/sms-verification")}>
          비밀번호 재설정
        </button>
      </div>
    </div>
  )
}
