"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api, PublicApiError } from "@/lib/api"
import { Loader2, ArrowLeft, Eye, EyeOff, MailCheck, Check } from "lucide-react"

type Step = "email" | "code" | "password"

const CODE_LENGTH = 6
const RESEND_SECONDS = 60

const inputCls =
  "mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus:ring-2 focus:ring-ring"
const primaryBtnCls =
  "bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"

/**
 * Admin password reset, one screen per step:
 *
 *   1. email    -> POST /auth/forgot-password   (emails a 6-digit code)
 *   2. code     -> POST /auth/verify-reset-code (code -> single-use reset token)
 *   3. password -> POST /auth/reset-password    (token + new password)
 *
 * The code is verified on its own step so a typo is caught before the user
 * types a password. The reset token lives in component state only, so a page
 * reload restarts the flow. On success we clear any existing session and send
 * the user to /login with ?reset=1 so they sign in with the new password.
 */
export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")

  const [email, setEmail] = useState("")
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""))
  const [resetToken, setResetToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const boxes = useRef<(HTMLInputElement | null)[]>([])
  const code = digits.join("")

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (step === "code") boxes.current[0]?.focus()
  }, [step])

  function resetMessages() {
    setError("")
    setNotice("")
  }

  async function sendCode() {
    await api.auth.forgotPassword(email.trim())
    setCooldown(RESEND_SECONDS)
  }

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()
    setLoading(true)
    try {
      await sendCode()
      setStep("code")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset code")
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    resetMessages()
    setLoading(true)
    try {
      await sendCode()
      setDigits(Array(CODE_LENGTH).fill(""))
      boxes.current[0]?.focus()
      setNotice("A new code has been sent. Earlier codes no longer work.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code")
    } finally {
      setLoading(false)
    }
  }

  async function verify(value: string) {
    resetMessages()
    setLoading(true)
    try {
      const res = await api.auth.verifyResetCode(email.trim(), value)
      setResetToken(res.reset_token)
      setStep("password")
    } catch (err) {
      let msg = err instanceof Error ? err.message : "Could not verify code"
      if (err instanceof PublicApiError && err.attemptsRemaining !== undefined) {
        msg += ` (${err.attemptsRemaining} ${err.attemptsRemaining === 1 ? "attempt" : "attempts"} left)`
      }
      setError(msg)
      setDigits(Array(CODE_LENGTH).fill(""))
      boxes.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  function setDigit(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "")
    if (!clean) {
      setDigits((d) => d.map((v, i) => (i === index ? "" : v)))
      return
    }
    // Typing several digits at once (autofill, fast typing) fills forward.
    const next = [...digits]
    clean
      .slice(0, CODE_LENGTH - index)
      .split("")
      .forEach((ch, i) => (next[index + i] = ch))
    setDigits(next)
    const focusAt = Math.min(index + clean.length, CODE_LENGTH - 1)
    boxes.current[focusAt]?.focus()
    if (next.every(Boolean)) verify(next.join(""))
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      boxes.current[index - 1]?.focus()
    } else if (e.key === "ArrowLeft" && index > 0) {
      boxes.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      boxes.current[index + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH)
    if (!pasted) return
    e.preventDefault()
    const next = Array(CODE_LENGTH).fill("")
    pasted.split("").forEach((ch, i) => (next[i] = ch))
    setDigits(next)
    boxes.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus()
    if (pasted.length === CODE_LENGTH) verify(pasted)
  }

  const rules = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Contains a letter and a number", ok: /[A-Za-z]/.test(password) && /\d/.test(password) },
    { label: "Passwords match", ok: password.length > 0 && password === confirm },
  ]

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()
    if (!rules.every((r) => r.ok)) {
      setError("Please meet all the password requirements")
      return
    }
    setLoading(true)
    try {
      await api.auth.resetPassword(email.trim(), resetToken, password)
      // The backend does not revoke existing admin sessions on reset, so drop
      // any session on this browser and make the user sign in again.
      await fetch("/api/session", { method: "DELETE" }).catch(() => {})
      router.replace("/login?reset=1")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password")
    } finally {
      setLoading(false)
    }
  }

  const subtitle: Record<Step, string> = {
    email: "Enter your admin email and we'll send you a 6-digit code",
    code: `Enter the code we sent to ${email}`,
    password: "Choose a new password for your account",
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="bg-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm text-primary-foreground">
            {step === "code" ? <MailCheck className="h-6 w-6" /> : <span className="text-2xl font-bold">C</span>}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {step === "code" ? "Check your email" : step === "password" ? "New password" : "Reset password"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle[step]}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Step {step === "email" ? 1 : step === "code" ? 2 : 3} of 3
          </p>
        </div>

        {step === "email" && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="Enter your admin email"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={loading} className={primaryBtnCls}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <div className="space-y-4">
            <div className="flex justify-between gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    boxes.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${i + 1}`}
                  value={d}
                  disabled={loading}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  onFocus={(e) => e.target.select()}
                  className="h-12 w-full rounded-md border border-input bg-background text-center text-lg font-semibold text-foreground outline-none ring-offset-background focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              ))}
            </div>

            {notice && !error && <p className="text-sm text-success">{notice}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="button"
              disabled={loading || code.length < CODE_LENGTH}
              onClick={() => verify(code)}
              className={primaryBtnCls}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify code"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t get it? Check spam, or{" "}
              {cooldown > 0 ? (
                <span>resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="font-medium text-primary hover:underline disabled:opacity-50"
                >
                  resend code
                </button>
              )}
            </p>
            <p className="text-center text-xs text-muted-foreground">The code expires in 10 minutes.</p>

            <button
              type="button"
              onClick={() => {
                setStep("email")
                setDigits(Array(CODE_LENGTH).fill(""))
                resetMessages()
              }}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
          </div>
        )}

        {step === "password" && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-10`}
                  placeholder="At least 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="text-sm font-medium text-foreground">
                Confirm password
              </label>
              <input
                id="confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCls}
                placeholder="Re-enter new password"
                required
              />
            </div>

            <ul className="space-y-1">
              {rules.map((r) => (
                <li
                  key={r.label}
                  className={`flex items-center gap-2 text-xs ${r.ok ? "text-success" : "text-muted-foreground"}`}
                >
                  <Check className={`h-3.5 w-3.5 ${r.ok ? "opacity-100" : "opacity-30"}`} />
                  {r.label}
                </li>
              ))}
            </ul>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={loading} className={primaryBtnCls}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset password"}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
