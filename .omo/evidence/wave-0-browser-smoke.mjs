import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"
import path from "node:path"

const args = new Map()

for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index]
  const value = process.argv[index + 1]

  if (key === "--expect-missing-shell") {
    args.set(key, "true")
    index -= 1
    continue
  }

  if (key !== undefined && value !== undefined) {
    args.set(key, value)
  }
}

const baseUrl = args.get("--base-url") ?? "http://127.0.0.1:5173"
const outputDir = args.get("--output-dir") ?? ".omo/evidence"
const expectMissingShell = args.has("--expect-missing-shell")

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
]

const expectedTabs = ["즐겨찾기", "All", "프롬프트", "이미지 프롬프트", "Workflow", "레포"]

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch()
const artifacts = []

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport })
    await page.goto(baseUrl, { waitUntil: "networkidle" })

    const title = page.getByRole("heading", { name: "Prompt Gallery" })
    const titleCount = await title.count()
    const visibleTitle = titleCount > 0 && (await title.first().isVisible())

    const tabs = await Promise.all(
      expectedTabs.map(async (tabName) => {
        const locator = page.getByRole("button", { name: tabName })
        const count = await locator.count()
        return { name: tabName, visible: count > 0 && (await locator.first().isVisible()) }
      }),
    )
    const visibleTabs = tabs.filter((tab) => tab.visible).map((tab) => tab.name)

    if (expectMissingShell) {
      assert(!visibleTitle, "Expected missing app title, but Prompt Gallery title is visible")
      assert(visibleTabs.length === 0, "Expected missing tabs, but tab controls are visible")
      await page.close()
      continue
    }

    assert(visibleTitle, "Prompt Gallery title is not visible")
    assert(
      visibleTabs.length === expectedTabs.length,
      `Expected ${expectedTabs.length} visible tabs, got ${visibleTabs.length}: ${visibleTabs.join(", ")}`,
    )

    const search = page.getByRole("searchbox", { name: "검색 준비 중" })
    assert((await search.count()) === 1, "Disabled search placeholder is missing")
    assert(await search.first().isDisabled(), "Search input should be disabled in Wave 0")

    const emptyRegion = page.locator(".content-empty")
    const emptyBox = await emptyRegion.boundingBox()
    assert(emptyBox !== null && emptyBox.width > 0 && emptyBox.height > 0, "Empty content region is not rendered")

    const shellBox = await page.locator("main.app-shell").boundingBox()
    assert(shellBox !== null && shellBox.width > 0 && shellBox.height > 0, "App shell is blank")

    const screenshotPath = path.join(outputDir, `wave-0-browser-${viewport.name}.png`)
    const screenshot = await page.screenshot({ path: screenshotPath, fullPage: true })
    assert(screenshot.byteLength > 1000, `Screenshot is unexpectedly small: ${screenshot.byteLength} bytes`)

    artifacts.push({
      viewport: viewport.name,
      path: screenshotPath,
      screenshotBytes: screenshot.byteLength,
      titleVisible: visibleTitle,
      tabsVisible: visibleTabs,
      emptyRegion: {
        width: Math.round(emptyBox.width),
        height: Math.round(emptyBox.height),
      },
    })

    await page.close()
  }
} finally {
  await browser.close()
}

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl,
      expectMissingShell,
      artifacts,
    },
    null,
    2,
  ),
)
