import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { get, ref, remove, serverTimestamp, update } from 'firebase/database'
import {
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react'
import { dashboardStats, lesson, quizQuestions, courseTracks, type CourseTrack, type ModuleStatus } from './courseData'
import {
  AuthPage,
  EmailVerificationPage,
  FirstRunOverlay,
  VerificationResultPage,
  type AuthMode,
  type AuthSubmitResult,
  type UserGoal,
  type VerifyResultStatus,
} from './AuthScreens'
import { auth, db, googleProvider } from './firebase'
import { LandingPage } from './LandingPage'
import { LessonSession } from './LessonSession'
import { SettingsPage, type ProfileState, type SettingsState } from './SettingsPage'

type PrivateScreen = 'dashboard' | 'lesson' | 'quiz' | 'settings'
type PublicScreen = 'landing' | 'register' | 'login' | 'verify-email' | 'verify-result'
type AppScreen = PrivateScreen | PublicScreen
type ToastTone = 'neutral' | 'success' | 'error'

type ToastState = {
  message: string
  tone: ToastTone
} | null

type PendingRegistration = {
  email: string
  name: string
}

type SessionUser = {
  uid: string
  email: string
  name: string
  goal: UserGoal | null
  emailVerified: boolean
  provider: 'password' | 'google'
}

const statusLabel: Record<ModuleStatus, string> = {
  locked: 'Zablokowany',
  active: 'W toku',
  completed: 'Ukonczony',
  review: 'Do powtorki',
}

const statusClass: Record<ModuleStatus, string> = {
  locked: 'module-pill locked',
  active: 'module-pill active',
  completed: 'module-pill completed',
  review: 'module-pill review',
}

const defaultSettingsState: SettingsState = {
  themeMode: 'dark',
  bodyTextSize: 'normal',
  editorFont: 'fira',
  editorFontSize: 14,
  editorLigatures: true,
  animationsEnabled: true,
  dailyGoal: 15,
  hintLevel: 'standard',
  autoRunExamples: false,
  confirmBeforeSolution: true,
  spacedRepetitionEnabled: true,
  interfaceLanguage: 'pl',
  emailStreakReminder: true,
  emailWeeklySummary: true,
  emailNewContent: false,
  browserReminders: false,
  browserReminderTime: '19:00',
  browserStreakWarning: true,
  profileVisibility: 'private',
  analyticsEnabled: true,
}

function createDefaultProfileState(name = ''): ProfileState {
  return {
    fullName: name,
    username: '',
    timezone: getDefaultTimezone(),
    avatarDataUrl: null,
  }
}

function App() {
  const [routeKey, setRouteKey] = useState(() => getRouteKey())
  const route = useMemo(() => parseRoute(routeKey), [routeKey])
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null)
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [profileState, setProfileState] = useState<ProfileState>(() => createDefaultProfileState())
  const [settingsState, setSettingsState] = useState<SettingsState>(defaultSettingsState)
  const [authReady, setAuthReady] = useState(false)
  const [databaseReady, setDatabaseReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lessonComplete, setLessonComplete] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [xp, setXp] = useState(dashboardStats.xp)
  const [streak, setStreak] = useState(dashboardStats.streak)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [streakPulse, setStreakPulse] = useState(false)
  const [quizIndex, setQuizIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [quizScore, setQuizScore] = useState(0)
  const [quizFinished, setQuizFinished] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null)
  const [startLessonPulse, setStartLessonPulse] = useState(false)
  const lastPersistedStateRef = useRef('')
  const databaseWriteErrorShownRef = useRef(false)
  const visibleTracks = buildVisibleTracks(lessonComplete)
  const allModules = visibleTracks.flatMap((track) => track.modules)
  const totalModules = allModules.length
  const completedModules = allModules.filter((module) => module.status === 'completed').length
  const progressPercentage = Math.round((completedModules / totalModules) * 100)
  const reviewModules = allModules.filter((module) => module.status === 'review')
  const profileLevel = Math.max(1, Math.floor(xp / 100) + 1)
  const displayName = profileState.fullName.trim() || currentUser?.name || dashboardStats.userName
  const settingsStats = {
    totalMinutes,
    completedLessons: completedModules,
    totalLessons: totalModules,
    totalXp: xp,
    longestStreak,
  }
  const currentQuestion = quizQuestions[quizIndex]
  const currentScreen = getScreen(route.screen)
  const activeBreadcrumb =
    currentScreen === 'dashboard'
      ? ['Dashboard', 'Twoj postep']
      : currentScreen === 'quiz'
        ? [...lesson.breadcrumb, 'Quiz']
        : lesson.breadcrumb

  function resetLearningState() {
    setLessonComplete(false)
    setShowConfetti(false)
    setXp(dashboardStats.xp)
    setStreak(dashboardStats.streak)
    setTotalMinutes(0)
    setLongestStreak(0)
    setStreakPulse(false)
    setQuizIndex(0)
    setSelectedAnswer(null)
    setQuizScore(0)
    setQuizFinished(false)
    setStartLessonPulse(false)
  }

  useEffect(() => {
    const syncRoute = () => setRouteKey(getRouteKey())
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(mapFirebaseUser(firebaseUser))
      setAuthReady(true)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const loadProgress = async () => {
      if (!currentUser?.emailVerified) {
        setDatabaseReady(false)
        lastPersistedStateRef.current = ''
        databaseWriteErrorShownRef.current = false
        return
      }

      setDatabaseReady(false)
      try {
        const userRef = ref(db, `users/${currentUser.uid}`)
        const snapshot = await get(userRef)

        if (snapshot.exists()) {
          const data = snapshot.val()
          const profile = readProfile(data)
          const settings = readSettings(data)
          const progress = readProgress(data)

          setXp(progress.xp)
          setStreak(progress.streak)
          setTotalMinutes(progress.totalMinutes)
          setLongestStreak(progress.longestStreak)
          setLessonComplete(progress.lessonComplete)
          setQuizIndex(progress.quizIndex)
          setSelectedAnswer(progress.selectedAnswer)
          setQuizScore(progress.quizScore)
          setQuizFinished(progress.quizFinished)
          setSelectedGoal(profile.goal)
          setProfileState({
            fullName: profile.fullName || profile.name || currentUser.name,
            username: profile.username,
            timezone: profile.timezone,
            avatarDataUrl: profile.avatarDataUrl,
          })
          setSettingsState(settings)
          setCurrentUser((value) =>
            value
              ? {
                  ...value,
                  name: profile.fullName || profile.name || value.name,
                  goal: profile.goal,
                }
              : value,
          )
          setNeedsOnboarding(profile.goal === null)
          lastPersistedStateRef.current = JSON.stringify(
            buildPersistedPayload({
              email: currentUser.email,
              name: profile.fullName || profile.name || currentUser.name,
              goal: profile.goal,
              profile: {
                fullName: profile.fullName || profile.name || currentUser.name,
                username: profile.username,
                timezone: profile.timezone,
                avatarDataUrl: profile.avatarDataUrl,
              },
              settings,
              xp: progress.xp,
              streak: progress.streak,
              totalMinutes: progress.totalMinutes,
              longestStreak: progress.longestStreak,
              lessonComplete: progress.lessonComplete,
              quizIndex: progress.quizIndex,
              selectedAnswer: progress.selectedAnswer,
              quizScore: progress.quizScore,
              quizFinished: progress.quizFinished,
            }),
          )
        } else {
          resetLearningState()
          setSelectedGoal(null)
          setProfileState(createDefaultProfileState(currentUser.name))
          setSettingsState(defaultSettingsState)
          setCurrentUser((value) => (value ? { ...value, goal: null } : value))
          setNeedsOnboarding(true)
          lastPersistedStateRef.current = JSON.stringify(
            buildPersistedPayload({
              email: currentUser.email,
              name: currentUser.name,
              goal: null,
              profile: createDefaultProfileState(currentUser.name),
              settings: defaultSettingsState,
              xp: dashboardStats.xp,
              streak: dashboardStats.streak,
              totalMinutes: 0,
              longestStreak: 0,
              lessonComplete: false,
              quizIndex: 0,
              selectedAnswer: null,
              quizScore: 0,
              quizFinished: false,
            }),
          )
        }
      } catch (error) {
        resetLearningState()
        setSelectedGoal(null)
        setProfileState(createDefaultProfileState(currentUser.name))
        setSettingsState(defaultSettingsState)
        setCurrentUser((value) => (value ? { ...value, goal: null } : value))
        setNeedsOnboarding(true)
        lastPersistedStateRef.current = ''
        showToast(`Nie udalo sie odczytac danych z bazy. Startuje pusty profil. ${mapDatabaseError(error)}`, 'error')
      } finally {
        setDatabaseReady(true)
      }
    }

    void loadProgress()
  }, [currentUser?.uid, currentUser?.emailVerified, currentUser?.email, currentUser?.name])

  useEffect(() => {
    const persistProgress = async () => {
      if (!currentUser?.emailVerified || !databaseReady) {
        return
      }

      const payload = buildPersistedPayload({
        email: currentUser.email,
        name: currentUser.name,
        goal: selectedGoal,
        profile: profileState,
        settings: settingsState,
        xp,
        streak,
        totalMinutes,
        longestStreak,
        lessonComplete,
        quizIndex,
        selectedAnswer,
        quizScore,
        quizFinished,
      })

      const nextKey = JSON.stringify(payload)
      if (nextKey === lastPersistedStateRef.current) {
        return
      }

      try {
        await update(ref(db, `users/${currentUser.uid}`), {
          ...payload,
          meta: {
            updatedAt: serverTimestamp(),
          },
        })

        lastPersistedStateRef.current = nextKey
        databaseWriteErrorShownRef.current = false
      } catch (error) {
        if (!databaseWriteErrorShownRef.current) {
          databaseWriteErrorShownRef.current = true
          showToast(`Nie udalo sie zapisac postepu do bazy. ${mapDatabaseError(error)}`, 'error')
        }
      }
    }

    void persistProgress()
  }, [
    currentUser?.uid,
    currentUser?.emailVerified,
    currentUser?.email,
    currentUser?.name,
    databaseReady,
    lessonComplete,
    longestStreak,
    profileState,
    quizFinished,
    quizIndex,
    quizScore,
    selectedAnswer,
    selectedGoal,
    settingsState,
    streak,
    totalMinutes,
    xp,
  ])

  useEffect(() => {
    if (!authReady) {
      return
    }

    if ((!currentUser || !currentUser.emailVerified) && isPrivateScreen(route.screen)) {
      navigateTo('/', setRouteKey, true)
      return
    }

    if (currentUser?.emailVerified && route.screen === 'landing') {
      navigateTo('/dashboard', setRouteKey, true)
      return
    }

    if (currentUser && !currentUser.emailVerified && route.screen === 'landing') {
      navigateTo('/weryfikacja-emaila', setRouteKey, true)
      return
    }

    if (currentUser?.emailVerified && (route.screen === 'register' || route.screen === 'login' || route.screen === 'verify-email')) {
      navigateTo('/dashboard', setRouteKey, true)
      return
    }

    if (!pendingRegistration && !currentUser && route.screen === 'verify-email') {
      navigateTo('/rejestracja', setRouteKey, true)
    }
  }, [authReady, currentUser, pendingRegistration, route.screen])

  useEffect(() => {
    if (!showConfetti && !streakPulse && !startLessonPulse) {
      return
    }

    const confettiTimer = window.setTimeout(() => setShowConfetti(false), 2000)
    const streakTimer = window.setTimeout(() => setStreakPulse(false), 1000)
    const pulseTimer = window.setTimeout(() => setStartLessonPulse(false), 2000)

    return () => {
      window.clearTimeout(confettiTimer)
      window.clearTimeout(streakTimer)
      window.clearTimeout(pulseTimer)
    }
  }, [showConfetti, startLessonPulse, streakPulse])

  useEffect(() => {
    if (!toast) {
      return
    }

    const toastTimer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(toastTimer)
  }, [toast])

  useEffect(() => {
    const root = document.documentElement
    const resolvedTheme =
      settingsState.themeMode === 'system'
        ? window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
        : settingsState.themeMode

    const bodySize = settingsState.bodyTextSize === 'small' ? '13px' : settingsState.bodyTextSize === 'large' ? '17px' : '15px'
    const editorFamily =
      settingsState.editorFont === 'jetbrains'
        ? '"JetBrains Mono", monospace'
        : settingsState.editorFont === 'source'
          ? '"Source Code Pro", monospace'
          : '"Fira Code", monospace'

    root.dataset.theme = resolvedTheme
    root.dataset.animations = settingsState.animationsEnabled ? 'on' : 'off'
    root.style.setProperty('--app-body-size', bodySize)
    root.style.setProperty('--editor-font-size', `${settingsState.editorFontSize}px`)
    root.style.setProperty('--editor-font-family', editorFamily)
    root.style.setProperty('--editor-ligatures', settingsState.editorLigatures ? 'normal' : 'none')
  }, [
    settingsState.animationsEnabled,
    settingsState.bodyTextSize,
    settingsState.editorFont,
    settingsState.editorFontSize,
    settingsState.editorLigatures,
    settingsState.themeMode,
  ])

  const showToast = (message: string, tone: ToastTone = 'neutral') => {
    setToast({ message, tone })
  }

  const navigateApp = (nextScreen: PrivateScreen) => {
    setSidebarOpen(false)
    startTransition(() => navigateTo(getPathForScreen(nextScreen), setRouteKey))
  }

  const handleLogout = async () => {
    setDatabaseReady(false)
    resetLearningState()
    setPendingRegistration(null)
    setNeedsOnboarding(false)
    setSelectedGoal(null)
    setProfileState(createDefaultProfileState())
    setSettingsState(defaultSettingsState)
    await signOut(auth)
    navigateTo('/', setRouteKey)
    showToast('Wylogowano. Wrociles na strone powitalna.', 'success')
  }

  const handleProfileUpdate = (patch: Partial<ProfileState>) => {
    setProfileState((value) => ({
      ...value,
      ...patch,
    }))

    if (patch.fullName !== undefined) {
      setCurrentUser((value) =>
        value
          ? {
              ...value,
              name: patch.fullName!.trim() || auth.currentUser?.displayName || 'Nowy kursant',
            }
          : value,
      )
    }
  }

  const handleSettingsUpdate = (patch: Partial<SettingsState>) => {
    setSettingsState((value) => ({
      ...value,
      ...patch,
    }))
  }

  const handleExportData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      account: {
        email: currentUser?.email ?? '',
        provider: currentUser?.provider ?? 'password',
        goal: selectedGoal,
      },
      profile: profileState,
      settings: settingsState,
      progress: {
        xp,
        streak,
        totalMinutes,
        longestStreak,
        lessonComplete,
        quizIndex,
        selectedAnswer,
        quizScore,
        quizFinished,
      },
    }

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'javapath-data-export.json'
    anchor.click()
    URL.revokeObjectURL(url)
    showToast('Eksport danych jest gotowy.', 'success')
  }

  const handleResetModuleProgress = () => {
    setLessonComplete(false)
    setQuizIndex(0)
    setSelectedAnswer(null)
    setQuizScore(0)
    setQuizFinished(false)
    showToast('Postep aktywnego modulu zostal wyzerowany.', 'success')
  }

  const handleResetAllProgress = () => {
    resetLearningState()
    navigateTo('/dashboard', setRouteKey, true)
    showToast('Caly postep nauki zostal wyzerowany.', 'success')
  }

  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !currentUser) {
      showToast('Nie znaleziono aktywnego konta do usuniecia.', 'error')
      return
    }

    try {
      await remove(ref(db, `users/${currentUser.uid}`))
      await deleteUser(auth.currentUser)
      resetLearningState()
      setCurrentUser(null)
      setPendingRegistration(null)
      setSelectedGoal(null)
      setNeedsOnboarding(false)
      setProfileState(createDefaultProfileState())
      setSettingsState(defaultSettingsState)
      navigateTo('/', setRouteKey, true)
      showToast('Konto zostalo usuniete.', 'success')
    } catch (error) {
      showToast(mapFirebaseError(error), 'error')
      throw error
    }
  }

  const handleModuleOpen = (status: ModuleStatus, title: string) => {
    if (status === 'locked') {
      showToast(`Modul "${title}" jest jeszcze zablokowany. Najpierw ukoncz poprzedni etap.`, 'neutral')
      return
    }

    navigateApp('lesson')
  }

  const openQuiz = () => {
    if (!lessonComplete) {
      showToast('Quiz odblokuje sie po przejsciu calej sesji lekcyjnej.', 'neutral')
      return
    }

    setQuizIndex(0)
    setSelectedAnswer(null)
    setQuizScore(0)
    setQuizFinished(false)
    navigateApp('quiz')
  }

  const openFirstLesson = () => {
    navigateApp('lesson')
  }

  const handleReviewAction = () => {
    if (reviewModules.length === 0) {
      showToast('Powtorki pojawia sie po kilku zakonczonych lekcjach.', 'neutral')
      openFirstLesson()
      return
    }

    openQuiz()
  }

  const submitQuizAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || quizFinished) {
      return
    }

    setSelectedAnswer(answerIndex)

    if (answerIndex === currentQuestion.correctIndex) {
      setQuizScore((value) => value + 1)
    }
  }

  const goToNextQuestion = () => {
    if (selectedAnswer === null) {
      return
    }

    if (quizIndex === quizQuestions.length - 1) {
      setQuizFinished(true)
      setXp((value) => value + 60)
      return
    }

    setQuizIndex((value) => value + 1)
    setSelectedAnswer(null)
  }

  const handleLessonCompleted = (xpReward: number) => {
    if (lessonComplete) {
      return
    }

    setLessonComplete(true)
    setShowConfetti(true)
    setStreakPulse(true)
    setStreak((current) => {
      const nextStreak = Math.max(1, current + 1)
      setLongestStreak((best) => Math.max(best, nextStreak))
      return nextStreak
    })
    setTotalMinutes((current) => current + 15)
    setXp((current) => current + xpReward)
  }

  const switchAuthMode = (mode: AuthMode) => {
    navigateTo(mode === 'register' ? '/rejestracja' : '/logowanie', setRouteKey)
  }

  const handleRegister = async ({
    email,
    password,
    name,
  }: {
    email: string
    password: string
    name: string
  }): Promise<AuthSubmitResult> => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)

      if (name) {
        await updateProfile(credential.user, { displayName: name })
      }

      await sendEmailVerification(credential.user)
      setPendingRegistration({
        email,
        name: name || credential.user.displayName || 'Nowy kursant',
      })
      setCurrentUser(mapFirebaseUser(auth.currentUser))
      navigateTo('/weryfikacja-emaila', setRouteKey)

      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        field: 'email',
        message: mapFirebaseError(error),
      }
    }
  }

  const handleLogin = async ({ email, password }: { email: string; password: string }): Promise<AuthSubmitResult> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      await reload(credential.user)
      setCurrentUser(mapFirebaseUser(auth.currentUser))

      if (!credential.user.emailVerified) {
        setPendingRegistration({
          email: credential.user.email || email,
          name: credential.user.displayName || 'Nowy kursant',
        })
        navigateTo('/weryfikacja-emaila', setRouteKey)
        return {
          ok: false,
          field: 'email',
          message: 'Konto jest utworzone, ale email nie zostal jeszcze potwierdzony.',
        }
      }

      setSelectedGoal(null)
      setNeedsOnboarding(false)
      resetLearningState()
      navigateTo('/dashboard', setRouteKey)
      showToast('Witaj ponownie. Mozesz kontynuowac nauke.', 'success')

      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        field: 'form',
        message: mapFirebaseError(error),
      }
    }
  }

  const handleGoogleContinue = async () => {
    try {
      const credential = await signInWithPopup(auth, googleProvider)
      const nextUser = mapFirebaseUser(credential.user)
      setCurrentUser(nextUser)
      setSelectedGoal(null)
      setNeedsOnboarding(false)
      resetLearningState()
      navigateTo('/dashboard', setRouteKey)
      showToast('Konto Google jest gotowe. Mozesz zaczynac.', 'success')

      return { linkedExisting: !credential.user.metadata.creationTime || credential.user.metadata.creationTime !== credential.user.metadata.lastSignInTime }
    } catch (error) {
      throw new Error(mapFirebaseError(error))
    }
  }

  const handleCheckVerification = async () => {
    if (!auth.currentUser) {
      showToast('Najpierw zaloguj sie na konto, ktore chcesz aktywowac.', 'error')
      navigateTo('/logowanie', setRouteKey)
      return
    }

    await reload(auth.currentUser)
    const refreshedUser = auth.currentUser

    if (!refreshedUser?.emailVerified) {
      showToast('Email nie jest jeszcze potwierdzony. Kliknij link z wiadomosci i sprobuj ponownie.', 'neutral')
      return
    }

    setCurrentUser(mapFirebaseUser(refreshedUser))
    setNeedsOnboarding(false)
    setPendingRegistration(null)
    resetLearningState()
    navigateTo('/weryfikuj?token=success', setRouteKey)
  }

  const handleVerificationPrimary = () => {
    if (route.verifyStatus === 'success') {
      navigateTo('/dashboard', setRouteKey)
      return
    }

    if (route.verifyStatus === 'used') {
      navigateTo('/logowanie', setRouteKey)
      return
    }

    navigateTo('/weryfikacja-emaila', setRouteKey)
  }

  const handleVerificationSecondary = () => {
    if (route.verifyStatus === 'success') {
      navigateTo('/dashboard', setRouteKey)
      return
    }

    if (route.verifyStatus === 'used') {
      navigateTo('/', setRouteKey)
      return
    }

    navigateTo('/rejestracja', setRouteKey)
  }

  const handleFinishOnboarding = () => {
    if (currentUser) {
      const nextGoal = selectedGoal
      setCurrentUser((value) => (value ? { ...value, goal: nextGoal } : value))
    }

    setNeedsOnboarding(false)
    setStartLessonPulse(true)
  }

  if (route.screen === 'verify-result') {
    return (
      <>
        <VerificationResultPage
          email={currentUser?.email || pendingRegistration?.email || 'konto@javapath.pl'}
          name={currentUser?.name || pendingRegistration?.name}
          status={route.verifyStatus}
          onPrimaryAction={handleVerificationPrimary}
          onSecondaryAction={handleVerificationSecondary}
        />
        {toast && (
          <div className={`app-toast ${toast.tone}`} role="status" aria-live="polite">
            {toast.message}
          </div>
        )}
      </>
    )
  }

  if (!authReady) {
    return null
  }

  if (currentUser?.emailVerified && !databaseReady) {
    return (
      <div className="verify-shell">
        <section className="verify-card">
          <p className="eyebrow">JavaPath</p>
          <h1>Wczytywanie konta...</h1>
          <p className="verify-copy">Pobieram Twoj profil i zapisany postep z Realtime Database.</p>
        </section>
      </div>
    )
  }

  if (!currentUser || !currentUser.emailVerified) {
    return (
      <>
        {route.screen === 'landing' && (
          <LandingPage
            onLogin={() => navigateTo('/logowanie', setRouteKey)}
            onStartFree={() => navigateTo('/rejestracja', setRouteKey)}
          />
        )}

        {route.screen === 'register' && (
          <AuthPage
            mode="register"
            existingEmails={[]}
            initialEmail={pendingRegistration?.email}
            onBack={() => navigateTo('/', setRouteKey)}
            onSwitchMode={switchAuthMode}
            onRegister={handleRegister}
            onLogin={handleLogin}
            onGoogleContinue={handleGoogleContinue}
          />
        )}

        {route.screen === 'login' && (
          <AuthPage
            mode="login"
            existingEmails={[]}
            initialEmail={pendingRegistration?.email}
            onBack={() => navigateTo('/', setRouteKey)}
            onSwitchMode={switchAuthMode}
            onRegister={handleRegister}
            onLogin={handleLogin}
            onGoogleContinue={handleGoogleContinue}
          />
        )}

        {route.screen === 'verify-email' && (pendingRegistration || currentUser) && (
          <EmailVerificationPage
            email={pendingRegistration?.email || currentUser?.email || 'konto@javapath.pl'}
            onBackToRegister={() => navigateTo('/rejestracja', setRouteKey)}
            onResend={async () => {
              if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser)
                showToast('Email weryfikacyjny wyslany ponownie.', 'success')
              }
            }}
            onCheckVerification={handleCheckVerification}
          />
        )}

        {toast && (
          <div className={`app-toast ${toast.tone}`} role="status" aria-live="polite">
            {toast.message}
          </div>
        )}
      </>
    )
  }

  if (currentScreen === 'settings') {
    return (
      <>
        <SettingsPage
          currentUser={{
            email: currentUser.email,
            name: displayName,
            provider: currentUser.provider,
          }}
          profile={profileState}
          settings={settingsState}
          stats={settingsStats}
          goal={selectedGoal}
          onBack={() => navigateApp('dashboard')}
          onUpdateProfile={handleProfileUpdate}
          onUpdateSettings={handleSettingsUpdate}
          onExportData={handleExportData}
          onResetModuleProgress={handleResetModuleProgress}
          onResetAllProgress={handleResetAllProgress}
          onDeleteAccount={handleDeleteAccount}
          onShowToast={showToast}
        />
        {toast && (
          <div className={`app-toast ${toast.tone}`} role="status" aria-live="polite">
            {toast.message}
          </div>
        )}
      </>
    )
  }

  return (
    <div className={`app-shell ${needsOnboarding ? 'app-shell-blurred' : ''}`.trim()}>
      {showConfetti && <ConfettiBurst />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <button type="button" className="sidebar-home-button sidebar-copy" onClick={() => navigateApp('dashboard')}>
            <p className="eyebrow">Java learning path</p>
            <h1>JavaPath</h1>
          </button>
          <button
            type="button"
            className="icon-button mobile-only"
            aria-label="Zamknij menu"
            onClick={() => setSidebarOpen(false)}
          >
            <XCircle size={18} />
          </button>
        </div>

        <section className="profile-card">
          <div className="avatar-ring">{getInitials(displayName)}</div>
          <button type="button" className="profile-home-button profile-copy" onClick={() => navigateApp('dashboard')}>
            <strong>{displayName}</strong>
            <p>Poziom {profileLevel}</p>
          </button>
          <div className="xp-chip">
            <Zap size={14} />
            <span>{xp} XP</span>
          </div>
        </section>

        <nav className="sidebar-nav" aria-label="Sciezki kursu">
          {visibleTracks.map((track, index) => (
            <TrackAccordion
              key={track.id}
              index={index}
              track={track}
              onOpenLesson={handleModuleOpen}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="ghost-link" onClick={() => navigateApp('settings')}>
            <Settings size={16} />
            <span>Ustawienia</span>
          </button>
          <button type="button" className="ghost-link" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button type="button" className="sidebar-backdrop" aria-label="Zamknij menu" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-button mobile-only"
              aria-label="Otworz menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>

            <div>
              <p className="eyebrow">Sciezka aktywna</p>
              <div className="breadcrumb">
                {activeBreadcrumb.map((item, index) => (
                  <span key={item}>
                    {index > 0 && <ChevronRight size={14} />}
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <StatPill icon={<Flame size={16} />} className={streakPulse ? 'pulse' : ''}>
              {streak} dni
            </StatPill>
            <StatPill icon={<Zap size={16} />} tone="success">
              {xp} XP
            </StatPill>
          </div>
        </header>

        <main className={`main-panel ${currentScreen === 'quiz' ? 'quiz-open' : ''}`}>
          {currentScreen === 'dashboard' && (
            <section className="dashboard">
              <section className="hero-strip">
                <div>
                  <p className="eyebrow">Dark IDE meets learning game</p>
                  <h2>Witaj, {displayName}. Twoja seria: {streak} dni.</h2>
                  <p>
                    Konto startuje bez postepu. Otworz pierwsza lekcje, uruchom kod w przegladarce i odblokuj dalsze
                    elementy platformy.
                  </p>
                </div>
                <button
                  type="button"
                  className={`primary-button ${startLessonPulse ? 'primary-button-pulse' : ''}`.trim()}
                  onClick={openFirstLesson}
                >
                  Rozpocznij pierwsza lekcje
                  <ChevronRight size={16} />
                </button>
              </section>

              <section className="card-grid">
                <article className="progress-card strong">
                  <header>
                    <div className="card-icon">
                      <LayoutDashboard size={18} />
                    </div>
                    <div>
                      <h3>Twoj postep</h3>
                      <p>Nastepny modul: {dashboardStats.nextModule}</p>
                    </div>
                  </header>
                  <div className="ring-metric">
                    <div className="ring" style={{ '--progress': `${progressPercentage}%` } as CSSProperties}>
                      <span>{progressPercentage}%</span>
                    </div>
                    <div className="card-copy">
                      <strong>
                        {completedModules} z {totalModules} modulow
                      </strong>
                      <p>Startujesz bez historii. Pierwszy ukonczony modul odblokuje XP, streak i quiz.</p>
                    </div>
                  </div>
                </article>

                <article className="progress-card">
                  <header>
                    <div className="card-icon">
                      <RefreshCw size={18} />
                    </div>
                    <div>
                      <h3>Dzis do powtorki</h3>
                      <p>Algorytm 7 / 14 / 30 dni</p>
                    </div>
                  </header>
                  {reviewModules.length > 0 ? (
                    <ul className="compact-list">
                      {reviewModules.map((module) => (
                        <li key={module.id}>
                          <span>{module.title}</span>
                          <span className="tag warning">Powtorka</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="empty-card-state">
                      <p>Brak powtorek. Ukarcz pierwszy modul, a system zacznie planowac odswiezki.</p>
                    </div>
                  )}
                  <button type="button" className="secondary-button" onClick={handleReviewAction}>
                    {reviewModules.length > 0 ? 'Zacznij powtorke' : 'Przejdz do pierwszej lekcji'}
                  </button>
                </article>

                <article className="progress-card">
                  <header>
                    <div className="card-icon">
                      <Trophy size={18} />
                    </div>
                    <div>
                      <h3>Wyzwanie dnia</h3>
                      <p>{lessonComplete ? 'Aktywne jeszcze 24h' : 'Odblokuje sie po module 1'}</p>
                    </div>
                  </header>
                  <div className="challenge-card">
                    <strong>{dashboardStats.challengeTitle}</strong>
                    <p>
                      {lessonComplete
                        ? 'Jedno zadanie na output, concatenation i czytelny format komunikatu.'
                        : 'Challenge startuje dopiero po pierwszym sukcesie, zeby nie wrzucac nowego uzytkownika na gleboka wode.'}
                    </p>
                    <div className="challenge-meta">
                      <span className={`tag ${lessonComplete ? 'success' : 'warning'}`}>
                        {lessonComplete ? '40 XP' : 'Zablokowane'}
                      </span>
                      <button type="button" className="text-link" onClick={openFirstLesson}>
                        {lessonComplete ? 'Otworz zadanie' : 'Przejdz do lekcji'}
                      </button>
                    </div>
                  </div>
                </article>
              </section>

              <section className="course-map">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Mapa kursu</p>
                    <h3>Wizualna sciezka nauki</h3>
                  </div>
                  <button type="button" className="secondary-button" onClick={openFirstLesson}>
                    Otworz aktywny modul
                  </button>
                </div>

                <div className="map-nodes" aria-label="Mapa modulow">
                  {allModules.map((module, index) => (
                    <div key={module.id} className="map-node-group">
                      <button
                        type="button"
                        className={`map-node ${module.status}`}
                        onClick={() => handleModuleOpen(module.status, module.title)}
                      >
                        <span>{index + 1}</span>
                      </button>
                      <strong>{module.title}</strong>
                      <p>{statusLabel[module.status]}</p>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          )}

          {currentScreen === 'lesson' && (
            <LessonSession
              lessonComplete={lessonComplete}
              onAwardXp={(xpValue) => setXp((current) => current + xpValue)}
              onLessonCompleted={handleLessonCompleted}
              onBackToDashboard={() => navigateApp('dashboard')}
              onOpenQuiz={openQuiz}
              onShowToast={showToast}
            />
          )}

          {currentScreen === 'quiz' && (
            <section className="quiz-overlay">
              {!quizFinished ? (
                <div className="quiz-card">
                  <div className="quiz-meta">
                    <span className="eyebrow">Quiz koncowy</span>
                    <span>
                      Pytanie {quizIndex + 1} / {quizQuestions.length}
                    </span>
                  </div>

                  <div className="quiz-progress">
                    <span style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }} />
                  </div>

                  <h2>{currentQuestion.prompt}</h2>

                  <div className="quiz-grid">
                    {currentQuestion.options.map((option, index) => {
                      const isCorrect = currentQuestion.correctIndex === index
                      const isSelected = selectedAnswer === index
                      const isWrong = isSelected && !isCorrect
                      const classes = ['quiz-option']

                      if (selectedAnswer !== null && isCorrect) {
                        classes.push('correct')
                      }

                      if (isWrong) {
                        classes.push('wrong')
                      }

                      return (
                        <button
                          key={option}
                          type="button"
                          className={classes.join(' ')}
                          onClick={() => submitQuizAnswer(index)}
                        >
                          <span className="option-index">{String.fromCharCode(65 + index)}</span>
                          <span>{option}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="quiz-footer">
                    <button type="button" className="secondary-button" onClick={() => navigateApp('lesson')}>
                      Wroc do lekcji
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={goToNextQuestion}
                      disabled={selectedAnswer === null}
                    >
                      Nastepne pytanie
                    </button>
                  </div>
                </div>
              ) : (
                <div className="quiz-card summary">
                  <CircleCheckBig size={42} />
                  <h2>Quiz zakonczony</h2>
                  <p>
                    Zdobyty wynik: {quizScore} / {quizQuestions.length}. Bonus za ukonczenie quizu zostal dodany do XP.
                  </p>
                  <div className="summary-stats">
                    <span className="tag success">+60 XP</span>
                    <span className="tag warning">{Math.round((quizScore / quizQuestions.length) * 100)}% skutecznosci</span>
                  </div>
                  <button type="button" className="primary-button" onClick={() => navigateApp('dashboard')}>
                    Wroc na dashboard
                  </button>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {toast && (
        <div className={`app-toast ${toast.tone}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}

      {needsOnboarding && (
        <FirstRunOverlay
          selectedGoal={selectedGoal}
          onSelectGoal={setSelectedGoal}
          onContinue={handleFinishOnboarding}
        />
      )}
    </div>
  )
}

function TrackAccordion({
  index,
  track,
  onOpenLesson,
}: {
  index: number
  track: CourseTrack
  onOpenLesson: (status: ModuleStatus, title: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const trackCode = `P${index + 1}`

  return (
    <section className="track-card">
      <button
        type="button"
        className={`track-toggle ${isOpen ? 'open' : ''}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <div className="track-glyph">{trackCode}</div>
        <div className="track-copy">
          <p className="eyebrow">{track.level}</p>
          <h2>{track.title}</h2>
          <p>{track.summary}</p>
        </div>
        <ChevronDown size={16} className={`track-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="track-body">
          <div className="track-progress">
            <span style={{ width: `${track.completion}%` }} />
          </div>

          <div className="track-modules">
            {track.modules.map((module) => (
              <button
                key={module.id}
                type="button"
                className={`module-row ${module.status}`}
                onClick={() => onOpenLesson(module.status, module.title)}
              >
                <div className="module-copy">
                  <strong>{module.title}</strong>
                  <span>{module.subtitle}</span>
                </div>
                <div className="module-meta">
                  <span className={statusClass[module.status]}>{statusLabel[module.status]}</span>
                  <span>{module.xp} XP</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function StatPill({
  icon,
  tone = 'warning',
  className = '',
  children,
}: {
  icon: ReactNode
  tone?: 'warning' | 'success'
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`stat-pill ${tone} ${className}`.trim()}>
      {icon}
      <span>{children}</span>
    </div>
  )
}

function ConfettiBurst() {
  return (
    <div className="confetti-burst" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => (
        <span key={index} className={`confetti-piece piece-${index % 6}`} />
      ))}
    </div>
  )
}

function buildVisibleTracks(lessonComplete: boolean) {
  return courseTracks.map((track) => {
    let completedInTrack = 0

    const modules = track.modules.map((module) => {
      if (track.id === 'fundamenty' && lessonComplete && module.id === 'hello-world') {
        completedInTrack += 1
        return {
          ...module,
          status: 'completed' as const,
        }
      }

      if (track.id === 'fundamenty' && lessonComplete && module.id === 'zmienne') {
        return {
          ...module,
          status: 'active' as const,
        }
      }

      if (module.status === 'completed') {
        completedInTrack += 1
      }

      return module
    })

    return {
      ...track,
      completion: Math.round((completedInTrack / modules.length) * 100),
      modules,
    }
  })
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

function getRouteKey() {
  return `${window.location.pathname}${window.location.search}`
}

function parseRoute(routeKey: string): { screen: AppScreen; verifyStatus: VerifyResultStatus } {
  const url = new URL(routeKey, window.location.origin)
  const path = url.pathname

  if (path === '/rejestracja') {
    return { screen: 'register', verifyStatus: 'invalid' }
  }

  if (path === '/logowanie') {
    return { screen: 'login', verifyStatus: 'invalid' }
  }

  if (path === '/weryfikacja-emaila') {
    return { screen: 'verify-email', verifyStatus: 'invalid' }
  }

  if (path === '/weryfikuj') {
    return {
      screen: 'verify-result',
      verifyStatus: parseVerifyStatus(url.searchParams.get('token')),
    }
  }

  if (path === '/dashboard') {
    return { screen: 'dashboard', verifyStatus: 'invalid' }
  }

  if (path === '/lekcja') {
    return { screen: 'lesson', verifyStatus: 'invalid' }
  }

  if (path === '/quiz') {
    return { screen: 'quiz', verifyStatus: 'invalid' }
  }

  if (path === '/ustawienia') {
    return { screen: 'settings', verifyStatus: 'invalid' }
  }

  return { screen: 'landing', verifyStatus: 'invalid' }
}

function parseVerifyStatus(token: string | null): VerifyResultStatus {
  if (token === 'success') {
    return 'success'
  }

  if (token === 'expired') {
    return 'expired'
  }

  if (token === 'used') {
    return 'used'
  }

  return 'invalid'
}

function isPrivateScreen(screen: AppScreen): screen is PrivateScreen {
  return screen === 'dashboard' || screen === 'lesson' || screen === 'quiz' || screen === 'settings'
}

function getScreen(screen: AppScreen): PrivateScreen {
  if (screen === 'lesson' || screen === 'quiz' || screen === 'settings') {
    return screen
  }

  return 'dashboard'
}

function getPathForScreen(screen: PrivateScreen) {
  if (screen === 'lesson') {
    return '/lekcja'
  }

  if (screen === 'quiz') {
    return '/quiz'
  }

  if (screen === 'settings') {
    return '/ustawienia'
  }

  return '/dashboard'
}

function navigateTo(path: string, setRouteKey: (value: string) => void, replace = false) {
  if (replace) {
    window.history.replaceState({}, '', path)
  } else {
    window.history.pushState({}, '', path)
  }

  setRouteKey(getRouteKey())
}

function mapFirebaseUser(firebaseUser: FirebaseUser | null): SessionUser | null {
  if (!firebaseUser || !firebaseUser.email) {
    return null
  }

  const providerIds = firebaseUser.providerData.map((entry) => entry.providerId)

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName || 'Nowy kursant',
    goal: null,
    emailVerified: firebaseUser.emailVerified,
    provider: providerIds.includes('google.com') ? 'google' : 'password',
  }
}

function buildPersistedPayload({
  email,
  name,
  goal,
  profile,
  settings,
  xp,
  streak,
  totalMinutes,
  longestStreak,
  lessonComplete,
  quizIndex,
  selectedAnswer,
  quizScore,
  quizFinished,
}: {
  email: string
  name: string
  goal: UserGoal | null
  profile: ProfileState
  settings: SettingsState
  xp: number
  streak: number
  totalMinutes: number
  longestStreak: number
  lessonComplete: boolean
  quizIndex: number
  selectedAnswer: number | null
  quizScore: number
  quizFinished: boolean
}) {
  return {
    profile: {
      email,
      name,
      goal,
      fullName: profile.fullName,
      username: profile.username,
      timezone: profile.timezone,
      avatarDataUrl: profile.avatarDataUrl,
    },
    settings,
    progress: {
      xp,
      streak,
      totalMinutes,
      longestStreak,
      lessonComplete,
      quizIndex,
      selectedAnswer,
      quizScore,
      quizFinished,
    },
  }
}

function readProfile(data: Record<string, unknown>) {
  const rawProfile = isRecord(data.profile) ? data.profile : {}
  const goal = rawProfile.goal

  return {
    name: typeof rawProfile.name === 'string' ? rawProfile.name : '',
    goal: isGoal(goal) ? goal : null,
    fullName: typeof rawProfile.fullName === 'string' ? rawProfile.fullName : '',
    username: typeof rawProfile.username === 'string' ? rawProfile.username : '',
    timezone: typeof rawProfile.timezone === 'string' ? rawProfile.timezone : getDefaultTimezone(),
    avatarDataUrl: typeof rawProfile.avatarDataUrl === 'string' ? rawProfile.avatarDataUrl : null,
  }
}

function readSettings(data: Record<string, unknown>): SettingsState {
  const rawSettings = isRecord(data.settings) ? data.settings : {}

  return {
    themeMode: isThemeMode(rawSettings.themeMode) ? rawSettings.themeMode : defaultSettingsState.themeMode,
    bodyTextSize: isBodyTextSize(rawSettings.bodyTextSize) ? rawSettings.bodyTextSize : defaultSettingsState.bodyTextSize,
    editorFont: isEditorFont(rawSettings.editorFont) ? rawSettings.editorFont : defaultSettingsState.editorFont,
    editorFontSize: isEditorFontSize(rawSettings.editorFontSize) ? rawSettings.editorFontSize : defaultSettingsState.editorFontSize,
    editorLigatures: toBoolean(rawSettings.editorLigatures, defaultSettingsState.editorLigatures),
    animationsEnabled: toBoolean(rawSettings.animationsEnabled, defaultSettingsState.animationsEnabled),
    dailyGoal: isDailyGoal(rawSettings.dailyGoal) ? rawSettings.dailyGoal : defaultSettingsState.dailyGoal,
    hintLevel: isHintLevel(rawSettings.hintLevel) ? rawSettings.hintLevel : defaultSettingsState.hintLevel,
    autoRunExamples: toBoolean(rawSettings.autoRunExamples, defaultSettingsState.autoRunExamples),
    confirmBeforeSolution: toBoolean(rawSettings.confirmBeforeSolution, defaultSettingsState.confirmBeforeSolution),
    spacedRepetitionEnabled: toBoolean(rawSettings.spacedRepetitionEnabled, defaultSettingsState.spacedRepetitionEnabled),
    interfaceLanguage: isInterfaceLanguage(rawSettings.interfaceLanguage) ? rawSettings.interfaceLanguage : defaultSettingsState.interfaceLanguage,
    emailStreakReminder: toBoolean(rawSettings.emailStreakReminder, defaultSettingsState.emailStreakReminder),
    emailWeeklySummary: toBoolean(rawSettings.emailWeeklySummary, defaultSettingsState.emailWeeklySummary),
    emailNewContent: toBoolean(rawSettings.emailNewContent, defaultSettingsState.emailNewContent),
    browserReminders: toBoolean(rawSettings.browserReminders, defaultSettingsState.browserReminders),
    browserReminderTime: typeof rawSettings.browserReminderTime === 'string' ? rawSettings.browserReminderTime : defaultSettingsState.browserReminderTime,
    browserStreakWarning: toBoolean(rawSettings.browserStreakWarning, defaultSettingsState.browserStreakWarning),
    profileVisibility: isProfileVisibility(rawSettings.profileVisibility) ? rawSettings.profileVisibility : defaultSettingsState.profileVisibility,
    analyticsEnabled: toBoolean(rawSettings.analyticsEnabled, defaultSettingsState.analyticsEnabled),
  }
}

function readProgress(data: Record<string, unknown>) {
  const rawProgress = isRecord(data.progress) ? data.progress : {}

  return {
    xp: toNumber(rawProgress.xp, dashboardStats.xp),
    streak: toNumber(rawProgress.streak, dashboardStats.streak),
    totalMinutes: toNumber(rawProgress.totalMinutes, 0),
    longestStreak: toNumber(rawProgress.longestStreak, 0),
    lessonComplete: Boolean(rawProgress.lessonComplete),
    quizIndex: clamp(toNumber(rawProgress.quizIndex, 0), 0, Math.max(quizQuestions.length - 1, 0)),
    selectedAnswer: rawProgress.selectedAnswer === null || rawProgress.selectedAnswer === undefined
      ? null
      : clamp(toNumber(rawProgress.selectedAnswer, 0), 0, 3),
    quizScore: toNumber(rawProgress.quizScore, 0),
    quizFinished: Boolean(rawProgress.quizFinished),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isGoal(value: unknown): value is UserGoal {
  return value === 'career' || value === 'study' || value === 'project' || value === 'curious'
}

function isThemeMode(value: unknown): value is SettingsState['themeMode'] {
  return value === 'dark' || value === 'light' || value === 'system'
}

function isBodyTextSize(value: unknown): value is SettingsState['bodyTextSize'] {
  return value === 'small' || value === 'normal' || value === 'large'
}

function isEditorFont(value: unknown): value is SettingsState['editorFont'] {
  return value === 'fira' || value === 'jetbrains' || value === 'source'
}

function isEditorFontSize(value: unknown): value is SettingsState['editorFontSize'] {
  return value === 12 || value === 14 || value === 16 || value === 18
}

function isDailyGoal(value: unknown): value is SettingsState['dailyGoal'] {
  return value === 5 || value === 10 || value === 15 || value === 20 || value === 30
}

function isHintLevel(value: unknown): value is SettingsState['hintLevel'] {
  return value === 'helpful' || value === 'standard' || value === 'demanding'
}

function isInterfaceLanguage(value: unknown): value is SettingsState['interfaceLanguage'] {
  return value === 'pl' || value === 'en'
}

function isProfileVisibility(value: unknown): value is SettingsState['profileVisibility'] {
  return value === 'private' || value === 'public'
}

function toNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getDefaultTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Warsaw'
}

function mapFirebaseError(error: unknown) {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return 'Cos poszlo nie tak. Sprobuj ponownie za chwile.'
  }

  const code = String(error.code)
  const message = 'message' in error ? String(error.message) : ''

  if (code === 'auth/email-already-in-use') {
    return 'Konto z tym adresem juz istnieje. Zaloguj sie albo odzyskaj haslo.'
  }

  if (code === 'auth/invalid-email') {
    return 'Adres email jest niepoprawny.'
  }

  if (code === 'auth/weak-password') {
    return 'Haslo jest za slabe. Uzyj co najmniej 8 znakow i jednej cyfry.'
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Niepoprawny email lub haslo.'
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Logowanie Google zostalo przerwane przed zakonczeniem.'
  }

  if (code === 'auth/unauthorized-domain') {
    return 'Ta domena nie jest dodana w Firebase jako dozwolona dla logowania Google.'
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Logowanie Google nie jest wlaczone w Firebase Authentication.'
  }

  if (code === 'auth/popup-blocked') {
    return 'Przegladarka zablokowala okno logowania Google. Zezwol na popupy i sprobuj ponownie.'
  }

  if (code === 'auth/too-many-requests') {
    return 'Za duzo prob. Odczekaj chwile i sprobuj ponownie.'
  }

  if (code === 'auth/requires-recent-login') {
    return 'Ta operacja wymaga ponownego zalogowania. Zaloguj sie jeszcze raz i sprobuj ponownie.'
  }

  return `Nieznany blad Firebase: ${code}${message ? ` (${message})` : ''}`
}

function mapDatabaseError(error: unknown) {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return 'Sprawdz reguly Realtime Database i czy baza jest wlaczona.'
  }

  const code = String(error.code)

  if (code === 'permission-denied') {
    return 'Realtime Database odrzucila dostep. Najczesciej oznacza to brak opublikowanych rules albo zle reguly.'
  }

  if (code === 'failed-precondition') {
    return 'Realtime Database nie jest jeszcze poprawnie skonfigurowana w projekcie.'
  }

  if (code === 'unavailable') {
    return 'Realtime Database jest chwilowo niedostepna albo polaczenie sie urwalo.'
  }

  return `Kod Realtime Database: ${code}`
}

export default App
