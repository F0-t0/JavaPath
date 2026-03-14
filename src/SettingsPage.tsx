import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Download,
  Globe,
  Palette,
  Shield,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from 'lucide-react'

export type ThemeMode = 'dark' | 'light' | 'system'
export type BodyTextSize = 'small' | 'normal' | 'large'
export type EditorFont = 'fira' | 'jetbrains' | 'source'
export type HintLevel = 'helpful' | 'standard' | 'demanding'
export type InterfaceLanguage = 'pl' | 'en'
export type ProfileVisibility = 'private' | 'public'
export type DailyGoal = 5 | 10 | 15 | 20 | 30
export type UserGoal = 'career' | 'study' | 'project' | 'curious'
export type SectionId = 'account' | 'appearance' | 'learning' | 'notifications' | 'privacy' | 'stats'

export type SettingsState = {
  themeMode: ThemeMode
  bodyTextSize: BodyTextSize
  editorFont: EditorFont
  editorFontSize: 12 | 14 | 16 | 18
  editorLigatures: boolean
  animationsEnabled: boolean
  dailyGoal: DailyGoal
  hintLevel: HintLevel
  autoRunExamples: boolean
  confirmBeforeSolution: boolean
  spacedRepetitionEnabled: boolean
  interfaceLanguage: InterfaceLanguage
  emailStreakReminder: boolean
  emailWeeklySummary: boolean
  emailNewContent: boolean
  browserReminders: boolean
  browserReminderTime: string
  browserStreakWarning: boolean
  profileVisibility: ProfileVisibility
  analyticsEnabled: boolean
}

export type ProfileState = {
  fullName: string
  username: string
  timezone: string
  avatarDataUrl: string | null
}

export type SettingsStats = {
  totalMinutes: number
  completedLessons: number
  totalLessons: number
  totalXp: number
  longestStreak: number
}

type SettingsPageProps = {
  currentUser: {
    email: string
    name: string
    provider: 'password' | 'google'
  }
  profile: ProfileState
  settings: SettingsState
  stats: SettingsStats
  goal: UserGoal | null
  onBack: () => void
  onUpdateProfile: (patch: Partial<ProfileState>) => void
  onUpdateSettings: (patch: Partial<SettingsState>) => void
  onExportData: () => void
  onResetModuleProgress: () => void
  onResetAllProgress: () => void
  onDeleteAccount: () => Promise<void>
  onShowToast: (message: string, tone?: 'neutral' | 'success' | 'error') => void
}

const sectionItems: { id: SectionId; label: string; icon: typeof UserRound }[] = [
  { id: 'account', label: 'Konto', icon: UserRound },
  { id: 'appearance', label: 'Wyglad', icon: Palette },
  { id: 'learning', label: 'Nauka', icon: SlidersHorizontal },
  { id: 'notifications', label: 'Powiadomienia', icon: Bell },
  { id: 'privacy', label: 'Prywatnosc i dane', icon: Shield },
  { id: 'stats', label: 'Postep i statystyki', icon: Globe },
]

const timezoneOptions = [
  'Europe/Warsaw',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
]

const usernameTaken = new Set(['admin', 'javapath', 'support'])

