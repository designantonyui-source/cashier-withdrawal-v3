import { cva, type VariantProps } from "class-variance-authority"
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  Delete,
  Info,
  Landmark,
  Loader2,
  Lock,
  MessageCircleQuestionMark,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react"
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
} from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { FloatingInput } from "@/components/ui/floating-input"
import { currencyExponent, formatNumber, normalizeAmountInput } from "./money"

const CashierSurfaceContext = createContext<HTMLElement | null>(null)

/* -------------------------------------------------------------------------- */
/* Surfaces and chrome                                                        */
/* -------------------------------------------------------------------------- */

export function CashierSurface({
  children,
  showGlow = false,
  className,
  label = "Cashier",
}: {
  children: ReactNode
  showGlow?: boolean
  className?: string
  label?: string
}) {
  const [surfaceEl, setSurfaceEl] = useState<HTMLElement | null>(null)
  return (
    <CashierSurfaceContext.Provider value={surfaceEl}>
      <section
        ref={setSurfaceEl}
        aria-label={label}
        style={showGlow ? { backgroundImage: "var(--surface-glow)" } : undefined}
        className={cn(
          "relative flex h-[760px] w-full max-w-[420px] flex-col overflow-hidden rounded-[24px] border border-hairline bg-background bg-no-repeat text-foreground shadow-[var(--surface-shadow)]",
          className,
        )}
      >
        {children}
      </section>
    </CashierSurfaceContext.Provider>
  )
}

export function CashierShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-svh items-center justify-center bg-background p-0 text-foreground sm:p-6",
        className,
      )}
    >
      <CashierSurface className="h-svh rounded-none border-0 sm:h-[780px] sm:max-h-[calc(100svh-48px)] sm:rounded-[24px] sm:border">
        {children}
      </CashierSurface>
    </div>
  )
}

export function IconButton({
  label,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--header-btn-bg,var(--surface-2))] text-foreground ring-1 ring-hairline backdrop-blur-sm transition-[background-color,transform] duration-150 hover:bg-[var(--header-btn-bg-hover,var(--surface-3))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function CashierHeader({
  title,
  subtitle,
  onBack,
  onClose,
  leading,
  trailing,
  seamless = false,
  className,
}: {
  title: string
  subtitle?: ReactNode
  onBack?: () => void
  onClose?: () => void
  leading?: ReactNode
  trailing?: ReactNode
  /** Hides the bottom divider and backdrop fill while at rest over the Home Hub glow. */
  seamless?: boolean
  className?: string
}) {
  // Keep Close pinned on the trailing side across every screen so it never
  // jumps left/right between hub, pushed forms, and settled status views.
  const closeOnRight = Boolean(onClose)
  const showLeft = Boolean(onBack || leading)
  return (
    <header
      className={cn(
        "relative z-10 flex h-14 shrink-0 items-center justify-between border-b px-4 transition-[background-color,border-color,box-shadow] duration-150",
        seamless
          ? "border-transparent bg-transparent"
          : "border-hairline bg-background/85 backdrop-blur-xl",
        className,
      )}
    >
      {showLeft ? (
        <div className="relative z-10 flex shrink-0 items-center gap-2">
          {onBack ? (
            <IconButton label="Go back" onClick={onBack}>
              <ChevronLeft className="size-5" aria-hidden="true" />
            </IconButton>
          ) : null}
          {leading}
          {!closeOnRight && onClose ? (
            <IconButton label="Close" onClick={onClose}>
              <X className="size-4" aria-hidden="true" />
            </IconButton>
          ) : null}
        </div>
      ) : (
        <span className="size-9 shrink-0" aria-hidden="true" />
      )}
      <div className="pointer-events-none absolute left-1/2 top-1/2 flex max-w-[calc(100%-6.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
        <h1 className="max-w-full truncate text-[16px] font-semibold leading-5 tracking-[-0.01em]">
          {title}
        </h1>
        {subtitle ? (
          <div className="pointer-events-auto mt-0.5 max-w-full truncate text-[12px] leading-4 tabular-nums text-muted-foreground">
            {subtitle}
          </div>
        ) : null}
      </div>
      {(trailing || closeOnRight) && (
        <div className="relative z-10 flex shrink-0 items-center gap-2">
          {trailing}
          {closeOnRight && onClose ? (
            <IconButton label="Close" onClick={onClose}>
              <X className="size-4" aria-hidden="true" />
            </IconButton>
          ) : null}
        </div>
      )}
    </header>
  )
}

export function CashierSheet({
  open,
  title,
  onClose,
  children,
  footer,
  className,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  const surfaceEl = useContext(CashierSurfaceContext)
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const getFocusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      )

    getFocusable()[0]?.focus()

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      onCloseRef.current()
    }

    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  const getFocusable = () =>
    Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ) ?? [],
    )

  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return

    const focusable = getFocusable()
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const content = (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={trapFocus}
        className={cn(
          "relative z-10 max-h-[86%] overflow-y-auto rounded-t-sheet border-t border-hairline-strong bg-surface-1 px-5 pb-6 pt-5 shadow-[0_-24px_80px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-6 duration-200 ease-out motion-reduce:animate-none",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[20px] font-semibold leading-6 tracking-[-0.01em]">{title}</h2>
          <IconButton label={`Close ${title}`} onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </IconButton>
        </div>
        {children}
        {footer ? <div className="mt-5">{footer}</div> : null}
      </div>
    </div>
  )

  return surfaceEl ? createPortal(content, surfaceEl) : content
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

const actionButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,color,transform,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--button-bg-primary)] text-[var(--button-text-primary)] shadow-[var(--shadow-soft)] hover:bg-[var(--button-bg-primary-hover)] active:bg-[var(--button-bg-primary-hover)] disabled:bg-surface-3 disabled:text-muted-foreground disabled:shadow-none disabled:opacity-100",
        secondary:
          "bg-[var(--button-bg-secondary)] text-[var(--button-text-secondary)] ring-1 ring-hairline hover:bg-[var(--button-bg-secondary-hover)]",
        ghost: "bg-transparent text-foreground hover:bg-surface-2",
        danger: "bg-danger-surface text-danger hover:bg-danger/20",
      },
      size: {
        lg: "h-[52px] px-6 text-[16px] leading-5",
        md: "h-12 px-5 text-[15px] leading-5",
        sm: "h-10 px-4 text-[13px] leading-[18px]",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
      fullWidth: true,
    },
  },
)

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof actionButtonVariants> & {
    loading?: boolean
    loadingLabel?: string
    leadingIcon?: ReactNode
  }

