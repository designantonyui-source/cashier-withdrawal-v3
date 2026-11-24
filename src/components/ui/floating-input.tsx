import * as React from "react"
import { cn } from "cn"

/**
 * Floating-label input: the label rests inside the field while empty and
 * floats to the top edge on focus or once a value is present. The input
 * keeps a transparent background; the wrapper owns the surface and ring.
 */
function FloatingInput({
  label,
  id,
  className,
  inputClassName,
  labelClassName,
  error,
  ...props
}: React.ComponentProps<"input"> & {
  label: string
  error?: boolean
  inputClassName?: string
  labelClassName?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        placeholder=" "
        aria-invalid={error || undefined}
        className={cn(
          "peer h-14 w-full rounded-card bg-surface-3 px-3 pb-1 pt-5 text-[17px] text-foreground ring-1 ring-hairline transition-[box-shadow,background-color] outline-none placeholder:text-transparent focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50",
          error && "ring-danger/60 focus:ring-danger/60",
          inputClassName,
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground transition-all duration-150",
          "peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-primary",
          "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-medium",
          labelClassName,
        )}
      >
        {label}
      </label>
    </div>
  )
}

export { FloatingInput }
