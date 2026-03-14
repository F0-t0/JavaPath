import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { java } from '@codemirror/lang-java'
import { oneDark } from '@codemirror/theme-one-dark'
import {
  ArrowDown,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  Compass,
  LaptopMinimal,
  LockOpen,
  Map,
  MenuSquare,
  Puzzle,
  Rocket,
  Trophy,
} from 'lucide-react'

type LandingPageProps = {
  onLogin: () => void
  onStartFree: () => void
}

type DemoTone = 'neutral' | 'success' | 'error'

type CurriculumLevel = {
  id: string
  level: string
  title: string
  description: string
  duration: string
  lessons: { title: string; type: 'lesson' | 'drill' | 'project' }[]
}

type FaqItem = {
  question: string
  answer: string
}

const landingCurriculum: CurriculumLevel[] = [
  {
    id: 'fundamenty',
    level: '01',
    title: 'Fundamenty',
    description: 'Pierwsze programy, zmienne, typy danych i wejscie od uzytkownika.',
    duration: '10 lekcji',
    lessons: [
      { title: 'Twoj pierwszy program - Hello, World! i jak dziala Java', type: 'lesson' },
      { title: 'Zmienne - czym sa i jak je tworzyc', type: 'lesson' },
      { title: 'Typy danych - int, double, String, boolean', type: 'lesson' },
      { title: 'Operatory arytmetyczne - +, -, *, /, %', type: 'lesson' },
      { title: 'Operatory porownania i logiczne', type: 'lesson' },
      { title: 'Wejscie od uzytkownika - klasa Scanner', type: 'lesson' },
      { title: 'Konwersja typow - casting i parsowanie', type: 'lesson' },
      { title: 'Stale - slowo kluczowe final', type: 'lesson' },
      { title: 'Cwiczenia - zmienne i typy danych', type: 'drill' },
      { title: 'Mini-project - Kalkulator BMI', type: 'project' },
    ],
  },
  {
    id: 'logika',
    level: '02',
    title: 'Logika i sterowanie',
    description: 'Warunki, petle i podejmowanie decyzji w kodzie.',
    duration: '9 lekcji',
    lessons: [
      { title: 'Instrukcja if/else - podejmowanie decyzji', type: 'lesson' },
      { title: 'Zagniezdzone if i else if - wiele warunkow', type: 'lesson' },
      { title: 'Instrukcja switch - kiedy if/else to za malo', type: 'lesson' },
      { title: 'Petla for - powtarzanie ze licznikiem', type: 'lesson' },
      { title: 'Petla while - dopoki warunek jest spelniony', type: 'lesson' },
      { title: 'Petla do-while - wykonaj przynajmniej raz', type: 'lesson' },
      { title: 'Break i continue - kontrola petli', type: 'lesson' },
      { title: 'Cwiczenia - warunki i petle', type: 'drill' },
      { title: 'Mini-project - Gra zgadywanka liczbowa', type: 'project' },
    ],
  },
  {
    id: 'struktura',
    level: '03',
    title: 'Struktura kodu',
    description: 'Metody, argumenty, return, scope i rozbijanie programu na czesci.',
    duration: '8 lekcji',
    lessons: [
      { title: 'Metody - czym sa i jak je tworzyc', type: 'lesson' },
      { title: 'Parametry i argumenty - przekazywanie danych', type: 'lesson' },
      { title: 'Wartosc zwracana - slowo kluczowe return', type: 'lesson' },
      { title: 'Przeciazanie metod - ta sama nazwa, inne parametry', type: 'lesson' },
      { title: 'Zakres zmiennych (scope) - gdzie zmienna zyje', type: 'lesson' },
      { title: 'Rekurencja - metoda wywolujaca sama siebie', type: 'lesson' },
      { title: 'Cwiczenia - metody', type: 'drill' },
      { title: 'Mini-project - Kalkulator z metodami', type: 'project' },
    ],
  },
  {
    id: 'oop',
    level: '04',
    title: 'OOP i dalej',
    description: 'Klasy, obiekty, kolekcje, interfejsy i wyjatki w praktyce.',
    duration: '14 lekcji',
    lessons: [
      { title: 'Klasy i obiekty - podstawy programowania obiektowego', type: 'lesson' },
      { title: 'Konstruktory - tworzenie obiektow', type: 'lesson' },
      { title: 'Pola i metody klasy - atrybuty i zachowania', type: 'lesson' },
      { title: 'Enkapsulacja - prywatne pola, publiczne metody', type: 'lesson' },
      { title: 'Dziedziczenie - extends i ponowne uzycie kodu', type: 'lesson' },
      { title: 'Nadpisywanie metod - Override', type: 'lesson' },
      { title: 'Klasa abstrakcyjna - szablon bez implementacji', type: 'lesson' },
      { title: 'Interfejsy - kontrakt dla klas', type: 'lesson' },
      { title: 'Polimorfizm - jeden typ, wiele form', type: 'lesson' },
      { title: 'ArrayList - dynamiczna lista elementow', type: 'lesson' },
      { title: 'HashMap - pary klucz-wartosc', type: 'lesson' },
      { title: 'Wyjatki - try, catch, finally', type: 'lesson' },
      { title: 'Cwiczenia - OOP', type: 'drill' },
      { title: 'Mini-project - System zarzadzania biblioteka', type: 'project' },
    ],
  },
]