export function ActionButton({
  className,
  variant,
  size,
  fullWidth,
  loading = false,
  loadingLabel = "Processing…",
  leadingIcon,
  children,
  disabled,
  ...props
}: ActionButtonProps) {
  const resolvedSize = size ?? (variant === "secondary" ? "md" : "lg")
  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(actionButtonVariants({ variant, size: resolvedSize, fullWidth }), className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          {leadingIcon}
          {children}
        </>
      )}
    </button>
  )
}

/**
 * Standardized support trigger with consistent icon and hierarchy across all flows.
 * Defaults to `48px` (`size="md"`) for secondary, `52px` (`size="lg"`) for primary,
 * and `40px` (`size="sm"`) for ghost/compact utility contexts.
 */
export function SupportButton({
  label = "Contact support",
  variant = "secondary",
  size,
  className,
  ...props
}: Omit<ActionButtonProps, "children" | "leadingIcon"> & {
  label?: string
}) {
  const resolvedSize = size ?? (variant === "secondary" ? "md" : variant === "ghost" ? "sm" : "lg")
  return (
    <ActionButton
      variant={variant}
      size={resolvedSize}
      leadingIcon={<MessageCircleQuestionMark className={cn("shrink-0", resolvedSize === "sm" ? "size-3.5" : "size-4")} aria-hidden="true" />}
      className={className}
      {...props}
    >
      <span>{label}</span>
    </ActionButton>
  )
}

/* -------------------------------------------------------------------------- */
/* Amount entry                                                               */
/* -------------------------------------------------------------------------- */

