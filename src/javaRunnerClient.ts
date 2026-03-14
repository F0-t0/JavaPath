export type JavaExecutionResult = {
  ok: boolean
  stage: 'compile' | 'run'
  stdout: string
  stderr: string
  exitCode: number | null
  durationMs: number
}

const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')

const LOCAL_JAVA_RUNNER_URL = 'http://127.0.0.1:4318/run'
const PUBLIC_JUDGE0_URL = 'https://ce.judge0.com'
const JAVA_LANGUAGE_ID = 91
const JAVA_RUNNER_URL = import.meta.env.VITE_JAVA_RUNNER_URL || (isLocalHost ? LOCAL_JAVA_RUNNER_URL : '')

type Judge0Submission = {
  token: string
}

type Judge0Status = {
  id: number
  description: string
}

type Judge0SubmissionResult = {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  exit_code: number | null
  message: string | null
  time: string | null
  status: Judge0Status | null
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

function parseDurationMs(value: string | null, fallbackMs: number) {
  if (!value) {
    return fallbackMs
  }

  const seconds = Number.parseFloat(value)
  if (Number.isNaN(seconds)) {
    return fallbackMs
  }

  return Math.round(seconds * 1000)
}

function buildJudge0Result(payload: Judge0SubmissionResult, startedAt: number): JavaExecutionResult {
  const durationMs = parseDurationMs(payload.time, Date.now() - startedAt)
  const statusId = payload.status?.id ?? 0
  const compileError = payload.compile_output?.trim()
  const runtimeError = payload.stderr?.trim() || payload.message?.trim()

  if (compileError) {
    return {
      ok: false,
      stage: 'compile',
      stdout: payload.stdout ?? '',
      stderr: compileError,
      exitCode: payload.exit_code,
      durationMs,
    }
  }

  if (statusId === 3) {
    return {
      ok: true,
      stage: 'run',
      stdout: payload.stdout ?? '',
      stderr: '',
      exitCode: payload.exit_code,
      durationMs,
    }
  }

  return {
    ok: false,
    stage: 'run',
    stdout: payload.stdout ?? '',
    stderr: runtimeError || `Judge0 zwrocil status: ${payload.status?.description ?? 'Nieznany blad'}.`,
    exitCode: payload.exit_code,
    durationMs,
  }
}

async function executeWithJudge0(source: string, stdin = ''): Promise<JavaExecutionResult> {
  const startedAt = Date.now()
  const createResponse = await fetch(`${PUBLIC_JUDGE0_URL}/submissions/?base64_encoded=false&wait=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_code: source,
      language_id: JAVA_LANGUAGE_ID,
      stdin,
    }),
  })

  if (!createResponse.ok) {
    return {
      ok: false,
      stage: 'run',
      stdout: '',
      stderr: `Judge0 zwrocil HTTP ${createResponse.status} przy tworzeniu zadania.`,
      exitCode: createResponse.status,
      durationMs: Date.now() - startedAt,
    }
  }

  const createdSubmission = (await createResponse.json()) as Judge0Submission

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await wait(900)

    const resultResponse = await fetch(
      `${PUBLIC_JUDGE0_URL}/submissions/${createdSubmission.token}?base64_encoded=false&fields=status,stdout,stderr,compile_output,exit_code,time,message`,
    )

    if (!resultResponse.ok) {
      return {
        ok: false,
        stage: 'run',
        stdout: '',
        stderr: `Judge0 zwrocil HTTP ${resultResponse.status} przy pobieraniu wyniku.`,
        exitCode: resultResponse.status,
        durationMs: Date.now() - startedAt,
      }
    }

    const submissionResult = (await resultResponse.json()) as Judge0SubmissionResult
    const statusId = submissionResult.status?.id ?? 0

    if (statusId > 2) {
      return buildJudge0Result(submissionResult, startedAt)
    }
  }

  return {
    ok: false,
    stage: 'run',
    stdout: '',
    stderr: 'Judge0 nie odpowiedzial na czas. Sprobuj ponownie za chwile.',
    exitCode: null,
    durationMs: Date.now() - startedAt,
  }
}

export async function executeJava(source: string, stdin = ''): Promise<JavaExecutionResult> {
  if (!JAVA_RUNNER_URL && !isLocalHost) {
    try {
      return await executeWithJudge0(source, stdin)
    } catch {
      return {
        ok: false,
        stage: 'run',
        stdout: '',
        stderr: 'Publiczny runner Javy chwilowo nie odpowiada. Sprobuj ponownie za chwile.',
        exitCode: null,
        durationMs: 0,
      }
    }
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(JAVA_RUNNER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ source, stdin }),
      signal: controller.signal,
    })

    if (!response.ok) {
      return {
        ok: false,
        stage: 'run',
        stdout: '',
        stderr: `Runner Javy zwrocil HTTP ${response.status}.`,
        exitCode: response.status,
        durationMs: 0,
      }
    }

    return (await response.json()) as JavaExecutionResult
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        stage: 'run',
        stdout: '',
        stderr: 'Runner Javy nie odpowiedzial na czas. Sprobuj ponownie.',
        exitCode: null,
        durationMs: 8000,
      }
    }

    return {
      ok: false,
      stage: 'run',
      stdout: '',
      stderr:
        JAVA_RUNNER_URL === LOCAL_JAVA_RUNNER_URL
          ? 'Lokalny runner Javy nie odpowiada. Uruchom go poleceniem npm run java-runner.'
          : 'Skonfigurowany runner Javy nie odpowiada. Sprawdz VITE_JAVA_RUNNER_URL.',
      exitCode: null,
      durationMs: 0,
    }
  } finally {
    window.clearTimeout(timeout)
  }
}
