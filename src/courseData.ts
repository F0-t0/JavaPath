export type ModuleStatus = 'locked' | 'active' | 'completed' | 'review'

export type CourseModule = {
  id: string
  title: string
  subtitle: string
  status: ModuleStatus
  xp: number
}

export type CourseTrack = {
  id: string
  level: string
  title: string
  summary: string
  completion: number
  modules: CourseModule[]
}

export type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
}

export type LessonExample = {
  id: string
  label: string
  title: string
  description: string
  whyItWorks: string
  code: string
  output: string
}

export type PracticeTask = {
  id: string
  kind: 'fill_blank' | 'scratch' | 'debug'
  title: string
  scenario: string
  instructions: string[]
  starterCode: string
  expectedOutput: string
  successMessage: string
  hints: string[]
  xp: number
}

export type LessonData = {
  breadcrumb: string[]
  title: string
  duration: string
  steps: string[]
  hook: {
    prompt: string
    detail: string
    cta: string
  }
  explain: {
    coreStatement: string
    paragraphs: string[]
    analogy: {
      title: string
      body: string
    }
    warning?: string
  }
  show: {
    intro: string
    examples: LessonExample[]
  }
  practice: {
    intro: string
    tasks: PracticeTask[]
  }
  wrapUp: {
    skills: string[]
    nextLesson: string
    nextLessonReason: string
    xpReward: number
  }
}

export const courseTracks: CourseTrack[] = [
  {
    id: 'fundamenty',
    level: 'Poziom 1',
    title: 'Fundamenty',
    summary: 'Pierwsze programy, zmienne, typy danych i wejscie od uzytkownika.',
    completion: 0,
    modules: [
      {
        id: 'hello-world',
        title: 'Twoj pierwszy program',
        subtitle: 'Hello, World! i jak startuje Java',
        status: 'active',
        xp: 120,
      },
      {
        id: 'zmienne',
        title: 'Zmienne',
        subtitle: 'Jak program zapamietuje dane',
        status: 'locked',
        xp: 120,
      },
      {
        id: 'typy-danych',
        title: 'Typy danych',
        subtitle: 'int, double, String, boolean',
        status: 'locked',
        xp: 120,
      },
      {
        id: 'operatory',
        title: 'Operatory',
        subtitle: 'Matematyka i porownania w Javie',
        status: 'locked',
        xp: 140,
      },
      {
        id: 'scanner',
        title: 'Wejscie od uzytkownika',
        subtitle: 'Pobieranie danych przez Scanner',
        status: 'locked',
        xp: 150,
      },
    ],
  },
  {
    id: 'logika',
    level: 'Poziom 2',
    title: 'Logika i sterowanie',
    summary: 'Warunki, petle i sterowanie przeplywem programu.',
    completion: 0,
    modules: [
      {
        id: 'if-else',
        title: 'Instrukcja if / else',
        subtitle: 'Podejmowanie decyzji',
        status: 'locked',
        xp: 160,
      },
      {
        id: 'switch',
        title: 'Switch',
        subtitle: 'Wiele sciezek programu',
        status: 'locked',
        xp: 160,
      },
      {
        id: 'petle',
        title: 'Petle',
        subtitle: 'for, while, do-while',
        status: 'locked',
        xp: 180,
      },
    ],
  },
  {
    id: 'struktura',
    level: 'Poziom 3',
    title: 'Struktura kodu',
    summary: 'Metody, argumenty, return i scope.',
    completion: 0,
    modules: [
      {
        id: 'metody',
        title: 'Metody',
        subtitle: 'Budowanie mniejszych blokow kodu',
        status: 'locked',
        xp: 210,
      },
      {
        id: 'return',
        title: 'Wartosc zwracana',
        subtitle: 'Jak metoda oddaje wynik',
        status: 'locked',
        xp: 220,
      },
    ],
  },
  {
    id: 'oop',
    level: 'Poziom 4',
    title: 'OOP i dalej',
    summary: 'Klasy, obiekty, kolekcje i wyjatki.',
    completion: 0,
    modules: [
      {
        id: 'klasy',
        title: 'Klasy i obiekty',
        subtitle: 'Podstawy OOP',
        status: 'locked',
        xp: 240,
      },
      {
        id: 'kolekcje',
        title: 'ArrayList i HashMap',
        subtitle: 'Przechowywanie wielu danych',
        status: 'locked',
        xp: 260,
      },
    ],
  },
]

