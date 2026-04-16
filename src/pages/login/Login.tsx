import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { IconEye, IconEyeClosed } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/AuthContext"
import { useHoneypot } from "@/hooks/useHoneypot"
import { autoLoginStorage } from "@/lib/storage"
import { getWorkerInfo } from "@/lib/auth"

export function LoginPage() {
  const [phone, setPhone] = useState(() => autoLoginStorage.getCredentials()?.phone ?? "")
  const [password, setPassword] = useState(() => autoLoginStorage.getCredentials()?.password ?? "")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { honeypotProps, isBotDetected } = useHoneypot()
  const [autoLogin, setAutoLogin] = useState(() => autoLoginStorage.isEnabled())
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

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
      if (autoLogin) {
        autoLoginStorage.enable()
        autoLoginStorage.setCredentials(phone, password)
      } else {
        autoLoginStorage.disable()
        autoLoginStorage.clearCredentials()
      }
      // Route to onboarding if the user explicitly marked this as first login,
      // OR if the backend reports onboarding is not yet complete AND no worker
      // category is set (a set category means the user has already started/finished
      // onboarding, so skip the flow even if onboardingCompleted is still false).
      const info = getWorkerInfo()
      const needsOnboarding =
        isFirstLogin ||
        (info.onboardingCompleted === false && !info.workerCategory)
      if (needsOnboarding) {
        sessionStorage.setItem('postLoginFirstLogin', '1')
        navigate('/onboarding')
      } else {
        sessionStorage.removeItem('postLoginFirstLogin')
        navigate('/home')
      }
    } else {
      sessionStorage.removeItem('postLoginFirstLogin')
      setError(result.error || "로그인에 실패했습니다")
    }
  }

  const handleSignUp = () => {
    navigate('/signup')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white px-5">

      {/* Logo */}
      <div className="mt-[180px] flex justify-center">
        <img src="/icons/app-logo.png" alt="건설인" className="h-12" />
      </div>

      {/* Form */}
      <form className="mt-8 flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); handleLogin() }}>
        {/* Phone Input */}
        <Input
          type="tel"
          autoComplete="tel"
          placeholder="휴대폰 번호"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-[52px] rounded-lg border-gray-300 px-4 text-base placeholder:text-gray-400"
        />

        {/* Password Input with Eye Icon - Figma style */}
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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
        <label className="flex items-center gap-2 mt-1 cursor-pointer">
          <Checkbox
            checked={autoLogin}
            onCheckedChange={(checked) => {
              const value = checked === true
              setAutoLogin(value)
              if (value) {
                autoLoginStorage.enable()
              } else {
                autoLoginStorage.disable()
              }
            }}
          />
          <span className="text-sm text-slate-500">자동 로그인</span>
        </label>

        {/* First Login Checkbox */}
        <label className="flex items-center gap-2 mt-1 cursor-pointer">
          <Checkbox
            checked={isFirstLogin}
            onCheckedChange={(checked) => setIsFirstLogin(checked === true)}
          />
          <span className="text-sm text-slate-500">첫 로그인</span>
        </label>

        {/* Honeypot */}
        <input {...honeypotProps} />

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {/* Login Button - Figma style */}
        <Button
          type="submit"
          variant={isSubmitting ? "primaryDisabled" : "primary"}
          size="full"
          className="mt-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </form>

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

      {/* PWA Install Prompt */}
      {installPrompt && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="full" onClick={handleInstall}>
            앱 설치하기
          </Button>
        </div>
      )}
    </div>
  )
}
