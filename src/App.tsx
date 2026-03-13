import { startTransition, useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
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
import { courseTracks, dashboardStats, lesson, quizQuestions, type CourseTrack, type ModuleStatus } from './courseData'
import { LessonSession } from './LessonSession'

type Screen = 'dashboard' | 'lesson' | 'quiz'
type ToastTone = 'neutral' | 'success' | 'error'

type ToastState = {
  message: string
  tone: ToastTone
} | null

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

function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lessonComplete, setLessonComplete] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [xp, setXp] = useState(dashboardStats.xp)
  const [streak, setStreak] = useState(dashboardStats.streak)
  const [streakPulse, setStreakPulse] = useState(false)
  const [quizIndex, setQuizIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [quizScore, setQuizScore] = useState(0)
  const [quizFinished, setQuizFinished] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const visibleTracks = buildVisibleTracks(lessonComplete)
  const allModules = visibleTracks.flatMap((track) => track.modules)
  const totalModules = allModules.length
  const completedModules = allModules.filter((module) => module.status === 'completed').length
  const progressPercentage = Math.round((completedModules / totalModules) * 100)
  const reviewModules = allModules.filter((module) => module.status === 'review')
  const profileLevel = Math.max(1, Math.floor(xp / 100) + 1)

  const currentQuestion = quizQuestions[quizIndex]
  const activeBreadcrumb =
    screen === 'dashboard'
      ? ['Dashboard', 'Twoj postep']
      : screen === 'quiz'
        ? [...lesson.breadcrumb, 'Quiz']
        : lesson.breadcrumb

  const showToast = (message: string, tone: ToastTone = 'neutral') => {
    setToast({ message, tone })
  }

  const navigate = (nextScreen: Screen) => {
    setSidebarOpen(false)
    setSettingsOpen(false)
    startTransition(() => setScreen(nextScreen))
  }

  useEffect(() => {
    if (!showConfetti && !streakPulse) {
      return
    }

    const confettiTimer = window.setTimeout(() => setShowConfetti(false), 2000)
    const streakTimer = window.setTimeout(() => setStreakPulse(false), 1000)

    return () => {
      window.clearTimeout(confettiTimer)
      window.clearTimeout(streakTimer)
    }
  }, [showConfetti, streakPulse])

  useEffect(() => {
    if (!toast) {
      return
    }

    const toastTimer = window.setTimeout(() => setToast(null), 2600)

    return () => {
      window.clearTimeout(toastTimer)
    }
  }, [toast])

  const resetAppState = () => {
    setScreen('dashboard')
    setSidebarOpen(false)
    setLessonComplete(false)
    setShowConfetti(false)
    setXp(dashboardStats.xp)
    setStreak(dashboardStats.streak)
    setStreakPulse(false)
    setQuizIndex(0)
    setSelectedAnswer(null)
    setQuizScore(0)
    setQuizFinished(false)
    setSettingsOpen(false)
  }

  const handleModuleOpen = (status: ModuleStatus, title: string) => {
    if (status === 'locked') {
      showToast(`Modul "${title}" jest jeszcze zablokowany. Najpierw ukoncz poprzedni etap.`, 'neutral')
      return
    }

    navigate('lesson')
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
    navigate('quiz')
  }

  const openSettings = () => {
    setSettingsOpen(true)
  }

  const handleLogout = () => {
    resetAppState()
    showToast('Postep zostal wyzerowany do startu.', 'success')
  }

  const openFirstLesson = () => {
    navigate('lesson')
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
    setStreak((current) => Math.max(1, current + 1))
    setXp((current) => current + xpReward)
  }

  return (
    <div className="app-shell">
      {showConfetti && <ConfettiBurst />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-copy">
            <p className="eyebrow">Java learning path</p>
            <h1>JavaPath</h1>
          </div>
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
          <div className="avatar-ring">JP</div>
          <div className="profile-copy">
            <strong>{dashboardStats.userName}</strong>
            <p>Poziom {profileLevel}</p>
          </div>
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
          <button type="button" className="ghost-link" onClick={openSettings}>
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button type="button" className="ghost-link" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <button type="button" className="sidebar-backdrop" aria-label="Zamknij menu" onClick={() => setSidebarOpen(false)} />}

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

        <main className={`main-panel ${screen === 'quiz' ? 'quiz-open' : ''}`}>
          {screen === 'dashboard' && (
            <section className="dashboard">
              <section className="hero-strip">
                <div>
                  <p className="eyebrow">Dark IDE meets learning game</p>
                  <h2>Zacznij nauke Javy od zera. Twoja seria: {streak} dni.</h2>
                  <p>
                    Konto startuje bez postepu. Otworz pierwsza lekcje, uruchom kod w przegladarce i odblokuj dalsze
                    elementy platformy.
                  </p>
                </div>
                <button type="button" className="primary-button" onClick={openFirstLesson}>
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
                      <strong>{completedModules} z {totalModules} modulow</strong>
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
                      <span className={`tag ${lessonComplete ? 'success' : 'warning'}`}>{lessonComplete ? '40 XP' : 'Zablokowane'}</span>
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

          {screen === 'lesson' && (
            <LessonSession
              lessonComplete={lessonComplete}
              onAwardXp={(xpValue) => setXp((current) => current + xpValue)}
              onLessonCompleted={handleLessonCompleted}
              onBackToDashboard={() => navigate('dashboard')}
              onOpenQuiz={openQuiz}
              onShowToast={showToast}
            />
          )}

          {screen === 'quiz' && (
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
                    <button type="button" className="secondary-button" onClick={() => navigate('lesson')}>
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
                  <button type="button" className="primary-button" onClick={() => navigate('dashboard')}>
                    Wroc na dashboard
                  </button>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {settingsOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSettingsOpen(false)}>
          <section
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-header">
              <div>
                <p className="eyebrow">Ustawienia</p>
                <h2 id="settings-title">Preferencje nauki</h2>
              </div>
              <button type="button" className="icon-button" aria-label="Zamknij ustawienia" onClick={() => setSettingsOpen(false)}>
                <XCircle size={18} />
              </button>
            </div>

            <div className="settings-grid">
              <article className="settings-card">
                <strong>Postep lokalny</strong>
                <p>Masz zapisany start kursu od zera. Postep rosl bedzie wraz z kolejnymi ukonczonymi modulami.</p>
              </article>
              <article className="settings-card">
                <strong>Motyw</strong>
                <p>Domyslny motyw to ciemny interfejs inspirowany IDE. Jasny motyw mozna dodac jako kolejny wariant.</p>
              </article>
              <article className="settings-card">
                <strong>Tempo nauki</strong>
                <p>Najlepszy efekt daje praca w krotkich sesjach: 20-30 minut i jedno zadanie praktyczne na raz.</p>
              </article>
            </div>

            <div className="settings-actions">
              <button type="button" className="secondary-button" onClick={handleLogout}>
                Wyzeruj postep
              </button>
              <button type="button" className="primary-button" onClick={() => setSettingsOpen(false)}>
                Zamknij
              </button>
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div className={`app-toast ${toast.tone}`} role="status" aria-live="polite">
          {toast.message}
        </div>
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

export default App
