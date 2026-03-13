# JavaPath

JavaPath to frontend aplikacji do nauki Javy w przegladarce. Projekt zawiera dashboard z mapa kursu, ekran lekcji w split-view, edytor CodeMirror dla Javy, output, quiz oraz podstawy gamifikacji.

## Stack

- React 19
- TypeScript
- Vite
- CodeMirror 6
- Lucide React

## Uruchomienie

```bash
npm install
npm run dev
```

Build produkcyjny:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Zakres

- Dashboard z hero, kartami postepu i mapa kursu
- Lesson view z trescia, zadaniem, hintami i przyciskami akcji
- Edytor `Main.java` z syntax highlightingiem i walidacja front-endowa
- Quiz fullscreen z ocenianiem odpowiedzi
- Responsywny sidebar i mobilne zakladki `Lekcja | Kod`

## Uwagi techniczne

Aktualna implementacja uruchamiania zadania korzysta z lokalnej walidacji front-endowej. Kolejnym krokiem moze byc integracja z Judge0 lub Piston dla wykonywania kodu Java w izolowanym sandboxie.