export function AmountDisplay({
  value,
  muted = false,
  label = "Amount",
  input,
  subline,
  className,
}: {
  value: string
  muted?: boolean
  label?: string
  input?: ReactNode
  /** Glanceable secondary line under the amount, e.g. the fee-inclusive total. */
  subline?: ReactNode
  className?: string
}) {
  // Split the formatted value into the numeric part (accent) and the
  // currency affix (muted): "50 PLN" → "50" + " PLN", "$50.00" → "$" + "50.00".
  const match = /^([^\d]*)([\d\s.,\u00a0\u202f]+)([^\d]*)$/.exec(value)
  const [, prefix = "", digits = value, suffix = ""] = match ?? []
  const digitTone = muted ? "text-text-tertiary" : "bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
  // Interactive displays (with an input overlay) get a padded, large-radius
  // container so the keyboard-focus ring clears the display glyphs instead
  // of cutting through them. Read-only receipt displays stay unpadded.
  return (
    <div
      className={cn(
        "relative min-w-0",
        input &&
          "rounded-[20px] px-4 py-3 ring-1 ring-hairline focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-4 focus-within:ring-offset-background",
        className,
      )}
    >
      <p
        aria-live="polite"
        aria-atomic="true"
        className="font-display text-[clamp(48px,14vw,64px)] leading-[0.94] tracking-[-0.03em] tabular-nums"
      >
        {match ? (
          <>
            {prefix && <span className="text-text-tertiary">{prefix}</span>}
            <span className={digitTone}>{digits}</span>
            {suffix && <span className="text-text-tertiary">{suffix}</span>}
          </>
        ) : (
          <span className={digitTone}>{value}</span>
        )}
      </p>
      {subline ? (
        <p className="mt-1.5 text-[12px] leading-4 text-muted-foreground">{subline}</p>
      ) : null}
      <span className="sr-only">{label}</span>
      {input}
    </div>
  )
}

export function AmountKeypad({
  onDigit,
  onDecimal,
  onBackspace,
  disabled = false,
  /** Label for the decimal key; matches the locale's decimal separator. */
  decimalLabel = ".",
  className,
}: {
  onDigit: (digit: string) => void
  onDecimal: () => void
  onBackspace: () => void
  disabled?: boolean
  decimalLabel?: string
  className?: string
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"] as const

  return (
    <div role="group" aria-label="Amount keypad" className={cn("grid grid-cols-3 gap-1", className)}>
      {keys.map((key) =>
        key === "backspace" ? (
          <button
            key={key}
            type="button"
            aria-label="Delete last digit"
            disabled={disabled}
            onClick={onBackspace}
            className="flex h-14 items-center justify-center rounded-[20px] text-foreground transition-colors hover:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
          >
            <Delete className="size-6" aria-hidden="true" />
          </button>
        ) : (
          <button
            key={key}
            type="button"
            aria-label={key === "." ? "Decimal separator" : key}
            disabled={disabled}
            onClick={() => (key === "." ? onDecimal() : onDigit(key))}
            className="flex h-14 items-center justify-center rounded-[20px] text-[26px] font-normal tabular-nums text-foreground transition-colors hover:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
          >
            {key === "." ? decimalLabel : key}
          </button>
        ),
      )}
    </div>
  )
}

export function CurrencyAmountField({
  id,
  label,
  value,
  currency,
  locale = "pl-PL",
  error = false,
  describedBy,
  onChange,
}: {
  id: string
  label: string
  value: string
  currency: string
  locale?: string
  error?: boolean
  describedBy?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <FloatingInput
        id={id}
        label={label}
        inputMode="decimal"
        autoComplete="off"
        error={error}
        aria-invalid={error}
        aria-describedby={describedBy}
        value={value}
        onChange={(event) =>
          onChange(normalizeAmountInput(event.target.value, locale, currencyExponent(currency)))
        }
        inputClassName="pr-14 tabular-nums"
      />
      <span
        className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[12px] font-medium text-muted-foreground"
        aria-hidden="true"
      >
        {currency}
      </span>
    </div>
  )
}

export function QuickAmounts({
  amounts,
  format = (value) => formatNumber(value, "pl-PL"),
  value,
  onSelect,
  surface = "default",
  className,
}: {
  amounts: number[]
  format?: (value: number) => string
  value?: number | null
  onSelect: (value: number) => void
  surface?: "default" | "card"
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Quick amounts"
      className={cn("grid min-w-0 gap-2", className)}
      style={{ gridTemplateColumns: `repeat(${Math.max(1, amounts.length)}, minmax(0, 1fr))` }}
    >
      {amounts.map((amount) => (
        <button
          key={amount}
          type="button"
          aria-pressed={value === amount}
          onClick={() => onSelect(amount)}
          className={cn(
            "h-9 min-w-0 flex-1 truncate rounded-full px-2.5 text-[13px] font-medium tabular-nums transition-[background-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
            value === amount
              ? "bg-accent-soft text-foreground ring-1 ring-primary/70"
              : surface === "card"
                ? "bg-surface-3 text-foreground ring-1 ring-hairline hover:bg-surface-1"
                : "bg-surface-2 text-foreground hover:bg-surface-3",
          )}
        >
          {format(amount)}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Choice and methods                                                         */
/* -------------------------------------------------------------------------- */

export function OptionCard({
  icon,
  title,
  description,
  onClick,
  layout = "row",
  className,
}: {
  icon: ReactNode
  title: string
  description: string
  onClick?: () => void
  layout?: "row" | "stacked"
  className?: string
}) {
  if (layout === "stacked") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group flex w-full flex-col items-start gap-5 rounded-card bg-surface-2 p-5 text-left ring-1 ring-hairline transition-[background-color,transform] duration-150 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.995]",
          className,
        )}
      >
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-surface-3 ring-1 ring-hairline">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-[17px] font-semibold leading-6">{title}</span>
          <span className="mt-1 block text-[15px] leading-5 text-muted-foreground">
            {description}
          </span>
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-4 rounded-card bg-surface-2 p-4 text-left ring-1 ring-hairline transition-[background-color,transform] duration-150 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.995]",
        className,
      )}
    >
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-3 ring-1 ring-hairline">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold leading-6">{title}</span>
        <span className="mt-1 block text-[15px] leading-5 text-muted-foreground">{description}</span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-text-tertiary transition-transform duration-150 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  )
}

