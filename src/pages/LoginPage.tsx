import { useState, type FormEvent } from 'react'
import { Cloud, Eye, EyeOff, Smartphone } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Tabs'
import { TextField } from '../components/ui/Field'
import { cloudSync } from '../services/cloud'
import { useToast } from '../hooks/useUI'

type Mode = 'signin' | 'signup'

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
  </svg>
)

/** Sign in / sign up. Shown before the app when there is no session and the user hasn't chosen local mode. */
export default function LoginPage({ onClose }: { onClose?: () => void }) {
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState<'email' | 'google' | 'reset' | null>(null)
  const [error, setError] = useState<{ field?: 'email' | 'password'; text: string } | null>(null)

  const run = async (kind: 'email' | 'google' | 'reset', fn: () => Promise<void>) => {
    setBusy(kind)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError({ text: e instanceof Error ? e.message : 'Щось пішло не так.' })
    } finally {
      setBusy(null)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const mail = email.trim()
    if (!mail) return setError({ field: 'email', text: 'Вкажи email' })
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setError({ field: 'email', text: 'Неправильний формат email' })
    if (!password) return setError({ field: 'password', text: 'Вкажи пароль' })
    if (mode === 'signup' && password.length < 6) return setError({ field: 'password', text: 'Щонайменше 6 символів' })
    void run('email', () => (mode === 'signin' ? cloudSync.signIn(mail, password) : cloudSync.signUp(mail, password, name)))
  }

  const reset = () => {
    const mail = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setError({ field: 'email', text: 'Вкажи email, на який надіслати посилання' })
    void run('reset', async () => {
      await cloudSync.resetPassword(mail)
      toast('Посилання для зміни пароля надіслано на пошту')
    })
  }

  return (
    <main className="relative isolate min-h-dvh overflow-x-hidden px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-[26rem] flex-col">
        {/* Brand */}
        <div className="relative isolate mt-4 overflow-hidden rounded-[32px] bg-[#121a17] px-6 pt-6 pb-7 text-[#f3f2ed] ring-1 ring-white/5">
          <div className="pointer-events-none absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-[radial-gradient(circle,rgb(var(--accent-rgb)/0.5),rgb(var(--accent-rgb)/0)_65%)]" aria-hidden />
          <img src="./icons/icon-192.png" alt="" width={56} height={56} className="size-14 rounded-[16px] shadow-lg" />
          <h1 className="mt-5 text-[clamp(1.5rem,7vw,1.875rem)] leading-tight font-bold tracking-[-0.02em] break-words">
            {mode === 'signin' ? 'З поверненням' : 'Створи обліковий запис'}
          </h1>
          <p className="mt-2 text-[0.9375rem] leading-snug text-white/70">
            Твої фінанси збережуться в хмарі й будуть однакові на телефоні, планшеті та компʼютері.
          </p>
        </div>

        <div className="mt-5 rounded-[28px] bg-surface p-5 shadow-card">
          <Segmented<Mode>
            label="Вхід або реєстрація"
            value={mode}
            onChange={(m) => {
              setMode(m)
              setError(null)
            }}
            options={[
              { value: 'signin', label: 'Вхід' },
              { value: 'signup', label: 'Реєстрація' },
            ]}
          />

          <form noValidate onSubmit={submit} className="mt-5 space-y-4">
            {mode === 'signup' && (
              <TextField label="Як до тебе звертатися" optional value={name} maxLength={60} autoComplete="given-name" onChange={(e) => setName(e.target.value)} />
            )}
            <TextField
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              error={error?.field === 'email' ? error.text : null}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
            />
            <div className="relative">
              <TextField
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                className="pr-12"
                hint={mode === 'signup' ? 'Щонайменше 6 символів' : undefined}
                error={error?.field === 'password' ? error.text : null}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                aria-pressed={showPassword}
                className="press absolute top-[1.875rem] right-1 grid size-11 place-items-center rounded-full text-muted hover:text-text"
              >
                {showPassword ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
              </button>
            </div>

            {error && !error.field && (
              <p role="alert" className="rounded-2xl bg-expense-soft px-4 py-3 text-sm leading-snug font-medium text-expense break-words">
                {error.text}
              </p>
            )}

            <Button type="submit" block size="lg" disabled={!!busy} aria-busy={busy === 'email'}>
              {busy === 'email' ? 'Зачекай…' : mode === 'signin' ? 'Увійти' : 'Зареєструватися'}
            </Button>
            {mode === 'signin' && (
              <button type="button" onClick={reset} disabled={!!busy} className="press mx-auto block rounded-full px-3 py-1.5 text-sm font-medium text-primary disabled:opacity-50">
                {busy === 'reset' ? 'Надсилаємо…' : 'Забули пароль?'}
              </button>
            )}
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-subtle" aria-hidden>
            <span className="h-px flex-1 bg-border" />
            або
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="secondary" block size="lg" icon={<GoogleMark />} disabled={!!busy} onClick={() => void run('google', () => cloudSync.signInWithGoogle())}>
            {busy === 'google' ? 'Зачекай…' : 'Продовжити з Google'}
          </Button>
        </div>

        <ul className="mt-5 space-y-3 px-1 text-[0.8125rem] leading-snug text-muted">
          <li className="flex gap-3">
            <Cloud className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Зміни зберігаються одразу й зʼявляються на інших пристроях.
          </li>
          <li className="flex gap-3">
            <Smartphone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Без інтернету все працює, а синхронізується, щойно він зʼявиться.
          </li>
        </ul>

        <Button
          variant="ghost"
          block
          className="mt-4"
          onClick={() => {
            cloudSync.continueLocally()
            onClose?.()
          }}
        >
          {onClose ? 'Скасувати' : 'Продовжити без входу'}
        </Button>
      </div>
    </main>
  )
}
