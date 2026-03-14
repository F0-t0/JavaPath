import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from 'lucide-react'

export type AuthMode = 'register' | 'login'
export type VerifyResultStatus = 'success' | 'expired' | 'used' | 'invalid'
export type UserGoal = 'career' | 'study' | 'project' | 'curious'

export type AuthSubmitResult =
  | {
      ok: true
    }
  | {
      ok: false
      message: string
      field?: 'email' | 'password' | 'form'
    }

type RegisterValues = {
  email: string
  password: string
  name: string
}

type LoginValues = {
  email: string
  password: string
}

type AuthPageProps = {
  mode: AuthMode
  initialEmail?: string
  existingEmails: string[]
  onBack: () => void
  onSwitchMode: (mode: AuthMode) => void
  onRegister: (values: RegisterValues) => Promise<AuthSubmitResult>
  onLogin: (values: LoginValues) => Promise<AuthSubmitResult>
  onGoogleContinue: (mode: AuthMode) => Promise<{ linkedExisting?: boolean }>
}

type EmailVerificationPageProps = {
  email: string
  onBackToRegister: () => void
  onResend: () => void
  onCheckVerification: () => void
}

type VerificationResultPageProps = {
  email: string
  name?: string
  status: VerifyResultStatus
  onPrimaryAction: () => void
  onSecondaryAction: () => void
}

type FirstRunOverlayProps = {
  selectedGoal: UserGoal | null
  onSelectGoal: (goal: UserGoal) => void
  onContinue: () => void
}

const termsHref = '#'
const goalCards: { id: UserGoal; icon: string; title: string }[] = [
  { id: 'career', icon: 'TG', title: 'Chce zostac programista' },
  { id: 'study', icon: 'ST', title: 'Nauka na studia lub kurs' },
  { id: 'project', icon: 'PR', title: 'Rozwijam wlasny projekt' },
  { id: 'curious', icon: 'OK', title: 'Po prostu jestem ciekawy' },
]

