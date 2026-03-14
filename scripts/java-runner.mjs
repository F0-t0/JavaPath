import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

const HOST = '127.0.0.1'
const PORT = 4318
const MAX_SOURCE_LENGTH = 100_000

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function sendJson(res, statusCode, payload) {
  setCorsHeaders(res)
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''

    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      body += chunk

      if (body.length > MAX_SOURCE_LENGTH) {
        reject(new Error('Payload jest zbyt duzy.'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function runProcess(command, args, { cwd, stdin = '', timeoutMs = 4000 }) {
  return new Promise((resolve) => {
    const startedAt = Date.now()
    const child = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''
    let finished = false
    let killFallbackTimer = null

    const finish = (payload) => {
      if (finished) {
        return
      }

      finished = true
      clearTimeout(timeoutHandle)

      if (killFallbackTimer !== null) {
        clearTimeout(killFallbackTimer)
      }

      resolve({
        ...payload,
        durationMs: Date.now() - startedAt,
      })
    }

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8')
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8')
    })

    child.on('error', (error) => {
      finish({
        ok: false,
        stdout,
        stderr: `Nie udalo sie uruchomic ${command}: ${error.message}`,
        exitCode: null,
      })
    })

    child.on('close', (exitCode) => {
      finish({
        ok: exitCode === 0,
        stdout,
        stderr,
        exitCode,
      })
    })

    const timeoutHandle = setTimeout(() => {
      child.kill('SIGTERM')
      killFallbackTimer = setTimeout(() => {
        child.kill('SIGKILL')
      }, 500)

      finish({
        ok: false,
        stdout,
        stderr: stderr || `Proces ${command} przekroczyl limit ${timeoutMs} ms.`,
        exitCode: null,
      })
    }, timeoutMs)

    if (stdin) {
      child.stdin.write(stdin)
    }

    child.stdin.end()
  })
}

async function executeJava(source, stdin = '') {
  const workingDirectory = await mkdtemp(path.join(os.tmpdir(), 'javapath-runner-'))

  try {
    const sourcePath = path.join(workingDirectory, 'Main.java')
    await writeFile(sourcePath, source, 'utf8')

    const compileResult = await runProcess('javac', ['-encoding', 'UTF-8', 'Main.java'], {
      cwd: workingDirectory,
      timeoutMs: 4000,
    })

    if (!compileResult.ok) {
      return {
        ok: false,
        stage: 'compile',
        ...compileResult,
      }
    }

    const runResult = await runProcess('java', ['-Xmx64m', 'Main'], {
      cwd: workingDirectory,
      stdin,
      timeoutMs: 4000,
    })

    return {
      stage: 'run',
      ...runResult,
    }
  } finally {
    await rm(workingDirectory, { recursive: true, force: true })
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: 'Brak URL.' })
    return
  }

  if (req.method === 'OPTIONS') {
    setCorsHeaders(res)
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'POST' || req.url !== '/run') {
    sendJson(res, 404, { error: 'Nie znaleziono endpointu.' })
    return
  }

  try {
    const rawBody = await readRequestBody(req)
    const parsedBody = JSON.parse(rawBody)
    const source = typeof parsedBody.source === 'string' ? parsedBody.source : ''
    const stdin = typeof parsedBody.stdin === 'string' ? parsedBody.stdin : ''

    if (!source.trim()) {
      sendJson(res, 400, {
        ok: false,
        stage: 'compile',
        stdout: '',
        stderr: 'Nie otrzymano kodu Java do wykonania.',
        exitCode: null,
        durationMs: 0,
      })
      return
    }

    const result = await executeJava(source, stdin)
    sendJson(res, 200, result)
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      stage: 'run',
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Nieznany blad runnera.',
      exitCode: null,
      durationMs: 0,
    })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Java runner listening on http://${HOST}:${PORT}`)
})

server.on('error', (error) => {
  console.error('Java runner failed to start:', error)
  process.exit(1)
})
