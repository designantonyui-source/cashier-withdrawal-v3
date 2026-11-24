import { useState } from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type CodeInputProps = {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  length?: number
  groupSize?: number
  size?: "default" | "sm"
  error?: boolean
  disabled?: boolean
  "aria-describedby"?: string
  className?: string
}

export function CodeInput({
  id,
  label,
  value,
  onChange,
  length = 6,
  groupSize = 3,
  size = "default",
  error = false,
  disabled = false,
  "aria-describedby": ariaDescribedBy,
  className,
}: CodeInputProps) {
  const [focused, setFocused] = useState(false)
  const digits = value.replace(/\D/g, "").slice(0, length)
  const activeIndex = focused ? Math.min(digits.length, length - 1) : -1

  const groups: number[][] = []
  for (let start = 0; start < length; start += groupSize) {
    groups.push(Array.from({ length: Math.min(groupSize, length - start) }, (_, offset) => start + offset))
  }

  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <Label htmlFor={id} className="text-[12px] font-medium leading-4 text-muted-foreground">
          {label}
        </Label>
      ) : null}
      <div className={cn("relative flex w-full items-center", size === "sm" ? "gap-3" : "gap-4")}>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={digits}
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-describedby={ariaDescribedBy}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
            if (pasted) {
              event.preventDefault()
              onChange(pasted)
            }
          }}
          onChange={(event) => {
            onChange(event.target.value.replace(/\D/g, "").slice(0, length))
          }}
          className="absolute inset-0 z-10 size-full cursor-text bg-transparent text-base text-transparent caret-transparent opacity-0 outline-none select-none selection:bg-transparent disabled:cursor-not-allowed"
        />
        {groups.map((indices, groupIdx) => (
          <div
            key={groupIdx}
            aria-hidden="true"
            className={cn(
              "grid min-w-0 flex-1",
              size === "sm" ? "gap-1.5" : "gap-2",
            )}
            style={{ gridTemplateColumns: `repeat(${indices.length}, minmax(0, 1fr))` }}
          >
            {indices.map((idx) => {
              const char = digits[idx] ?? ""
              const isActive = idx === activeIndex
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center justify-center bg-surface-3 font-semibold tabular-nums text-foreground transition-colors duration-75",
                    size === "sm" ? "h-12 rounded-[12px] text-[18px] leading-6" : "h-14 rounded-[14px] text-[22px] leading-7",
                    disabled && "opacity-45",
                    error
                      ? "ring-[1.5px] ring-danger"
                      : isActive
                        ? "ring-2 ring-ring"
                        : "ring-1 ring-hairline-strong",
                  )}
                >
                  {char ? (
                    char
                  ) : isActive && !disabled ? (
                    <span className={cn("w-0.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none", size === "sm" ? "h-5" : "h-6")} />
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