export const dashboardStats = {
  xp: 0,
  streak: 0,
  userName: 'Nowy kursant',
  nextModule: 'Twoj pierwszy program',
  challengeTitle: 'Pierwsze wyzwanie czeka po module 1',
}

export const lesson: LessonData = {
  breadcrumb: ['Poziom 1', 'Fundamenty', 'Twoj pierwszy program'],
  title: 'Twoj pierwszy program',
  duration: '15-20 minut',
  steps: ['Hook', 'Explain', 'Show', 'Practice', 'Wrap-up'],
  hook: {
    prompt:
      'Skad program wie, co ma pokazac na ekranie, skoro komputer nie czyta naszych mysli?',
    detail:
      'Pierwszy program w Javie to moment, w ktorym widzisz, jak kod zamienia sie w efekt. Za chwile zbudujesz minimalny plik Java, uruchomisz go i zobaczysz wynik tak, jak robi to prawdziwa aplikacja.',
    cta: 'Rozumiem, pokaz mi jak',
  },
  explain: {
    coreStatement:
      'Program Java startuje od metody main, a tekst wyswietlasz przez System.out.println.',
    paragraphs: [
      'Kazdy program potrzebuje jednego, konkretnego miejsca startu. W Javie tym miejscem jest metoda main. Gdy uruchamiasz plik, Java szuka wlasnie jej i zaczyna wykonanie kodu od tego punktu.',
      'Instrukcja System.out.println sluzy do pokazania tekstu w konsoli. To najprostszy sposob, zeby sprawdzic, czy program dziala i czy wykonuje dokladnie to, czego od niego oczekujesz.',
      'Na tym etapie nie musisz jeszcze rozumiec calej skladni klasy. Wystarczy, ze wiesz gdzie wpisac swoj kod i jak wyswietlic pierwszy komunikat.',
    ],
    analogy: {
      title: 'Analogia',
      body:
        'Pomysl o programie jak o spektaklu. Metoda main to chwila podniesienia kurtyny, a println to pierwsza kwestia wypowiedziana na scenie. Bez niej widz nic nie zobaczy ani nie uslyszy.',
    },
    warning:
      'Uwaga: Java rozroznia wielkie i male litery. System to nie to samo co system, a println musi konczyc sie srednikiem.',
  },
  show: {
    intro:
      'Najpierw zobacz dwa dzialajace przyklady. Pierwszy pokazuje absolutne minimum. Drugi wrzuca ten sam koncept w prosty, bardziej realistyczny kontekst.',
    examples: [
      {
        id: 'example-a',
        label: 'Przyklad A',
        title: 'Minimalny szkielet',
        description: 'Najmniejszy program, ktory uruchamia sie poprawnie i wyswietla tekst.',
        whyItWorks:
          'Tutaj najwazniejsze jest to, ze metoda main jest miejscem startu, a println daje natychmiastowy efekt.',
        code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Witaj, Java!"); // pokazujemy pierwszy komunikat\n  }\n}`,
        output: 'Witaj, Java!',
      },
      {
        id: 'example-b',
        label: 'Przyklad B',
        title: 'Program z mini-kontekstem',
        description: 'Ten sam koncept, ale juz jako poczatek malej aplikacji powitalnej.',
        whyItWorks:
          'Program nadal startuje od main, ale komunikat wyglada juz jak fragment prawdziwej aplikacji.',
        code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("JavaPath uruchomiony."); // potwierdzamy start aplikacji\n    System.out.println("Czas napisac pierwszy kod."); // pokazujemy kolejny krok\n  }\n}`,
        output: 'JavaPath uruchomiony.\nCzas napisac pierwszy kod.',
      },
    ],
  },
  practice: {
    intro:
      'Teraz przechodzisz od ogladania do dzialania. Najpierw uzupelnisz brakujacy kod, potem napiszesz prosty program od zera, a na koncu naprawisz blad jak prawdziwy developer.',
    tasks: [
      {
        id: 'task-fill',
        kind: 'fill_blank',
        title: 'Zadanie 1 — Uzupelnij brakujace fragmenty',
        scenario:
          'Program ma wypisac komunikat Witaj, JavaPath!, ale dwa fragmenty sa puste.',
        instructions: [
          'Uzupelnij nazwe klasy i tresc komunikatu.',
          'Nie zmieniaj pozostalej struktury programu.',
        ],
        starterCode: `public class _____ {\n  public static void main(String[] args) {\n    System.out.println("_____");\n  }\n}`,
        expectedOutput: 'Witaj, JavaPath!',
        successMessage:
          'Dobrze. Wiesz juz, gdzie znajduje sie punkt startu programu i jak wyswietlic pierwszy tekst.',
        hints: [
          'Sprawdz, jak nazywa sie klasa w pozostalych przykladach.',
          'Program powinien wypisac dokladnie jeden komunikat: Witaj, JavaPath!',
          'Pierwsza linia powinna zaczynac sie od: public class Main',
        ],
        xp: 30,
      },
      {
        id: 'task-scratch',
        kind: 'scratch',
        title: 'Zadanie 2 — Napisz od zera',
        scenario:
          'Napisz program, ktory wypisuje dwie linie: "Start programu" oraz "Kod dziala."',
        instructions: [
          'Zostaw klase Main i metode main.',
          'Wypisz dwie osobne linie przez System.out.println.',
        ],
        starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
        expectedOutput: 'Start programu\nKod dziala.',
        successMessage:
          'Masz juz pierwszy samodzielnie napisany program. To moment, w ktorym lekcja przestaje byc teoria.',
        hints: [
          'Potrzebujesz dwoch osobnych wywolan System.out.println.',
          'Pierwszy komunikat to: Start programu',
          'Druga linia powinna wygladac tak: System.out.println("Kod dziala.");',
        ],
        xp: 40,
      },
      {
        id: 'task-debug',
        kind: 'debug',
        title: 'Zadanie 3 — Znajdz blad',
        scenario:
          'Ten kod powinien wypisac "Mam pierwszy program", ale zawiera dwa podstawowe bledy. Napraw go.',
        instructions: [
          'Napraw skladnie tak, aby kod sie uruchomil.',
          'Output ma byc dokladnie taki, jak w tresci zadania.',
        ],
        starterCode: `public class Main {\n  public static void main(String[] args) {\n    system.out.println("Mam pierwszy program")\n  }\n}`,
        expectedOutput: 'Mam pierwszy program',
        successMessage:
          'Umiesz juz nie tylko napisac prosty program, ale tez przeczytac kod i naprawic blad. To realna umiejetnosc developerska.',
        hints: [
          'Java rozroznia wielkie i male litery.',
          'Obiekt odpowiedzialny za output zaczyna sie od System, nie system.',
          'Na koncu instrukcji println musi byc srednik.',
        ],
        xp: 50,
      },
    ],
  },
  wrapUp: {
    skills: [
      'Wiem, ze program Java startuje od metody main.',
      'Umiem wyswietlic tekst przez System.out.println.',
      'Potrafie napisac prosty program od zera i sprawdzic jego output.',
      'Rozumiem, jak wylapac podstawowy blad skladni i naprawic go samodzielnie.',
    ],
    nextLesson: 'Zmienne — czym sa i jak je tworzyc',
    nextLessonReason:
      'W nastepnej lekcji nauczysz sie, jak program zapamietuje dane i jak zmieniac je w trakcie dzialania.',
    xpReward: 120,
  },
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Od jakiej metody Java zaczyna wykonanie programu?',
    options: ['start()', 'run()', 'main()', 'boot()'],
    correctIndex: 2,
  },
  {
    id: 'q2',
    prompt: 'Ktora instrukcja wyswietla tekst w konsoli?',
    options: ['System.out.println()', 'console.log()', 'print()', 'echo()'],
    correctIndex: 0,
  },
  {
    id: 'q3',
    prompt: 'Co jest bledem w zapisie: system.out.println("Hello")?',
    options: ['Brakuje klasy Main', 'System powinno zaczynac sie wielka litera', 'Brakuje nawiasu klamrowego', 'Nie wolno uzywac cudzyslowu'],
    correctIndex: 1,
  },
  {
    id: 'q4',
    prompt: 'Po co uzywamy srednika na koncu instrukcji?',
    options: ['Zeby uruchomic program', 'Zeby zakonczyc instrukcje', 'Zeby otworzyc metode main', 'To niepotrzebne'],
    correctIndex: 1,
  },
]
