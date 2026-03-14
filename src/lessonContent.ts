import { courseTracks, lesson, quizQuestions, type LessonData, type QuizQuestion } from './courseData'

type LessonBlueprint = {
  hookPrompt: string
  hookDetail: string
  coreStatement: string
  paragraphs: string[]
  analogy: {
    title: string
    body: string
  }
  warning?: string
  showIntro: string
  examples: LessonData['show']['examples']
  practiceIntro: string
  tasks: LessonData['practice']['tasks']
  skills: string[]
  nextReason?: string
}

const orderedModules = courseTracks.flatMap((track) =>
  track.modules.map((module) => ({
    ...module,
    trackLevel: track.level,
    trackTitle: track.title,
  })),
)

const moduleById = Object.fromEntries(orderedModules.map((module) => [module.id, module]))

function getNextOrderedModule(moduleId: string) {
  const index = orderedModules.findIndex((module) => module.id === moduleId)
  return index >= 0 ? orderedModules[index + 1] ?? null : null
}

function buildLesson(moduleId: string, blueprint: LessonBlueprint): LessonData {
  const module = moduleById[moduleId]
  const nextModule = getNextOrderedModule(moduleId)

  if (!module) {
    return lesson
  }

  return {
    breadcrumb: [module.trackLevel, module.trackTitle, module.title],
    title: module.title,
    duration: '15-20 minut',
    steps: ['Hook', 'Explain', 'Show', 'Practice', 'Wrap-up'],
    hook: {
      prompt: blueprint.hookPrompt,
      detail: blueprint.hookDetail,
      cta: 'Dobra, pokaz mi jak',
    },
    explain: {
      coreStatement: blueprint.coreStatement,
      paragraphs: blueprint.paragraphs,
      analogy: blueprint.analogy,
      warning: blueprint.warning,
    },
    show: {
      intro: blueprint.showIntro,
      examples: blueprint.examples,
    },
    practice: {
      intro: blueprint.practiceIntro,
      tasks: blueprint.tasks,
    },
    wrapUp: {
      skills: blueprint.skills,
      nextLesson: nextModule?.title ?? 'Kolejny modul kursu',
      nextLessonReason:
        blueprint.nextReason ??
        (nextModule
          ? `Nastepny krok to modul "${nextModule.title}", ktory rozwinie to, co wycwiczyles przed chwila.`
          : 'To koniec aktualnej listy modulow. Kolejny etap pojawi sie po rozbudowie kursu.'),
      xpReward: module.xp,
    },
  }
}

function buildQuiz(
  moduleId: string,
  items: Array<{ prompt: string; options: string[]; correctIndex: number }>,
): QuizQuestion[] {
  return items.map((item, index) => ({
    id: `${moduleId}-q${index + 1}`,
    ...item,
  }))
}

