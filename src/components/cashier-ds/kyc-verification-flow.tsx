import {
  BookUser,
  Camera,
  Check,
  ChevronRight,
  CircleCheck,
  Clock,
  FileText,
  IdCard,
  Landmark,
  ScanText,
  Upload,
  User,
} from "lucide-react"
import { useId, useRef, useState } from "react"

import { POLISH_BANKS, toBankPickerOptions } from "@/lib/bank-options"
import { cn } from "@/lib/utils"
import { FloatingInput } from "@/components/ui/floating-input"

import {
  ActionButton,
  CashierHeader,
  SheetPickerField,
  SummaryList,
  SummaryRow,
} from "./primitives"

export type KycStep = "checklist" | "personal" | "document" | "bank" | "submitted" | "verified"
export type KycDocType = "id-card" | "passport"

export type KycSubmission = {
  fullName: string
  pesel: string
  docType: KycDocType
  bankName: string
  iban: string
}

const DOC_OPTIONS = [
  {
    value: "id-card",
    label: "Polish ID card",
    subtitle: "Front and back required",
    icon: (
      <img
        src="/kyc-icons/polish-id-card.png"
        alt=""
        className="h-[27px] w-10 rounded-[4px] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.16)]"
      />
    ),
  },
  {
    value: "passport",
    label: "Passport",
    subtitle: "Photo page only",
    icon: (
      <img
        src="/kyc-icons/polish-passport.png"
        alt=""
        className="h-9 w-7 rounded-[3px] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.22)]"
      />
    ),
  },
]

const KYC_BANK_OPTIONS = toBankPickerOptions([
  ...POLISH_BANKS.map((bank) => bank.name),
  "Other bank",
])

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

function formatPlIbanInput(value: string) {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (!cleaned) return ""
  const withPrefix = cleaned.startsWith("PL") ? cleaned : `PL${cleaned.replace(/^P?L?/, "")}`
  return withPrefix.slice(0, 28)
}

function isValidPlIban(value: string) {
  return /^PL\d{26}$/.test(value.replace(/\s+/g, "").toUpperCase())
}

function maskPesel(value: string) {
  const digits = onlyDigits(value)
  if (digits.length < 4) return digits
  return `•••••••${digits.slice(-4)}`
}

