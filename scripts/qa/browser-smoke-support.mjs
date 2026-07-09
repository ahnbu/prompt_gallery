import { spawn } from "node:child_process"
import { writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function stopProcess(child) {
  if (child.exitCode !== null) {
    return
  }

  if (process.platform === "win32" && child.pid !== undefined) {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" })
  } else {
    child.kill("SIGTERM")
  }

  await delay(1500)
}

export async function startLocalApp(outputPath) {
  const stem = outputPath.replace(/\.[^.]+$/, "")
  const stdoutPath = `${stem}-dev.stdout.log`
  const stderrPath = `${stem}-dev.stderr.log`
  let stdout = ""
  let stderr = ""
  const viteBin = path.join(rootDir, "node_modules/vite/bin/vite.js")
  const child = spawn(process.execPath, [viteBin, "--host", "127.0.0.1"], {
    cwd: rootDir,
    env: { BROWSER: "none", NO_UPDATE_NOTIFIER: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  })

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString()
  })
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString()
  })

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const health = await fetch("http://127.0.0.1:5173/api/health", {
        signal: AbortSignal.timeout(1000),
      })
      const shell = await fetch("http://127.0.0.1:5173/", {
        signal: AbortSignal.timeout(1000),
      })
      if (health.ok && shell.ok) {
        await writeFile(stdoutPath, stdout)
        await writeFile(stderrPath, stderr)
        return { child, stdoutPath, stderrPath }
      }
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error
      }
    }

    await delay(500)
  }

  await writeFile(stdoutPath, stdout)
  await writeFile(stderrPath, stderr)
  await stopProcess(child)
  throw new Error("Local dev server did not become ready within 30s")
}
