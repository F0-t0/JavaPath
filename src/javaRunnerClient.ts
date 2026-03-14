export type JavaExecutionResult = {
  ok: boolean
  stage: 'compile' | 'run'
  stdout: string
  stderr: string
  exitCode: number | null
  durationMs: number
}

const JAVA_RUNNER_URL = 'http://127.0.0.1:4318/run'

export async function executeJava(source: string, stdin = ''): Promise<JavaExecutionResult> {
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
      stderr: 'Lokalny runner Javy nie odpowiada. Uruchom go poleceniem npm run java-runner.',
      exitCode: null,
      durationMs: 0,
    }
  } finally {
    window.clearTimeout(timeout)
  }
}