function maskIban(value: string) {
  const clean = value.replace(/\s+/g, "").toUpperCase()
  if (clean.length < 8) return clean
  return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`
}

function StepIconCircle({ done, Icon }: { done: boolean; Icon: typeof User }) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full ring-1",
        done
          ? "bg-success-surface text-success ring-success/20"
          : "bg-surface-3 text-foreground ring-hairline",
      )}
      aria-hidden="true"
    >
      {done ? <Check className="size-5" strokeWidth={2.5} /> : <Icon className="size-5" />}
    </span>
  )
}

function DocumentUploadSlot({
  icon: Icon = FileText,
  label,
  hint,
  fileName,
  onSelectFile,
  onCapture,
  onClear,
}: {
  icon?: typeof FileText
  label: string
  hint: string
  fileName: string | null
  onSelectFile: (name: string) => void
  onCapture: () => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className={cn(
        "grid gap-3 rounded-card p-4 ring-1 transition-colors",
        fileName ? "bg-surface-2 ring-success/30" : "bg-surface-2 ring-hairline",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full ring-1",
              fileName
                ? "bg-success-surface text-success ring-success/20"
                : "bg-surface-3 text-muted-foreground ring-hairline",
            )}
            aria-hidden="true"
          >
            {fileName ? <Check className="size-5" strokeWidth={2.5} /> : <Icon className="size-5" />}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-medium leading-5 text-foreground">{label}</p>
            <p className="mt-0.5 truncate text-[12px] leading-4 text-muted-foreground">
              {fileName ? `${fileName} · Ready` : hint}
            </p>
          </div>
        </div>
        {fileName ? (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Retake
          </button>
        ) : null}
      </div>

      {!fileName ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCapture}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-surface-3 px-3 text-[13px] font-medium text-foreground ring-1 ring-hairline transition-colors hover:bg-surface-3/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Camera className="size-4" aria-hidden="true" />
            <span>Take photo</span>
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-surface-3 px-3 text-[13px] font-medium text-foreground ring-1 ring-hairline transition-colors hover:bg-surface-3/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Upload className="size-4" aria-hidden="true" />
            <span>Upload file</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
            aria-label={`Upload ${label}`}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onSelectFile(file.name)
              event.target.value = ""
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

/**
 * Multi-step iOS KYC verification flow matching Polish regulatory requirements
 * (legal name + PESEL, photo ID, and own PL IBAN bank account).
 * Patterns drawn from Phantom iOS, Zopa Bank, Wise, and Cash App verification flows.
 */
export function KycVerificationFlow({
  initialStep = "checklist",
  initialData,
  onBack,
  onClose,
  onSubmit,
  onComplete,
}: {
  initialStep?: KycStep
  initialData?: Partial<KycSubmission>
  onBack: () => void
  onClose?: () => void
  onSubmit: (submission: KycSubmission) => void
  onComplete: () => void
}) {
  const idPrefix = useId()
  const [step, setStep] = useState<KycStep>(initialStep)

  const [fullName, setFullName] = useState(initialData?.fullName ?? "")
  const [pesel, setPesel] = useState(initialData?.pesel ?? "")
  const [personalAttempted, setPersonalAttempted] = useState(false)
  const [personalDone, setPersonalDone] = useState(
    Boolean(initialData?.fullName && onlyDigits(initialData?.pesel ?? "").length === 11),
  )

  const [docType, setDocType] = useState<KycDocType>(initialData?.docType ?? "id-card")
  const [frontFile, setFrontFile] = useState<string | null>(
    initialStep === "bank" || initialStep === "submitted" || initialStep === "verified"
      ? "Document front photo"
      : null,
  )
  const [backFile, setBackFile] = useState<string | null>(
    initialStep === "bank" || initialStep === "submitted" || initialStep === "verified"
      ? "Document back photo"
      : null,
  )
  const [documentDone, setDocumentDone] = useState(
    initialStep === "bank" || initialStep === "submitted" || initialStep === "verified",
  )

  const [bankName, setBankName] = useState(initialData?.bankName ?? "")
  const [iban, setIban] = useState(initialData?.iban ?? "")
  const [bankAttempted, setBankAttempted] = useState(false)
  const [bankDone, setBankDone] = useState(
    Boolean(initialData?.bankName && isValidPlIban(initialData?.iban ?? "")),
  )

  const [checkingStatus, setCheckingStatus] = useState(false)

  const completedCount = Number(personalDone) + Number(documentDone) + Number(bankDone)
  const allStepsDone = completedCount === 3

  const normalizedName = fullName.trim()
  const peselDigits = onlyDigits(pesel)
  const nameValid = normalizedName.split(/\s+/).filter(Boolean).length >= 2
  const peselValid = peselDigits.length === 11

  const needsBackPhoto = docType === "id-card"
  const docsReady = Boolean(frontFile) && (!needsBackPhoto || Boolean(backFile))

  const ibanValid = isValidPlIban(iban)
  const bankValid = Boolean(bankName) && ibanValid

  const savePersonal = () => {
    setPersonalAttempted(true)
    if (!nameValid || !peselValid) return
    setPersonalDone(true)
    setStep(documentDone ? "checklist" : "document")
  }

  const saveDocument = () => {
    if (!docsReady) return
    setDocumentDone(true)
    setStep(bankDone ? "checklist" : "bank")
  }

  const saveBank = () => {
    setBankAttempted(true)
    if (!bankValid) return
    setBankDone(true)
    setStep("checklist")
  }

  const submitAll = () => {
    if (!allStepsDone) {
      if (!personalDone) setStep("personal")
      else if (!documentDone) setStep("document")
      else setStep("bank")
      return
    }
    onSubmit({
      fullName: normalizedName,
      pesel: peselDigits,
      docType,
      bankName,
      iban: formatPlIbanInput(iban),
    })
    setStep("submitted")
  }

  const refreshVerification = () => {
    if (checkingStatus) return
    setCheckingStatus(true)
    window.setTimeout(() => {
      setCheckingStatus(false)
      setStep("verified")
    }, 450)
  }

  const headerBack = () => {
    if (step === "checklist" || step === "submitted" || step === "verified") {
      onBack()
      return
    }
    setStep("checklist")
  }

  if (step === "submitted") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <CashierHeader title="Identity verification" onBack={onBack} onClose={onClose} />
        <div className="cashier-push min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-6">
          <div className="grid gap-5">
            <div className="flex flex-col items-center text-center">
              <span
                className="flex size-12 items-center justify-center rounded-full bg-warning-surface text-warning"
                aria-hidden="true"
              >
                <Clock className="size-6" strokeWidth={2.25} />
              </span>
              <h2 className="mt-4 text-[22px] font-semibold leading-7 tracking-[-0.01em]">
                Verification in review
              </h2>
              <p className="mt-1.5 max-w-[32ch] text-[14px] leading-5 text-muted-foreground">
                We’re checking your details against Polish regulatory records. Withdrawals unlock as soon as review completes.
              </p>
            </div>

            <SummaryList>
              <SummaryRow label="Legal name" value={normalizedName || "Submitted"} />
              <SummaryRow label="PESEL" value={peselDigits ? maskPesel(peselDigits) : "Submitted"} />
              <SummaryRow
                label="Photo ID"
                value={docType === "passport" ? "Passport" : "Polish ID card"}
              />
              <SummaryRow
                label="Bank account"
                value={bankName ? `${bankName} · ${maskIban(iban)}` : "Submitted"}
              />
            </SummaryList>
          </div>
        </div>
        <div className="shrink-0 border-t border-hairline bg-background/80 px-5 pb-6 pt-3 backdrop-blur-xl">
          <ActionButton loading={checkingStatus} onClick={refreshVerification}>
            Check status
          </ActionButton>
        </div>
      </div>
    )
  }

  if (step === "verified") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <CashierHeader title="Identity verification" onClose={onClose ?? onBack} />
        <div className="cashier-push min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-6">
          <div className="grid gap-5">
            <div className="flex flex-col items-center text-center">
              <span
                className="flex size-12 items-center justify-center rounded-full bg-success-surface text-success"
                aria-hidden="true"
              >
                <CircleCheck className="size-6" strokeWidth={2.25} />
              </span>
              <h2 className="mt-4 text-[22px] font-semibold leading-7 tracking-[-0.01em]">
                Identity verified
              </h2>
              <p className="mt-1.5 max-w-[32ch] text-[14px] leading-5 text-muted-foreground">
                Your identity and Polish bank account are confirmed. You can withdraw anytime.
              </p>
            </div>

            <SummaryList>
              <SummaryRow label="Personal details & PESEL" value="Verified" valueClassName="text-success" />
              <SummaryRow label="Photo ID" value="Verified" valueClassName="text-success" />
              <SummaryRow label="Polish bank account" value="Verified" valueClassName="text-success" />
            </SummaryList>
          </div>
        </div>
        <div className="shrink-0 border-t border-hairline bg-background/80 px-5 pb-6 pt-3 backdrop-blur-xl">
          <ActionButton onClick={onComplete}>Continue to withdraw</ActionButton>
        </div>
      </div>
    )
  }

  if (step === "personal") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <CashierHeader title="Personal details" onBack={headerBack} onClose={onClose} />
        <div className="cashier-push min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5">
          <section className="grid gap-2" aria-label="Personal details">
            <h2 className="px-1 text-[13px] font-semibold leading-5 text-foreground">
              Legal name & PESEL
            </h2>

            <div className="overflow-hidden rounded-[18px] bg-surface-2 ring-1 ring-hairline">
              <div className="border-b border-hairline">
                <FloatingInput
                  id={`${idPrefix}-name`}
                  label="Full legal name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  error={personalAttempted && !nameValid}
                  aria-invalid={personalAttempted && !nameValid}
                  inputClassName="rounded-t-[18px] rounded-b-none bg-transparent ring-0 focus:ring-2 focus:ring-inset"
                />
              </div>
              <FloatingInput
                id={`${idPrefix}-pesel`}
                label="PESEL (11 digits)"
                inputMode="numeric"
                maxLength={11}
                value={pesel}
                onChange={(event) => setPesel(onlyDigits(event.target.value).slice(0, 11))}
                error={personalAttempted && !peselValid}
                aria-invalid={personalAttempted && !peselValid}
                inputClassName="rounded-b-[18px] rounded-t-none bg-transparent font-mono tabular-nums ring-0 focus:ring-2 focus:ring-inset"
              />
            </div>

            {personalAttempted && (!nameValid || !peselValid) ? (
              <p role="alert" className="px-1 text-[12px] leading-4 text-danger">
                {!nameValid
                  ? "Enter your first and last legal name."
                  : "Enter a valid 11-digit PESEL number."}
              </p>
            ) : (
              <p className="px-1 text-[12px] leading-4 text-muted-foreground">
                Enter your full legal name and 11-digit PESEL as shown on your ID. Required by Polish gambling law.
              </p>
            )}
          </section>
        </div>
        <div className="shrink-0 border-t border-hairline bg-background/80 px-5 pb-6 pt-3 backdrop-blur-xl">
          <ActionButton onClick={savePersonal}>Save and continue</ActionButton>
        </div>
      </div>
    )
  }

  if (step === "document") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <CashierHeader title="Photo ID" onBack={headerBack} onClose={onClose} />
        <div className="cashier-push min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5">
          <div className="grid gap-4">
            <div className="grid gap-1">
              <h2 className="text-[17px] font-semibold leading-6">Add a photo of your ID</h2>
              <p className="text-[13px] leading-5 text-muted-foreground">
                Make sure all corners are visible and the text is sharp and glare-free.
              </p>
            </div>

            <SheetPickerField
              id={`${idPrefix}-doc-type`}
              label="Document type"
              sheetTitle="Select document type"
              placeholder="Select document type"
              value={docType}
              options={DOC_OPTIONS}
              onChange={(value) => setDocType(value as KycDocType)}
            />

            <div className="grid gap-3">
              <DocumentUploadSlot
                icon={docType === "passport" ? BookUser : IdCard}
                label={docType === "passport" ? "Photo page" : "Front of ID"}
                hint="Clear photo showing your face and details"
                fileName={frontFile}
                onSelectFile={setFrontFile}
                onCapture={() => setFrontFile(docType === "passport" ? "passport-photo.jpg" : "id-front.jpg")}
                onClear={() => setFrontFile(null)}
              />
              {needsBackPhoto ? (
                <DocumentUploadSlot
                  icon={ScanText}
                  label="Back of ID"
                  hint="Include the full MRZ code at the bottom"
                  fileName={backFile}
                  onSelectFile={setBackFile}
                  onCapture={() => setBackFile("id-back.jpg")}
                  onClear={() => setBackFile(null)}
                />
              ) : null}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-hairline bg-background/80 px-5 pb-6 pt-3 backdrop-blur-xl">
          <ActionButton disabled={!docsReady} onClick={saveDocument}>
            Save and continue
          </ActionButton>
        </div>
      </div>
    )
  }

  if (step === "bank") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <CashierHeader title="Bank account" onBack={headerBack} onClose={onClose} />
        <div className="cashier-push min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5">
          <section className="grid gap-3" aria-label="Bank account">
            <h2 className="px-1 text-[13px] font-semibold leading-5 text-foreground">
              Polish bank account
            </h2>

            <SheetPickerField
              id={`${idPrefix}-bank`}
              label="Polish bank"
              sheetTitle="Choose your bank"
              placeholder="Choose your bank"
              value={bankName}
              options={KYC_BANK_OPTIONS}
              error={bankAttempted && !bankName}
              onChange={setBankName}
            />

            <FloatingInput
              id={`${idPrefix}-iban`}
              label="Polish IBAN (PL + 26 digits)"
              value={iban}
              maxLength={28}
              onChange={(event) => setIban(formatPlIbanInput(event.target.value))}
              error={bankAttempted && !ibanValid}
              aria-invalid={bankAttempted && !ibanValid}
              inputClassName="bg-surface-2 font-mono uppercase tabular-nums"
            />

            {bankAttempted && !bankValid ? (
              <p role="alert" className="px-1 text-[12px] leading-4 text-danger">
                {!bankName
                  ? "Select your Polish bank."
                  : "Enter a valid 28-character Polish IBAN starting with PL."}
              </p>
            ) : (
              <p className="px-1 text-[12px] leading-4 text-muted-foreground">
                Must be held in your legal name. Withdrawals are paid out only to this IBAN.
              </p>
            )}
          </section>
        </div>
        <div className="shrink-0 border-t border-hairline bg-background/80 px-5 pb-6 pt-3 backdrop-blur-xl">
          <ActionButton onClick={saveBank}>Save and continue</ActionButton>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CashierHeader title="Verify your identity" onBack={headerBack} onClose={onClose} />
      <div className="cashier-push min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5">
        <div className="grid gap-4">
          <div className="grid gap-2 px-1">
            <div className="flex items-center justify-between text-[12px] leading-4">
              <span className="font-medium text-foreground">It takes about 2 minutes</span>
              <span className="font-medium text-muted-foreground tabular-nums">
                {completedCount} of 3 completed
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${(completedCount / 3) * 100}%` }}
              />
            </div>
          </div>

          <section aria-labelledby={`${idPrefix}-steps-title`} className="grid gap-2">
            <h2 id={`${idPrefix}-steps-title`} className="px-1 text-[13px] font-semibold leading-5 text-foreground">
              Verification steps
            </h2>
            <div
              role="group"
              aria-labelledby={`${idPrefix}-steps-title`}
              className="divide-y divide-hairline overflow-hidden rounded-card bg-surface-2 ring-1 ring-hairline"
            >
            <button
              type="button"
              onClick={() => setStep("personal")}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-3/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-surface-3"
            >
              <StepIconCircle done={personalDone} Icon={User} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-5">Personal details & PESEL</span>
                <span className="mt-0.5 block truncate text-[12px] leading-4 text-muted-foreground">
                  {personalDone ? `${normalizedName} · ${maskPesel(peselDigits)}` : "Legal name and 11-digit PESEL"}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setStep("document")}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-3/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-surface-3"
            >
              <StepIconCircle done={documentDone} Icon={IdCard} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-5">Photo ID</span>
                <span className="mt-0.5 block truncate text-[12px] leading-4 text-muted-foreground">
                  {documentDone
                    ? docType === "passport"
                      ? "Passport · Photo added"
                      : "Polish ID card · Front & back added"
                    : "Polish ID card or passport"}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setStep("bank")}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-3/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-surface-3"
            >
              <StepIconCircle done={bankDone} Icon={Landmark} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-5">Polish bank account</span>
                <span className="mt-0.5 block truncate text-[12px] leading-4 text-muted-foreground">
                  {bankDone ? `${bankName} · ${maskIban(iban)}` : "Your own PL IBAN for payouts"}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />
            </button>
          </div>
          <p className="px-1 text-[12px] leading-4 text-muted-foreground">
            Polish regulations require these checks before your first withdrawal. Your details are encrypted and used only for verification.
          </p>
        </section>
        </div>
      </div>
      <div className="shrink-0 border-t border-hairline bg-background/80 px-5 pb-6 pt-3 backdrop-blur-xl">
        <ActionButton onClick={submitAll}>
          {allStepsDone ? "Submit verification" : "Continue"}
        </ActionButton>
      </div>
    </div>
  )
}