export function SettingsPage(props: SettingsPageProps) {
  const {
    currentUser,
    profile,
    settings,
    stats,
    onBack,
    onUpdateProfile,
    onUpdateSettings,
    onExportData,
    onResetModuleProgress,
    onResetAllProgress,
    onDeleteAccount,
    onShowToast,
  } = props

  const [activeSection, setActiveSection] = useState<SectionId>('account')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [notificationsGranted, setNotificationsGranted] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsGranted(Notification.permission)
    }
  }, [])

  const usernameState = useMemo(() => {
    const value = profile.username.trim()
    if (!value) {
      return { tone: 'neutral', message: 'Ustaw unikalna nazwe uzytkownika dla przyszlego profilu publicznego.' }
    }
    if (!/^[A-Za-z0-9_]{3,30}$/.test(value)) {
      return { tone: 'error', message: 'Uzyj 3-30 znakow: litery, cyfry i podkreslenia.' }
    }
    if (usernameTaken.has(value.toLowerCase())) {
      return { tone: 'error', message: 'Ta nazwa jest juz zajeta.' }
    }
    return { tone: 'success', message: 'Nazwa jest dostepna.' }
  }, [profile.username])

  const canDelete = deleteConfirmed && deleteEmail.trim().toLowerCase() === currentUser.email.toLowerCase() && !deleting
  const activityCells = useMemo(() => buildActivityHeatmap(stats.totalMinutes, stats.longestStreak), [stats.longestStreak, stats.totalMinutes])

  const handleAvatarPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Plik jest zbyt duzy. Maksymalny rozmiar to 2 MB.')
      return
    }
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      setAvatarError('Akceptowane sa tylko pliki JPG lub PNG.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      onUpdateProfile({ avatarDataUrl: typeof reader.result === 'string' ? reader.result : null })
      setAvatarError('')
      onShowToast('Zdjecie profilowe zostalo zaktualizowane.', 'success')
    }
    reader.readAsDataURL(file)
  }

  const handleRequestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      onShowToast('Ta przegladarka nie obsluguje powiadomien.', 'error')
      return
    }
    const permission = await Notification.requestPermission()
    setNotificationsGranted(permission)
    if (permission === 'granted') {
      onShowToast('Powiadomienia w przegladarce sa aktywne.', 'success')
    }
  }

  const handleDelete = async () => {
    if (!canDelete) {
      return
    }
    setDeleting(true)
    try {
      await onDeleteAccount()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="settings-page">
      <header className="settings-page-topbar">
        <button type="button" className="settings-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Wroc
        </button>
        <h1>Ustawienia</h1>
        <div className="settings-topbar-spacer" aria-hidden="true" />
      </header>

      <div className="settings-page-layout">
        <aside className="settings-page-nav" aria-label="Sekcje ustawien">
          {sectionItems.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                type="button"
                className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`.trim()}
                onClick={() => setActiveSection(section.id)}
              >
                <span>
                  <Icon size={16} />
                  {section.label}
                </span>
                <ChevronRight size={14} />
              </button>
            )
          })}
        </aside>

        <section className="settings-page-content">
          {activeSection === 'account' && renderAccountSection({
            currentUser,
            profile,
            timezoneOptions,
            usernameState,
            avatarError,
            onUpdateProfile,
            onShowToast,
            handleAvatarPick,
            onOpenDelete: () => setDeleteModalOpen(true),
          })}

          {activeSection === 'appearance' && renderAppearanceSection(settings, onUpdateSettings)}
          {activeSection === 'learning' && renderLearningSection(settings, onUpdateSettings, onShowToast)}
          {activeSection === 'notifications' && renderNotificationSection(settings, notificationsGranted, onUpdateSettings, handleRequestBrowserPermission)}
          {activeSection === 'privacy' && renderPrivacySection(settings, onUpdateSettings, onExportData)}
          {activeSection === 'stats' && renderStatsSection(stats, activityCells, onResetModuleProgress, onResetAllProgress)}
        </section>
      </div>

      {deleteModalOpen && (
        <div className="settings-delete-backdrop" role="presentation" onClick={() => setDeleteModalOpen(false)}>
          <section className="settings-delete-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>Usun konto</h2>
            <p>Wpisz swoj email i potwierdz, ze rozumiesz skutki. Konto i zapisane dane zostana usuniete od razu.</p>
            <input type="email" placeholder={currentUser.email} value={deleteEmail} onChange={(event) => setDeleteEmail(event.target.value)} />
            <label className="terms-row">
              <input type="checkbox" checked={deleteConfirmed} onChange={(event) => setDeleteConfirmed(event.target.checked)} />
              <span>Rozumiem, ze ta operacja usuwa konto, postep i dane nauki.</span>
            </label>
            <div className="settings-action-row">
              <button type="button" className="secondary-button" onClick={() => setDeleteModalOpen(false)}>Anuluj</button>
              <button type="button" className="danger-button" disabled={!canDelete} onClick={() => void handleDelete()}>
                {deleting ? 'Usuwanie...' : 'Tak, usun moje konto'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function renderAccountSection({
  currentUser,
  profile,
  timezoneOptions,
  usernameState,
  avatarError,
  onUpdateProfile,
  onShowToast,
  handleAvatarPick,
  onOpenDelete,
}: {
  currentUser: SettingsPageProps['currentUser']
  profile: ProfileState
  timezoneOptions: string[]
  usernameState: { tone: string; message: string }
  avatarError: string
  onUpdateProfile: SettingsPageProps['onUpdateProfile']
  onShowToast: SettingsPageProps['onShowToast']
  handleAvatarPick: (event: React.ChangeEvent<HTMLInputElement>) => void
  onOpenDelete: () => void
}) {
  return (
    <div className="settings-section-stack">
      <SectionBlock title="Konto" description="Zarzadzaj swoim profilem, danymi logowania i strefa czasowa.">
        <div className="settings-avatar-row">
          {profile.avatarDataUrl ? (
            <img src={profile.avatarDataUrl} alt="Awatar uzytkownika" className="settings-avatar" />
          ) : (
            <div className="settings-avatar avatar-fallback">{getInitials(profile.fullName || currentUser.name)}</div>
          )}
          <div className="settings-avatar-actions">
            <label className="secondary-button file-trigger">
              Zmien zdjecie
              <input type="file" accept="image/png,image/jpeg" onChange={handleAvatarPick} />
            </label>
            <button type="button" className="text-link" onClick={() => onUpdateProfile({ avatarDataUrl: null })}>Usun zdjecie</button>
            {avatarError && <small className="field-message error">{avatarError}</small>}
          </div>
        </div>

        <SettingsField label="Imie i nazwisko">
          <input type="text" value={profile.fullName} maxLength={50} onChange={(event) => onUpdateProfile({ fullName: event.target.value })} />
        </SettingsField>

        <SettingsField label="Nazwa uzytkownika">
          <input type="text" value={profile.username} onChange={(event) => onUpdateProfile({ username: event.target.value })} />
          <small className={`field-message ${usernameState.tone}`}>{usernameState.message}</small>
        </SettingsField>

        <SettingsField label="Adres email">
          <div className="settings-readonly">
            <span>{currentUser.email}</span>
            <button
              type="button"
              className="secondary-button"
              onClick={() => onShowToast(currentUser.provider === 'google' ? 'Adres email jest zarzadzany przez Google.' : 'Zmiana emaila wymaga osobnego flow potwierdzenia. Dodam go w kolejnej iteracji.', 'neutral')}
            >
              Zmien email
            </button>
          </div>
        </SettingsField>

        <SettingsField label="Haslo">
          {currentUser.provider === 'google' ? (
            <div className="settings-inline-note">Logujesz sie przez Google. Haslo jest zarzadzane przez konto Google.</div>
          ) : (
            <button type="button" className="secondary-button" onClick={() => onShowToast('Zmiana hasla wymaga flow reautoryzacji Firebase. Dodam go jako kolejny krok.', 'neutral')}>
              Zmien haslo
            </button>
          )}
        </SettingsField>

        <SettingsField label="Polaczone konta">
          <div className="settings-readonly">
            <span>{currentUser.provider === 'google' ? 'Konto Google jest aktywne.' : 'Konto email/haslo jest aktywne.'}</span>
            <button
              type="button"
              className="secondary-button"
              onClick={() => onShowToast(currentUser.provider === 'google' ? 'Dodawanie hasla do konta Google wymaga linkowania providerow. Dodam to w kolejnej iteracji.' : 'Laczenie konta z Google wymaga linkowania providerow. Dodam to w kolejnej iteracji.', 'neutral')}
            >
              {currentUser.provider === 'google' ? 'Dodaj haslo' : 'Polacz z Google'}
            </button>
          </div>
        </SettingsField>

        <SettingsField label="Strefa czasowa">
          <select value={profile.timezone} onChange={(event) => onUpdateProfile({ timezone: event.target.value })}>
            {Array.from(new Set([profile.timezone, ...timezoneOptions])).map((timezone) => (
              <option key={timezone} value={timezone}>{timezone}</option>
            ))}
          </select>
          <small className="field-hint">Uzywana do prawidlowego liczenia serii dni nauki.</small>
        </SettingsField>
      </SectionBlock>

      <DangerBlock title="Usuniecie konta" description="Konto zostanie soft-deleted na 14 dni. Potem dane zostana usuniete trwale.">
        <button type="button" className="danger-button" onClick={onOpenDelete}>
          <Trash2 size={16} />
          Usun konto
        </button>
      </DangerBlock>
    </div>
  )
}

function renderAppearanceSection(settings: SettingsState, onUpdateSettings: SettingsPageProps['onUpdateSettings']) {
  return (
    <div className="settings-section-stack">
      <SectionBlock title="Wyglad" description="Dostosuj motyw, czytelnosc i zachowanie interfejsu.">
        <CardChoiceGrid
          title="Motyw"
          value={settings.themeMode}
          options={[
            { id: 'dark', label: 'Ciemny', description: 'Domyslny motyw inspirowany IDE.' },
            { id: 'light', label: 'Jasny', description: 'Jasniejszy wariant do pracy w dzien.' },
            { id: 'system', label: 'Systemowy', description: 'Dopasowuje sie do ustawien urzadzenia.' },
          ]}
          onChange={(value) => onUpdateSettings({ themeMode: value as ThemeMode })}
        />

        <SegmentedControl
          title="Rozmiar czcionki"
          value={settings.bodyTextSize}
          options={[
            { id: 'small', label: 'Maly' },
            { id: 'normal', label: 'Normalny' },
            { id: 'large', label: 'Duzy' },
          ]}
          onChange={(value) => onUpdateSettings({ bodyTextSize: value as BodyTextSize })}
        />
        <div className="settings-preview-line">Zmienna to pudelko z etykieta, w ktorym program przechowuje wartosc.</div>

        <SettingsField label="Czcionka edytora kodu">
          <select value={settings.editorFont} onChange={(event) => onUpdateSettings({ editorFont: event.target.value as EditorFont })}>
            <option value="fira">Fira Code</option>
            <option value="jetbrains">JetBrains Mono</option>
            <option value="source">Source Code Pro</option>
          </select>
        </SettingsField>

        <ToggleRow
          title="Wlacz ligatury typograficzne"
          description="Przydatne np. dla operatorow typu != lub =>."
          checked={settings.editorLigatures}
          onChange={(checked) => onUpdateSettings({ editorLigatures: checked })}
        />

        <RangeRow
          title="Rozmiar czcionki w edytorze"
          value={settings.editorFontSize}
          options={[12, 14, 16, 18]}
          onChange={(value) => onUpdateSettings({ editorFontSize: value as 12 | 14 | 16 | 18 })}
        />
        <CodePreview font={settings.editorFont} size={settings.editorFontSize} ligatures={settings.editorLigatures} />

        <ToggleRow
          title="Animacje interfejsu"
          description="Wylacz, jesli animacje Cie rozpraszaja lub powoduja dyskomfort."
          checked={settings.animationsEnabled}
          onChange={(checked) => onUpdateSettings({ animationsEnabled: checked })}
        />
      </SectionBlock>
    </div>
  )
}

function renderLearningSection(
  settings: SettingsState,
  onUpdateSettings: SettingsPageProps['onUpdateSettings'],
  onShowToast: SettingsPageProps['onShowToast'],
) {
  return (
    <div className="settings-section-stack">
      <SectionBlock title="Nauka" description="Opcje, ktore wplywaja na przebieg sesji i zachowanie kursu.">
        <RangeRow title="Dzienny cel nauki" value={settings.dailyGoal} options={[5, 10, 15, 20, 30]} suffix="min" onChange={(value) => onUpdateSettings({ dailyGoal: value as DailyGoal })} />

        <SegmentedControl
          title="Poziom trudnosci podpowiedzi"
          value={settings.hintLevel}
          options={[
            { id: 'helpful', label: 'Pomocny' },
            { id: 'standard', label: 'Standardowy' },
            { id: 'demanding', label: 'Wymagajacy' },
          ]}
          onChange={(value) => onUpdateSettings({ hintLevel: value as HintLevel })}
        />

        <ToggleRow title="Automatyczne uruchamianie przykladow kodu" description="Przy otwarciu kroku Show przyklad odpali sie automatycznie po chwili." checked={settings.autoRunExamples} onChange={(checked) => onUpdateSettings({ autoRunExamples: checked })} />
        <ToggleRow title="Potwierdzenie przed pokazaniem rozwiazania" description="Zmniejsza odruch natychmiastowego zagladania do rozwiazania." checked={settings.confirmBeforeSolution} onChange={(checked) => onUpdateSettings({ confirmBeforeSolution: checked })} />
        <ToggleRow title="System powtorek" description="Automatycznie przywraca zakonczone moduly do kolejki odswiezek." checked={settings.spacedRepetitionEnabled} onChange={(checked) => onUpdateSettings({ spacedRepetitionEnabled: checked })} />

        <SettingsField label="Jezyk interfejsu">
          <select
            value={settings.interfaceLanguage}
            onChange={(event) => {
              onUpdateSettings({ interfaceLanguage: event.target.value as InterfaceLanguage })
              onShowToast('Zmiana jezyka interfejsu zostala zapisana. Tresci lekcji pozostaja po polsku w MVP.', 'neutral')
            }}
          >
            <option value="pl">Polski</option>
            <option value="en">English</option>
          </select>
        </SettingsField>
      </SectionBlock>
    </div>
  )
}

function renderNotificationSection(
  settings: SettingsState,
  notificationsGranted: NotificationPermission,
  onUpdateSettings: SettingsPageProps['onUpdateSettings'],
  handleRequestBrowserPermission: () => Promise<void>,
) {
  return (
    <div className="settings-section-stack">
      <SectionBlock title="Powiadomienia" description="Email i przypomnienia w przegladarce, bez spamu i bez rozpraszaczy.">
        <ToggleRow title="Przypomnienie o serii" description="Email, gdy aktywny streak jest zagrozony." checked={settings.emailStreakReminder} onChange={(checked) => onUpdateSettings({ emailStreakReminder: checked })} />
        <ToggleRow title="Tygodniowe podsumowanie" description="Podsumowanie postepu, XP i kolejnego kroku." checked={settings.emailWeeklySummary} onChange={(checked) => onUpdateSettings({ emailWeeklySummary: checked })} />
        <ToggleRow title="Nowe tresci" description="Powiadomienie o nowych modulach i poziomach." checked={settings.emailNewContent} onChange={(checked) => onUpdateSettings({ emailNewContent: checked })} />

        <div className={`settings-browser-banner ${notificationsGranted === 'granted' ? 'granted' : ''}`.trim()}>
          <span>{notificationsGranted === 'granted' ? 'Przegladarka ma juz uprawnienia do powiadomien.' : 'Przegladarka nie ma jeszcze uprawnien do powiadomien.'}</span>
          {notificationsGranted !== 'granted' && <button type="button" className="secondary-button" onClick={() => void handleRequestBrowserPermission()}>Wlacz uprawnienia</button>}
        </div>

        <ToggleRow title="Przypomnienie o codziennej nauce" description="Push w ustawionej godzinie, jesli nie uczyles sie jeszcze dzisiaj." checked={settings.browserReminders} disabled={notificationsGranted !== 'granted'} onChange={(checked) => onUpdateSettings({ browserReminders: checked })} />

        <SettingsField label="Godzina przypomnienia">
          <input type="time" value={settings.browserReminderTime} disabled={notificationsGranted !== 'granted'} onChange={(event) => onUpdateSettings({ browserReminderTime: event.target.value })} />
        </SettingsField>

        <ToggleRow title="Streak zagrozony" description="Push, gdy do konca dnia zostalo mniej niz 2 godziny." checked={settings.browserStreakWarning} disabled={notificationsGranted !== 'granted'} onChange={(checked) => onUpdateSettings({ browserStreakWarning: checked })} />
      </SectionBlock>
    </div>
  )
}

function renderPrivacySection(
  settings: SettingsState,
  onUpdateSettings: SettingsPageProps['onUpdateSettings'],
  onExportData: () => void,
) {
  return (
    <div className="settings-section-stack">
      <SectionBlock title="Prywatnosc i dane" description="Kontrola nad widocznoscia profilu, analityka i eksportem danych.">
        <SegmentedControl title="Widocznosc profilu" value={settings.profileVisibility} options={[{ id: 'private', label: 'Prywatny' }, { id: 'public', label: 'Publiczny' }]} onChange={(value) => onUpdateSettings({ profileVisibility: value as ProfileVisibility })} />
        <ToggleRow title="Analityka i ulepszanie produktu" description="Anonimowe eventy pomagaja wykryc problematyczne miejsca w kursie." checked={settings.analyticsEnabled} onChange={(checked) => onUpdateSettings({ analyticsEnabled: checked })} />
        <div className="settings-action-row">
          <button type="button" className="secondary-button" onClick={onExportData}>
            <Download size={16} />
            Pobierz moje dane
          </button>
          <a className="text-link" href="#" target="_blank" rel="noreferrer">Polityka prywatnosci</a>
          <a className="text-link" href="#" target="_blank" rel="noreferrer">Regulamin</a>
        </div>
      </SectionBlock>
    </div>
  )
}

function renderStatsSection(
  stats: SettingsStats,
  activityCells: { date: string; minutes: number; level: number }[],
  onResetModuleProgress: () => void,
  onResetAllProgress: () => void,
) {
  return (
    <div className="settings-section-stack">
      <SectionBlock title="Postep i statystyki" description="Panel szczegolowych danych o nauce, aktywnosci i resetach.">
        <div className="settings-stats-grid">
          <StatCard label="Laczny czas nauki" value={formatMinutes(stats.totalMinutes)} />
          <StatCard label="Ukonczone lekcje" value={`${stats.completedLessons}/${stats.totalLessons}`} />
          <StatCard label="Laczne XP" value={`${stats.totalXp}`} />
          <StatCard label="Najdluzsza seria" value={`${stats.longestStreak} dni`} />
        </div>

        <div className="settings-heatmap">
          {activityCells.map((cell) => (
            <span key={cell.date} className={`heat-${cell.level}`} title={`${cell.date}: ${cell.minutes} min`} />
          ))}
        </div>

        <div className="settings-module-list">
          <ModuleProgressRow title="Twoj pierwszy program" progress={stats.completedLessons > 0 ? 100 : 45} />
          <ModuleProgressRow title="Zmienne" progress={stats.completedLessons > 1 ? 100 : stats.completedLessons > 0 ? 24 : 0} />
          <ModuleProgressRow title="Typy danych" progress={0} />
        </div>

        <DangerBlock title="Reset postepu" description="Mozez wyczyscic pojedynczy modul albo caly progres konta.">
          <div className="settings-action-row">
            <button type="button" className="secondary-button" onClick={onResetModuleProgress}>Zresetuj postep modulu</button>
            <button type="button" className="danger-button" onClick={onResetAllProgress}>Zresetuj caly postep</button>
          </div>
        </DangerBlock>
      </SectionBlock>
    </div>
  )
}

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <article className="settings-block">
      <header className="settings-block-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className="settings-block-body">{children}</div>
    </article>
  )
}

function DangerBlock({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <article className="settings-block settings-block-danger">
      <header className="settings-block-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className="settings-block-body">{children}</div>
    </article>
  )
}

function SettingsField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className={`settings-toggle-row ${disabled ? 'disabled' : ''}`.trim()}>
      <div className="settings-toggle-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button
        type="button"
        className={`settings-switch ${checked ? 'on' : ''}`.trim()}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  )
}

function SegmentedControl({
  title,
  value,
  options,
  onChange,
}: {
  title: string
  value: string
  options: { id: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="settings-segmented">
      <strong>{title}</strong>
      <div className="settings-segmented-buttons">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`settings-segmented-option ${value === option.id ? 'active' : ''}`.trim()}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function CardChoiceGrid({
  title,
  value,
  options,
  onChange,
}: {
  title: string
  value: string
  options: { id: string; label: string; description: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="settings-choice-group">
      <strong>{title}</strong>
      <div className="settings-choice-grid">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`settings-choice-card ${value === option.id ? 'active' : ''}`.trim()}
            onClick={() => onChange(option.id)}
          >
            <span className={`settings-choice-preview theme-${option.id}`.trim()} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <strong>{option.label}</strong>
            <p>{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function RangeRow({
  title,
  value,
  options,
  onChange,
  suffix = '',
}: {
  title: string
  value: number
  options: number[]
  onChange: (value: number) => void
  suffix?: string
}) {
  return (
    <div className="settings-range-row">
      <div className="settings-range-head">
        <strong>{title}</strong>
        <span>
          {value}
          {suffix ? ` ${suffix}` : ''}
        </span>
      </div>
      <div className="settings-range-options">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`settings-range-option ${value === option ? 'active' : ''}`.trim()}
            onClick={() => onChange(option)}
          >
            {option}
            {suffix ? ` ${suffix}` : ''}
          </button>
        ))}
      </div>
    </div>
  )
}

function CodePreview({
  font,
  size,
  ligatures,
}: {
  font: EditorFont
  size: number
  ligatures: boolean
}) {
  return (
    <pre
      className="settings-code-preview"
      style={{
        fontFamily: getEditorFontFamily(font),
        fontSize: `${size}px`,
        fontVariantLigatures: ligatures ? 'normal' : 'none',
      }}
    >
      <code>{`public class Main {\n  public static void main(String[] args) {\n    int punkty = 42;\n    System.out.println("Punkty: " + punkty);\n  }\n}`}</code>
    </pre>
  )
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <article className="settings-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function ModuleProgressRow({
  title,
  progress,
}: {
  title: string
  progress: number
}) {
  return (
    <div className="settings-module-row">
      <div className="settings-module-copy">
        <strong>{title}</strong>
        <span>{progress}%</span>
      </div>
      <div className="module-progress-bar" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function getEditorFontFamily(font: EditorFont) {
  if (font === 'jetbrains') {
    return '"JetBrains Mono", monospace'
  }

  if (font === 'source') {
    return '"Source Code Pro", monospace'
  }

  return '"Fira Code", monospace'
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return 'JP'
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatMinutes(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return '0 min'
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} h`
  }

  return `${hours} h ${minutes} min`
}

function buildActivityHeatmap(totalMinutes: number, longestStreak: number) {
  const today = new Date()
  const cells: { date: string; minutes: number; level: number }[] = []
  const totalDays = 84

  for (let index = totalDays - 1; index >= 0; index -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - index)

    const cycle = (totalDays - index + longestStreak) % 7
    const boost = totalMinutes > 0 && cycle < 3 ? 1 : 0
    const minutes =
      totalMinutes === 0
        ? 0
        : Math.max(0, Math.min(60, Math.round((cycle * 7 + boost * 12 + (longestStreak % 5) * 3) % 61)))
    const level = minutes === 0 ? 0 : minutes < 15 ? 1 : minutes < 35 ? 2 : 3

    cells.push({
      date: date.toISOString().slice(0, 10),
      minutes,
      level,
    })
  }

  return cells
}
