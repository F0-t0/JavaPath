# JavaPath

JavaPath to przegladarkowa platforma do nauki Javy z dashboardem kursu, ekranem lekcji typu split-view, quizami i systemem postepu. Projekt jest zbudowany jako frontend React/Vite, ale lekcje potrafia juz lokalnie kompilowac i uruchamiac prawdziwy kod Java przez prosty runner HTTP oparty o `javac` i `java`.

## Stack

- React 19
- TypeScript
- Vite
- CodeMirror 6
- Firebase Authentication + Realtime Database
- Lucide React
- lokalny Java runner (`javac` / `java`)

## Funkcje

- landing page przed logowaniem
- rejestracja email/haslo i logowanie Google przez Firebase
- dashboard z mapa kursu, XP, streakiem i light/dark mode
- lesson view z pieciokrokowym flow: Hook / Explain / Show / Practice / Wrap-up
- quiz fullscreen dla kazdego modulu
- prawdziwe uruchamianie kodu Java w lekcjach
- obsluga `Scanner` przez podstawienie testowego `stdin` w odpowiednich zadaniach
- strona ustawien z zapisem preferencji i podstawowych statystyk

## Wymagania

- Node.js 20+
- Java JDK z dostepnymi komendami `javac` i `java`

## Uruchomienie lokalne

```bash
npm install
npm run java-runner
```

W drugim terminalu:

```bash
npm run dev
```

Alternatywnie build + preview:

```bash
npm run build
npm run preview
```

## Skrypty

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run java-runner
```

## Uwagi techniczne

- Runner Javy nasluchuje domyslnie na `http://127.0.0.1:4318/run`.
- Lokalnie aplikacja uzywa prostego runnera developerskiego opartego o `javac` i `java`.
- Publiczna wersja na GitHub Pages korzysta z Judge0 CE do wykonywania kodu Java bez wlasnego hostingu backendu.
- Jesli projekt ma trafic szerzej do uzytku produkcyjnego, nastepnym krokiem powinien byc wlasny izolowany backend lub self-hosted Judge0 zamiast publicznego endpointu.