export function BalanceCard({
  label,
  value,
  icon,
  action,
  onAction,
  className,
}: {
  label: string
  value: string
  icon: ReactNode
  action?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-card bg-surface-2 p-4 ring-1 ring-hairline", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-3 ring-1 ring-hairline">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] leading-4 text-muted-foreground">{label}</p>
        <p className="mt-1 text-[22px] font-semibold leading-7 tracking-[-0.01em] tabular-nums">{value}</p>
      </div>
      {action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="h-9 shrink-0 rounded-full bg-[var(--button-bg-primary)] px-4 text-[14px] font-semibold text-[var(--button-text-primary)] transition-colors hover:bg-[var(--button-bg-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2"
        >
          {action}
        </button>
      ) : null}
    </div>
  )
}

export function MethodTrigger({
  name,
  onClick,
  className,
}: {
  name: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-14 w-full items-center justify-between gap-3 rounded-control px-3 text-left transition-colors hover:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span className="text-[17px] font-medium">{name}</span>
      <ChevronDown className="size-5 text-text-tertiary" aria-hidden="true" />
    </button>
  )
}

export function MethodGroup({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  const moveSelection = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"]
    if (!keys.includes(event.key)) return

    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]:not([disabled])',
      ),
    )
    if (items.length === 0) return

    const currentIndex = items.findIndex((item) => item === document.activeElement)
    const lastIndex = items.length - 1
    let nextIndex: number

    if (event.key === "Home") {
      nextIndex = 0
    } else if (event.key === "End") {
      nextIndex = lastIndex
    } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = currentIndex < lastIndex ? currentIndex + 1 : 0
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : lastIndex
    }

    event.preventDefault()
    items[nextIndex].focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={moveSelection}
      className={cn(
        "method-inset-group overflow-hidden rounded-card bg-surface-2 ring-1 ring-hairline",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SelectionIndicator({
  selected = false,
  shape = "circle",
  className,
}: {
  selected?: boolean
  shape?: "circle" | "square"
  className?: string
}) {
  const radius = shape === "circle" ? "rounded-full" : "rounded-[8px]"
  return selected ? (
    <span
      className={cn(
        "flex size-[26px] shrink-0 items-center justify-center bg-primary text-primary-foreground transition-colors",
        radius,
        className,
      )}
      aria-hidden="true"
    >
      <Check className="size-4" strokeWidth={2.5} />
    </span>
  ) : (
    <span
      className={cn(
        "size-[26px] shrink-0 border-[1.3px] border-hairline bg-surface-3 transition-colors",
        radius,
        className,
      )}
      aria-hidden="true"
    />
  )
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  onChange,
  disabled,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onCheckedChange?.(event.target.checked)
          onChange?.(event)
        }}
        className="peer sr-only"
        {...props}
      />
      <SelectionIndicator
        shape="square"
        selected={checked}
        className="peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-45"
      />
    </span>
  )
}

