import { useState } from "react"
import { cn } from "@/lib/utils"

export type NavItem = "home" | "attendance" | "contract" | "profile"

interface AppBottomNavProps {
  defaultActive?: NavItem
  active?: NavItem
  onNavigate?: (item: NavItem) => void
  className?: string
}

// Custom SVG icons matching Figma design
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    {active ? (
      // Material Icon: Home Filled
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    ) : (
      // Material Icon: Home Outlined
      <path d="M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
    )}
  </svg>
)

const AttendanceIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    {active ? (
      // Material Icon: Today Filled
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
    ) : (
      // Material Icon: Today Outlined
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zm0-12H5V5h14v2zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
    )}
  </svg>
)

const ContractIcon = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Tabler icon: file-pencil */}
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path
      d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"
      fill={active ? "currentColor" : "none"}
    />
    <path d="M10 18l5 -5a1.414 1.414 0 0 0 -2 -2l-5 5v2h2z" stroke={active ? "white" : "currentColor"} />
  </svg>
)

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    {active ? (
      // Material Icon: Person Filled
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    ) : (
      // Material Icon: Person Outlined
      <path d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    )}
  </svg>
)

const navItems: {
  id: NavItem
  icon: React.FC<{ active: boolean }>
  label: string
}[] = [
  { id: "home", icon: HomeIcon, label: "홈" },
  { id: "attendance", icon: AttendanceIcon, label: "출역현황" },
  { id: "contract", icon: ContractIcon, label: "근로계약" },
  { id: "profile", icon: ProfileIcon, label: "내 정보" },
]

export function AppBottomNav({
  defaultActive = "home",
  active,
  onNavigate,
  className,
}: AppBottomNavProps) {
  const [internalActive, setInternalActive] = useState<NavItem>(defaultActive)

  const currentActive = active ?? internalActive

  const handleNavigate = (item: NavItem) => {
    if (active === undefined) {
      setInternalActive(item)
    }
    onNavigate?.(item)
  }

  return (
    <nav
      className={cn(
        "flex h-[60px] w-full items-center justify-around border-t border-slate-200 bg-white",
        className
      )}
    >
      {navItems.map(({ id, icon: Icon, label }) => {
        const isActive = currentActive === id

        return (
          <button
            key={id}
            type="button"
            onClick={() => handleNavigate(id)}
            className={cn(
              "flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-slate-400"
            )}
          >
            <Icon active={isActive} />
            <span
              className={cn(
                "text-[11px]",
                isActive ? "font-bold" : "font-medium"
              )}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
