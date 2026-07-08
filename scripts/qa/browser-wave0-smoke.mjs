import { chromium } from "playwright"

const expectedTabs = ["즐겨찾기", "All", "프롬프트", "이미지 프롬프트", "Workflow", "레포"]
const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
]

class Wave0SmokeError extends Error {}

function assert(condition, message) {
  if (!condition) {
    throw new Wave0SmokeError(message)
  }
}

export async function runWave0(baseUrl, outputPath) {
  const browser = await chromium.launch()
  const artifacts = []
  const screenshotStem = outputPath.replace(/\.[^.]+$/, "")

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport })
      await page.goto(baseUrl, { waitUntil: "networkidle" })
      const visibleTabs = await assertShell(page)
      await assertWave0Placeholder(page)

      const screenshotPath = `${screenshotStem}-${viewport.name}.png`
      const screenshot = await page.screenshot({ path: screenshotPath, fullPage: true })
      assert(
        screenshot.byteLength > 1000,
        `Screenshot is unexpectedly small: ${screenshot.byteLength} bytes`,
      )
      artifacts.push({
        viewport: viewport.name,
        path: screenshotPath,
        bytes: screenshot.byteLength,
        tabs: visibleTabs,
      })
      await page.close()
    }
  } finally {
    await browser.close()
  }

  return artifacts
}

async function assertShell(page) {
  const title = page.getByRole("heading", { name: "Prompt Gallery" })
  assert(
    (await title.count()) === 1 && (await title.first().isVisible()),
    "Prompt Gallery title is not visible",
  )
  const visibleTabs = []
  for (const tabName of expectedTabs) {
    const tab = page.getByRole("button", { name: tabName, exact: true })
    assert(
      (await tab.count()) === 1 && (await tab.first().isVisible()),
      `Tab is not visible: ${tabName}`,
    )
    visibleTabs.push(tabName)
  }
  return visibleTabs
}

async function assertWave0Placeholder(page) {
  const search = page.getByRole("searchbox", { name: "검색 준비 중" })
  assert(
    (await search.count()) === 1 && (await search.first().isDisabled()),
    "Wave 0 disabled search is missing",
  )
  const emptyBox = await page.locator(".content-empty").boundingBox()
  assert(
    emptyBox !== null && emptyBox.width > 0 && emptyBox.height > 0,
    "Empty content region is not rendered",
  )
}

export function renderWave0Evidence(result) {
  const lines = [
    "# Wave 0 Browser Smoke",
    "",
    `Scenario: ${result.scenario}`,
    `Base URL: ${result.baseUrl}`,
    `Local app started: ${result.started ? "yes" : "no"}`,
    `Result: ${result.ok ? "PASS" : "FAIL"}`,
  ]

  appendArtifacts(lines, result.artifacts)
  appendFailure(lines, result.error)
  appendDevLogs(lines, result.devLogs)
  lines.push(
    "",
    "## Binary Observable",
    result.ok
      ? "Playwright screenshots written and DOM role assertions passed"
      : "Nonzero CLI exit with captured browser assertion failure",
  )
  return `${lines.join("\n")}\n`
}

function appendArtifacts(lines, artifacts) {
  if (artifacts === undefined) {
    return
  }
  lines.push(
    "",
    "## Assertions",
    "- Prompt Gallery heading visible.",
    "- All Wave 0 tab controls visible by accessible role/name.",
    "- Disabled search placeholder visible.",
    "- Empty content region has nonzero dimensions.",
    "- Desktop and mobile screenshots exceed 1KB.",
    "",
    "## Screenshots",
  )
  for (const artifact of artifacts) {
    lines.push(`- ${artifact.viewport}: ${artifact.path} (${artifact.bytes} bytes)`)
  }
}

function appendFailure(lines, error) {
  if (error !== undefined) {
    lines.push("", "## Failure", error)
  }
}

function appendDevLogs(lines, devLogs) {
  if (devLogs !== undefined) {
    lines.push("", "## Dev Logs", `stdout: ${devLogs.stdoutPath}`, `stderr: ${devLogs.stderrPath}`)
  }
}
