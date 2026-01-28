import { useState } from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import CheckIcon from "@mui/icons-material/Check"

export interface SiteOption {
  value: string
  label: string
}

interface SiteComboboxProps {
  options: SiteOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
}

export function SiteCombobox({
  options,
  value,
  onChange,
  placeholder = "전체 현장",
  emptyMessage = "현장을 찾을 수 없습니다.",
  className,
}: SiteComboboxProps) {
  const [open, setOpen] = useState(false)

  const selectedLabel = options.find((opt) => opt.value === value)?.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 text-sm",
            "text-slate-900",
            className
          )}
        >
          <span className="truncate font-semibold">{selectedLabel || placeholder}</span>
          <KeyboardArrowDownIcon sx={{ fontSize: 20 }} className="text-slate-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="전체 현장"
                onSelect={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                <span className="flex-1">전체 현장</span>
                {value === "" && (
                  <CheckIcon sx={{ fontSize: 16 }} className="text-primary shrink-0" />
                )}
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <span className="flex-1">{option.label}</span>
                  {value === option.value && (
                    <CheckIcon sx={{ fontSize: 16 }} className="text-primary shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