const faqItems: FaqItem[] = [
  {
    question: 'Czy JavaPath jest naprawde bezplatny?',
    answer:
      'Tak. Pelny kurs, lekcje, edytor kodu i system postepow sa dostepne bez oplat. Nie ma planu premium ani ukrytych kosztow.',
  },
  {
    question: 'Czy musze cos instalowac?',
    answer:
      'Nie. Aplikacja dziala w przegladarce, a kod Java jest uruchamiany po stronie serwera i zwraca wynik do Twojego ekranu.',
  },
  {
    question: 'Czy kurs jest dla absolutnych poczatkujacych?',
    answer:
      'Tak. Pierwsza lekcja zaczyna od zera i nie zaklada zadnej wczesniejszej wiedzy o programowaniu.',
  },
  {
    question: 'Czy Java jest dobrym pierwszym jezykiem?',
    answer:
      'Jesli chcesz mocnych podstaw i myslisz o backendzie, Androidzie albo pracy developerskiej, Java jest bardzo sensownym wyborem. Nie jest najlatwiejsza na start, ale daje solidne fundamenty.',
  },
  {
    question: 'Jak dlugo trwa ukonczenie kursu?',
    answer:
      'Przy 15-20 minutach dziennie to zwykle 8-10 tygodni. Przy intensywniejszej nauce krocej, ale bez presji i bez terminow.',
  },
  {
    question: 'Co bede umial po ukonczeniu kursu?',
    answer:
      'Bedziesz potrafil napisac proste programy konsolowe w Javie, zrozumiesz klasy, obiekty, kolekcje i wyjatki. To solidna baza, ale nie obietnica gotowosci do pracy.',
  },
  {
    question: 'Czy moge uczyc sie bez konta?',
    answer:
      'Tak. Mozesz wejsc do pierwszych lekcji bez rejestracji. Konto przydaje sie glownie do zapisu postepu miedzy urzadzeniami.',
  },
  {
    question: 'Czy aplikacja dziala na telefonie?',
    answer:
      'Tak. Interfejs jest responsywny. Do samego pisania kodu wygodniejszy jest komputer lub tablet, ale wszystko dziala takze na telefonie.',
  },
  {
    question: 'Czy jest wsparcie jesli utkne?',
    answer:
      'Kazde zadanie ma system progresywnych podpowiedzi. Nie ma jeszcze live supportu ani forum, bo na MVP wazniejsza jest czysta nauka bez rozproszen.',
  },
  {
    question: 'Czy sam kurs wystarczy, zeby zostac programista?',
    answer:
      'Nie. JavaPath buduje fundament. Dalej potrzebujesz projektow, narzedzi, frameworkow, baz danych i kontaktu z prawdziwym kodem. Uczciwie: to poczatek drogi, nie cala droga.',
  },
]

const demoStarterCode = `public class Main {
    public static void main(String[] args) {
        // Napisz swoj kod tutaj

    }
}`

