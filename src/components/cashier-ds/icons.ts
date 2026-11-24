import {
  ArrowDownLeft,
  ArrowUpRight,
  Bitcoin,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDollarSign,
  CircleX,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Delete,
  Eye,
  EyeOff,
  History,
  Info,
  Landmark,
  Loader2,
  MessageCircleQuestionMark,
  Plus,
  ShieldCheck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react"

/**
 * Standardized icon set for the cashier design system.
 *
 * Rules:
 * - Status icons always use the Circle* family: CircleCheck (success),
 *   CircleAlert (warning), CircleX (error), Clock (pending/neutral).
 *   Never mix a bare glyph (Check, X) with a circled one for the same meaning.
 * - Sizes follow the height scale: size-4 in 32px chips, size-5 in rows and
 *   timelines, size-6 in 48px+ status headings.
 * - All icons are aria-hidden; the surrounding element carries the label.
 */

export const StatusIcons = {
  success: CircleCheck,
  warning: CircleAlert,
  error: CircleX,
  pending: Clock,
} as const satisfies Record<string, LucideIcon>

export const NavigationIcons = {
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  close: X,
} as const satisfies Record<string, LucideIcon>

export const ActionIcons = {
  copy: Copy,
  check: Check,
  plus: Plus,
  delete: Delete,
  eye: Eye,
  eyeOff: EyeOff,
  info: Info,
  support: MessageCircleQuestionMark,
  loader: Loader2,
} as const satisfies Record<string, LucideIcon>

export const PaymentIcons = {
  card: CreditCard,
  bank: Landmark,
  wallet: Wallet,
  bitcoin: Bitcoin,
  coins: Coins,
  dollar: CircleDollarSign,
} as const satisfies Record<string, LucideIcon>

export const ContentIcons = {
  history: History,
  shieldCheck: ShieldCheck,
  arrowDownLeft: ArrowDownLeft,
  arrowUpRight: ArrowUpRight,
} as const satisfies Record<string, LucideIcon>

/** Every icon used in the cashier, for the Storybook icon inventory. */
export const AllIcons: { name: string; Icon: LucideIcon; category: string }[] = [
  // Status
  { name: "CircleCheck", Icon: CircleCheck, category: "Status" },
  { name: "CircleAlert", Icon: CircleAlert, category: "Status" },
  { name: "CircleX", Icon: CircleX, category: "Status" },
  { name: "Clock", Icon: Clock, category: "Status" },
  // Navigation
  { name: "ChevronLeft", Icon: ChevronLeft, category: "Navigation" },
  { name: "ChevronRight", Icon: ChevronRight, category: "Navigation" },
  { name: "ChevronDown", Icon: ChevronDown, category: "Navigation" },
  { name: "X", Icon: X, category: "Navigation" },
  // Actions
  { name: "Copy", Icon: Copy, category: "Actions" },
  { name: "Check", Icon: Check, category: "Actions" },
  { name: "Plus", Icon: Plus, category: "Actions" },
  { name: "Delete", Icon: Delete, category: "Actions" },
  { name: "Eye", Icon: Eye, category: "Actions" },
  { name: "EyeOff", Icon: EyeOff, category: "Actions" },
  { name: "Info", Icon: Info, category: "Actions" },
  { name: "MessageCircleQuestionMark", Icon: MessageCircleQuestionMark, category: "Actions" },
  { name: "Loader2", Icon: Loader2, category: "Actions" },
  // Payment
  { name: "CreditCard", Icon: CreditCard, category: "Payment" },
  { name: "Landmark", Icon: Landmark, category: "Payment" },
  { name: "Wallet", Icon: Wallet, category: "Payment" },
  { name: "Bitcoin", Icon: Bitcoin, category: "Payment" },
  { name: "Coins", Icon: Coins, category: "Payment" },
  { name: "CircleDollarSign", Icon: CircleDollarSign, category: "Payment" },
  // Content
  { name: "History", Icon: History, category: "Content" },
  { name: "ShieldCheck", Icon: ShieldCheck, category: "Content" },
  { name: "ArrowDownLeft", Icon: ArrowDownLeft, category: "Content" },
  { name: "ArrowUpRight", Icon: ArrowUpRight, category: "Content" },
]