function createTopicLesson(moduleId: string): LessonData {
  switch (moduleId) {
    case 'zmienne':
      return buildLesson(moduleId, {
        hookPrompt: 'Masz 100 punktow zycia i nick gracza. Jak program ma to zapamietac?',
        hookDetail:
          'W tej lekcji przechodzisz od pojedynczego komunikatu do danych, ktore program moze przechowac pod nazwa i wykorzystac pozniej.',
        coreStatement: 'Zmienna to nazwane miejsce w programie, w ktorym przechowujesz wartosc.',
        paragraphs: [
          'Zamiast wpisywac kazda liczbe i kazdy tekst na sztywno, mozesz zapisac je w zmiennej. Dzieki temu kod staje sie czytelniejszy i latwiejszy do zmiany.',
          'Zmienna ma typ, nazwe i wartosc poczatkowa. Typ mowi Javie, jaki rodzaj danych trzymasz. Nazwa pomaga Tobie i programowi odwolywac sie do tej wartosci.',
          'Najwazniejsze w praktyce jest to, ze zmienna pozwala uzyc tej samej informacji kilka razy bez przepisywania jej od nowa.',
        ],
        analogy: {
          title: 'Analogia',
          body: 'Pomysl o zmiennej jak o pudelku z etykieta. Na etykiecie piszesz, co jest w srodku, a potem mozesz siegac po to pudelko zawsze, gdy tego potrzebujesz.',
        },
        warning: 'Java rozroznia wielkie i male litery. Zmienna nick to nie to samo co Nick.',
        showIntro:
          'Najpierw zobacz najprostsza deklaracje zmiennej, a potem malego gracza z punktami i nickiem.',
        examples: [
          {
            id: 'variables-a',
            label: 'Przyklad A',
            title: 'Jedna zmienna',
            description: 'Program zapisuje wartosc w zmiennej i wypisuje ja na ekran.',
            whyItWorks: 'Najpierw deklarujesz zmienna, potem uzywasz jej w println. To podstawowy rytm pracy z danymi.',
            code: `public class Main {\n  public static void main(String[] args) {\n    int zycie = 100;\n    System.out.println("Zycie gracza: " + zycie);\n  }\n}`,
            output: 'Zycie gracza: 100',
          },
          {
            id: 'variables-b',
            label: 'Przyklad B',
            title: 'Nick i punkty',
            description: 'Dwie zmienne przechowuja dane o graczu.',
            whyItWorks: 'Kod nie trzyma informacji w losowych miejscach. Kazda wartosc ma swoja nazwe i mozna jej uzyc kilka razy.',
            code: `public class Main {\n  public static void main(String[] args) {\n    String nick = "Maks";\n    int punkty = 250;\n\n    System.out.println("Gracz: " + nick);\n    System.out.println("Punkty: " + punkty);\n  }\n}`,
            output: 'Gracz: Maks\nPunkty: 250',
          },
        ],
        practiceIntro:
          'Teraz przechodzisz przez trzy zadania zwiazane z deklarowaniem zmiennych, uzywaniem ich i poprawianiem typowych bledow.',
        tasks: [
          {
            id: 'variables-fill',
            kind: 'fill_blank',
            title: 'Zadanie 1 - Uzupelnij deklaracje',
            scenario: 'Program ma zapisac zycie gracza i jego nick.',
            instructions: [
              'Uzupelnij typ i nazwe zmiennej dla liczby 100.',
              'Uzupelnij deklaracje tekstowej zmiennej nick.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    _____ zycie = 100;\n    _____ nick = "Maks";\n    System.out.println("Nick: " + nick);\n    System.out.println("Zycie: " + zycie);\n  }\n}`,
            expectedOutput: 'Nick: Maks\nZycie: 100',
            successMessage: 'Dobrze. Umiesz juz zapisac liczbe i tekst w dwoch roznych zmiennych.',
            hints: [
              'Liczba calkowita 100 potrzebuje typu int.',
              'Nick to tekst, wiec potrzebujesz typu String.',
              'Prawidlowe linie to: int zycie = 100; oraz String nick = "Maks";',
            ],
            xp: 35,
            validation: {
              placeholdersDisallowed: true,
              requiredPatterns: ['int\\s+zycie\\s*=\\s*100\\s*;', 'String\\s+nick\\s*=\\s*"Maks"\\s*;'],
              failureMessage: 'Uzyj typu int dla zycie i typu String dla nick.',
            },
          },
          {
            id: 'variables-scratch',
            kind: 'scratch',
            title: 'Zadanie 2 - Napisz program ze zmiennymi',
            scenario: 'Zapisz imie i wiek uzytkownika, a potem wypisz oba dane w jednym komunikacie.',
            instructions: [
              'Utworz zmienna String imie z wartoscia "Ania".',
              'Utworz zmienna int wiek z wartoscia 22.',
              'Wypisz oba pola w jednym println.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
            expectedOutput: 'Czesc Ania, masz 22 lata.',
            successMessage: 'Masz juz pierwszy program, w ktorym kilka zmiennych wspolpracuje w jednym komunikacie.',
            hints: [
              'Potrzebujesz zmiennych String imie i int wiek.',
              'W println polacz tekst z imie i wiek przez operator +.',
              'Mozesz uzyc komunikatu: "Czesc " + imie + ", masz " + wiek + " lata."',
            ],
            xp: 45,
            validation: {
              requiredPatterns: [
                'String\\s+imie\\s*=\\s*"Ania"\\s*;',
                'int\\s+wiek\\s*=\\s*22\\s*;',
                'System\\.out\\.println\\(',
                'imie',
                'wiek',
              ],
              failureMessage: 'Program powinien deklarowac zmienne imie i wiek oraz uzyc ich w println.',
            },
          },
          {
            id: 'variables-debug',
            kind: 'debug',
            title: 'Zadanie 3 - Napraw blad w zmiennej',
            scenario: 'Kod powinien wypisac liczbe punktow, ale ma dwa klasyczne bledy.',
            instructions: [
              'Popraw typ Int na int.',
              'Zachowaj ta sama nazwe zmiennej w println.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    Int punkty = 50;\n    System.out.println("Punkty: " + Punkty);\n  }\n}`,
            expectedOutput: 'Punkty: 50',
            successMessage: 'Dobrze. Rozpoznajesz juz dwa typowe bledy: zly typ i zla wielkosc litery w nazwie zmiennej.',
            hints: [
              'Java ma typ int, nie Int.',
              'Punkty i punkty to dla Javy dwie rozne nazwy.',
              'Po poprawce obie linie powinny uzywac nazwy punkty.',
            ],
            xp: 55,
            validation: {
              forbiddenIncludes: ['Int ', 'Punkty'],
              requiredPatterns: [
                'int\\s+punkty\\s*=\\s*50\\s*;',
                'System\\.out\\.println\\(\\s*"Punkty: "\\s*\\+\\s*punkty\\s*\\)\\s*;',
              ],
              failureMessage: 'Popraw typ na int i uzyj tej samej nazwy zmiennej punkty w println.',
            },
          },
        ],
        skills: [
          'Rozumiem, po co programowi zmienne.',
          'Umiem zadeklarowac zmienne typu int i String.',
          'Potrafie uzyc zmiennej w println zamiast twardego wpisywania wartosci.',
          'Wylapuje podstawowe bledy w nazwie i typie zmiennej.',
        ],
        nextReason:
          'Nastepny modul porzadkuje to, jakie rodzaje danych mozesz w ogole przechowywac i kiedy wybrac int, double, String albo boolean.',
      })

    case 'typy-danych':
      return buildLesson(moduleId, {
        hookPrompt: 'Skad Java ma wiedziec, czy 37 to liczba, tekst czy odpowiedz prawda falsz?',
        hookDetail:
          'Sam zapis wartosci nie wystarcza. Program musi jeszcze wiedziec, jakiego rodzaju dane przechowujesz i co wolno z nimi zrobic.',
        coreStatement: 'Typ danych mowi Javie, z jakim rodzajem wartosci pracuje zmienna.',
        paragraphs: [
          'int przechowuje liczby calkowite, double liczby z przecinkiem, String tekst, a boolean wartosc true albo false.',
          'Wybor typu nie jest kosmetyka. To od niego zalezy, czy program potraktuje wartosc jak liczbe do obliczen, tekst do wyswietlenia czy warunek logiczny.',
          'Im szybciej nauczysz sie dobierac typ do wartosci, tym mniej bledow bedziesz robic w kolejnych lekcjach.',
        ],
        analogy: {
          title: 'Analogia',
          body: 'To jak wybieranie odpowiedniego pojemnika. Wode lejesz do butelki, dokumenty trzymasz w teczce, a klucz w kieszeni. Nie wszystko pasuje do wszystkiego.',
        },
        warning: 'String zawsze zapisujesz w cudzyslowie. boolean nie przyjmuje "tak" lub "nie", tylko true albo false.',
        showIntro: 'Najpierw zobacz cztery glowne typy danych, a potem maly profil uzytkownika zlozony z kilku pol.',
        examples: [
          {
            id: 'types-a',
            label: 'Przyklad A',
            title: 'Cztery podstawowe typy',
            description: 'Jedna zmienna dla kazdego najwazniejszego typu z poziomu fundamentow.',
            whyItWorks: 'Kazda wartosc ma typ dobrany do znaczenia, a nie przypadkowo.',
            code: `public class Main {\n  public static void main(String[] args) {\n    int wiek = 21;\n    double wzrost = 1.78;\n    String miasto = "Krakow";\n    boolean aktywny = true;\n\n    System.out.println(miasto);\n  }\n}`,
            output: 'Krakow',
          },
          {
            id: 'types-b',
            label: 'Przyklad B',
            title: 'Profil kursanta',
            description: 'Kilka pol opisuje jedna osobe w bardziej realistycznym kontekscie.',
            whyItWorks: 'Ten sam profil laczy liczbe, tekst i wartosc logiczna. Tak wyglada prawdziwa praca z danymi.',
            code: `public class Main {\n  public static void main(String[] args) {\n    String imie = "Ola";\n    int ukonczoneLekcje = 3;\n    double sredniWynik = 87.5;\n    boolean maStreak = true;\n\n    System.out.println(imie + " ma wynik " + sredniWynik);\n  }\n}`,
            output: 'Ola ma wynik 87.5',
          },
        ],
        practiceIntro: 'W zadaniach dobierasz typ do wartosci, zapisujesz profil i poprawiasz zle zadeklarowane pola.',
        tasks: [
          {
            id: 'types-fill',
            kind: 'fill_blank',
            title: 'Zadanie 1 - Dobierz typ',
            scenario: 'Uzupelnij poprawne typy dla wieku, ceny, imienia i statusu premium.',
            instructions: [
              'Uzyj int dla liczby calkowitej.',
              'Uzyj double dla ceny z przecinkiem.',
              'Uzyj String dla tekstu i boolean dla true/false.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    _____ wiek = 19;\n    _____ cena = 14.99;\n    _____ imie = "Kuba";\n    _____ premium = true;\n    System.out.println(imie);\n  }\n}`,
            expectedOutput: 'Kuba',
            successMessage: 'Dobrze. Rozpoznajesz juz cztery podstawowe typy danych.',
            hints: [
              'Wiek 19 to int.',
              'Cena 14.99 to double.',
              'Imie potrzebuje String, a premium potrzebuje boolean.',
            ],
            xp: 35,
            validation: {
              placeholdersDisallowed: true,
              requiredPatterns: [
                'int\\s+wiek\\s*=\\s*19\\s*;',
                'double\\s+cena\\s*=\\s*14\\.99\\s*;',
                'String\\s+imie\\s*=\\s*"Kuba"\\s*;',
                'boolean\\s+premium\\s*=\\s*true\\s*;',
              ],
              failureMessage: 'Dobierz poprawne typy: int, double, String i boolean.',
            },
          },
          {
            id: 'types-scratch',
            kind: 'scratch',
            title: 'Zadanie 2 - Zbuduj mini-profil',
            scenario: 'Utworz cztery zmienne: nick, poziom, wynik i online, a potem wypisz nick oraz wynik.',
            instructions: [
              'nick ma byc tekstem "Luna".',
              'poziom ma byc liczba calkowita 4, wynik ma byc 92.5, online ma byc false.',
              'Wypisz w println nick i wynik.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
            expectedOutput: 'Luna - 92.5',
            successMessage: 'Masz juz poprawnie zbudowany profil oparty o kilka roznych typow danych.',
            hints: [
              'Potrzebujesz String nick, int poziom, double wynik i boolean online.',
              'W println wystarczy polaczyc nick i wynik.',
              'Pamietaj, ze false nie zapisujesz w cudzyslowie.',
            ],
            xp: 45,
            validation: {
              requiredPatterns: [
                'String\\s+nick\\s*=\\s*"Luna"\\s*;',
                'int\\s+poziom\\s*=\\s*4\\s*;',
                'double\\s+wynik\\s*=\\s*92\\.5\\s*;',
                'boolean\\s+online\\s*=\\s*false\\s*;',
                'System\\.out\\.println\\(',
              ],
              failureMessage: 'Program powinien zawierac cztery poprawnie zadeklarowane typy danych i jedno println.',
            },
          },
          {
            id: 'types-debug',
            kind: 'debug',
            title: 'Zadanie 3 - Napraw typy',
            scenario: 'Ten kod ma zle przypisane typy do wartosci. Popraw go.',
            instructions: [
              'Wiek nie moze byc String, a nazwa miasta nie moze byc int.',
              'Zostaw te same wartosci.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    String wiek = 20;\n    int miasto = "Warszawa";\n    System.out.println(miasto);\n  }\n}`,
            expectedOutput: 'Warszawa',
            successMessage: 'Dobrze. Umiesz juz wykryc, kiedy typ nie pasuje do wartosci.',
            hints: [
              '20 bez cudzyslowu to nie String.',
              '"Warszawa" to tekst, wiec potrzebuje typu String.',
              'Po poprawce uzyj int wiek i String miasto.',
            ],
            xp: 55,
            validation: {
              forbiddenIncludes: ['String wiek = 20;', 'int miasto = "Warszawa";'],
              requiredPatterns: ['int\\s+wiek\\s*=\\s*20\\s*;', 'String\\s+miasto\\s*=\\s*"Warszawa"\\s*;'],
              failureMessage: 'Popraw typy tak, aby liczba byla int, a tekst byl String.',
            },
          },
        ],
        skills: [
          'Rozrozniam int, double, String i boolean.',
          'Umiem dobrac typ do wartosci.',
          'Wiem, ze tekst potrzebuje cudzyslowu, a boolean przyjmuje true albo false.',
          'Rozpoznaje bledy wynikajace ze zlego typu danych.',
        ],
      })

    case 'operatory':
      return buildLesson(moduleId, {
        hookPrompt: 'Masz cene produktu i liczbe sztuk. Jak policzysz wynik bez recznego liczenia?',
        hookDetail:
          'Operatory pozwalaja programowi wykonywac obliczenia i porownania. Bez nich Java umialaby tylko przechowywac dane, ale nie moglaby nic z nimi zrobic.',
        coreStatement: 'Operatory lacza wartosci i pozwalaja liczyc, porownywac oraz budowac proste warunki.',
        paragraphs: [
          'Operator +, -, * i / sluzy do obliczen na liczbach. Operator % daje reszte z dzielenia, co przydaje sie czesciej, niz wydaje sie na poczatku.',
          'Operatory porownania, takie jak >, < czy ==, zwracaja wartosc true albo false. To wlasnie one przygotowuja grunt pod instrukcje warunkowe.',
          'Na tym etapie liczy sie to, zeby zobaczyc roznice miedzy liczeniem wyniku a sprawdzaniem, czy wynik spelnia warunek.',
        ],
        analogy: {
          title: 'Analogia',
          body: 'Operatory dzialaja jak znaki na kalkulatorze. Same liczby nie wystarcza, dopiero znak mowi, czy dodajesz, mnozysz czy porownujesz.',
        },
        warning: '== sprawdza rownosc, a = przypisuje wartosc. To dwa rozne znaki z roznym zadaniem.',
        showIntro: 'Najpierw policzysz prosty wynik, a potem zobaczysz polaczenie obliczen z porownaniem.',
        examples: [
          {
            id: 'operators-a',
            label: 'Przyklad A',
            title: 'Proste obliczenie',
            description: 'Program liczy cene kilku sztuk tego samego produktu.',
            whyItWorks: 'Najpierw przechowujesz dane w zmiennych, potem laczysz je operatorem *.',
            code: `public class Main {\n  public static void main(String[] args) {\n    int cena = 12;\n    int sztuki = 3;\n    int razem = cena * sztuki;\n\n    System.out.println("Razem: " + razem);\n  }\n}`,
            output: 'Razem: 36',
          },
          {
            id: 'operators-b',
            label: 'Przyklad B',
            title: 'Obliczenie i porownanie',
            description: 'Po obliczeniu wyniku program od razu sprawdza, czy gracz ma dosc punktow.',
            whyItWorks: 'Jedne operatory licza, inne odpowiadaja na pytanie prawda czy falsz.',
            code: `public class Main {\n  public static void main(String[] args) {\n    int punkty = 120;\n    int koszt = 90;\n    boolean stacGo = punkty >= koszt;\n\n    System.out.println("Czy stac go na zakup? " + stacGo);\n  }\n}`,
            output: 'Czy stac go na zakup? true',
          },
        ],
        practiceIntro: 'W zadaniach przechodzisz od prostych obliczen do porownania wyniku i naprawienia zlego operatora.',
        tasks: [
          {
            id: 'operators-fill',
            kind: 'fill_blank',
            title: 'Zadanie 1 - Uzupelnij operator',
            scenario: 'Program ma policzyc laczna liczbe punktow po zdobyciu bonusu.',
            instructions: [
              'Uzyj operatora + do dodania punktow i bonusu.',
              'Zapisz wynik w zmiennej razem.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    int punkty = 40;\n    int bonus = 15;\n    int razem = punkty _____ bonus;\n    System.out.println("Razem: " + razem);\n  }\n}`,
            expectedOutput: 'Razem: 55',
            successMessage: 'Dobrze. Wiesz juz, jak wykorzystac operator do zbudowania nowej wartosci.',
            hints: [
              'Tutaj nie chodzi o porownanie, tylko o dodanie liczb.',
              'Potrzebujesz zwyklego operatora +.',
              'Poprawna linia to: int razem = punkty + bonus;',
            ],
            xp: 35,
            validation: {
              placeholdersDisallowed: true,
              requiredPatterns: ['int\\s+razem\\s*=\\s*punkty\\s*\\+\\s*bonus\\s*;'],
              failureMessage: 'Do zsumowania punktow i bonusu potrzebujesz operatora +.',
            },
          },
          {
            id: 'operators-scratch',
            kind: 'scratch',
            title: 'Zadanie 2 - Policz wynik i sprawdz warunek',
            scenario: 'Policz laczna cene zakupow i sprawdz, czy przekracza 50.',
            instructions: [
              'Utworz zmienne cena i sztuki.',
              'Policz razem przez mnozenie.',
              'Utworz boolean duzyKoszyk z warunkiem razem > 50.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
            expectedOutput: 'true',
            successMessage: 'Masz juz program, ktory nie tylko liczy, ale tez ocenia wynik przez operator porownania.',
            hints: [
              'Mnozenie wykonasz operatorem *.',
              'Warunek logiczny powinien korzystac z operatora >.',
              'Przykladowy zapis: boolean duzyKoszyk = razem > 50;',
            ],
            xp: 45,
            validation: {
              requiredPatterns: [
                'int\\s+cena\\s*=',
                'int\\s+sztuki\\s*=',
                'int\\s+razem\\s*=\\s*cena\\s*\\*\\s*sztuki\\s*;',
                'boolean\\s+duzyKoszyk\\s*=\\s*razem\\s*>\\s*50\\s*;',
              ],
              failureMessage: 'Program powinien liczyc wynik operatorem * i sprawdzac warunek przez >.',
            },
          },
          {
            id: 'operators-debug',
            kind: 'debug',
            title: 'Zadanie 3 - Napraw zly operator',
            scenario: 'Kod ma sprawdzac rownosc, ale przez pomylke przypisuje wartosc.',
            instructions: [
              'Popraw warunek tak, aby porownywal wynik z 10.',
              'Nie zmieniaj nazwy zmiennej rowneDziesiec.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    int wynik = 10;\n    boolean rowneDziesiec = wynik = 10;\n    System.out.println(rowneDziesiec);\n  }\n}`,
            expectedOutput: 'true',
            successMessage: 'Dobrze. Odróżniasz juz przypisanie od porownania.',
            hints: [
              'Jedno = przypisuje wartosc.',
              'Do porownania potrzebujesz operatora ==.',
              'Popraw warunek na: wynik == 10',
            ],
            xp: 55,
            validation: {
              forbiddenIncludes: ['boolean rowneDziesiec = wynik = 10;'],
              requiredPatterns: ['boolean\\s+rowneDziesiec\\s*=\\s*wynik\\s*==\\s*10\\s*;'],
              failureMessage: 'Do sprawdzania rownosci uzyj operatora ==, nie pojedynczego =.',
            },
          },
        ],
        skills: [
          'Umiem uzyc operatorow arytmetycznych do obliczen.',
          'Rozumiem, ze operatory porownania zwracaja true albo false.',
          'Wiem, czym rozni sie = od ==.',
          'Potrafie zbudowac proste obliczenie i warunek w jednym programie.',
        ],
      })

    case 'scanner':
      return buildLesson(moduleId, {
        hookPrompt: 'Co z tego, ze program cos wypisuje, skoro nie potrafi nic przyjac od uzytkownika?',
        hookDetail:
          'W tej lekcji wchodzisz w pierwszy prawdziwy dialog z programem. Scanner pozwala pobrac dane wpisane z klawiatury i zareagowac na nie w kodzie.',
        coreStatement: 'Scanner pobiera dane od uzytkownika i zapisuje je do zmiennych.',
        paragraphs: [
          'Zeby uzyc Scannera, najpierw importujesz klase z java.util, a potem tworzysz obiekt oparty o System.in.',
          'Nastepnie wywolujesz metody takie jak nextLine albo nextInt, aby pobrac konkretna wartosc od uzytkownika i zapisac ja do zmiennej.',
          'To moment, w ktorym program przestaje byc tylko sekwencja stalych komunikatow i zaczyna reagowac na dane z zewnatrz.',
        ],
        analogy: {
          title: 'Analogia',
          body: 'Scanner dziala jak recepcjonista, ktory odbiera informacje od goscia i przekazuje je dalej do systemu.',
        },
        warning: 'Pamietaj o imporcie java.util.Scanner. Bez niego Java nie bedzie wiedziala, czym jest Scanner.',
        showIntro: 'Najpierw zobacz sam szkielet Scannera, a potem prosty program powitalny oparty o wpisane imie.',
        examples: [
          {
            id: 'scanner-a',
            label: 'Przyklad A',
            title: 'Minimalny Scanner',
            description: 'Najmniejszy poprawny setup do pobrania tekstu od uzytkownika.',
            whyItWorks: 'Importujesz klase, tworzysz obiekt i od razu pobierasz jedna wartosc przez nextLine.',
            code: `import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    String imie = scanner.nextLine();\n\n    System.out.println("Hej, " + imie);\n  }\n}`,
            output: 'Hej, Kuba',
            stdin: 'Kuba\n',
          },
          {
            id: 'scanner-b',
            label: 'Przyklad B',
            title: 'Imie i wiek',
            description: 'Program pobiera dwa pola i od razu sklada z nich odpowiedz.',
            whyItWorks: 'Scanner moze pobrac kilka danych po kolei i zapisac je do roznych zmiennych.',
            code: `import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    String imie = scanner.nextLine();\n    int wiek = scanner.nextInt();\n\n    System.out.println(imie + " ma " + wiek + " lat.");\n  }\n}`,
            output: 'Kuba ma 20 lat.',
            stdin: 'Kuba\n20\n',
          },
        ],
        practiceIntro: 'W zadaniach uruchamiasz sam szkielet Scannera, pobierasz dane i poprawiasz brakujacy import.',
        tasks: [
          {
            id: 'scanner-fill',
            kind: 'fill_blank',
            title: 'Zadanie 1 - Uzupelnij setup Scannera',
            scenario: 'Program ma pobrac jedno imie od uzytkownika.',
            instructions: [
              'Uzupelnij import klasy Scanner.',
              'Utworz obiekt scanner oparty o System.in.',
            ],
            starterCode: `import _____;\n\npublic class Main {\n  public static void main(String[] args) {\n    _____ scanner = new Scanner(System.in);\n    String imie = scanner.nextLine();\n    System.out.println(imie);\n  }\n}`,
            expectedOutput: 'Kuba',
            stdin: 'Kuba\n',
            successMessage: 'Dobrze. Masz juz poprawny szkielet kodu do pobierania danych.',
            hints: [
              'Import powinien wskazywac na java.util.Scanner.',
              'Typ obiektu tez nazywa sie Scanner.',
              'Potrzebujesz: import java.util.Scanner; i Scanner scanner = new Scanner(System.in);',
            ],
            xp: 35,
            validation: {
              placeholdersDisallowed: true,
              requiredIncludes: ['import java.util.Scanner;', 'Scanner scanner = new Scanner(System.in);'],
              failureMessage: 'Uzupelnij import java.util.Scanner i deklaracje obiektu scanner.',
            },
          },
          {
            id: 'scanner-scratch',
            kind: 'scratch',
            title: 'Zadanie 2 - Pobierz imie i przywitaj uzytkownika',
            scenario: 'Napisz program, ktory pobiera imie przez Scanner i wyswietla powitanie.',
            instructions: [
              'Importuj Scanner.',
              'Pobierz String imie przez nextLine.',
              'Wypisz komunikat: Czesc, [imie]',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
            expectedOutput: 'Czesc, Kuba',
            stdin: 'Kuba\n',
            successMessage: 'Masz juz program, ktory czyta dane od uzytkownika i reaguje na nie w outputcie.',
            hints: [
              'Zacznij od import java.util.Scanner; nad klasa Main.',
              'Potrzebujesz Scanner scanner = new Scanner(System.in); oraz String imie = scanner.nextLine();',
              'W println uzyj tekstu "Czesc, " polaczonego z imie.',
            ],
            xp: 45,
            validation: {
              requiredIncludes: ['import java.util.Scanner;'],
              requiredPatterns: [
                'Scanner\\s+scanner\\s*=\\s*new\\s+Scanner\\(System\\.in\\)\\s*;',
                'String\\s+imie\\s*=\\s*scanner\\.nextLine\\(\\)\\s*;',
                'System\\.out\\.println\\(',
              ],
              failureMessage: 'Program powinien importowac Scanner, pobrac imie przez nextLine i wypisac powitanie.',
            },
          },
          {
            id: 'scanner-debug',
            kind: 'debug',
            title: 'Zadanie 3 - Napraw brakujacy import',
            scenario: 'Kod tworzy Scanner, ale Java nie wie jeszcze, skad ta klasa pochodzi.',
            instructions: [
              'Dodaj brakujacy import na poczatku pliku.',
              'Nie zmieniaj reszty kodu.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    int wiek = scanner.nextInt();\n    System.out.println(wiek);\n  }\n}`,
            expectedOutput: '20',
            stdin: '20\n',
            successMessage: 'Dobrze. Wiesz juz, ze przy pracy z nowa klasa czesto trzeba dodac odpowiedni import.',
            hints: [
              'Scanner nie jest wbudowany automatycznie do kazdego pliku.',
              'Potrzebujesz importu z pakietu java.util.',
              'Dodaj na gorze pliku: import java.util.Scanner;',
            ],
            xp: 55,
            validation: {
              requiredIncludes: ['import java.util.Scanner;'],
              requiredPatterns: ['Scanner\\s+scanner\\s*=\\s*new\\s+Scanner\\(System\\.in\\)\\s*;'],
              failureMessage: 'Dodaj import java.util.Scanner; na poczatku pliku.',
            },
          },
        ],
        skills: [
          'Wiem, po co sluzy Scanner.',
          'Umiem zaimportowac java.util.Scanner.',
          'Potrafie pobrac tekst przez nextLine i liczbe przez nextInt.',
          'Rozumiem, jak zapisac wpisane dane do zmiennej.',
        ],
      })

    case 'if-else':
      return buildLesson(moduleId, {
        hookPrompt: 'Skad program ma wiedziec, czy pokazac rabat, czy komunikat "za malo punktow"?',
        hookDetail:
          'Instrukcja if/else to pierwszy moment, w ktorym program podejmuje decyzje na podstawie warunku, a nie wykonuje zawsze dokladnie ten sam kod.',
        coreStatement: 'if/else pozwala wykonac inny kod, gdy warunek jest prawdziwy, a inny, gdy jest falszywy.',
        paragraphs: [
          'Warunek w if zwraca true albo false. Jesli wynik to true, Java wykonuje blok if. W przeciwnym razie przechodzi do else.',
          'Najwazniejsze jest to, zeby warunek byl czytelny i oparty o dane, ktore juz masz w programie, na przyklad wiek, wynik albo liczbe punktow.',
          'if/else daje Ci pierwszy prawdziwy mechanizm reagowania na sytuacje, a nie tylko wyswietlania z gory ustalonych komunikatow.',
        ],
        analogy: {
          title: 'Analogia',
          body: 'To jak bramka na lotnisku. Jesli bilet jest wazny, wpuszcza cie dalej. Jesli nie, kieruje do innej kolejki.',
        },
        warning: 'Warunek musi byc w nawiasach. Sam else nie potrzebuje warunku, bo jest planem awaryjnym.',
        showIntro: 'Najpierw prosty warunek z wiekiem, potem bardziej realistyczny komunikat o punktach.',
        examples: [
          {
            id: 'if-a',
            label: 'Przyklad A',
            title: 'Pelnoletni albo nie',
            description: 'Program wybiera jedna z dwoch sciezek na podstawie wieku.',
            whyItWorks: 'if sprawdza wiek, a else przejmuje stery, gdy warunek nie jest spelniony.',
            code: `public class Main {\n  public static void main(String[] args) {\n    int wiek = 20;\n\n    if (wiek >= 18) {\n      System.out.println("Mozesz wejsc.");\n    } else {\n      System.out.println("Jeszcze nie teraz.");\n    }\n  }\n}`,
            output: 'Mozesz wejsc.',
          },
          {
            id: 'if-b',
            label: 'Przyklad B',
            title: 'Zakup za punkty',
            description: 'Program decyduje, czy gracz ma wystarczajaco duzo punktow.',
            whyItWorks: 'Warunek porownuje dwie liczby i od razu kieruje program na odpowiednia sciezke.',
            code: `public class Main {\n  public static void main(String[] args) {\n    int punkty = 70;\n    int koszt = 90;\n\n    if (punkty >= koszt) {\n      System.out.println("Zakup dostepny.");\n    } else {\n      System.out.println("Za malo punktow.");\n    }\n  }\n}`,
            output: 'Za malo punktow.',
          },
        ],
        practiceIntro: 'W zadaniach uzupelniasz warunek, piszesz wlasny if/else i poprawiasz zla skladnie bloku warunkowego.',
        tasks: [
          {
            id: 'if-fill',
            kind: 'fill_blank',
            title: 'Zadanie 1 - Uzupelnij warunek',
            scenario: 'Program ma wypisac "Dorosly", gdy wiek jest co najmniej 18.',
            instructions: [
              'Uzupelnij operator porownania w warunku.',
              'Nie zmieniaj reszty kodu.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    int wiek = 18;\n\n    if (wiek _____ 18) {\n      System.out.println("Dorosly");\n    } else {\n      System.out.println("Niepelnoletni");\n    }\n  }\n}`,
            expectedOutput: 'Dorosly',
            successMessage: 'Dobrze. Rozumiesz juz, jak wyglada prosty warunek graniczny.',
            hints: [
              'Wiek 18 ma przejsc przez warunek.',
              'Potrzebujesz operatora wieksze lub rowne.',
              'Uzupelnij znak >=.',
            ],
            xp: 35,
            validation: {
              placeholdersDisallowed: true,
              requiredPatterns: ['if\\s*\\(\\s*wiek\\s*>=\\s*18\\s*\\)'],
              failureMessage: 'Warunek powinien sprawdzac, czy wiek jest wiekszy lub rowny 18.',
            },
          },
          {
            id: 'if-scratch',
            kind: 'scratch',
            title: 'Zadanie 2 - Napisz wlasny if/else',
            scenario: 'Jesli liczba punktow jest co najmniej 100, wypisz "Nagroda odblokowana", w przeciwnym razie "Zbieraj dalej".',
            instructions: [
              'Utworz zmienna int punkty z wartoscia 120.',
              'Napisz if/else z warunkiem punkty >= 100.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
            expectedOutput: 'Nagroda odblokowana',
            successMessage: 'Masz juz wlasna decyzje programu oparta o warunek.',
            hints: [
              'Najpierw zadeklaruj int punkty = 120;',
              'Warunek powinien wygladac jak punkty >= 100.',
              'Potrzebujesz dwoch blokow: if i else.',
            ],
            xp: 45,
            validation: {
              requiredPatterns: [
                'int\\s+punkty\\s*=\\s*120\\s*;',
                'if\\s*\\(\\s*punkty\\s*>=\\s*100\\s*\\)',
                'else',
              ],
              requiredIncludes: ['System.out.println("Nagroda odblokowana");', 'System.out.println("Zbieraj dalej");'],
              failureMessage: 'Program powinien miec zmienna punkty oraz pelny blok if/else z dwoma komunikatami.',
            },
          },
          {
            id: 'if-debug',
            kind: 'debug',
            title: 'Zadanie 3 - Napraw skladnie if',
            scenario: 'Kod ma zly zapis warunku i brakujacy nawias.',
            instructions: [
              'Dodaj nawiasy do warunku if.',
              'Upewnij sie, ze println konczy sie srednikiem.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    int wynik = 8;\n\n    if wynik > 5 {\n      System.out.println("Zdane")\n    } else {\n      System.out.println("Jeszcze nie");\n    }\n  }\n}`,
            expectedOutput: 'Zdane',
            successMessage: 'Dobrze. Potrafisz juz poprawic bledny zapis instrukcji warunkowej.',
            hints: [
              'Warunek if zawsze stoi w nawiasach ().',
              'println potrzebuje srednika na koncu.',
              'Poprawna forma to: if (wynik > 5) { ... }',
            ],
            xp: 55,
            validation: {
              forbiddenIncludes: ['if wynik > 5'],
              requiredPatterns: ['if\\s*\\(\\s*wynik\\s*>\\s*5\\s*\\)'],
              requiredIncludes: ['System.out.println("Zdane");'],
              failureMessage: 'Napraw skladnie instrukcji if i zamknij println srednikiem.',
            },
          },
        ],
        skills: [
          'Rozumiem, jak dziala if/else.',
          'Umiem zapisac prosty warunek logiczny.',
          'Potrafie przygotowac dwie sciezki programu na wypadek true i false.',
          'Rozpoznaje typowe bledy skladni w if/else.',
        ],
      })

    case 'switch':
      return buildLesson(moduleId, {
        hookPrompt: 'Masz jeden numer dnia tygodnia. Czy chcesz pisac siedem osobnych ifow?',
        hookDetail:
          'switch przydaje sie wtedy, gdy jedna zmienna moze przyjmowac kilka konkretnych wartosci, a kazda z nich prowadzi do innej odpowiedzi programu.',
        coreStatement: 'switch wybiera jedna sciezke programu na podstawie konkretnej wartosci.',
        paragraphs: [
          'Zamiast wielu kolejnych ifow sprawdzajacych ten sam identyfikator, mozesz uzyc switch i wypisac rozne przypadki jako case.',
          'Kazdy case odpowiada jednej konkretnej wartosci, a break zatrzymuje dalsze przechodzenie do kolejnych caseow.',
          'switch nie zastepuje kazdego ifa, ale jest bardzo czytelny wtedy, gdy wybierasz miedzy kilkoma znanymi opcjami.',
        ],
        analogy: {
          title: 'Analogia',
          body: 'To jak panel z przyciskami w windzie. Wciskasz jedna liczbe i system wie, na ktore pietro ma jechac.',
        },
        warning: 'Bez break program przejdzie do kolejnych caseow. To jeden z najczestszych bledow poczatkujacych.',
        showIntro: 'Najpierw prosty switch dla dnia, a potem menu opcji w mini-aplikacji.',
        examples: [
          {
            id: 'switch-a',
            label: 'Przyklad A',
            title: 'Dzien tygodnia',
            description: 'Jedna liczba prowadzi do jednej konkretnej odpowiedzi.',
            whyItWorks: 'switch grupuje wszystkie mozliwe odpowiedzi wokol jednej zmiennej.',
            code: `public class Main {\n  public static void main(String[] args) {\n    int dzien = 2;\n\n    switch (dzien) {\n      case 1:\n        System.out.println("Poniedzialek");\n        break;\n      case 2:\n        System.out.println("Wtorek");\n        break;\n      default:\n        System.out.println("Inny dzien");\n    }\n  }\n}`,
            output: 'Wtorek',
          },
          {
            id: 'switch-b',
            label: 'Przyklad B',
            title: 'Menu aplikacji',
            description: 'Program obsluguje wybor jednej z kilku opcji.',
            whyItWorks: 'Kazdy case odpowiada jednej komendzie i latwo go rozbudowac bez kaskady ifow.',
            code: `public class Main {\n  public static void main(String[] args) {\n    int opcja = 3;\n\n    switch (opcja) {\n      case 1:\n        System.out.println("Start");\n        break;\n      case 2:\n        System.out.println("Ustawienia");\n        break;\n      case 3:\n        System.out.println("Wyjscie");\n        break;\n      default:\n        System.out.println("Brak opcji");\n    }\n  }\n}`,
            output: 'Wyjscie',
          },
        ],
        practiceIntro: 'W zadaniach dopisujesz case, tworzysz wlasny switch i poprawiasz brakujace break.',
        tasks: [
          {
            id: 'switch-fill',
            kind: 'fill_blank',
            title: 'Zadanie 1 - Uzupelnij case',
            scenario: 'Program ma wypisac "Sroda" dla wartosci 3.',
            instructions: [
              'Uzupelnij numer case dla srody.',
              'Zostaw break na koncu bloku.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    int dzien = 3;\n\n    switch (dzien) {\n      case _____:\n        System.out.println("Sroda");\n        break;\n      default:\n        System.out.println("Inny dzien");\n    }\n  }\n}`,
            expectedOutput: 'Sroda',
            successMessage: 'Dobrze. Potrafisz juz dopasowac konkretna wartosc do konkretnego case.',
            hints: [
              'Program ma trafic w przypadek dla liczby 3.',
              'Musisz wpisac sama liczbe, bez dodatkowych znakow.',
              'Poprawny zapis to: case 3:',
            ],
            xp: 35,
            validation: {
              placeholdersDisallowed: true,
              requiredPatterns: ['case\\s+3\\s*:'],
              failureMessage: 'Case dla srody powinien miec wartosc 3.',
            },
          },
          {
            id: 'switch-scratch',
            kind: 'scratch',
            title: 'Zadanie 2 - Napisz switch dla menu',
            scenario: 'Dla opcji 2 program ma wypisac "Profil", w przeciwnym razie "Nieznana opcja".',
            instructions: [
              'Utworz zmienna int opcja = 2.',
              'Napisz switch z case 2 i default.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
            expectedOutput: 'Profil',
            successMessage: 'Masz juz wlasny switch, ktory wybiera poprawna sciezke dla jednej opcji.',
            hints: [
              'Zacznij od int opcja = 2;',
              'W switch potrzebujesz przynajmniej case 2 oraz default.',
              'Pamietaj o break po case 2.',
            ],
            xp: 45,
            validation: {
              requiredPatterns: ['int\\s+opcja\\s*=\\s*2\\s*;', 'switch\\s*\\(\\s*opcja\\s*\\)', 'case\\s+2\\s*:', 'default\\s*:'],
              requiredIncludes: ['System.out.println("Profil");', 'System.out.println("Nieznana opcja");'],
              failureMessage: 'Program powinien miec zmienna opcja, switch, case 2, default i break.',
            },
          },
          {
            id: 'switch-debug',
            kind: 'debug',
            title: 'Zadanie 3 - Napraw brakujacy break',
            scenario: 'Kod ma wypisac jedna opcje, ale przechodzi do kolejnego case.',
            instructions: [
              'Dodaj brakujacy break po case 1.',
              'Zostaw reszte kodu bez zmian.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    int opcja = 1;\n\n    switch (opcja) {\n      case 1:\n        System.out.println("Start");\n      case 2:\n        System.out.println("Profil");\n        break;\n      default:\n        System.out.println("Brak");\n    }\n  }\n}`,
            expectedOutput: 'Start',
            successMessage: 'Dobrze. Wylapales jeden z najwazniejszych detalow pracy ze switch.',
            hints: [
              'Po case 1 program powinien sie zatrzymac.',
              'Brakuje break tuz po pierwszym println.',
              'Dodaj break po komunikacie Start.',
            ],
            xp: 55,
            validation: {
              requiredPatterns: ['case\\s+1\\s*:[\\s\\S]*System\\.out\\.println\\("Start"\\);[\\s\\S]*break;'],
              failureMessage: 'Po case 1 dodaj break, aby program nie lecial dalej do case 2.',
            },
          },
        ],
        skills: [
          'Rozumiem, kiedy switch jest czytelniejszy niz kilka ifow.',
          'Umiem zapisac case, default i break.',
          'Potrafie obsluzyc kilka mozliwych wartosci jednej zmiennej.',
          'Wiem, dlaczego brak break powoduje bledne przejscie do kolejnego przypadku.',
        ],
      })

    case 'petle':
      return buildLesson(moduleId, {
        hookPrompt: 'Chcesz wypisac liczby od 1 do 10. Serio bedziesz pisac 10 osobnych println?',
        hookDetail:
          'Petle pozwalaja powtarzac ten sam fragment kodu wiele razy bez kopiowania go recznie. To jedna z najwazniejszych oszczednosci w programowaniu.',
        coreStatement: 'Petla powtarza blok kodu tyle razy, ile wymaga warunek.',
        paragraphs: [
          'for sprawdza sie wtedy, gdy znasz liczbe powtorzen i chcesz sterowac licznikiem. while jest wygodna, gdy bardziej interesuje Cie sam warunek niz licznik.',
          'Petla laczy trzy elementy: start, warunek zatrzymania i zmiane stanu, ktora przybliza program do konca petli.',
          'Najwazniejsze na poczatku jest to, zeby rozumiec kolejny numer obiegu i nie zgubic momentu, w ktorym petla ma sie zakonczyc.',
        ],
        analogy: {
          title: 'Analogia',
          body: 'To jak odliczanie kolejnych pompek podczas treningu. Dopoki licznik nie dojdzie do celu, robisz kolejna powtorke.',
        },
        warning: 'Jesli zapomnisz zmieniac wartosc sterujaca albo ustawisz zly warunek, petla moze nigdy sie nie skonczyc.',
        showIntro: 'Najpierw petla for z licznikiem, a potem while, ktora powtarza sie dopoki warunek jest prawdziwy.',
        examples: [
          {
            id: 'loop-a',
            label: 'Przyklad A',
            title: 'for od 1 do 3',
            description: 'Prosty licznik pokazuje trzy kolejne obiegi petli.',
            whyItWorks: 'for ustawia licznik, sprawdza warunek i zwieksza licznik po kazdym obiegu.',
            code: `public class Main {\n  public static void main(String[] args) {\n    for (int i = 1; i <= 3; i++) {\n      System.out.println(i);\n    }\n  }\n}`,
            output: '1\n2\n3',
          },
          {
            id: 'loop-b',
            label: 'Przyklad B',
            title: 'while z energia',
            description: 'Program powtarza komunikat, dopoki energia jest wieksza od zera.',
            whyItWorks: 'Warunek while sprawdzany jest przed kazdym obiegiem, a energia spada wewnatrz petli.',
            code: `public class Main {\n  public static void main(String[] args) {\n    int energia = 3;\n\n    while (energia > 0) {\n      System.out.println("Energia: " + energia);\n      energia--;\n    }\n  }\n}`,
            output: 'Energia: 3\nEnergia: 2\nEnergia: 1',
          },
        ],
        practiceIntro: 'W zadaniach uzupelniasz licznik, tworzysz wlasna petle for i poprawiasz petle, ktora nie zmienia licznika.',
        tasks: [
          {
            id: 'loop-fill',
            kind: 'fill_blank',
            title: 'Zadanie 1 - Uzupelnij petle for',
            scenario: 'Program ma wypisac liczby od 1 do 5.',
            instructions: [
              'Uzupelnij warunek w petli.',
              'Nie zmieniaj licznika poczatkowego ani inkrementacji.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    for (int i = 1; i _____ 5; i++) {\n      System.out.println(i);\n    }\n  }\n}`,
            expectedOutput: '1\n2\n3\n4\n5',
            successMessage: 'Dobrze. Rozumiesz juz, jaki warunek pozwala petli przejsc od 1 do 5.',
            hints: [
              'Liczba 5 ma zostac jeszcze wypisana.',
              'Potrzebujesz warunku mniejsze lub rowne.',
              'Uzupelnij znak <=.',
            ],
            xp: 35,
            validation: {
              placeholdersDisallowed: true,
              requiredPatterns: ['for\\s*\\(\\s*int\\s+i\\s*=\\s*1\\s*;\\s*i\\s*<=\\s*5\\s*;\\s*i\\+\\+\\s*\\)'],
              failureMessage: 'Petla powinna miec warunek i <= 5.',
            },
          },
          {
            id: 'loop-scratch',
            kind: 'scratch',
            title: 'Zadanie 2 - Napisz petle for',
            scenario: 'Wypisz trzy razy komunikat "Runda".',
            instructions: [
              'Uzyj petli for.',
              'Nie kopiuj trzech osobnych println.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
            expectedOutput: 'Runda\nRunda\nRunda',
            successMessage: 'Masz juz kod, ktory powtarza sie przez petle zamiast przez kopiowanie tych samych linii.',
            hints: [
              'Petla moze zaczynac od int i = 0 i konczyc sie przy i < 3.',
              'Wewnatrz petli wystarczy jeden println z tekstem "Runda".',
              'Najwazniejsze, zeby to byla prawdziwa petla for.',
            ],
            xp: 45,
            validation: {
              requiredPatterns: ['for\\s*\\(', 'i\\+\\+'],
              requiredIncludes: ['System.out.println("Runda");'],
              failureMessage: 'Uzyj petli for i jednego println z tekstem "Runda".',
            },
          },
          {
            id: 'loop-debug',
            kind: 'debug',
            title: 'Zadanie 3 - Napraw petle while',
            scenario: 'Petla while nie zmienia licznika i moze wykonac sie w nieskonczonosc.',
            instructions: [
              'Dodaj zmiane licznika wewnatrz petli.',
              'Nie zmieniaj warunku ani wartosci poczatkowej.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    int licznik = 3;\n\n    while (licznik > 0) {\n      System.out.println(licznik);\n    }\n  }\n}`,
            expectedOutput: '3\n2\n1',
            successMessage: 'Dobrze. Wiesz juz, ze petla potrzebuje zmiany stanu, zeby dojsc do konca.',
            hints: [
              'Licznik musi malec po kazdym obiegu.',
              'Mozesz uzyc licznik--; wewnatrz petli.',
              'Dodaj dekrementacje pod println.',
            ],
            xp: 55,
            validation: {
              requiredIncludes: ['licznik--;'],
              requiredPatterns: ['while\\s*\\(\\s*licznik\\s*>\\s*0\\s*\\)'],
              failureMessage: 'Dodaj licznik--; w srodku petli, aby while mogla sie zakonczyc.',
            },
          },
        ],
        skills: [
          'Rozumiem, po co uzywamy petli.',
          'Umiem zapisac podstawowa petle for.',
          'Wiem, ze while potrzebuje warunku i zmiany stanu.',
          'Potrafie wykryc blad, ktory prowadzi do nieskonczonej petli.',
        ],
      })

    case 'metody':
      return buildLesson(moduleId, {
        hookPrompt: 'Czy naprawde chcesz kopiowac ten sam kawalek kodu w trzech miejscach?',
        hookDetail:
          'Metody pozwalaja wydzielic fragment zachowania pod jedna nazwa i uruchamiac go wtedy, gdy jest potrzebny.',
        coreStatement: 'Metoda to nazwany blok kodu, ktory mozesz wywolac z innego miejsca programu.',
        paragraphs: [
          'Zamiast przepisywac ten sam kod wielokrotnie, zamykasz go w metodzie. Potem wystarczy jedno wywolanie, zeby uruchomic caly blok.',
          'Metoda moze byc bez parametrow albo przyjmowac dane, ale na poczatku najwazniejsze jest samo oddzielenie odpowiedzialnosci.',
          'Dzieki metodom program robi sie krotszy, bardziej czytelny i latwiejszy do rozbudowy.',
        ],
        analogy: {
          title: 'Analogia',
          body: 'To jak przycisk w windzie. Nie budujesz calego mechanizmu za kazdym razem, tylko naciskasz jedna nazwe i system robi reszte.',
        },
        warning: 'Najpierw deklarujesz metode, a dopiero potem ja wywolujesz. Sama deklaracja niczego jeszcze nie uruchamia.',
        showIntro: 'Najpierw zobacz metode bez parametrow, a potem metode, ktora przyjmuje imie.',
        examples: [
          {
            id: 'methods-a',
            label: 'Przyklad A',
            title: 'Jedna metoda pomocnicza',
            description: 'Program wydziela powitanie do osobnej metody.',
            whyItWorks: 'main nie musi zawierac wszystkiego. Czesc zachowania mozesz nazwac i przeniesc do osobnego bloku.',
            code: `public class Main {\n  public static void pokazStart() {\n    System.out.println("Start aplikacji");\n  }\n\n  public static void main(String[] args) {\n    pokazStart();\n  }\n}`,
            output: 'Start aplikacji',
          },
          {
            id: 'methods-b',
            label: 'Przyklad B',
            title: 'Metoda z parametrem',
            description: 'To samo zachowanie, ale z danymi przekazanymi przy wywolaniu.',
            whyItWorks: 'Jedna metoda moze obsluzyc wiele roznych osob bez kopiowania kolejnych println.',
            code: `public class Main {\n  public static void powitaj(String imie) {\n    System.out.println("Czesc, " + imie);\n  }\n\n  public static void main(String[] args) {\n    powitaj("Ola");\n  }\n}`,
            output: 'Czesc, Ola',
          },
        ],
        practiceIntro: 'W zadaniach dopisujesz nazwe metody, tworzysz wlasna metode i poprawiasz bledne wywolanie.',
        tasks: [
          {
            id: 'methods-fill',
            kind: 'fill_blank',
            title: 'Zadanie 1 - Uzupelnij metode',
            scenario: 'Program ma miec metode start i wywolac ja w main.',
            instructions: [
              'Uzupelnij nazwe metody w deklaracji i w wywolaniu.',
              'Zostaw tresc println bez zmian.',
            ],
            starterCode: `public class Main {\n  public static void _____() {\n    System.out.println("Start");\n  }\n\n  public static void main(String[] args) {\n    _____();\n  }\n}`,
            expectedOutput: 'Start',
            successMessage: 'Dobrze. Rozumiesz juz polaczenie deklaracji metody z jej wywolaniem.',
            hints: [
              'Ta sama nazwa musi pojawic sie dwa razy.',
              'Najprostsza nazwa tutaj to start.',
              'Uzupelnij deklaracje start() oraz wywolanie start();',
            ],
            xp: 35,
            validation: {
              placeholdersDisallowed: true,
              requiredPatterns: ['public\\s+static\\s+void\\s+start\\s*\\(', 'start\\s*\\(\\s*\\)\\s*;'],
              failureMessage: 'Uzyj tej samej nazwy metody w deklaracji i wywolaniu, na przyklad start.',
            },
          },
          {
            id: 'methods-scratch',
            kind: 'scratch',
            title: 'Zadanie 2 - Napisz metode z parametrem',
            scenario: 'Utworz metode powitaj, ktora przyjmuje imie i wypisuje "Hej, [imie]".',
            instructions: [
              'Metoda ma nazywac sie powitaj i przyjmowac String imie.',
              'Wywolaj metode dla wartosci "Ania".',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
            expectedOutput: 'Hej, Ania',
            successMessage: 'Masz juz metode, ktora przyjmuje dane i korzysta z nich w srodku swojego ciala.',
            hints: [
              'Deklaracja moze wygladac tak: public static void powitaj(String imie) { ... }',
              'Wewnatrz metody uzyj println z tekstem "Hej, " + imie.',
              'Na koncu wywolaj powitaj("Ania");',
            ],
            xp: 45,
            validation: {
              requiredPatterns: [
                'public\\s+static\\s+void\\s+powitaj\\s*\\(\\s*String\\s+imie\\s*\\)',
                'powitaj\\s*\\(\\s*"Ania"\\s*\\)\\s*;',
              ],
              requiredIncludes: ['System.out.println("Hej, " + imie);'],
              failureMessage: 'Program powinien deklarowac metode powitaj(String imie) i wywolywac ja dla "Ania".',
            },
          },
          {
            id: 'methods-debug',
            kind: 'debug',
            title: 'Zadanie 3 - Napraw wywolanie metody',
            scenario: 'Metoda istnieje, ale main probuje wywolac ja pod zla nazwa.',
            instructions: [
              'Zachowaj deklaracje metody bez zmian.',
              'Popraw wywolanie w main.',
            ],
            starterCode: `public class Main {\n  public static void pokazProfil() {\n    System.out.println("Profil gotowy");\n  }\n\n  public static void main(String[] args) {\n    pokazprofile();\n  }\n}`,
            expectedOutput: 'Profil gotowy',
            successMessage: 'Dobrze. Wiesz juz, ze nazwa metody musi zgadzac sie dokladnie w deklaracji i wywolaniu.',
            hints: [
              'Java rozroznia wielkie i male litery.',
              'W deklaracji metoda nazywa sie pokazProfil.',
              'Wywolanie tez musi byc pokazProfil();',
            ],
            xp: 55,
            validation: {
              forbiddenIncludes: ['pokazprofile();'],
              requiredIncludes: ['pokazProfil();'],
              requiredPatterns: ['public\\s+static\\s+void\\s+pokazProfil\\s*\\('],
              failureMessage: 'Popraw wywolanie tak, aby zgadzalo sie z nazwa metody pokazProfil.',
            },
          },
        ],
        skills: [
          'Rozumiem, po co wydzielamy kod do metod.',
          'Umiem napisac metode bez parametrow i z parametrem.',
          'Potrafie wywolac metode z main.',
          'Wiem, ze nazwy metod musza zgadzac sie dokladnie.',
        ],
      })

    case 'return':
      return buildLesson(moduleId, {
        hookPrompt: 'Co zrobic, gdy metoda ma nie tylko cos wykonac, ale jeszcze oddac wynik?',
        hookDetail:
          'Do tej pory metoda mogla cos wypisac. Teraz idziesz krok dalej i sprawiasz, ze metoda oddaje wartosc, z ktorej korzysta reszta programu.',
        coreStatement: 'return konczy metode i oddaje z niej konkretna wartosc.',
        paragraphs: [
          'Jesli metoda ma cos policzyc, nie zawsze chcesz od razu to wypisywac. Czesto lepiej zwrocic wynik i zdecydowac pozniej, co z nim zrobic.',
          'Typ zwracany metody musi pasowac do tego, co zwracasz po return. Metoda int nie moze oddac tekstu, a metoda String nie moze oddac liczby bez konwersji.',
          'return to wazny krok od "program cos robi" do "program buduje wynik, ktory mozna wykorzystac dalej".',
        ],
        analogy: {
          title: 'Analogia',
          body: 'To jak prosba o rachunek w restauracji. Kelner nie tylko przychodzi do stolika, ale wraca z konkretna liczba, ktora potem wykorzystujesz.',
        },
        warning: 'Metoda z return nie powinna byc typu void. Typ zwracany musi odpowiadac temu, co wraca po return.',
        showIntro: 'Najpierw zobacz metode zwracajaca liczbe, a potem mala metode budujaca tekst odpowiedzi.',
        examples: [
          {
            id: 'return-a',
            label: 'Przyklad A',
            title: 'Suma dwoch liczb',
            description: 'Metoda liczy wynik i oddaje go do miejsca wywolania.',
            whyItWorks: 'main nie liczy wszystkiego sam. Korzysta z gotowego wyniku zwroconego przez metode.',
            code: `public class Main {\n  public static int suma(int a, int b) {\n    return a + b;\n  }\n\n  public static void main(String[] args) {\n    System.out.println(suma(2, 3));\n  }\n}`,
            output: '5',
          },
          {
            id: 'return-b',
            label: 'Przyklad B',
            title: 'Zwrot gotowego komunikatu',
            description: 'Metoda buduje tekst, a main decyduje, kiedy go pokazac.',
            whyItWorks: 'return oddziela tworzenie wyniku od miejsca, w ktorym wynik jest uzywany.',
            code: `public class Main {\n  public static String statusLekcji() {\n    return "Lekcja ukonczona";\n  }\n\n  public static void main(String[] args) {\n    System.out.println(statusLekcji());\n  }\n}`,
            output: 'Lekcja ukonczona',
          },
        ],
        practiceIntro: 'W zadaniach uzupelniasz return, piszesz metode zwracajaca wynik i poprawiasz zly typ zwracany.',
        tasks: [
          {
            id: 'return-fill',
            kind: 'fill_blank',
            title: 'Zadanie 1 - Uzupelnij return',
            scenario: 'Metoda ma zwrocic liczbe 7.',
            instructions: [
              'Uzupelnij instrukcje return wewnatrz metody.',
              'Nie zmieniaj typu metody.',
            ],
            starterCode: `public class Main {\n  public static int pobierzLiczbe() {\n    return _____;\n  }\n\n  public static void main(String[] args) {\n    System.out.println(pobierzLiczbe());\n  }\n}`,
            expectedOutput: '7',
            successMessage: 'Dobrze. Wiesz juz, jak metoda oddaje liczbe do miejsca wywolania.',
            hints: [
              'Metoda ma oddac liczbe calkowita.',
              'Potrzebujesz samej wartosci 7.',
              'Uzupelnij na: return 7;',
            ],
            xp: 35,
            validation: {
              placeholdersDisallowed: true,
              requiredIncludes: ['return 7;'],
              failureMessage: 'Metoda powinna zawierac return 7;',
            },
          },
          {
            id: 'return-scratch',
            kind: 'scratch',
            title: 'Zadanie 2 - Napisz metode suma',
            scenario: 'Utworz metode suma, ktora zwraca wynik dodawania 4 i 6.',
            instructions: [
              'Metoda ma zwracac int.',
              'Wywolaj metode w println.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
            expectedOutput: '10',
            successMessage: 'Masz juz metode, ktora liczy wynik i oddaje go dalej przez return.',
            hints: [
              'Zacznij od deklaracji public static int suma().',
              'Wewnatrz metody wpisz return 4 + 6;',
              'W main uzyj System.out.println(suma());',
            ],
            xp: 45,
            validation: {
              requiredPatterns: [
                'public\\s+static\\s+int\\s+suma\\s*\\(\\s*\\)',
                'return\\s+4\\s*\\+\\s*6\\s*;',
                'System\\.out\\.println\\(\\s*suma\\s*\\(\\s*\\)\\s*\\);',
              ],
              failureMessage: 'Program powinien miec metode int suma() z return 4 + 6 i wywolywac ja w println.',
            },
          },
          {
            id: 'return-debug',
            kind: 'debug',
            title: 'Zadanie 3 - Napraw typ zwracany',
            scenario: 'Metoda zwraca tekst, ale zadeklarowana jest jako int.',
            instructions: [
              'Dopasuj typ metody do zwracanej wartosci.',
              'Nie zmieniaj samego tekstu po return.',
            ],
            starterCode: `public class Main {\n  public static int status() {\n    return "Gotowe";\n  }\n\n  public static void main(String[] args) {\n    System.out.println(status());\n  }\n}`,
            expectedOutput: 'Gotowe',
            successMessage: 'Dobrze. Rozumiesz juz, ze typ metody i typ wyniku po return musza do siebie pasowac.',
            hints: [
              'Metoda nie oddaje liczby.',
              'Tekst powinien byc zwracany przez metode typu String.',
              'Zmien deklaracje na public static String status().',
            ],
            xp: 55,
            validation: {
              forbiddenIncludes: ['public static int status()'],
              requiredPatterns: ['public\\s+static\\s+String\\s+status\\s*\\(\\s*\\)'],
              requiredIncludes: ['return "Gotowe";'],
              failureMessage: 'Zmien typ metody na String, bo return oddaje tekst "Gotowe".',
            },
          },
        ],
        skills: [
          'Rozumiem role slowa return.',
          'Umiem napisac metode zwracajaca int albo String.',
          'Potrafie wykorzystac zwrocona wartosc w println.',
          'Wiem, ze typ metody musi pasowac do tego, co oddaje return.',
        ],
      })

    case 'klasy':
      return buildLesson(moduleId, {
        hookPrompt: 'Jak zapisac dane ksiazki albo gracza tak, zeby wszystko trzymac razem, a nie w dziesieciu osobnych zmiennych?',
        hookDetail:
          'Klasa to pierwszy krok w strone programowania obiektowego. Pozwala opisac jeden typ obiektu z jego danymi i zachowaniem.',
        coreStatement: 'Klasa jest planem obiektu, a obiekt jest konkretna instancja utworzona na podstawie tego planu.',
        paragraphs: [
          'Zmienna trzyma pojedyncza wartosc, ale klasa pozwala zgrupowac kilka powiazanych danych pod jednym typem.',
          'Na podstawie klasy tworzysz obiekt przez new. Taki obiekt moze miec pola, na przyklad tytul ksiazki albo liczbe stron.',
          'To dopiero poczatek OOP, ale juz tutaj zobaczysz, jak porzadkowac dane w bardziej realistycznej strukturze.',
        ],
        analogy: {
          title: 'Analogia',
          body: 'Klasa jest jak plan domu, a obiekt jak konkretny dom zbudowany wedlug tego planu.',
        },
        warning: 'Najpierw musisz miec definicje klasy, a dopiero potem mozesz stworzyc obiekt przez new.',
        showIntro: 'Najpierw zobacz prosta klase Book, a potem obiekt gracza z kilkoma polami.',
        examples: [
          {
            id: 'class-a',
            label: 'Przyklad A',
            title: 'Klasa Book',
            description: 'Jedna klasa przechowuje dane o ksiazce.',
            whyItWorks: 'Zamiast osobnych luznych zmiennych masz jeden typ, ktory porzadkuje dane o ksiazce.',
            code: `class Book {\n  String title;\n  int pages;\n}\n\npublic class Main {\n  public static void main(String[] args) {\n    Book book = new Book();\n    book.title = "Java Start";\n    book.pages = 220;\n\n    System.out.println(book.title);\n  }\n}`,
            output: 'Java Start',
          },
          {
            id: 'class-b',
            label: 'Przyklad B',
            title: 'Obiekt gracza',
            description: 'Program laczy kilka danych gracza w jednym obiekcie.',
            whyItWorks: 'Obiekt trzyma spokrewnione pola razem, zamiast rozrzucac je po calym programie.',
            code: `class Player {\n  String nick;\n  int level;\n}\n\npublic class Main {\n  public static void main(String[] args) {\n    Player player = new Player();\n    player.nick = "Nova";\n    player.level = 5;\n\n    System.out.println(player.nick + " lvl " + player.level);\n  }\n}`,
            output: 'Nova lvl 5',
          },
        ],
        practiceIntro: 'W zadaniach uzupelniasz pola klasy, tworzysz obiekt i poprawiasz zla nazwe typu obiektu.',
        tasks: [
          {
            id: 'class-fill',
            kind: 'fill_blank',
            title: 'Zadanie 1 - Uzupelnij pola klasy',
            scenario: 'Klasa Book ma przechowywac tytul i liczbe stron.',
            instructions: [
              'Uzupelnij typ String dla title.',
              'Uzupelnij typ int dla pages.',
            ],
            starterCode: `class Book {\n  _____ title;\n  _____ pages;\n}\n\npublic class Main {\n  public static void main(String[] args) {\n    Book book = new Book();\n    book.title = "Algorytmy";\n    book.pages = 180;\n    System.out.println(book.title);\n  }\n}`,
            expectedOutput: 'Algorytmy',
            successMessage: 'Dobrze. Umiesz juz zdefiniowac dwa podstawowe pola klasy.',
            hints: [
              'Tytul ksiazki to tekst, wiec potrzebuje String.',
              'Liczba stron to liczba calkowita, wiec potrzebuje int.',
              'Uzyj String title i int pages.',
            ],
            xp: 35,
            validation: {
              placeholdersDisallowed: true,
              requiredPatterns: ['String\\s+title\\s*;', 'int\\s+pages\\s*;'],
              failureMessage: 'Pole title powinno byc String, a pages powinno byc int.',
            },
          },
          {
            id: 'class-scratch',
            kind: 'scratch',
            title: 'Zadanie 2 - Utworz klase i obiekt',
            scenario: 'Stworz klase Course z polami name i lessons, a potem utworz obiekt course i wypisz jego nazwe.',
            instructions: [
              'Klasa ma miec pola String name i int lessons.',
              'Utworz obiekt Course course = new Course();',
              'Wypisz course.name.',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
            expectedOutput: 'JavaPath Basics',
            successMessage: 'Masz juz pelny mini-obiekt z klasa, instancja i odczytem pola.',
            hints: [
              'Najpierw zdefiniuj class Course nad public class Main.',
              'Potem stworz obiekt przez new Course().',
              'Ustaw course.name = "JavaPath Basics"; i wypisz to pole.',
            ],
            xp: 45,
            validation: {
              requiredPatterns: [
                'class\\s+Course',
                'String\\s+name\\s*;',
                'int\\s+lessons\\s*;',
                'Course\\s+course\\s*=\\s*new\\s+Course\\s*\\(\\s*\\)\\s*;',
              ],
              requiredIncludes: ['course.name = "JavaPath Basics";', 'System.out.println(course.name);'],
              failureMessage: 'Program powinien definiowac klase Course, tworzyc obiekt course i wypisywac jego pole name.',
            },
          },
          {
            id: 'class-debug',
            kind: 'debug',
            title: 'Zadanie 3 - Napraw typ obiektu',
            scenario: 'Kod tworzy obiekt klasy Player, ale uzywa zlej wielkosci liter w typie.',
            instructions: [
              'Popraw typ przy deklaracji obiektu.',
              'Nie zmieniaj samej definicji klasy.',
            ],
            starterCode: `class Player {\n  String nick;\n}\n\npublic class Main {\n  public static void main(String[] args) {\n    player p = new Player();\n    p.nick = "Echo";\n    System.out.println(p.nick);\n  }\n}`,
            expectedOutput: 'Echo',
            successMessage: 'Dobrze. Wiesz juz, ze nazwa klasy musi byc uzyta dokladnie tak samo przy tworzeniu obiektu.',
            hints: [
              'Klasa nazywa sie Player z wielkiej litery.',
              'Typ przy deklaracji obiektu tez musi byc Player.',
              'Poprawna linia to: Player p = new Player();',
            ],
            xp: 55,
            validation: {
              forbiddenIncludes: ['player p = new Player();'],
              requiredIncludes: ['Player p = new Player();'],
              requiredPatterns: ['class\\s+Player'],
              failureMessage: 'Uzyj poprawnej nazwy klasy Player przy deklaracji obiektu.',
            },
          },
        ],
        skills: [
          'Rozumiem roznice miedzy klasa a obiektem.',
          'Umiem zdefiniowac proste pola klasy.',
          'Potrafie stworzyc obiekt przez new i ustawic jego pola.',
          'Rozpoznaje typowe bledy przy nazwie klasy i instancji.',
        ],
      })

    case 'kolekcje':
      return buildLesson(moduleId, {
        hookPrompt: 'Co zrobisz, gdy jeden gracz ma nie jeden wynik, ale cala liste zadan albo mape wynikow?',
        hookDetail:
          'Pojedyncza zmienna nie wystarczy, gdy danych jest wiele. Kolekcje pozwalaja przechowywac listy elementow albo pary klucz-wartosc.',
        coreStatement: 'ArrayList przechowuje wiele elementow w kolejnosci, a HashMap laczy klucz z wartoscia.',
        paragraphs: [
          'ArrayList jest dobra, gdy chcesz trzymac liste elementow i pobierac je po indeksie albo dopisywac kolejne pozycje.',
          'HashMap przydaje sie wtedy, gdy bardziej interesuje Cie nazwa klucza niz pozycja na liscie, na przyklad nick gracza i liczba punktow.',
          'Na tym etapie najwazniejsze jest zrozumienie, ze kolekcje przechowuja wiele danych pod jednym obiektem.',
        ],
        analogy: {
          title: 'Analogia',
          body: 'ArrayList dziala jak lista zakupow, a HashMap jak slownik, w ktorym kazde slowo ma przypisane znaczenie.',
        },
        warning: 'Zeby uzyc ArrayList albo HashMap, musisz je zaimportowac z java.util.',
        showIntro: 'Najpierw lista zadan w ArrayList, a potem mapa punktow w HashMap.',
        examples: [
          {
            id: 'collections-a',
            label: 'Przyklad A',
            title: 'ArrayList z zadaniami',
            description: 'Program tworzy liste i dopisuje do niej kilka elementow.',
            whyItWorks: 'Jedna lista przechowuje wiele tekstow bez tworzenia osobnej zmiennej dla kazdego zadania.',
            code: `import java.util.ArrayList;\n\npublic class Main {\n  public static void main(String[] args) {\n    ArrayList<String> zadania = new ArrayList<>();\n    zadania.add("Quiz");\n    zadania.add("Powtorka");\n\n    System.out.println(zadania.size());\n  }\n}`,
            output: '2',
          },
          {
            id: 'collections-b',
            label: 'Przyklad B',
            title: 'HashMap z punktami',
            description: 'Program przypisuje punkty do nickow graczy.',
            whyItWorks: 'HashMap pozwala pobierac wartosc po nazwie klucza, a nie po pozycji na liscie.',
            code: `import java.util.HashMap;\n\npublic class Main {\n  public static void main(String[] args) {\n    HashMap<String, Integer> punkty = new HashMap<>();\n    punkty.put("Nova", 120);\n    punkty.put("Echo", 90);\n\n    System.out.println(punkty.get("Nova"));\n  }\n}`,
            output: '120',
          },
        ],
        practiceIntro: 'W zadaniach uzupelniasz import, tworzysz liste i poprawiasz zly typ kolekcji.',
        tasks: [
          {
            id: 'collections-fill',
            kind: 'fill_blank',
            title: 'Zadanie 1 - Uzupelnij import i typ listy',
            scenario: 'Program ma utworzyc liste Stringow i dodac do niej dwa zadania.',
            instructions: [
              'Uzupelnij import ArrayList.',
              'Uzupelnij typ przy deklaracji listy.',
            ],
            starterCode: `import _____;\n\npublic class Main {\n  public static void main(String[] args) {\n    _____<String> zadania = new ArrayList<>();\n    zadania.add("Lekcja");\n    zadania.add("Quiz");\n    System.out.println(zadania.size());\n  }\n}`,
            expectedOutput: '2',
            successMessage: 'Dobrze. Umiesz juz poprawnie zaimportowac i zadeklarowac liste.',
            hints: [
              'Potrzebujesz import java.util.ArrayList;',
              'Typ listy to ArrayList.',
              'Poprawny zapis to ArrayList<String> zadania = new ArrayList<>();',
            ],
            xp: 35,
            validation: {
              placeholdersDisallowed: true,
              requiredIncludes: ['import java.util.ArrayList;', 'ArrayList<String> zadania = new ArrayList<>();'],
              failureMessage: 'Uzupelnij import java.util.ArrayList i deklaracje ArrayList<String> zadania.',
            },
          },
          {
            id: 'collections-scratch',
            kind: 'scratch',
            title: 'Zadanie 2 - Zbuduj mape punktow',
            scenario: 'Utworz HashMap z punktami graczy i dodaj do niej wpis "Nova" -> 150.',
            instructions: [
              'Zaimportuj HashMap.',
              'Utworz HashMap<String, Integer> punkty.',
              'Dodaj wpis przez put i wypisz wartosc dla klucza "Nova".',
            ],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
            expectedOutput: '150',
            successMessage: 'Masz juz kolekcje klucz-wartosc i umiesz pobrac z niej konkretna dana.',
            hints: [
              'Zacznij od import java.util.HashMap;',
              'Deklaracja moze wygladac tak: HashMap<String, Integer> punkty = new HashMap<>();',
              'Dodaj punkty.put("Nova", 150); i wypisz punkty.get("Nova").',
            ],
            xp: 45,
            validation: {
              requiredIncludes: ['import java.util.HashMap;'],
              requiredPatterns: [
                'HashMap<String,\\s*Integer>\\s+punkty\\s*=\\s*new\\s+HashMap<>\\(\\)\\s*;',
                'punkty\\.put\\(\\s*"Nova"\\s*,\\s*150\\s*\\)\\s*;',
                'punkty\\.get\\(\\s*"Nova"\\s*\\)',
              ],
              failureMessage: 'Program powinien tworzyc HashMap<String, Integer>, dodawac wpis Nova -> 150 i pobierac go przez get.',
            },
          },
          {
            id: 'collections-debug',
            kind: 'debug',
            title: 'Zadanie 3 - Napraw zly typ listy',
            scenario: 'Lista ma przechowywac teksty, ale zadeklarowano ja z typem int.',
            instructions: [
              'Popraw typ generyczny listy.',
              'Nie zmieniaj metod add z tekstami.',
            ],
            starterCode: `import java.util.ArrayList;\n\npublic class Main {\n  public static void main(String[] args) {\n    ArrayList<int> tagi = new ArrayList<>();\n    tagi.add("java");\n    tagi.add("oop");\n    System.out.println(tagi.size());\n  }\n}`,
            expectedOutput: '2',
            successMessage: 'Dobrze. Rozumiesz juz, ze typ elementu w kolekcji musi pasowac do danych, ktore do niej dodajesz.',
            hints: [
              'Do listy dodajesz teksty, nie liczby.',
              'W ArrayList z tekstami uzyjesz typu String.',
              'Popraw deklaracje na ArrayList<String> tagi = new ArrayList<>();',
            ],
            xp: 55,
            validation: {
              forbiddenIncludes: ['ArrayList<int>'],
              requiredIncludes: ['ArrayList<String> tagi = new ArrayList<>();'],
              failureMessage: 'Lista dodaje teksty, wiec potrzebuje typu ArrayList<String>, nie ArrayList<int>.',
            },
          },
        ],
        skills: [
          'Rozumiem, po co sa kolekcje.',
          'Umiem stworzyc ArrayList i dodac do niej elementy.',
          'Potrafie uzyc HashMap do par klucz-wartosc.',
          'Wiem, ze typ elementow w kolekcji musi pasowac do danych.',
        ],
      })

    default:
      return buildLesson(moduleId, {
        hookPrompt: `Jak wykorzystac temat "${moduleById[moduleId]?.title ?? 'ten modul'}" w dzialajacym programie?`,
        hookDetail:
          'Ta lekcja jest juz osobna sesja dla konkretnego modulu, ale jej tresc czeka jeszcze na reczne dopracowanie.',
        coreStatement: `${moduleById[moduleId]?.title ?? 'Ten modul'} to kolejny etap, ktory rozwinie Twoj sposob myslenia o kodzie.`,
        paragraphs: [
          'Modul ma juz osobny przebieg lekcji, quiz i progres.',
          'Na razie dostajesz wersje tymczasowa zamiast recznie dopisanego materialu.',
          'To nadal osobna lekcja dla konkretnego modulu, a nie kopia pierwszego ekranu.',
        ],
        analogy: {
          title: 'Analogia',
          body: 'To jak szkic nowego rozdzialu przed ostatecznym dopracowaniem przykladow i zadan.',
        },
        warning: 'Ta lekcja ma juz osobny stan, ale jej content wymaga jeszcze recznego dopisania.',
        showIntro: 'Tymczasowy material dla tego modulu.',
        examples: [
          {
            id: `${moduleId}-example-a`,
            label: 'Przyklad A',
            title: 'Minimalny szkic',
            description: 'Tymczasowy przyklad modulu.',
            whyItWorks: 'To placeholder content dla odrebnej lekcji.',
            code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Modul: ${moduleById[moduleId]?.title ?? 'Brak'}");\n  }\n}`,
            output: `Modul: ${moduleById[moduleId]?.title ?? 'Brak'}`,
          },
          {
            id: `${moduleId}-example-b`,
            label: 'Przyklad B',
            title: 'Dalszy kontekst',
            description: 'Drugi tymczasowy przyklad modulu.',
            whyItWorks: 'To nadal osobna tresc dla tego modulu.',
            code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Ten modul ma juz wlasna lekcje.");\n  }\n}`,
            output: 'Ten modul ma juz wlasna lekcje.',
          },
        ],
        practiceIntro: 'Placeholder practice dla modulu, dopoki nie zostanie dopisany material reczny.',
        tasks: [
          {
            id: `${moduleId}-fill`,
            kind: 'fill_blank',
            title: 'Zadanie 1 - Placeholder',
            scenario: 'Wypisz nazwe modulu.',
            instructions: ['Uzupelnij tekst w println.'],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("_____");\n  }\n}`,
            expectedOutput: moduleById[moduleId]?.title ?? 'Modul',
            successMessage: 'Tymczasowe zadanie zaliczone.',
            hints: ['Wpisz nazwe modulu.', 'To przejsciowa lekcja.', `Uzyj tekstu: ${moduleById[moduleId]?.title ?? 'Modul'}`],
            xp: 20,
            validation: {
              placeholdersDisallowed: true,
              requiredIncludes: [`System.out.println("${moduleById[moduleId]?.title ?? 'Modul'}");`],
              failureMessage: 'Wypisz nazwe modulu.',
            },
          },
          {
            id: `${moduleId}-scratch`,
            kind: 'scratch',
            title: 'Zadanie 2 - Placeholder',
            scenario: 'Wypisz dwa komunikaty o module.',
            instructions: ['Uzyj dwoch println.'],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    \n  }\n}`,
            expectedOutput: 'Start\nDalej',
            successMessage: 'Tymczasowe zadanie zaliczone.',
            hints: ['Potrzebujesz dwoch println.', 'To tylko fallback.', 'Wypisz dwa proste komunikaty.'],
            xp: 20,
            validation: {
              minPrintlnCount: 2,
              failureMessage: 'Uzyj dwoch println.',
            },
          },
          {
            id: `${moduleId}-debug`,
            kind: 'debug',
            title: 'Zadanie 3 - Placeholder',
            scenario: 'Napraw prosty blad w println.',
            instructions: ['Popraw wielkosc litery w System.'],
            starterCode: `public class Main {\n  public static void main(String[] args) {\n    system.out.println("OK");\n  }\n}`,
            expectedOutput: 'OK',
            successMessage: 'Tymczasowe zadanie zaliczone.',
            hints: ['Java rozroznia wielkosc liter.', 'Uzyj System.out.println.', 'To jeszcze fallback lesson.'],
            xp: 20,
            validation: {
              forbiddenIncludes: ['system.out'],
              requiredIncludes: ['System.out.println("OK");'],
              failureMessage: 'Popraw zapis na System.out.println("OK");',
            },
          },
        ],
        skills: ['Ta lekcja ma juz osobny stan.', 'To nie jest juz kopia pierwszego modulu.', 'Content czeka jeszcze na reczne dopisanie.'],
      })
  }
}

function createTopicQuiz(moduleId: string): QuizQuestion[] {
  switch (moduleId) {
    case 'zmienne':
      return buildQuiz(moduleId, [
        { prompt: 'Po co uzywamy zmiennych?', options: ['Zeby ukrywac bledy', 'Zeby przechowywac wartosci pod nazwa', 'Zeby usunac println', 'Zeby zastapic klasy'], correctIndex: 1 },
        { prompt: 'Ktory typ nadaje sie do liczby 100?', options: ['String', 'boolean', 'int', 'Scanner'], correctIndex: 2 },
        { prompt: 'Ktora deklaracja zapisuje tekst?', options: ['int nick = "Maks";', 'String nick = "Maks";', 'boolean nick = "Maks";', 'double nick = "Maks";'], correctIndex: 1 },
        { prompt: 'Co jest bledem?', options: ['int punkty = 10;', 'String imie = "Ola";', 'Int wiek = 20;', 'boolean online = false;'], correctIndex: 2 },
      ])

    case 'typy-danych':
      return buildQuiz(moduleId, [
        { prompt: 'Ktory typ przechowuje liczbe z przecinkiem?', options: ['int', 'double', 'boolean', 'String'], correctIndex: 1 },
        { prompt: 'Ktory zapis jest poprawny dla boolean?', options: ['boolean premium = true;', 'boolean premium = "true";', 'String premium = false;', 'int premium = true;'], correctIndex: 0 },
        { prompt: 'Do czego sluzy String?', options: ['Do liczb calkowitych', 'Do warunkow logicznych', 'Do tekstu', 'Do petli'], correctIndex: 2 },
        { prompt: 'Jaki typ pasuje do wartosci 19?', options: ['int', 'double', 'String', 'boolean'], correctIndex: 0 },
      ])

    case 'operatory':
      return buildQuiz(moduleId, [
        { prompt: 'Ktory operator mnozy liczby?', options: ['+', '-', '*', '=='], correctIndex: 2 },
        { prompt: 'Co zwraca operator > ?', options: ['Tekst', 'Liczbe', 'true albo false', 'Liste'], correctIndex: 2 },
        { prompt: 'Jaka jest roznica miedzy = i == ?', options: ['Nie ma roznicy', '= porownuje, == przypisuje', '= przypisuje, == porownuje', 'Oba mnoza liczby'], correctIndex: 2 },
        { prompt: 'Do czego sluzy % ?', options: ['Do dodawania', 'Do reszty z dzielenia', 'Do tekstu', 'Do petli'], correctIndex: 1 },
      ])

    case 'scanner':
      return buildQuiz(moduleId, [
        { prompt: 'Co trzeba zaimportowac, aby uzyc Scanner?', options: ['java.io.Scanner', 'java.util.Scanner', 'java.lang.Scanner', 'scanner.java'], correctIndex: 1 },
        { prompt: 'Ktora metoda pobiera linie tekstu?', options: ['nextLine()', 'println()', 'getLine()', 'readText()'], correctIndex: 0 },
        { prompt: 'Scanner tworzymy na bazie...', options: ['System.out', 'System.in', 'Main.java', 'return'], correctIndex: 1 },
        { prompt: 'Do czego sluzy nextInt()?', options: ['Do pobrania liczby calkowitej', 'Do wypisania liczby', 'Do importu klasy', 'Do petli'], correctIndex: 0 },
      ])

    case 'if-else':
      return buildQuiz(moduleId, [
        { prompt: 'Kiedy wykonuje sie blok if?', options: ['Zawsze', 'Gdy warunek daje true', 'Gdy warunek daje false', 'Nigdy'], correctIndex: 1 },
        { prompt: 'Do czego sluzy else?', options: ['Do definicji klasy', 'Do alternatywnej sciezki dla false', 'Do petli', 'Do return'], correctIndex: 1 },
        { prompt: 'Ktory zapis warunku jest poprawny?', options: ['if wiek > 18', 'if (wiek > 18)', 'if [wiek > 18]', 'if {wiek > 18}'], correctIndex: 1 },
        { prompt: 'Co moze stac w warunku if?', options: ['Dowolny tekst', 'Porownanie zwracajace true albo false', 'Tylko liczba', 'Tylko String'], correctIndex: 1 },
      ])

    case 'switch':
      return buildQuiz(moduleId, [
        { prompt: 'Kiedy switch jest wygodny?', options: ['Gdy jedna zmienna ma kilka konkretnych wartosci', 'Zawsze zamiast if', 'Tylko przy petlach', 'Tylko dla tekstu'], correctIndex: 0 },
        { prompt: 'Do czego sluzy break w switch?', options: ['Do rozpoczecia petli', 'Do zatrzymania przejscia do kolejnych caseow', 'Do importu klasy', 'Do zwracania wyniku'], correctIndex: 1 },
        { prompt: 'Ktory element obsluguje pozostale przypadki?', options: ['if', 'else', 'default', 'return'], correctIndex: 2 },
        { prompt: 'Co moze sie stac bez break?', options: ['Kod sie nie skompiluje', 'Program przejdzie do kolejnych caseow', 'Switch zniknie', 'Wartosc zamieni sie w boolean'], correctIndex: 1 },
      ])

    case 'petle':
      return buildQuiz(moduleId, [
        { prompt: 'Po co uzywamy petli?', options: ['Zeby przechowywac tekst', 'Zeby powtarzac kod bez kopiowania', 'Zeby zastapic klasy', 'Zeby unikac warunkow'], correctIndex: 1 },
        { prompt: 'Ktora petla dobrze nadaje sie do licznika?', options: ['for', 'switch', 'if', 'return'], correctIndex: 0 },
        { prompt: 'Co grozi petli while bez zmiany licznika?', options: ['Nic', 'Moze dzialac bez konca', 'Zamieni sie w if', 'Usunie dane'], correctIndex: 1 },
        { prompt: 'Ktory zapis zwieksza licznik o 1?', options: ['i--', 'i++', 'i==', 'i+=text'], correctIndex: 1 },
      ])

    case 'metody':
      return buildQuiz(moduleId, [
        { prompt: 'Po co wydzielamy kod do metod?', options: ['Zeby go ukryc przed Java', 'Zeby go wielokrotnie wywolywac i porzadkowac program', 'Zeby usunac main', 'Zeby nie pisac klas'], correctIndex: 1 },
        { prompt: 'Co robi wywolanie metody?', options: ['Deklaruje klase', 'Uruchamia kod zapisany w metodzie', 'Tworzy petle', 'Importuje plik'], correctIndex: 1 },
        { prompt: 'Co to jest parametr metody?', options: ['Komentarz', 'Dane przekazywane do metody', 'Typ klasy', 'Operator logiczny'], correctIndex: 1 },
        { prompt: 'Ktory zapis moze deklarowac metode?', options: ['public static void start()', 'start = void()', 'method start {}', 'return start()'], correctIndex: 0 },
      ])

    case 'return':
      return buildQuiz(moduleId, [
        { prompt: 'Do czego sluzy return?', options: ['Do powtarzania petli', 'Do oddania wyniku z metody', 'Do importu klas', 'Do tworzenia obiektu'], correctIndex: 1 },
        { prompt: 'Jaki typ powinna miec metoda zwracajaca tekst?', options: ['void', 'int', 'String', 'boolean'], correctIndex: 2 },
        { prompt: 'Co jest bledem?', options: ['public static int suma()', 'return 5;', 'public static int status() { return "OK"; }', 'System.out.println(suma());'], correctIndex: 2 },
        { prompt: 'Co mozesz zrobic ze zwrocona wartoscia?', options: ['Tylko ja usunac', 'Uzyc jej dalej, np. w println', 'Tylko zapisac w komentarzu', 'Nic'], correctIndex: 1 },
      ])

    case 'klasy':
      return buildQuiz(moduleId, [
        { prompt: 'Czym jest klasa?', options: ['Gotowym obiektem', 'Planem obiektu', 'Petla warunkowa', 'Typem operatora'], correctIndex: 1 },
        { prompt: 'Do czego sluzy new?', options: ['Do tworzenia obiektu', 'Do importu klasy', 'Do petli for', 'Do return'], correctIndex: 0 },
        { prompt: 'Co moze byc polem klasy?', options: ['String title', 'break', 'switch', 'return'], correctIndex: 0 },
        { prompt: 'Ktory zapis tworzy obiekt klasy Book?', options: ['Book = new book();', 'Book book = new Book();', 'new Book = book;', 'Book();'], correctIndex: 1 },
      ])

    case 'kolekcje':
      return buildQuiz(moduleId, [
        { prompt: 'Do czego sluzy ArrayList?', options: ['Do pojedynczej liczby', 'Do listy wielu elementow', 'Do importu klas', 'Do warunku if'], correctIndex: 1 },
        { prompt: 'Co przechowuje HashMap?', options: ['Tylko liczby', 'Tylko tekst', 'Pary klucz-wartosc', 'Tylko petle'], correctIndex: 2 },
        { prompt: 'Jaki import jest poprawny dla ArrayList?', options: ['java.util.ArrayList', 'java.lang.ArrayList', 'java.io.ArrayList', 'array.list'], correctIndex: 0 },
        { prompt: 'Co robi metoda add w ArrayList?', options: ['Usuwa element', 'Dodaje element do listy', 'Sprawdza warunek', 'Zmienia klase'], correctIndex: 1 },
      ])

    default:
      return buildQuiz(moduleId, [
        { prompt: 'Czy ten modul ma juz osobna lekcje?', options: ['Tak', 'Nie', 'Tylko w quizie', 'Tylko w ustawieniach'], correctIndex: 0 },
        { prompt: 'Czy to nadal kopia pierwszej lekcji?', options: ['Tak', 'Nie', 'Tylko czasami', 'Tylko na mobile'], correctIndex: 1 },
        { prompt: 'Co jest jeszcze do zrobienia?', options: ['Dopisanie recznego contentu', 'Usuniecie quizu', 'Wyciecie dashboardu', 'Wyciecie modulu'], correctIndex: 0 },
      ])
  }
}

const lessonCatalog: Record<string, LessonData> = {
  'hello-world': lesson,
}

const quizCatalog: Record<string, QuizQuestion[]> = {
  'hello-world': quizQuestions,
}

export const defaultLessonId = 'hello-world'

export function getOrderedModuleIds() {
  return orderedModules.map((module) => module.id)
}

export function getNextModuleId(moduleId: string) {
  return getNextOrderedModule(moduleId)?.id ?? null
}

export function getLessonByModuleId(moduleId: string): LessonData {
  return lessonCatalog[moduleId] ?? createTopicLesson(moduleId)
}

export function getQuizQuestionsByModuleId(moduleId: string): QuizQuestion[] {
  return quizCatalog[moduleId] ?? createTopicQuiz(moduleId)
}
