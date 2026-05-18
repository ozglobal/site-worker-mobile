import { useState, type CSSProperties, type ChangeEvent } from "react"

interface HoneypotProps {
  name: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  style: CSSProperties
  tabIndex: number
  autoComplete: string
  "aria-hidden": boolean
}

interface UseHoneypotReturn {
  honeypotProps: HoneypotProps
  isBotDetected: boolean
}

export function useHoneypot(): UseHoneypotReturn {
  const [value, setValue] = useState("")

  const honeypotProps: HoneypotProps = {
    name: "website",
    value,
    onChange: (e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    style: {
      position: "absolute",
      left: "-9999px",
      opacity: 0,
      height: 0,
      width: 0,
      overflow: "hidden",
    },
    tabIndex: -1,
    autoComplete: "off",
    "aria-hidden": true,
  }

  return {
    honeypotProps,
    isBotDetected: value.length > 0,
  }
}
