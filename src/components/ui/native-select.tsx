import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return extractText(node.props.children)
  return ""
}

function collectOptions(children: React.ReactNode): { value: string; label: string }[] {
  const result: { value: string; label: string }[] = []
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<{ value?: string | number | readonly string[]; children?: React.ReactNode }>(child)) return
    const typeName = typeof child.type === "function" ? child.type.name : child.type
    if (typeName === "option" || typeName === "NativeSelectOption") {
      const label = extractText(child.props.children)
      const val = child.props.value !== undefined ? String(child.props.value) : label
      result.push({ value: val, label })
      return
    }
    if (child.props.children) {
      result.push(...collectOptions(child.props.children))
    }
  })
  return result
}

function NativeSelect({
  className,
  size = "default",
  children,
  value,
  defaultValue,
  onChange,
  ...props
}: NativeSelectProps) {
  const options = React.useMemo(() => collectOptions(children), [children])
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | undefined>(() =>
    defaultValue !== undefined ? String(defaultValue) : options[0]?.value,
  )
  const currentValue = value !== undefined ? String(value) : (uncontrolledValue ?? options[0]?.value ?? "")
  const matchedOption = options.find((option) => option.value === currentValue) ?? options[0]
  const displayLabel = matchedOption?.label ?? ""
  const isPlaceholder = currentValue === ""

  return (
    <div
      className={cn(
        "group/native-select relative w-fit rounded-card bg-surface-3 ring-1 ring-hairline transition-colors has-[select:disabled]:opacity-50 has-[select:focus-visible]:ring-2 has-[select:focus-visible]:ring-ring has-[select[aria-invalid=true]]:ring-2 has-[select[aria-invalid=true]]:ring-destructive/40",
        className
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={(event) => {
          if (value === undefined) setUncontrolledValue(event.target.value)
          onChange?.(event)
        }}
        className="relative z-10 h-8 w-full min-w-0 cursor-pointer appearance-none rounded-card border-0 bg-transparent py-1 pr-10 pl-3 text-base opacity-0 outline-none select-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed data-[size=sm]:h-7"
        {...props}
      >
        {children}
      </select>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-between gap-2 pr-3.5 pl-3 text-[15px] leading-5 select-none"
      >
        <span className={cn("min-w-0 truncate", isPlaceholder ? "text-muted-foreground" : "text-foreground")}>
          {displayLabel}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" data-slot="native-select-icon" />
      </div>
    </div>
  )
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