export function AuthPage({
  mode,
  initialEmail = '',
  existingEmails,
  onBack,
  onSwitchMode,
  onRegister,
  onLogin,
  onGoogleContinue,
}: AuthPageProps) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<'idle' | 'valid' | 'invalid' | 'taken'>('idle')
  const [emailMessage, setEmailMessage] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setEmail(initialEmail)
  }, [initialEmail])

  useEffect(() => {
    setSubmitMessage('')
  }, [mode])

  useEffect(() => {
    if (!email.trim()) {
      setEmailFeedback('idle')
      setEmailMessage('')
      return
    }

    const timer = window.setTimeout(() => {
      if (!isValidEmail(email)) {
        setEmailFeedback('invalid')
        setEmailMessage('Wprowadz poprawny adres email')
        return
      }

      setEmailFeedback('valid')
      setEmailMessage('')
    }, 800)

    return () => window.clearTimeout(timer)
  }, [email])

  const normalizedEmail = email.trim().toLowerCase()
  const passwordStrength = getPasswordStrength(password)
  const canRegister =
    isValidEmail(email) && passwordStrength.meetsMinimum && termsAccepted && !loading && emailFeedback !== 'taken'
  const canLogin = isValidEmail(email) && password.length > 0 && !loading

  const handleEmailBlur = () => {
    if (!isValidEmail(email) || mode !== 'register') {
      return
    }

    if (existingEmails.includes(normalizedEmail)) {
      setEmailFeedback('taken')
      setEmailMessage('Ten email jest juz zarejestrowany. Zaloguj sie.')
      return
    }

    setEmailFeedback('valid')
    setEmailMessage('')
  }

  const handleGoogleClick = async () => {
    setLoading(true)
    setSubmitMessage('')

    try {
      const result = await onGoogleContinue(mode)
      setLoading(false)
      if (result.linkedExisting) {
        setSubmitMessage('Polaczylismy konto Google z istniejacym kontem JavaPath.')
      }
    } catch (error) {
      setLoading(false)
      setSubmitMessage(error instanceof Error ? error.message : 'Nie udalo sie polaczyc z Google. Sprobuj ponownie.')
    }
  }

  const handleSubmit = async () => {
    if (!navigator.onLine) {
      setSubmitMessage('Brak polaczenia. Sprawdz internet i sprobuj ponownie.')
      return
    }

    if (mode === 'register' && !canRegister) {
      setSubmitMessage('Uzupelnij email, haslo i zaakceptuj regulamin.')
      return
    }

    if (mode === 'login' && !canLogin) {
      setSubmitMessage('Podaj email i haslo, zeby wejsc do konta.')
      return
    }

    setLoading(true)
    setSubmitMessage('')

    try {
      const result =
        mode === 'register'
          ? await onRegister({ email: normalizedEmail, password, name: name.trim() })
          : await onLogin({ email: normalizedEmail, password })

      setLoading(false)

      if (!result.ok) {
        setSubmitMessage(result.message)
        if (result.field === 'email') {
          setEmailFeedback('taken')
        }
        return
      }

      setSubmitMessage('')
    } catch (error) {
      setLoading(false)
      setSubmitMessage(error instanceof Error ? error.message : 'Cos poszlo nie tak. Sprobuj ponownie za chwile.')
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-pane">
        <div className="auth-card">
          <button type="button" className="auth-back" onClick={onBack}>
            <ArrowLeft size={16} />
            Wroc na strone glowna
          </button>

          <div className="auth-copy">
            <p className="eyebrow">{mode === 'register' ? 'Rejestracja' : 'Logowanie'}</p>
            <h1>{mode === 'register' ? 'Utworz konto' : 'Zaloguj sie'}</h1>
          </div>

          <button type="button" className="google-button" onClick={handleGoogleClick} disabled={loading}>
            {loading ? <LoaderCircle size={18} className="spin" /> : <GoogleMark />}
            <span>{mode === 'register' ? 'Kontynuuj przez Google' : 'Wejdz przez Google'}</span>
          </button>

          <div className="auth-divider">
            <span>lub</span>
          </div>

          <div className="auth-form">
            <label className="auth-field">
              <span>Email</span>
              <div className={`auth-input-wrap ${emailFeedback === 'invalid' || emailFeedback === 'taken' ? 'error' : emailFeedback === 'valid' ? 'success' : ''}`}>
                <input
                  type="email"
                  placeholder="jan@example.com"
                  value={email}
                  onBlur={handleEmailBlur}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                />
                {emailFeedback === 'valid' && <Check size={16} />}
                {(emailFeedback === 'invalid' || emailFeedback === 'taken') && <CircleAlert size={16} />}
              </div>
              {emailMessage && (
                <small className={`field-message ${emailFeedback === 'valid' ? 'success' : 'error'}`}>
                  {emailFeedback === 'taken' ? (
                    <>
                      Ten email jest juz zarejestrowany.{' '}
                      <button type="button" className="inline-link" onClick={() => onSwitchMode('login')}>
                        Zaloguj sie
                      </button>
                    </>
                  ) : (
                    emailMessage
                  )}
                </small>
              )}
            </label>

            <label className="auth-field">
              <span>Haslo</span>
              <div className="auth-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Minimum 8 znakow i jedna cyfra' : 'Wpisz swoje haslo'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Ukryj haslo' : 'Pokaz haslo'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {mode === 'register' && password.length > 0 && (
                <div className="password-meter">
                  <div className="password-meter-track">
                    <span
                      className={passwordStrength.tone}
                      style={{ width: `${passwordStrength.percent}%` }}
                    />
                  </div>
                  <small className={`field-message ${passwordStrength.tone}`}>{passwordStrength.label}</small>
                </div>
              )}

              {mode === 'register' && !passwordStrength.meetsMinimum && password.length > 0 && (
                <small className="field-hint">Minimum 8 znakow i jedna cyfra.</small>
              )}
            </label>

            {mode === 'register' && (
              <>
                <label className="auth-field">
                  <span className="optional-label">Imie (opcjonalne)</span>
                  <div className="auth-input-wrap">
                    <input
                      type="text"
                      placeholder="Jak mamy sie do Ciebie zwracac?"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      disabled={loading}
                    />
                  </div>
                </label>

                <label className="terms-row">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    disabled={loading}
                  />
                  <span>
                    Akceptuje <a href={termsHref} target="_blank" rel="noreferrer">Regulamin</a> i{' '}
                    <a href={termsHref} target="_blank" rel="noreferrer">Polityke prywatnosci</a>
                  </span>
                </label>
              </>
            )}

            <button
              type="button"
              className="primary-button auth-submit"
              onClick={handleSubmit}
              disabled={mode === 'register' ? !canRegister : !canLogin}
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="spin" />
                  {mode === 'register' ? 'Tworzenie konta...' : 'Logowanie...'}
                </>
              ) : (
                <>
                  {mode === 'register' ? 'Utworz konto' : 'Przejdz do konta'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {submitMessage && <p className="auth-submit-message">{submitMessage}</p>}

            <p className="auth-switch">
              {mode === 'register' ? 'Masz juz konto?' : 'Nie masz konta?'}{' '}
              <button type="button" className="inline-link" onClick={() => onSwitchMode(mode === 'register' ? 'login' : 'register')}>
                {mode === 'register' ? 'Zaloguj sie' : 'Zarejestruj sie'}
              </button>
            </p>
          </div>
        </div>
      </section>

      <aside className="auth-aside">
        <div className="auth-aside-grid" aria-hidden="true" />
        <div className="auth-aside-copy">
          <p className="eyebrow">JavaPath</p>
          <blockquote>"Twoj pierwszy program w Javie jest oddalony o jedna rejestracje."</blockquote>

          <ul className="auth-benefits">
            <li>
              <CheckCircle2 size={16} />
              41 lekcji od podstaw do OOP
            </li>
            <li>
              <CheckCircle2 size={16} />
              Edytor kodu w przegladarce - zero instalacji
            </li>
            <li>
              <CheckCircle2 size={16} />
              Bezplatny dostep na zawsze
            </li>
          </ul>

          <div className="auth-progress-note">
            <span>Poziom 1 odblokowuje sie od razu po rejestracji</span>
            <div className="auth-progress-bar">
              <span />
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export function EmailVerificationPage({
  email,
  onBackToRegister,
  onResend,
  onCheckVerification,
}: EmailVerificationPageProps) {
  const [cooldown, setCooldown] = useState(0)
  const [helpOpen, setHelpOpen] = useState(true)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (cooldown === 0) {
      return
    }

    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const handleResend = () => {
    if (cooldown > 0) {
      return
    }

    setCooldown(60)
    setResent(true)
    onResend()
  }

  return (
    <div className="verify-shell">
      <section className="verify-card">
        <div className="verify-expiry">Link wazny przez 24 godziny</div>

        <div className="mail-icon-wrap" aria-hidden="true">
          <div className="mail-icon">
            <Mail size={36} />
          </div>
        </div>

        <p className="eyebrow">Weryfikacja emaila</p>
        <h1>Sprawdz swoja skrzynke</h1>
        <p className="verify-copy">
          Wyslalismy link weryfikacyjny na adres <strong>{email}</strong>. Kliknij go, zeby aktywowac konto.
        </p>

        <div className="verify-actions">
          <button type="button" className="primary-button" onClick={onCheckVerification}>
            Sprawdz czy konto jest aktywne
            <ArrowRight size={16} />
          </button>
          <button type="button" className="secondary-button" onClick={handleResend} disabled={cooldown > 0}>
            {cooldown > 0 ? `Wyslij ponownie za ${cooldown}s` : 'Nie dostalem emaila - wyslij ponownie'}
          </button>
          <button type="button" className="text-link" onClick={onBackToRegister}>
            Podalem zly email - wroc do rejestracji
          </button>
        </div>

        {resent && <div className="verify-toast">Email wyslany ponownie.</div>}

        <button
          type="button"
          className={`faq-toggle verify-help-toggle ${helpOpen ? 'open' : ''}`.trim()}
          onClick={() => setHelpOpen((value) => !value)}
        >
          <span>Nie widzisz emaila?</span>
          <ChevronDown size={16} />
        </button>

        <div className="verify-help" style={{ maxHeight: helpOpen ? 180 : 0 }}>
          <ul>
            <li>Sprawdz folder Spam lub Oferty.</li>
            <li>Email moze dotrzec z opoznieniem do 5 minut.</li>
            <li>Upewnij sie, ze adres {email} jest poprawny.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export function VerificationResultPage({
  email,
  name,
  status,
  onPrimaryAction,
  onSecondaryAction,
}: VerificationResultPageProps) {
  const [redirectCountdown, setRedirectCountdown] = useState(3)

  useEffect(() => {
    if (status !== 'success') {
      return
    }

    if (redirectCountdown === 0) {
      onPrimaryAction()
      return
    }

    const timer = window.setTimeout(() => setRedirectCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [onPrimaryAction, redirectCountdown, status])

  const content = getVerificationContent(status, email, name, redirectCountdown)

  return (
    <div className="verify-result-shell">
      {status === 'success' && <div className="auth-confetti" aria-hidden="true">{Array.from({ length: 20 }, (_, index) => <span key={index} />)}</div>}
      <section className={`verify-result-card ${status}`}>
        <div className={`verify-result-icon ${status}`}>
          {content.icon}
        </div>
        <p className="eyebrow">Weryfikacja konta</p>
        <h1>{content.title}</h1>
        <p>{content.body}</p>

        <div className="verify-result-actions">
          <button type="button" className="primary-button" onClick={onPrimaryAction}>
            {content.primaryLabel}
            <ArrowRight size={16} />
          </button>
          <button type="button" className="secondary-button" onClick={onSecondaryAction}>
            {content.secondaryLabel}
          </button>
        </div>

        {status === 'success' && <span className="verify-redirect-note">Przekierowanie za {redirectCountdown}...</span>}
      </section>
    </div>
  )
}

export function FirstRunOverlay({ selectedGoal, onSelectGoal, onContinue }: FirstRunOverlayProps) {
  return (
    <div className="onboarding-overlay" role="presentation">
      <section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <p className="eyebrow">Pierwsze wejscie</p>
        <h2 id="onboarding-title">Zanim zaczniesz - jeden szybki krok</h2>
        <p className="onboarding-lead">Jaki jest Twoj cel nauki Javy?</p>

        <div className="goal-grid">
          {goalCards.map((goal) => (
            <button
              key={goal.id}
              type="button"
              className={`goal-card ${selectedGoal === goal.id ? 'selected' : ''}`.trim()}
              onClick={() => onSelectGoal(goal.id)}
            >
              <span className="goal-icon">{goal.icon}</span>
              <strong>{goal.title}</strong>
              {selectedGoal === goal.id && <Check size={16} />}
            </button>
          ))}
        </div>

        <p className="goal-note">Mozesz to zmienic pozniej w ustawieniach.</p>

        <button type="button" className={selectedGoal ? 'primary-button' : 'secondary-button'} onClick={onContinue}>
          {selectedGoal ? 'Zacznij nauke' : 'Pomin i zacznij'}
          <ArrowRight size={16} />
        </button>
      </section>
    </div>
  )
}

function getVerificationContent(
  status: VerifyResultStatus,
  email: string,
  name: string | undefined,
  redirectCountdown: number,
) {
  if (status === 'success') {
    const greeting = name ? `Witaj w JavaPath, ${name}.` : 'Witaj w JavaPath.'

    return {
      title: 'Konto aktywowane!',
      body: `${greeting} Konto dla ${email} jest gotowe. Mozesz zaczac pierwsza lekcje od razu.`,
      primaryLabel: 'Zacznij pierwsza lekcje',
      secondaryLabel: `Dashboard za ${redirectCountdown}s`,
      icon: <ShieldCheck size={38} />,
    }
  }

  if (status === 'expired') {
    return {
      title: 'Link wygasl',
      body: 'Link weryfikacyjny jest wazny przez 24 godziny. Wyslij nowy link na adres z rejestracji.',
      primaryLabel: 'Wyslij nowy link',
      secondaryLabel: 'Wroc do rejestracji',
      icon: <Clock3 size={38} />,
    }
  }

  if (status === 'used') {
    return {
      title: 'Ten link juz zostal uzyty',
      body: 'Twoje konto jest juz aktywne. Mozesz od razu przejsc do logowania.',
      primaryLabel: 'Przejdz do logowania',
      secondaryLabel: 'Wroc na strone glowna',
      icon: <CheckCircle2 size={38} />,
    }
  }

  return {
    title: 'Link wygasl lub jest nieprawidlowy',
    body: 'Ten link nie moze juz aktywowac konta. Wyslij nowy email weryfikacyjny i sprobuj ponownie.',
    primaryLabel: 'Wyslij nowy link',
    secondaryLabel: 'Wroc do rejestracji',
    icon: <CircleAlert size={38} />,
  }
}

function getPasswordStrength(password: string) {
  const hasDigit = /\d/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  if (password.length === 0) {
    return { label: '', percent: 0, tone: 'neutral', meetsMinimum: false }
  }

  if (password.length < 4) {
    return { label: 'Slabe', percent: 25, tone: 'error', meetsMinimum: false }
  }

  if (password.length < 8 || !hasDigit) {
    return { label: 'Srednie', percent: 50, tone: 'warning', meetsMinimum: false }
  }

  if (hasDigit && hasSpecial) {
    return { label: 'Bardzo silne', percent: 100, tone: 'success', meetsMinimum: true }
  }

  return { label: 'Silne', percent: 75, tone: 'success', meetsMinimum: true }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="google-mark">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 4 1.5l2.7-2.6C17 2.8 14.7 2 12 2 6.9 2 2.8 6.4 2.8 11.8S6.9 21.6 12 21.6c6.9 0 8.6-4.9 8.6-7.5 0-.5-.1-.9-.1-1.3H12Z" />
      <path fill="#34A853" d="M2.8 11.8c0 1.7.6 3.3 1.6 4.6l3.3-2.6c-.4-.5-.7-1.2-.7-2s.3-1.5.7-2L4.4 7.2c-1 1.2-1.6 2.9-1.6 4.6Z" />
      <path fill="#FBBC05" d="M12 21.6c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.7-2 1.2-3.5 1.2-2.5 0-4.5-1.7-5.3-4L3.4 16.4c1.8 3.1 4.9 5.2 8.6 5.2Z" />
      <path fill="#4285F4" d="M18.7 19.2c2-1.8 2.9-4.4 2.9-7.4 0-.5-.1-.9-.1-1.3H12v3.9h5.5c-.2 1-.8 2.5-2.3 3.8l3.5 2.7Z" />
    </svg>
  )
}
