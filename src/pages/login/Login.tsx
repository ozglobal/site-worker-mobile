import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { IconEye, IconEyeClosed } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/AuthContext"
import { autoLoginStorage } from "@/lib/storage"

export function LoginPage() {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [autoLogin, setAutoLogin] = useState(false)
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  // Check for saved credentials and auto-login on mount
  useEffect(() => {
    const savedCredentials = autoLoginStorage.get()
    if (savedCredentials) {
      setPhone(savedCredentials.phone)
      setPassword(savedCredentials.password)
      setAutoLogin(true)
      setIsAutoLoggingIn(true)

      // Perform auto-login
      performLogin(savedCredentials.phone, savedCredentials.password, true)
    }
  }, [])

  const performLogin = async (loginPhone: string, loginPassword: string, isAuto = false) => {
    if (!loginPhone || !loginPassword) {
      console.error('Login failed: Phone and password are required')
      setIsAutoLoggingIn(false)
      return
    }

    const result = await login({
      username: loginPhone,
      password: loginPassword,
    })

    if (result.success) {
      // Save credentials if auto-login is enabled (only on manual login)
      if (!isAuto && autoLogin) {
        autoLoginStorage.set({ phone: loginPhone, password: loginPassword })
      }
      navigate('/')
    } else {
      console.error('Login failed:', result.error)
      // Clear saved credentials if auto-login failed
      if (isAuto) {
        autoLoginStorage.clear()
        setAutoLogin(false)
      }
      setIsAutoLoggingIn(false)
    }
  }

  const handleLogin = async () => {
    await performLogin(phone, password)
  }

  const handleSignUp = () => {
    navigate('/signup')
  }

  // Show loading during auto-login
  if (isAutoLoggingIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-3xl">👷</span>
          <h1 className="text-2xl font-bold text-slate-900">건설인 C-Worker</h1>
        </div>
        <p className="text-sm text-gray-500">자동 로그인 중...</p>
      </div>
    )
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

        {/* Auto Login Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer mt-1">
          <Checkbox
            checked={autoLogin}
            onCheckedChange={(checked) => {
              setAutoLogin(checked === true)
              if (!checked) autoLoginStorage.clear()
            }}
          />
          <span className="text-sm text-slate-700">자동 로그인 설정</span>
        </label>

        {/* Login Button - Figma style */}
        <Button
          variant="primary"
          size="full"
          className="mt-3"
          onClick={handleLogin}
        >
          로그인
        </Button>
      </div>

      {/* Helper Links */}
      <div className="mt-5 flex items-center justify-center gap-4 text-sm text-gray-500">
        <button type="button" className="hover:underline" onClick={handleSignUp}>
          회원가입
        </button>
        <span>·</span>
        <button type="button" className="hover:underline">
          비밀번호 찾기
        </button>
      </div>
    </div>
  )
}