export function Radio({
  checked = false,
  onCheckedChange,
  onChange,
  disabled,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)}>
      <input
        type="radio"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onCheckedChange?.(event.target.checked)
          onChange?.(event)
        }}
        className="peer sr-only"
        {...props}
      />
      <SelectionIndicator
        shape="circle"
        selected={checked}
        className="peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-45"
      />
    </span>
  )
}

export function Switch({
  checked = false,
  onCheckedChange,
  disabled,
  onClick,
  className,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(event) => {
        onCheckedChange?.(!checked)
        onClick?.(event)
      }}
      className={cn(
        "relative h-7 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2 disabled:pointer-events-none disabled:opacity-45",
        checked ? "bg-primary" : "bg-surface-3 ring-1 ring-hairline-strong",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[3px] size-[22px] rounded-full bg-white shadow transition-all",
          checked ? "left-[19px]" : "left-[3px]",
        )}
      />
    </button>
  )
}

export function MethodRow({
  icon,
  title,
  description,
  selected = false,
  onClick,
  variant = "select",
  className,
}: {
  icon: ReactNode
  title: string
  description?: string
  selected?: boolean
  onClick?: () => void
  /** "select" shows radio indicators (destination pickers); "navigate" shows a chevron (method lists that push a detail screen). */
  variant?: "select" | "navigate"
  className?: string
}) {
  return (
    <button
      type="button"
      role={variant === "select" ? "radio" : undefined}
      aria-checked={variant === "select" ? selected : undefined}
      tabIndex={variant === "select" ? (selected ? 0 : -1) : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-card bg-surface-2 px-4 py-2.5 text-left ring-1 ring-hairline [.method-inset-group>&]:ring-0 transition-[background-color,transform] duration-150 hover:bg-surface-3/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [.method-inset-group>&]:focus-visible:ring-inset active:scale-[0.99] active:bg-surface-3",
        variant === "select" && selected && "bg-surface-3/50",
        className,
      )}
    >
      <span className="flex h-9 w-[50px] shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-5">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-[12px] font-normal leading-4 text-muted-foreground">{description}</span>
        ) : null}
      </span>
      {variant === "select" ? (
        <SelectionIndicator selected={selected} />
      ) : (
        <ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />
      )}
    </button>
  )
}

export type SheetPickerOption = {
  value: string
  label: string
  subtitle?: string
  icon?: ReactNode
  iconSrc?: string
  badgeText?: string
  badgeColor?: string
}

/**
 * Shared 50×32 white brand chip with crisp 10px corners so payment and bank
 * marks never shrink inside flex rows or get pinched at the edges.
 */
export function PaymentChip({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex h-8 w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white px-1.5 ring-1 ring-black/5",
        className,
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}

function SheetOptionVisual({ option }: { option: SheetPickerOption }) {
  if (option.icon) {
    return (
      <span
        className="flex h-9 w-[53px] shrink-0 items-center justify-center"
        aria-hidden="true"
      >
        {option.icon}
      </span>
    )
  }
  if (option.iconSrc) {
    return (
      <PaymentChip className="px-1.5 py-1">
        <img src={option.iconSrc} alt="" className="max-h-full max-w-full object-contain" />
      </PaymentChip>
    )
  }
  if (option.badgeText) {
    return (
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: option.badgeColor ?? "#7c3aed" }}
        aria-hidden="true"
      >
        {option.badgeText}
      </span>
    )
  }
  return (
    <PaymentChip>
      <Landmark className="size-4 text-[#111111]" />
    </PaymentChip>
  )
}

/**
 * iOS-native bottom-sheet selector replacing browser <select> menus inside
 * payment forms and payout destination pickers.
 */
