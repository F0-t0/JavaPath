import { useDeferredValue, useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { java } from '@codemirror/lang-java'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleCheckBig,
  Lightbulb,
  Maximize2,
  PanelBottom,
  Play,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { type LessonData, type PracticeTask } from './courseData'
import { executeJava } from './javaRunnerClient'

type LessonPanel = 'lesson' | 'code'
type OutputTone = 'neutral' | 'success' | 'error'
type RunMode = 'run' | 'check'

type TaskEvaluation = {
  success: boolean
  message: string
  output?: string
}

type LessonSessionProps = {
  theme: 'light' | 'dark'
  lesson: LessonData
  lessonComplete: boolean
  onAwardXp: (xp: number) => void
  onLessonCompleted: (xpReward: number) => void
  onBackToDashboard: () => void
  onOpenQuiz: () => void
  onShowToast: (message: string, tone?: 'neutral' | 'success' | 'error') => void
}

export function LessonSession({
  theme,
  lesson,
  lessonComplete,
  onAwardXp,
  onLessonCompleted,
  onBackToDashboard,
  onOpenQuiz,
  onShowToast,
}: LessonSessionProps) {
  const [lessonPanel, setLessonPanel] = useState<LessonPanel>('lesson')
  const [stepIndex, setStepIndex] = useState(0)
  const [practiceTaskIndex, setPracticeTaskIndex] = useState(0)
  const [practiceCode, setPracticeCode] = useState(lesson.practice.tasks[0].starterCode)
  const [practiceOutput, setPracticeOutput] = useState(
    'W tej sekcji zobaczysz output swojego programu lub wynik sprawdzenia zadania.',
  )
  const [practiceOutputTone, setPracticeOutputTone] = useState<OutputTone>('neutral')
  const [practiceRunMode, setPracticeRunMode] = useState<RunMode | null>(null)
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([])
  const [hintUsage, setHintUsage] = useState<Record<string, number>>({})
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0)
  const [exampleOutput, setExampleOutput] = useState(
    'Kliknij "Uruchom przyklad", aby zobaczyc wynik w terminalu.',
  )
  const [exampleRunning, setExampleRunning] = useState(false)
  const [editorFullscreen, setEditorFullscreen] = useState(false)
  const exampleTimerRef = useRef<number | null>(null)
  const deferredPracticeCode = useDeferredValue(practiceCode)

  const stepTitles = lesson.steps
  const currentTask = lesson.practice.tasks[practiceTaskIndex]
  const selectedExample = lesson.show.examples[selectedExampleIndex]
  const currentHintLevel = hintUsage[currentTask.id] ?? 0
  const currentHints = currentTask.hints.slice(0, currentHintLevel)
  const currentTaskReward = getTaskReward(currentTask, currentHintLevel)
  const liveTaskCheck = evaluatePracticeDraft(currentTask, deferredPracticeCode)
  const editorTheme = theme === 'light' ? javaPathLightTheme : oneDark

  const clearExampleTimer = () => {
    if (exampleTimerRef.current !== null) {
      window.clearInterval(exampleTimerRef.current)
      exampleTimerRef.current = null
    }
  }

  const resetPracticeTask = (taskIndex: number) => {
    const task = lesson.practice.tasks[taskIndex]
    setPracticeTaskIndex(taskIndex)
    setPracticeCode(task.starterCode)
    setPracticeOutput('Kliknij "Uruchom" albo "Sprawdz", zeby zobaczyc wynik dla aktualnego zadania.')
    setPracticeOutputTone('neutral')
    setPracticeRunMode(null)
  }

  const revealHint = () => {
    if (currentHintLevel >= currentTask.hints.length) {
      onShowToast('Wszystkie podpowiedzi do tego zadania sa juz odkryte.')
      return
    }

    setHintUsage((current) => ({
      ...current,
      [currentTask.id]: (current[currentTask.id] ?? 0) + 1,
    }))
  }

  const runPractice = async (mode: RunMode) => {
    setPracticeRunMode(mode)
    setPracticeOutput(mode === 'run' ? 'Uruchamianie programu...' : 'Sprawdzanie rozwiazania...')
    setPracticeOutputTone('neutral')

    const draftResult = evaluatePracticeDraft(currentTask, practiceCode)

    if (!draftResult.success) {
      setPracticeRunMode(null)
      setPracticeOutput(draftResult.message)
      setPracticeOutputTone('error')
      return
    }

    const execution = await executeJava(practiceCode, currentTask.stdin ?? '')
    setPracticeRunMode(null)

    if (!execution.ok) {
      setPracticeOutput(formatExecutionError(execution))
      setPracticeOutputTone('error')
      return
    }

    const runtimeOutput = normalizeRuntimeOutput(execution.stdout)

    if (mode === 'run') {
      setPracticeOutput(runtimeOutput || '(brak outputu)')
      setPracticeOutputTone('success')
      return
    }

    const result = evaluatePracticeTask(currentTask, practiceCode, runtimeOutput)

    if (result.success) {
      setPracticeOutput(result.output ?? currentTask.expectedOutput)
      setPracticeOutputTone('success')

      if (!completedTaskIds.includes(currentTask.id)) {
        setCompletedTaskIds((current) => [...current, currentTask.id])
        if (!lessonComplete) {
          onAwardXp(currentTaskReward)
        }
        onShowToast(`Zadanie zaliczone. Otrzymujesz ${currentTaskReward} XP.`, 'success')
      }

      return
    }

    setPracticeOutput(result.message)
    setPracticeOutputTone('error')
  }

  const runExample = async () => {
    clearExampleTimer()
    setExampleRunning(true)
    setExampleOutput('Kompilowanie przykladu...')
    const execution = await executeJava(selectedExample.code, selectedExample.stdin ?? '')

    if (!execution.ok) {
      setExampleRunning(false)
      setExampleOutput(formatExecutionError(execution))
      return
    }

    setExampleOutput('')
    const fullOutput = normalizeRuntimeOutput(execution.stdout) || '(brak outputu)'
    let visibleLength = 0

    exampleTimerRef.current = window.setInterval(() => {
      visibleLength += 1
      setExampleOutput(fullOutput.slice(0, visibleLength))

      if (visibleLength >= fullOutput.length) {
        clearExampleTimer()
        setExampleRunning(false)
      }
    }, 18)
  }

  const selectExample = (index: number) => {
    clearExampleTimer()
    setSelectedExampleIndex(index)
    setExampleRunning(false)
    setExampleOutput('Kliknij "Uruchom przyklad", aby zobaczyc wynik w terminalu.')
  }

  const openNextTask = () => {
    if (!completedTaskIds.includes(currentTask.id)) {
      onShowToast('Najpierw ukoncz aktualne zadanie.')
      return
    }

    if (practiceTaskIndex === lesson.practice.tasks.length - 1) {
      setStepIndex(4)

      if (!lessonComplete) {
        onLessonCompleted(lesson.wrapUp.xpReward)
      }

      onShowToast(`Lekcja zakonczona. Otrzymujesz bonus ${lesson.wrapUp.xpReward} XP.`, 'success')
      return
    }

    resetPracticeTask(practiceTaskIndex + 1)
  }

  const openPreviousTask = () => {
    if (practiceTaskIndex === 0) {
      setStepIndex(2)
      return
    }

    resetPracticeTask(practiceTaskIndex - 1)
  }

  const handleContinueStep = () => {
    if (stepIndex === 0) {
      setStepIndex(1)
      return
    }

    if (stepIndex === 1) {
      setStepIndex(2)
      setLessonPanel('code')
      return
    }

    if (stepIndex === 2) {
      setStepIndex(3)
      setLessonPanel('code')
      return
    }

    if (stepIndex === 3) {
      openNextTask()
      return
    }

    onBackToDashboard()
  }

  const handlePreviousStep = () => {
    if (stepIndex === 0) {
      onBackToDashboard()
      return
    }

    if (stepIndex === 3 && practiceTaskIndex > 0) {
      openPreviousTask()
      return
    }

    setStepIndex((current) => Math.max(0, current - 1))
  }

  const resetCurrentTask = () => {
    if (stepIndex === 3) {
      resetPracticeTask(practiceTaskIndex)
      return
    }

    clearExampleTimer()
    setExampleRunning(false)
    setExampleOutput('Kliknij "Uruchom przyklad", aby zobaczyc wynik w terminalu.')
  }

  useEffect(() => {
    return () => {
      clearExampleTimer()
    }
  }, [])

  return (
    <section className="lesson-view">
      <div className="mobile-pills">
        <button
          type="button"
          className={`mobile-pill ${lessonPanel === 'lesson' ? 'active' : ''}`}
          onClick={() => setLessonPanel('lesson')}
        >
          Lekcja
        </button>
        <button
          type="button"
          className={`mobile-pill ${lessonPanel === 'code' ? 'active' : ''}`}
          onClick={() => setLessonPanel('code')}
        >
          Workspace
        </button>
      </div>

      <section className={`lesson-column content ${lessonPanel === 'code' ? 'mobile-hidden' : ''}`}>
        <div className="lesson-header">
          <div>
            <p className="eyebrow">Sesja {lesson.duration}</p>
            <h2>{lesson.title}</h2>
            <p>
              Lekcja ma piec krokow. Nie przewijasz tutoriala. Idziesz przez kompletna sesje i konczysz z czyms, co
              sam uruchomiles.
            </p>
          </div>
          <div className="lesson-header-actions">
            <button type="button" className="secondary-button" onClick={onBackToDashboard}>
              Dashboard
            </button>
            <button type="button" className="secondary-button" onClick={onOpenQuiz}>
              <BookOpen size={16} />
              Quiz po wrap-upie
            </button>
          </div>
        </div>

        <div className="lesson-stepper" aria-label="Postep lekcji">
          {stepTitles.map((step, index) => {
            const stepState = index < stepIndex ? 'done' : index === stepIndex ? 'current' : 'locked'

            return (
              <div key={step} className={`step-pill ${stepState}`}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            )
          })}
        </div>

        <div className="content-stack">
          {stepIndex === 0 && (
            <>
              <article className="hook-card">
                <p className="eyebrow">Krok 1 - Hook</p>
                <h3>{lesson.hook.prompt}</h3>
                <p>{lesson.hook.detail}</p>
              </article>

              <div className="lesson-actions">
                <button type="button" className="secondary-button" onClick={handlePreviousStep}>
                  <ChevronRight className="rotate-180" size={16} />
                  Wroc do mapy
                </button>
                <button type="button" className="primary-button" onClick={handleContinueStep}>
                  {lesson.hook.cta}
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {stepIndex === 1 && (
            <>
              <article className="lesson-block explain-focus">
                <p className="eyebrow">Krok 2 - Explain</p>
                <h3 className="core-statement">{lesson.explain.coreStatement}</h3>
                {lesson.explain.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>

              <article className="lesson-block analogy-card">
                <p className="eyebrow">Analogia</p>
                <h3>{lesson.explain.analogy.title}</h3>
                <p>{lesson.explain.analogy.body}</p>
              </article>

              {lesson.explain.warning && (
                <article className="lesson-block warning-card">
                  <p className="eyebrow">Uwaga</p>
                  <p>{lesson.explain.warning}</p>
                </article>
              )}

              <div className="lesson-actions">
                <button type="button" className="secondary-button" onClick={handlePreviousStep}>
                  <ChevronRight className="rotate-180" size={16} />
                  Wstecz
                </button>
                <button type="button" className="primary-button" onClick={handleContinueStep}>
                  Rozumiem, przejdz do przykladow
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {stepIndex === 2 && (
            <>
              <article className="lesson-block">
                <p className="eyebrow">Krok 3 - Show</p>
                <h3>Zobacz dzialajacy kod</h3>
                <p>{lesson.show.intro}</p>
              </article>

              <div className="example-list">
                {lesson.show.examples.map((example, index) => (
                  <button
                    key={example.id}
                    type="button"
                    className={`example-card ${selectedExampleIndex === index ? 'active' : ''}`}
                    onClick={() => selectExample(index)}
                  >
                    <span className="example-label">{example.label}</span>
                    <div className="example-copy">
                      <strong>{example.title}</strong>
                      <p>{example.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <article className="lesson-block">
                <p className="eyebrow">Dlaczego to dziala</p>
                <p>{selectedExample.whyItWorks}</p>
              </article>

              <div className="lesson-actions">
                <button type="button" className="secondary-button" onClick={handlePreviousStep}>
                  <ChevronRight className="rotate-180" size={16} />
                  Wstecz
                </button>
                <button type="button" className="primary-button" onClick={handleContinueStep}>
                  Przejdz do zadan
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {stepIndex === 3 && (
            <article className="task-panel">
              <p className="eyebrow">Krok 4 - Practice</p>
              <h3>{currentTask.title}</h3>
              <p>{currentTask.scenario}</p>
              <ul className="requirement-list">
                {currentTask.instructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ul>

              <div className="task-progress-strip">
                {lesson.practice.tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={`task-dot ${
                      completedTaskIds.includes(task.id) ? 'done' : index === practiceTaskIndex ? 'current' : 'locked'
                    }`}
                  >
                    <span>{index + 1}</span>
                    <strong>{task.kind === 'fill_blank' ? 'Fill' : task.kind === 'scratch' ? 'Write' : 'Debug'}</strong>
                  </div>
                ))}
              </div>

              <div className="task-meta-line">
                <span className="tag success">Nagroda: {currentTaskReward} XP</span>
                <span className="tag warning">
                  Podpowiedzi: {currentHintLevel} / {currentTask.hints.length}
                </span>
              </div>

              {currentHints.length > 0 && (
                <div className="hint-stack">
                  {currentHints.map((hint, index) => (
                    <div key={hint} className="hint-card">
                      <span>Hint {index + 1}</span>
                      <p>{hint}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="lesson-actions">
                <button type="button" className="secondary-button" onClick={openPreviousTask}>
                  <ChevronRight className="rotate-180" size={16} />
                  {practiceTaskIndex === 0 ? 'Wroc do przykladow' : 'Poprzednie zadanie'}
                </button>
                <button type="button" className="primary-button" onClick={handleContinueStep}>
                  {practiceTaskIndex === lesson.practice.tasks.length - 1 ? 'Przejdz do podsumowania' : 'Nastepne zadanie'}
                  <ChevronRight size={16} />
                </button>
              </div>
            </article>
          )}

          {stepIndex === 4 && (
            <>
              <article className="wrap-card">
                <p className="eyebrow">Krok 5 - Wrap-up</p>
                <h3>Co umiesz teraz</h3>
                <ul className="wrap-list">
                  {lesson.wrapUp.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </article>

              <article className="lesson-block">
                <p className="eyebrow">Co dalej</p>
                <h3>{lesson.wrapUp.nextLesson}</h3>
                <p>{lesson.wrapUp.nextLessonReason}</p>
              </article>

              <article className="success-card">
                <CircleCheckBig size={32} />
                <div>
                  <strong>+{lesson.wrapUp.xpReward} XP</strong>
                  <p>Kolejny modul zostal odblokowany na mapie kursu.</p>
                </div>
              </article>

              <div className="lesson-actions">
                <button type="button" className="secondary-button" onClick={onBackToDashboard}>
                  Wroc do mapy
                </button>
                <button type="button" className="primary-button" onClick={onBackToDashboard}>
                  Nastepna lekcja
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="splitter" aria-hidden="true" />

      <section className={`lesson-column editor ${lessonPanel === 'lesson' ? 'mobile-hidden' : ''}`}>
        <div
          className={`editor-panel ${editorFullscreen ? 'fullscreen' : ''} ${
            stepIndex === 2 ? 'show-step' : stepIndex === 3 ? 'practice-step' : ''
          }`}
        >
          <div className="editor-toolbar">
            <div className="editor-file">
              <span className="dot" />
              <strong>
                {stepIndex === 2
                  ? `${selectedExample.label}.java`
                  : stepIndex === 3
                    ? `Practice-${practiceTaskIndex + 1}.java`
                    : 'Lesson Workspace'}
              </strong>
            </div>
            <div className="editor-toolbar-actions">
              {stepIndex === 3 && (
                <span className={`live-indicator ${liveTaskCheck.success ? 'success' : 'neutral'}`}>
                  {liveTaskCheck.success ? 'Wstepna analiza OK' : 'Szkic wymaga poprawki'}
                </span>
              )}
              <button type="button" className="icon-button" aria-label="Reset" onClick={resetCurrentTask}>
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Pelny ekran"
                onClick={() => setEditorFullscreen((current) => !current)}
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          {stepIndex <= 1 && (
            <div className="workspace-brief">
              <div className="workspace-card">
                <p className="eyebrow">Plan tej sesji</p>
                <h3>Jedna lekcja, jeden konkretny efekt</h3>
                <ul className="wrap-list">
                  <li>Najpierw lapiesz sens konceptu w jednym pytaniu.</li>
                  <li>Potem widzisz dzialajacy kod przed pisaniem wlasnego.</li>
                  <li>Na koncu przechodzisz przez trzy zadania o rosnacej trudnosci.</li>
                </ul>
              </div>

              <div className="workspace-card">
                <p className="eyebrow">Dlaczego to dziala</p>
                <h3>Aktywna nauka zamiast biernego czytania</h3>
                <p>
                  Kazdy krok prowadzi do kolejnego. Nie przewijasz teorii, tylko przygotowujesz sie do pracy w edytorze i
                  finalnie wykonujesz zadania samodzielnie.
                </p>
              </div>
            </div>
          )}

          {stepIndex === 2 && (
            <>
              <div className="example-tabs">
                {lesson.show.examples.map((example, index) => (
                  <button
                    key={example.id}
                    type="button"
                    className={`example-tab ${selectedExampleIndex === index ? 'active' : ''}`}
                    onClick={() => selectExample(index)}
                  >
                    {example.label}
                  </button>
                ))}
              </div>

              <div className="editor-frame readonly">
                <CodeMirror
                  value={selectedExample.code}
                  height="100%"
                  editable={false}
                  extensions={[java()]}
                  theme={editorTheme}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: false,
                    highlightActiveLine: false,
                    highlightActiveLineGutter: false,
                  }}
                />
              </div>

              <div className="output-panel">
                <div className="output-topbar">
                  <div className="output-title">
                    <PanelBottom size={16} />
                    <strong>
                      Przyklad {selectedExampleIndex + 1} z {lesson.show.examples.length}
                    </strong>
                  </div>
                  <div className="output-actions">
                    <button
                      type="button"
                      className={`action-button run ${exampleRunning ? 'loading' : ''}`}
                      onClick={runExample}
                      disabled={exampleRunning}
                    >
                      <Play size={15} />
                      Uruchom przyklad
                    </button>
                  </div>
                </div>

                <div className="output-console neutral">
                  <pre>{exampleOutput}</pre>
                </div>
              </div>
            </>
          )}

          {stepIndex === 3 && (
            <>
              <div className="editor-frame">
                <CodeMirror
                  value={practiceCode}
                  height="100%"
                  extensions={[java()]}
                  theme={editorTheme}
                  onChange={(value) => setPracticeCode(value)}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: false,
                    highlightActiveLine: true,
                    highlightActiveLineGutter: true,
                  }}
                />
              </div>

              <div className="editor-status">
                <span>Wstepna analiza: {liveTaskCheck.message}</span>
                <span>{deferredPracticeCode.split('\n').length} linii</span>
              </div>

              <div className="output-panel">
                <div className="output-topbar">
                  <div className="output-title">
                    <PanelBottom size={16} />
                    <strong>Output i walidacja</strong>
                  </div>
                  <div className="output-actions">
                    <button
                      type="button"
                      className={`action-button run ${practiceRunMode === 'run' ? 'loading' : ''}`}
                      onClick={() => runPractice('run')}
                      disabled={practiceRunMode !== null}
                    >
                      <Play size={15} />
                      Uruchom
                    </button>
                    <button
                      type="button"
                      className={`action-button check ${practiceRunMode === 'check' ? 'loading' : ''}`}
                      onClick={() => runPractice('check')}
                      disabled={practiceRunMode !== null}
                    >
                      <CheckCircle2 size={15} />
                      Sprawdz
                    </button>
                    <button type="button" className="action-button ghost" onClick={revealHint}>
                      <Lightbulb size={15} />
                      Podpowiedz
                    </button>
                  </div>
                </div>

                <div className={`output-console ${practiceOutputTone}`}>
                  <pre>{practiceOutput}</pre>
                </div>

                <div className="editor-footer">
                  <div className="status-row">
                    <span className={`status-badge ${completedTaskIds.includes(currentTask.id) ? 'success' : 'neutral'}`}>
                      {completedTaskIds.includes(currentTask.id) ? 'Zadanie ukonczone' : 'Zadanie w toku'}
                    </span>
                    <span>Hinty odejmuja 10% XP za klikniecie</span>
                  </div>

                  {completedTaskIds.includes(currentTask.id) && (
                    <button type="button" className="secondary-button accent" onClick={openNextTask}>
                      <Sparkles size={16} />
                      {practiceTaskIndex === lesson.practice.tasks.length - 1 ? 'Otworz wrap-up' : 'Przejdz dalej'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {stepIndex === 4 && (
            <div className="workspace-brief">
              <div className="workspace-card success">
                <p className="eyebrow">Lekcja zakonczona</p>
                <h3>Pierwsza sesja za toba</h3>
                <p>
                  Masz zakonczony pelny flow: hook, explain, dwa przyklady, trzy zadania praktyczne i wrap-up z
                  odblokowaniem kolejnego modulu.
                </p>
                <span className="tag success">+{lesson.wrapUp.xpReward} XP</span>
              </div>

              <div className="workspace-card">
                <p className="eyebrow">Nastepny krok</p>
                <h3>{lesson.wrapUp.nextLesson}</h3>
                <p>{lesson.wrapUp.nextLessonReason}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </section>
  )
}

const javaPathLightTheme = [
  EditorView.theme({
    '&': {
      color: '#1a1a2e',
      backgroundColor: '#ffffff',
    },
    '.cm-content': {
      caretColor: '#f89820',
    },
    '.cm-scroller': {
      fontFamily: '"Fira Code", monospace',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#f89820',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(248, 152, 32, 0.18)',
    },
    '.cm-gutters': {
      backgroundColor: '#f8f8fc',
      color: '#9999aa',
      border: 'none',
      borderRight: '1px solid #e2e2ea',
    },
    '.cm-activeLine': {
      backgroundColor: '#fff8f0',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#fff3e0',
      color: '#1a1a2e',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 10px 0 6px',
    },
  }),
  syntaxHighlighting(
    HighlightStyle.define([
      {
        tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.definitionKeyword],
        color: '#d46a00',
        fontWeight: '600',
      },
      {
        tag: [tags.typeName, tags.className],
        color: '#6f42c1',
      },
      {
        tag: [tags.string],
        color: '#0a7f66',
      },
      {
        tag: [tags.number, tags.bool, tags.null],
        color: '#0b6bd3',
      },
      {
        tag: [tags.comment, tags.lineComment, tags.blockComment],
        color: '#8f92aa',
        fontStyle: 'italic',
      },
      {
        tag: [tags.variableName, tags.propertyName],
        color: '#1a1a2e',
      },
      {
        tag: [tags.punctuation, tags.separator, tags.bracket],
        color: '#5b627c',
      },
    ]),
  ),
]

function getTaskReward(task: PracticeTask, hintCount: number) {
  const multiplier = Math.max(0, 1 - hintCount * 0.1)
  return Math.round(task.xp * multiplier)
}

function normalizeRuntimeOutput(value: string) {
  return value.replace(/\r/g, '').trimEnd()
}

function stripCodeComments(value: string) {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function normalizeCodeForIncludes(value: string, stripStrings = false) {
  const withoutComments = stripCodeComments(value)
  const withoutStrings = stripStrings
    ? withoutComments
        .replace(/"(?:\\.|[^"\\])*"/g, '""')
        .replace(/'(?:\\.|[^'\\])*'/g, "''")
    : withoutComments

  return withoutStrings.replace(/\s+/g, '')
}

function codeIncludesSnippet(source: string, snippet: string, stripStrings = false) {
  return normalizeCodeForIncludes(source, stripStrings).includes(normalizeCodeForIncludes(snippet, stripStrings))
}

function normalizeLooseText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitOutputLines(value: string) {
  const normalized = normalizeRuntimeOutput(value)
  return normalized ? normalized.split('\n').map((line) => line.trimEnd()) : []
}

function countPrintlnCalls(source: string) {
  return [...source.matchAll(/System\.out\.println\s*\(/g)].length
}

function formatExecutionError(result: {
  stage: 'compile' | 'run'
  stderr: string
  stdout: string
}) {
  const details = normalizeRuntimeOutput(result.stderr || result.stdout) || 'Program nie zakonczyl sie poprawnie.'

  return `${result.stage === 'compile' ? 'Blad kompilacji' : 'Blad uruchomienia'}:\n${details}`
}

function formatOutputMismatch(expectedLines: string[], actualLines: string[]) {
  const expected = expectedLines.join('\n')
  const actual = actualLines.length > 0 ? actualLines.join('\n') : '(brak outputu)'

  return `Output jest niepoprawny.\n\nOczekiwano:\n${expected}\n\nOtrzymano:\n${actual}`
}

function evaluatePracticeDraft(task: PracticeTask, source: string) {
  const normalized = source.replace(/\r/g, '')
  const hasMain = /public\s+class\s+Main/.test(normalized) && /public\s+static\s+void\s+main/.test(normalized)

  if (!hasMain) {
    return {
      success: false,
      message: 'Zostaw klase Main i metode main jako punkt startu programu.',
    }
  }

  const validation = task.validation

  if (validation?.placeholdersDisallowed && /_____/g.test(normalized)) {
    return {
      success: false,
      message: 'Najpierw uzupelnij wszystkie puste miejsca.',
    }
  }

  if (validation?.minPrintlnCount && countPrintlnCalls(normalized) < validation.minPrintlnCount) {
    return {
      success: false,
      message: 'Dodaj jeszcze brakujace wywolania System.out.println.',
    }
  }

  if (validation?.forbiddenIncludes?.some((snippet) => codeIncludesSnippet(normalized, snippet, true))) {
    return {
      success: false,
      message: 'Masz w kodzie element, ktory trzeba jeszcze poprawic.',
    }
  }

  return {
    success: true,
    message: 'Finalny wynik sprawdzisz po kompilacji i uruchomieniu programu.',
  }
}

function evaluatePracticeTask(task: PracticeTask, source: string, runtimeOutput: string): TaskEvaluation {
  const normalized = source.replace(/\r/g, '')
  const hasMain = /public\s+class\s+Main/.test(normalized) && /public\s+static\s+void\s+main/.test(normalized)

  if (!hasMain) {
    return {
      success: false,
      message: 'Zostaw klase Main i metode main jako punkt startu programu.',
    }
  }

  const validation = task.validation

  if (validation?.placeholdersDisallowed && /_____/g.test(normalized)) {
    return {
      success: false,
      message: 'Najpierw uzupelnij wszystkie puste miejsca.',
    }
  }

  if (validation?.minPrintlnCount && countPrintlnCalls(normalized) < validation.minPrintlnCount) {
    return {
      success: false,
      message: validation.failureMessage,
    }
  }

  if (validation?.forbiddenIncludes?.some((snippet) => codeIncludesSnippet(normalized, snippet, true))) {
    return {
      success: false,
      message: validation.failureMessage,
    }
  }

  if (validation?.requiredIncludes?.some((snippet) => !codeIncludesSnippet(normalized, snippet))) {
    return {
      success: false,
      message: validation.failureMessage,
    }
  }

  if (
    validation?.requiredPatterns?.some((pattern) => {
      const expression = new RegExp(pattern, 'm')
      return !expression.test(normalized)
    })
  ) {
    return {
      success: false,
      message: validation.failureMessage,
    }
  }

  const outputLines = splitOutputLines(runtimeOutput)

  if (validation?.exactOutputLines) {
    const exactMatch =
      validation.exactOutputLines.length === outputLines.length &&
      validation.exactOutputLines.every((line, index) => outputLines[index] === line)

    if (!exactMatch) {
      return {
        success: false,
        message: formatOutputMismatch(validation.exactOutputLines, outputLines),
      }
    }
  }

  if (validation?.includesOutputPhrases) {
    const missingPhrases = validation.includesOutputPhrases.filter(
      (phrase) => !normalizeLooseText(runtimeOutput).includes(normalizeLooseText(phrase)),
    )

    if (missingPhrases.length > 0) {
      return {
        success: false,
        message: `Wynik programu nie zawiera jeszcze wszystkich wymaganych elementow.\n\nBrakuje:\n- ${missingPhrases.join(
          '\n- ',
        )}\n\nOtrzymano:\n${runtimeOutput || '(brak outputu)'}`,
      }
    }
  }

  if (!validation?.exactOutputLines && !validation?.includesOutputPhrases && task.expectedOutput.trim()) {
    const expectedLines = splitOutputLines(task.expectedOutput)
    const exactMatch =
      expectedLines.length === outputLines.length &&
      expectedLines.every((line, index) => outputLines[index] === line)

    if (!exactMatch) {
      return {
        success: false,
        message: formatOutputMismatch(expectedLines, outputLines),
      }
    }
  }

  return {
    success: true,
    message: task.successMessage,
    output: runtimeOutput || '(brak outputu)',
  }
}