export function LandingPage({ onLogin, onStartFree }: LandingPageProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [hideScrollHint, setHideScrollHint] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [heroReady, setHeroReady] = useState(false)
  const [painVisible, setPainVisible] = useState(false)
  const [howVisible, setHowVisible] = useState(false)
  const [featureVisible, setFeatureVisible] = useState(false)
  const [openLevel, setOpenLevel] = useState<string | null>('fundamenty')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [flashFaq, setFlashFaq] = useState<number | null>(0)
  const [demoCode, setDemoCode] = useState(demoStarterCode)
  const [demoOutput, setDemoOutput] = useState('Kliknij "Uruchom", aby zobaczyc wynik.')
  const [demoLead, setDemoLead] = useState('')
  const [demoTone, setDemoTone] = useState<DemoTone>('neutral')
  const [demoRunning, setDemoRunning] = useState(false)
  const [demoShowCursor, setDemoShowCursor] = useState(false)
  const [demoBannerVisible, setDemoBannerVisible] = useState(false)
  const [curriculumHeights, setCurriculumHeights] = useState<Record<string, number>>({})
  const [faqHeights, setFaqHeights] = useState<Record<number, number>>({})
  const heroSectionRef = useRef<HTMLElement | null>(null)
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const painSectionRef = useRef<HTMLElement | null>(null)
  const howSectionRef = useRef<HTMLElement | null>(null)
  const featureSectionRef = useRef<HTMLElement | null>(null)
  const curriculumRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const faqRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const demoTimersRef = useRef<number[]>([])
  const flashTimerRef = useRef<number | null>(null)

  const featureCards = useMemo(
    () => [
      {
        icon: <Code2 size={22} />,
        title: 'Piszesz kod od pierwszej minuty',
        description:
          'Zadnej instalacji, zadnego konfigurowania srodowiska. Edytor dziala w przegladarce i uruchamia prawdziwy kod Java.',
      },
      {
        icon: <Clock3 size={22} />,
        title: 'Krotkie lekcje, realny postep',
        description:
          'Kazda lekcja miesci sie w 15-20 minutach. Uczysz sie we wlasnym tempie, bez deadlineow i bez akademickiego przeciazenia.',
      },
      {
        icon: <Puzzle size={22} />,
        title: 'Uczysz sie przez rozwiazywanie problemow',
        description:
          'Teoria jest tylko wstepem. Kazdy modul konczy sie zadaniami, ktore sprawdzaja czy rozumiesz temat, a nie czy umiesz go przeczytac.',
      },
      {
        icon: <Compass size={22} />,
        title: 'Wiesz co umiesz, a co wymaga powtorki',
        description:
          'Mapa kursu, XP i kolejka powtorek pokazuja dokladnie gdzie jestes i do czego warto wrocic po tygodniu albo miesiacu.',
      },
      {
        icon: <LockOpen size={22} />,
        title: 'Calkowicie bezplatny',
        description:
          'Pelny kurs bez oplat, bez karty kredytowej i bez sztucznego planu premium. Wchodzisz i zaczynasz od razu.',
      },
      {
        icon: <LaptopMinimal size={22} />,
        title: 'Dziala na kazdym urzadzeniu',
        description:
          'Mozesz czytac, rozwiazywac quizy i pisac kod na komputerze, tablecie albo telefonie. Interfejs skaluje sie bez utraty funkcji.',
      },
    ],
    [],
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(media.matches)

    updatePreference()
    media.addEventListener('change', updatePreference)

    return () => media.removeEventListener('change', updatePreference)
  }, [])

  const motionEnabled = !prefersReducedMotion
  const heroRevealReady = motionEnabled ? heroReady : true
  const painSectionVisible = motionEnabled ? painVisible : true
  const howSectionVisible = motionEnabled ? howVisible : true
  const featureSectionReady = motionEnabled ? featureVisible : true

  useEffect(() => {
    if (!motionEnabled) {
      return
    }

    const timer = window.setTimeout(() => setHeroReady(true), 100)
    return () => window.clearTimeout(timer)
  }, [motionEnabled])

  useEffect(() => {
    let frame = 0

    const updateScroll = () => {
      const scrollY = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setIsScrolled(scrollY > 10)
      setHideScrollHint(scrollY > 48)
      setScrollProgress(total > 0 ? Math.min(100, Math.max(0, (scrollY / total) * 100)) : 0)
      frame = 0
    }

    const onScroll = () => {
      if (frame !== 0) {
        return
      }

      frame = window.requestAnimationFrame(updateScroll)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    updateScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== 0) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [])

  useEffect(() => {
    if (!heroCanvasRef.current || !heroSectionRef.current) {
      return
    }

    const canvas = heroCanvasRef.current
    const hero = heroSectionRef.current
    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const pointer = { x: 0, y: 0, active: false }
    let animationFrame = 0
    let startTimer = 0
    let points: { x: number; y: number; phase: number }[] = []

    const resizeCanvas = () => {
      const rect = hero.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      points = []
      for (let y = 20; y < rect.height + 20; y += 40) {
        for (let x = 20; x < rect.width + 20; x += 40) {
          points.push({ x, y, phase: Math.random() * Math.PI * 2 })
        }
      }
    }

    const render = (time: number) => {
      const rect = hero.getBoundingClientRect()
      context.clearRect(0, 0, rect.width, rect.height)

      for (const point of points) {
        const pulse = motionEnabled ? 0.08 + ((Math.sin(time / 650 + point.phase) + 1) / 2) * 0.17 : 0.12
        let offsetX = 0
        let offsetY = 0
        let opacity = pulse

        if (supportsHover && motionEnabled && pointer.active) {
          const deltaX = pointer.x - point.x
          const deltaY = pointer.y - point.y
          const distance = Math.hypot(deltaX, deltaY)

          if (distance < 120) {
            const strength = (120 - distance) / 120
            offsetX = (deltaX / Math.max(distance, 1)) * strength * 8
            offsetY = (deltaY / Math.max(distance, 1)) * strength * 8
            opacity = Math.min(0.5, pulse + strength * 0.28)
          }
        }

        context.beginPath()
        context.fillStyle = `rgba(248, 152, 32, ${opacity})`
        context.arc(point.x + offsetX, point.y + offsetY, 1.4, 0, Math.PI * 2)
        context.fill()
      }

      if (motionEnabled) {
        animationFrame = window.requestAnimationFrame(render)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      pointer.active = true
    }

    const onPointerLeave = () => {
      pointer.active = false
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    if (supportsHover && motionEnabled) {
      hero.addEventListener('pointermove', onPointerMove)
      hero.addEventListener('pointerleave', onPointerLeave)
    }

    startTimer = window.setTimeout(() => render(performance.now()), 200)

    return () => {
      window.clearTimeout(startTimer)
      window.removeEventListener('resize', resizeCanvas)
      if (supportsHover && motionEnabled) {
        hero.removeEventListener('pointermove', onPointerMove)
        hero.removeEventListener('pointerleave', onPointerLeave)
      }
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame)
      }
    }
  }, [motionEnabled])

  useEffect(() => {
    if (!motionEnabled) {
      return
    }

    const onceObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target === painSectionRef.current) {
            setPainVisible(true)
            onceObserver.unobserve(entry.target)
          }

          if (entry.isIntersecting && entry.target === featureSectionRef.current) {
            setFeatureVisible(true)
            onceObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2 },
    )

    const liveObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === howSectionRef.current) {
            setHowVisible(entry.isIntersecting)
          }
        })
      },
      { threshold: 0.45 },
    )

    if (painSectionRef.current) {
      onceObserver.observe(painSectionRef.current)
    }
    if (featureSectionRef.current) {
      onceObserver.observe(featureSectionRef.current)
    }
    if (howSectionRef.current) {
      liveObserver.observe(howSectionRef.current)
    }

    return () => {
      onceObserver.disconnect()
      liveObserver.disconnect()
    }
  }, [motionEnabled])

  useEffect(() => {
    const measureHeights = () => {
      setCurriculumHeights(
        landingCurriculum.reduce<Record<string, number>>((accumulator, level) => {
          accumulator[level.id] = curriculumRefs.current[level.id]?.scrollHeight ?? 0
          return accumulator
        }, {}),
      )

      setFaqHeights(
        faqItems.reduce<Record<number, number>>((accumulator, _, index) => {
          accumulator[index] = faqRefs.current[index]?.scrollHeight ?? 0
          return accumulator
        }, {}),
      )
    }

    measureHeights()
    window.addEventListener('resize', measureHeights)
    return () => window.removeEventListener('resize', measureHeights)
  }, [openLevel, openFaq])

  useEffect(() => {
    return () => {
      demoTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current)
      }
    }
  }, [])

  const clearDemoTimers = () => {
    demoTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    demoTimersRef.current = []
  }

  const animateSuccessOutput = (fullOutput: string) => {
    clearDemoTimers()
    setDemoTone('success')
    setDemoLead('> Kompilowanie...')
    setDemoOutput('')
    setDemoShowCursor(false)
    setDemoBannerVisible(false)

    const compileTimer = window.setTimeout(() => {
      let visibleLength = 0
      setDemoLead('')
      setDemoShowCursor(true)

      const type = () => {
        visibleLength += 1
        setDemoOutput(fullOutput.slice(0, visibleLength))

        if (visibleLength < fullOutput.length) {
          const nextTimer = window.setTimeout(type, 35)
          demoTimersRef.current.push(nextTimer)
          return
        }

        const bannerTimer = window.setTimeout(() => setDemoBannerVisible(true), 300)
        const cursorTimer = window.setTimeout(() => setDemoShowCursor(false), 2000)
        demoTimersRef.current.push(bannerTimer, cursorTimer)
      }

      type()
    }, 400)

    demoTimersRef.current.push(compileTimer)
  }

  const runDemo = () => {
    clearDemoTimers()
    setDemoRunning(true)
    setDemoBannerVisible(false)
    setDemoTone('neutral')
    setDemoLead('> Kompilowanie...')
    setDemoOutput('')
    setDemoShowCursor(false)

    const runnerTimer = window.setTimeout(() => {
      setDemoRunning(false)
      const result = evaluateLandingDemo(demoCode)

      if (result.success) {
        animateSuccessOutput(result.output)
        return
      }

      setDemoLead('')
      setDemoTone('error')
      setDemoOutput(result.output)
      setDemoShowCursor(false)
    }, 400)

    demoTimersRef.current.push(runnerTimer)
  }

  const toggleFaq = (index: number) => {
    setOpenFaq((current) => (current === index ? null : index))
    setFlashFaq(index)

    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current)
    }

    flashTimerRef.current = window.setTimeout(() => setFlashFaq(null), 1500)
  }

  const lessonCount = landingCurriculum.reduce((sum, level) => sum + level.lessons.length, 0)

  return (
    <div className={`marketing-shell ${motionEnabled ? '' : 'reduced-motion'}`.trim()}>
      <header className={`marketing-topbar ${isScrolled ? 'scrolled' : ''}`}>
        <a className="marketing-brand" href="#top">
          <span className="marketing-brand-mark">J</span>
          <span>JavaPath</span>
        </a>

        <nav className="marketing-nav" aria-label="Nawigacja strony">
          <a href="#how-it-works">Jak to dziala</a>
          <a href="#curriculum">Program kursu</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="marketing-actions">
          <button type="button" className="secondary-button" onClick={onLogin}>
            Zaloguj sie
          </button>
          <button type="button" className="primary-button shimmer-cta" onClick={onStartFree}>
            Zacznij za darmo
            <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <div className="scroll-progress" aria-hidden="true">
        <span style={{ width: `${scrollProgress}%` }} />
      </div>

      <main id="top">
        <section className="marketing-hero" ref={heroSectionRef}>
          <canvas ref={heroCanvasRef} className="hero-grid-canvas" aria-hidden="true" />
          <div className="marketing-section hero-content">
            <div className="hero-copy">
            <p className={`hero-label hero-reveal step-1 ${heroRevealReady ? 'ready' : ''}`.trim()}>Naucz sie Javy - bez instalacji, bez oplat</p>
            <h1 className={`hero-reveal step-2 ${heroRevealReady ? 'ready' : ''}`.trim()}>Od zera do wlasnego programu w Javie.</h1>
            <p className={`hero-subtitle hero-reveal step-3 ${heroRevealReady ? 'ready' : ''}`.trim()}>
              Praktyczny kurs dla poczatkujacych i srednio zaawansowanych. Piszesz kod od pierwszej lekcji - bez teorii
              bez konca.
            </p>

            <div className={`hero-actions hero-reveal step-4 ${heroRevealReady ? 'ready' : ''}`.trim()}>
              <button type="button" className="primary-button hero-primary shimmer-cta" onClick={onStartFree}>
                Zacznij za darmo
                <ArrowRight size={16} />
              </button>
              <a className="secondary-button hero-secondary" href="#how-it-works">
                Zobacz jak to dziala
              </a>
            </div>

            <p className={`hero-trust hero-reveal step-5 ${heroRevealReady ? 'ready' : ''}`.trim()}>
              <span>Bezplatny dostep</span>
              <span>Bez karty kredytowej</span>
              <span>Zacznij w 30 sekund</span>
            </p>
            </div>
          </div>

          {!hideScrollHint && <div className="scroll-indicator"><ArrowDown size={18} /></div>}
        </section>

        <section className="marketing-section pain-section" ref={painSectionRef}>
          <div className="pain-grid perspective">
            {[
              {
                quote: 'Zaczalem tutorial na YouTube, po dwoch godzinach instalowalem Maven i nie mialem pojecia po co.',
                detail: 'Brzmi znajomo? Nie zaczynaj od konfiguracji srodowiska.',
              },
              {
                quote: 'Przeczytalem trzy rozdzialy ksiazki o Javie i nadal nie napisalem ani jednej linii dzialajacego kodu.',
                detail: 'Czytanie to nie nauka programowania.',
              },
              {
                quote: 'Kurs na innej platformie kosztowal kilkaset zlotych. Po pierwszym rozdziale zorientowalem sie, ze to nie dla mnie.',
                detail: 'JavaPath jest bezplatny. Calkowicie.',
              },
            ].map((card, index) => (
              <article
                key={card.quote}
                className={`pain-card ${painSectionVisible ? 'revealed' : ''}`.trim()}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <span className="pain-quote">"</span>
                <p>{card.quote}</p>
                <small>{card.detail}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section" id="how-it-works" ref={howSectionRef}>
          <div className="section-intro centered">
            <p className="eyebrow">Jak to dziala</p>
            <h2>Jak dziala JavaPath?</h2>
            <p>Trzy kroki. Zero konfiguracji.</p>
          </div>

          <div className="how-grid">
            <HowStep
              number="01"
              title="Wybierz modul"
              body="Zacznij od zera albo przejdz do tematu, ktory Cie interesuje. Kurs prowadzi Cie krok po kroku."
              variant="map"
              active={howSectionVisible}
            />
            <HowConnector active={howSectionVisible} />
            <HowStep
              number="02"
              title="Czytaj, pisz kod, sprawdzaj"
              body="Kazda lekcja laczy krotkie wyjasnienie z zadaniem praktycznym. Piszesz w edytorze od razu, bez instalacji."
              variant="editor"
              active={howSectionVisible}
            />
            <HowConnector active={howSectionVisible} />
            <HowStep
              number="03"
              title="Buduj nawyk i sledz wyniki"
              body="Widzisz co umiesz, co wymaga powtorki i jak daleko jestes od ukonczenia calej sciezki."
              variant="progress"
              active={howSectionVisible}
            />
          </div>
        </section>

        <section className="marketing-section" id="demo">
          <div className="section-intro">
            <p className="eyebrow">Interaktywny podglad</p>
            <h2>Sprawdz jak wyglada lekcja</h2>
            <p>To jest prawdziwy edytor. Mozesz pisac kod juz teraz.</p>
          </div>

          <div className="demo-shell">
            <div className="demo-window-bar">
              <span />
              <span />
              <span />
            </div>

            <div className="demo-layout">
              <aside className="demo-brief">
                <p className="eyebrow">Zadanie demo</p>
                <h3>Wypisz na ekranie tekst "Witaj w Javie!"</h3>
                <p>Wskazowka: uzyj System.out.println()</p>
                <button type="button" className={`action-button run ${demoRunning ? 'loading' : ''}`} onClick={runDemo} disabled={demoRunning}>
                  <Code2 size={15} />
                  Uruchom
                </button>
              </aside>

              <div className="demo-editor-stack">
                <div className="editor-frame">
                  <CodeMirror
                    value={demoCode}
                    height="auto"
                    extensions={[java()]}
                    theme={oneDark}
                    onChange={(value) => setDemoCode(value)}
                    basicSetup={{
                      lineNumbers: true,
                      foldGutter: false,
                    }}
                  />
                </div>

                <div className="demo-output-wrap">
                  <div className={`output-console ${demoTone}`}>
                    <div className="terminal-stack">
                      {demoLead && <p className="terminal-line compile">{demoLead}</p>}
                      <p className="terminal-line result">
                        <span>{demoOutput}</span>
                        {demoShowCursor && <span className="terminal-cursor">|</span>}
                      </p>
                    </div>
                  </div>

                  {demoBannerVisible && (
                    <div className="demo-success-banner">
                      <span>
                        <CheckCircle2 size={16} />
                        Dziala! To byl Twoj pierwszy program w Javie. Chcesz wiecej?
                      </span>
                      <button type="button" className="primary-button shimmer-cta" onClick={onStartFree}>
                        Zacznij kurs
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section" id="curriculum">
          <div className="section-intro">
            <p className="eyebrow">Program kursu</p>
            <h2>Co znajdziesz w kursie</h2>
            <p>
              {lessonCount} lekcji w 4 poziomach. Od Hello World do programowania obiektowego.
            </p>
          </div>

          <div className="curriculum-list">
            {landingCurriculum.map((level) => (
              <section key={level.id} className={`curriculum-card ${openLevel === level.id ? 'open' : ''}`}>
                <button
                  type="button"
                  className="curriculum-toggle"
                  aria-expanded={openLevel === level.id}
                  onClick={() => setOpenLevel((current) => (current === level.id ? null : level.id))}
                >
                  <div className="curriculum-header-main">
                    <span className="curriculum-number">{level.level}</span>
                    <div>
                      <h3>{level.title}</h3>
                      <p>{level.description}</p>
                    </div>
                  </div>
                  <div className="curriculum-meta">
                    <span>{level.duration}</span>
                    <ChevronDown size={18} className={`curriculum-caret ${openLevel === level.id ? 'open' : ''}`} />
                  </div>
                </button>

                <div
                  className="curriculum-body"
                  style={{ height: openLevel === level.id ? `${curriculumHeights[level.id] ?? 0}px` : '0px' }}
                >
                  <div
                    ref={(node) => {
                      curriculumRefs.current[level.id] = node
                    }}
                    className="curriculum-body-inner"
                  >
                    <ol className="curriculum-lessons">
                      {level.lessons.map((lessonItem, index) => (
                        <li key={lessonItem.title} style={{ transitionDelay: openLevel === level.id ? `${index * 30}ms` : '0ms' }}>
                          <span className="curriculum-lesson-icon">
                            {lessonItem.type === 'lesson' ? (
                              <BookOpenText size={15} />
                            ) : lessonItem.type === 'drill' ? (
                              <Code2 size={15} />
                            ) : (
                              <Rocket size={15} />
                            )}
                          </span>
                          <span className="curriculum-lesson-index">{String(index + 1).padStart(2, '0')}</span>
                          <span className="curriculum-lesson-title">{lessonItem.title}</span>
                          <span className="curriculum-lesson-time">~15 min</span>
                        </li>
                      ))}
                    </ol>
                    <p className="curriculum-cta-note">Zarejestruj sie, zeby odblokowac wszystkie lekcje.</p>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="marketing-section feature-section" ref={featureSectionRef}>
          <div className="feature-grid">
            {featureCards.map((feature, index) => (
              <article
                key={feature.title}
                className={`feature-card ${featureSectionReady ? 'revealed' : ''}`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section" id="faq">
          <div className="section-intro centered">
            <p className="eyebrow">FAQ</p>
            <h2>Czesto zadawane pytania</h2>
          </div>

          <div className="faq-list">
            {faqItems.map((item, index) => (
              <section key={item.question} className={`faq-item ${flashFaq === index ? 'flash' : ''}`}>
                <button
                  type="button"
                  className="faq-toggle"
                  aria-expanded={openFaq === index}
                  onClick={() => toggleFaq(index)}
                >
                  <span>{item.question}</span>
                  <span className={`faq-plus ${openFaq === index ? 'open' : ''}`}>+</span>
                </button>
                <div className="faq-answer" style={{ height: openFaq === index ? `${faqHeights[index] ?? 0}px` : '0px' }}>
                  <div
                    ref={(node) => {
                      faqRefs.current[index] = node
                    }}
                    className="faq-answer-inner"
                  >
                    <p>{item.answer}</p>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="marketing-section final-cta-section">
          <div className="final-cta-card">
            <h2>Gotowy zeby zaczac?</h2>
            <p>Pierwsza lekcja czeka. Zadnej rejestracji, zeby zajrzec.</p>
            <button type="button" className="primary-button hero-primary shimmer-cta" onClick={onStartFree}>
              Zacznij za darmo
              <ArrowRight size={16} />
            </button>
            <p className="hero-trust">
              <span>Bezplatny dostep</span>
              <span>Bez karty kredytowej</span>
              <span>Zacznij w 30 sekund</span>
            </p>
          </div>
        </section>
      </main>

      <footer className="marketing-footer">
        <div className="marketing-footer-brand">
          <a className="marketing-brand" href="#top">
            <span className="marketing-brand-mark">J</span>
            <span>JavaPath</span>
          </a>
          <p>(c) 2025 JavaPath. Projekt open-source.</p>
        </div>
        <nav className="marketing-footer-links" aria-label="Linki stopki">
          <a href="#top">Polityka prywatnosci</a>
          <a href="#top">Regulamin</a>
          <a href="#top">Kontakt</a>
        </nav>
      </footer>

      <button type="button" className="floating-cta shimmer-cta" onClick={onStartFree}>
        Zacznij za darmo
        <ArrowRight size={16} />
      </button>
    </div>
  )
}

function HowStep({
  number,
  title,
  body,
  variant,
  active,
}: {
  number: string
  title: string
  body: string
  variant: 'map' | 'editor' | 'progress'
  active: boolean
}) {
  const iconMap: Record<'map' | 'editor' | 'progress', ReactNode> = {
    map: <Map size={24} />,
    editor: <MenuSquare size={24} />,
    progress: <Trophy size={24} />,
  }

  return (
    <article className="how-card">
      <span className="how-number">{number}</span>
      <div className={`how-icon ${variant} ${active ? 'active' : ''}`.trim()}>
        <span className="how-icon-core">{iconMap[variant]}</span>
        {variant === 'editor' && <span className="how-caret" aria-hidden="true" />}
        {variant === 'progress' && (
          <span className="how-burst" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        )}
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  )
}

function HowConnector({ active }: { active: boolean }) {
  return (
    <div className={`how-connector ${active ? 'active' : ''}`.trim()} aria-hidden="true">
      <svg className="desktop-path" viewBox="0 0 120 40" fill="none">
        <path d="M6 20 C36 20 44 20 74 20" />
      </svg>
      <svg className="mobile-path" viewBox="0 0 40 120" fill="none">
        <path d="M20 6 C20 36 20 44 20 74" />
      </svg>
    </div>
  )
}

function evaluateLandingDemo(source: string) {
  const normalized = source.replace(/\r/g, '')
  const hasMain = /public\s+class\s+Main/.test(normalized) && /public\s+static\s+void\s+main/.test(normalized)

  if (!hasMain) {
    return {
      success: false,
      tone: 'error' as const,
      output: 'error: class Main or main method not found\nJava compiler expects class Main with a valid main method.',
    }
  }

  if (/system\.out/.test(normalized)) {
    return {
      success: false,
      tone: 'error' as const,
      output:
        'Main.java:3: error: package system does not exist\n        system.out.println("Witaj w Javie!");\n        ^\n1 error',
    }
  }

  const outputLines = [...normalized.matchAll(/System\.out\.println\(\s*"([^"]+)"\s*\);/g)].map((match) => match[1].trim())

  if (outputLines.length === 0) {
    return {
      success: false,
      tone: 'error' as const,
      output: 'error: no output produced\nDodaj przynajmniej jedno wywolanie System.out.println("...");',
    }
  }

  const hasGreeting = outputLines.some((line) => normalizeDemoText(line).includes('witaj w javie'))

  if (!hasGreeting) {
    return {
      success: false,
      tone: 'error' as const,
      output: 'Program uruchomil sie, ale wynik nadal nie zawiera tekstu: Witaj w Javie!',
    }
  }

  return {
    success: true,
    tone: 'success' as const,
    output: outputLines.join('\n'),
  }
}

function normalizeDemoText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