export function SheetPickerField({
  id,
  label,
  sheetTitle,
  placeholder = "Choose an option",
  value,
  options,
  onChange,
  error = false,
  describedBy,
  className,
}: {
  id: string
  label: string
  sheetTitle?: string
  placeholder?: string
  value: string
  options: SheetPickerOption[]
  onChange: (value: string) => void
  error?: boolean
  describedBy?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)
  const previewOptions = selected ? [] : options.filter((option) => option.iconSrc).slice(0, 3)

  return (
    <>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={error || undefined}
        aria-describedby={describedBy}
        onClick={() => setOpen(true)}
        className={cn(
          "flex min-h-14 w-full items-center justify-between gap-3 rounded-[18px] bg-surface-3 px-4 py-2.5 text-left ring-1 ring-hairline transition-[background-color,box-shadow,transform] duration-150 hover:bg-surface-3/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]",
          error && "ring-danger/60 focus-visible:ring-danger/60",
          className,
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {selected ? <SheetOptionVisual option={selected} /> : null}
          <span className="grid min-w-0">
            {selected ? (
              <>
                <span className="text-[11px] font-medium leading-3.5 text-muted-foreground">{label}</span>
                <span className="mt-0.5 truncate text-[15px] font-medium leading-5 text-foreground">{selected.label}</span>
              </>
            ) : (
              <span className="truncate text-[15px] text-muted-foreground">{placeholder}</span>
            )}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          {previewOptions.length > 0 ? (
            <span className="flex items-center -space-x-1" aria-hidden="true">
              {previewOptions.map((option) => (
                <span
                  key={option.value}
                  className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-white p-1 ring-2 ring-surface-3"
                >
                  <img src={option.iconSrc} alt="" className="max-h-full max-w-full object-contain" />
                </span>
              ))}
            </span>
          ) : null}
          <ChevronRight className="size-4 text-text-tertiary" aria-hidden="true" />
        </span>
      </button>

      <CashierSheet open={open} title={sheetTitle ?? label} onClose={() => setOpen(false)}>
        <MethodGroup label={sheetTitle ?? label}>
          {options.map((option) => (
            <MethodRow
              key={option.value}
              icon={<SheetOptionVisual option={option} />}
              title={option.label}
              description={option.subtitle}
              variant="select"
              selected={option.value === value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            />
          ))}
        </MethodGroup>
      </CashierSheet>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Review and feedback                                                        */
/* -------------------------------------------------------------------------- */

const SummaryVariantContext = createContext<"card" | "receipt">("card")

export function SummaryList({
  children,
  variant = "card",
  className,
}: {
  children: ReactNode
  variant?: "card" | "receipt"
  className?: string
}) {
  return (
    <SummaryVariantContext.Provider value={variant}>
      <dl
        className={cn(
          variant === "receipt"
            ? "mt-2.5 px-1.5 pb-0.5 pt-1"
            : "rounded-card bg-surface-2 px-4 py-1.5 ring-1 ring-hairline",
          className,
        )}
      >
        {children}
      </dl>
    </SummaryVariantContext.Provider>
  )
}

export function SummaryRow({
  label,
  value,
  detail,
  emphasis = false,
  positive = false,
  valueClassName,
  className,
}: {
  label: string
  value: ReactNode
  detail?: string
  emphasis?: boolean
  positive?: boolean
  valueClassName?: string
  className?: string
}) {
  const variant = useContext(SummaryVariantContext)
  const isReceipt = variant === "receipt"

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        emphasis
          ? "mt-1 border-t border-hairline pb-2 pt-3"
          : isReceipt
            ? "py-1.5"
            : "py-2",
        className,
      )}
    >
      <dt
        className={cn(
          "min-w-0 leading-5",
          isReceipt
            ? emphasis
              ? "text-[14.5px] font-bold text-foreground"
              : "text-[13.5px] font-normal text-muted-foreground"
            : cn(
                "text-[14px]",
                emphasis ? "font-medium text-foreground" : "font-normal text-muted-foreground",
              ),
        )}
      >
        {label}
        {detail ? <span className="mt-0.5 block text-[12px] leading-4 font-normal text-muted-foreground">{detail}</span> : null}
      </dt>
      <dd
        className={cn(
          "shrink-0 text-right leading-5 tabular-nums",
          positive
            ? "font-semibold text-[var(--fee-free,var(--success))]"
            : "text-foreground",
          isReceipt
            ? emphasis
              ? "text-[15.5px] font-bold"
              : cn("text-[13.5px]", !positive && "font-medium")
            : cn("text-[14px]", !positive && (emphasis ? "font-semibold" : "font-medium")),
          valueClassName,
        )}
      >
        {value}
      </dd>
    </div>
  )
}

type StatusTone = "success" | "warning" | "error"

const statusTone: Record<StatusTone, { Icon: LucideIcon; badge: string }> = {
  success: { Icon: CircleCheck, badge: "bg-success text-background" },
  warning: { Icon: CircleAlert, badge: "bg-warning text-background" },
  error: { Icon: CircleX, badge: "bg-danger text-background" },
}

export function StatusToast({
  title,
  description,
  tone = "success",
  className,
  ...props
}: {
  title: string
  description?: string
  tone?: StatusTone
} & HTMLAttributes<HTMLDivElement>) {
  const { Icon, badge } = statusTone[tone]

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={cn(
        "flex items-center gap-3 rounded-card bg-surface-2 px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.55)] animate-in fade-in slide-in-from-top-2 duration-200 motion-reduce:animate-none",
        className,
      )}
      {...props}
    >
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", badge)}>
        <Icon className="size-4" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-medium leading-5">{title}</p>
        {description ? (
          <p className="mt-1 text-[12px] leading-4 text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  )
}

type StatusHeadingTone = StatusTone | "neutral"

const statusHeadingTone: Record<StatusHeadingTone, { Icon: LucideIcon; badge: string }> = {
  success: { Icon: CircleCheck, badge: "bg-success-surface text-success" },
  warning: { Icon: CircleAlert, badge: "bg-warning-surface text-warning" },
  error: { Icon: CircleX, badge: "bg-danger-surface text-danger" },
  neutral: { Icon: Clock, badge: "bg-surface-3 text-muted-foreground" },
}

export function StatusHeading({
  tone,
  title,
  emphasis,
  description,
  headingRef,
  className,
  icon,
}: {
  tone: StatusHeadingTone
  title: string
  emphasis?: string
  description?: string
  headingRef?: Ref<HTMLHeadingElement>
  className?: string
  /** Overrides the tone glyph (e.g. canceled vs expired share the neutral tone). */
  icon?: LucideIcon
}) {
  const { Icon: ToneIcon, badge } = statusHeadingTone[tone]
  const Icon = icon ?? ToneIcon
  const descriptionId = useId()
  const hasDescription = Boolean(emphasis || description)
  // Every tone opens the screen the same way: icon, title and
  // description are centered, matching the success layout.
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <span
        className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", badge)}
        aria-hidden="true"
      >
        <Icon className="size-6" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <h2
          ref={headingRef}
          tabIndex={-1}
          aria-describedby={hasDescription ? descriptionId : undefined}
          className="text-[20px] font-semibold leading-6 tracking-[-0.01em] outline-none"
        >
          {title}
        </h2>
        {hasDescription ? (
          <div id={descriptionId} className="mx-auto mt-1.5 max-w-[30ch]">
            {emphasis ? (
              <p className="text-[13px] font-medium leading-5 text-foreground">{emphasis}</p>
            ) : null}
            {description ? (
              <p className="text-[13px] leading-5 text-muted-foreground">{description}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function InlineNotice({
  title,
  children,
  icon,
  tone = "neutral",
  className,
}: {
  title: string
  children?: ReactNode
  icon?: ReactNode
  tone?: "neutral" | "warning" | "danger"
  className?: string
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "note"}
      className={cn(
        "flex gap-3 rounded-card border p-4",
        tone === "neutral" && "border-hairline bg-surface-1",
        tone === "warning" && "border-warning/20 bg-warning-surface",
        tone === "danger" && "border-danger/20 bg-danger-surface",
        className,
      )}
    >
      <span
        className={cn(
          "mt-1 shrink-0",
          tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : "text-muted-foreground",
        )}
      >
        {icon ?? <Info className="size-5" aria-hidden="true" />}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-5">{title}</p>
        {children ? <div className="mt-1 text-[12px] leading-4 text-muted-foreground">{children}</div> : null}
      </div>
    </div>
  )
}

/**
 * The one empty / error shell for the cashier. History empty, filtered empty,
 * history error and the withdrawal empty state all render through this so
 * they share container, icon, type scale and action weight.
 */
export function EmptyState({
  icon,
  title,
  description,
  detail,
  action,
  onAction,
  tone = "empty",
  actionVariant = "primary",
  className,
}: {
  icon: ReactNode
  title: string
  description: string
  /** Extra muted line under the description (e.g. min/max limits). */
  detail?: ReactNode
  action?: string
  onAction?: () => void
  tone?: "empty" | "pending" | "error"
  actionVariant?: "primary" | "secondary"
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-card bg-surface-2 px-6 py-8 text-center ring-1 ring-hairline",
        className,
      )}
    >
      <span
        className={cn(
          "mb-4 flex size-12 items-center justify-center rounded-full ring-1 [&_svg]:size-6",
          tone === "error"
            ? "bg-danger-surface text-danger ring-danger/20"
            : tone === "pending"
              ? "bg-warning-surface text-warning ring-warning/20"
              : "bg-accent-soft text-primary ring-primary/20",
        )}
      >
        {icon}
      </span>
      <p className="text-[17px] font-semibold leading-6 tracking-[-0.01em]">{title}</p>
      <p className="mt-1.5 max-w-[30ch] text-[14px] leading-5 text-muted-foreground">{description}</p>
      {detail ? <p className="mt-1 text-[12px] leading-4 text-text-tertiary">{detail}</p> : null}
      {action && onAction ? (
        <ActionButton
          variant={actionVariant}
          size="md"
          className="mt-6"
          onClick={onAction}
        >
          {action}
        </ActionButton>
      ) : null}
    </div>
  )
}

/**
 * Compact security reassurance line placed directly below payment confirmation CTAs.
 */
export function SecureTransactionNote({
  methodName,
  className,
}: {
  methodName?: string
  className?: string
}) {
  const label = methodName
    ? `Encrypted & secure ${methodName} transaction`
    : "Encrypted & secure transaction"
  return (
    <p
      className={cn(
        "flex items-center justify-center gap-1.5 text-[12px] leading-4 text-muted-foreground",
        className,
      )}
    >
      <Lock className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </p>
  )
}

/**
 * Compact balance subtitle rendered inside `CashierHeader` on pushed sub-screens.
 */
export function HeaderBalanceSubtitle({
  label = "Balance",
  value,
  visible = true,
  onToggleVisible,
  className,
}: {
  label?: string
  value: string
  visible?: boolean
  onToggleVisible?: () => void
  className?: string
}) {
  const text = `${label}: ${visible ? value : "••••"}`
  if (!onToggleVisible) {
    return <span className={className}>{text}</span>
  }
  return (
    <button
      type="button"
      onClick={onToggleVisible}
      aria-label={visible ? "Hide balance" : "Show balance"}
      className={cn(
        "rounded px-1.5 transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {text}
    </button>
  )
}

/**
 * Compact sticky compliance footer bar for cashier home screens.
 */
export function CashierComplianceFooter({
  plLicensed = true,
  onResponsiblePlay,
  className,
}: {
  plLicensed?: boolean
  onResponsiblePlay?: () => void
  className?: string
}) {
  return (
    <footer
      aria-label="Regulatory and responsible play information"
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-t border-hairline bg-background/85 px-5 py-3.5 text-[12px] leading-4 text-muted-foreground backdrop-blur-xl",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex h-[22px] items-center rounded-[6px] bg-surface-2 px-1.5 text-[11px] font-semibold tracking-[-0.01em] text-foreground/85 ring-1 ring-hairline">
          18+
        </span>
        {onResponsiblePlay ? (
          <button
            type="button"
            onClick={onResponsiblePlay}
            className="rounded transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Play responsibly
          </button>
        ) : (
          <span>Play responsibly</span>
        )}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />
        <span>{plLicensed ? "Licensed by MF (PL)" : "Encrypted & regulated"}</span>
      </span>
    </footer>
  )
}
