import { chromium } from "playwright"
import { seedGalleryData } from "./browser-gallery-fixtures.mjs"
import { screenshot } from "./browser-image-preview-support.mjs"
import { startLocalApp, stopProcess } from "./browser-smoke-support.mjs"

const OUTPUT = ".omo/evidence/wave-4.md"
const SOURCE_URL = "https://example.com/wave4-source"

async function assertSourceFieldPresent(page) {
  const field = page.locator('[data-qa="item-source-url"]')
  await field.waitFor({ state: "visible" })
}

async function createPromptWithSource(page, baseUrl) {
  await page.goto(`${baseUrl}/`)
  await page.locator('[aria-label="추가"]').first().click()
  const typeSelect = page.locator('[data-qa="item-type-select"]')
  await typeSelect.waitFor({ state: "visible" })
  await typeSelect.selectOption("prompt")
  await page.locator('textarea').first().fill("Wave4 source url test body")
  await page.locator('[data-qa="item-source-url"]').fill(SOURCE_URL)
  await page.getByRole("button", { name: "저장" }).click()
  await page.locator('[data-qa="gallery-card"]').first().waitFor()
}

async function assertCardSourceLink(page) {
  const link = page.locator('[data-qa="item-card-source"]').first()
  await link.waitFor({ state: "visible" })
  const href = await link.getAttribute("href")
  if (href !== SOURCE_URL) {
    throw new Error(`card source link href mismatch: expected ${SOURCE_URL}, got ${href}`)
  }
  const rel = await link.getAttribute("rel")
  if (rel !== "noopener noreferrer") {
    throw new Error(`card source link rel mismatch: got ${rel}`)
  }
}

async function assertDetailSourceLink(page) {
  await page.locator('[data-qa="card-open"]').first().click()
  const link = page.locator('[data-qa="item-detail-source"]')
  await link.waitFor({ state: "visible" })
  const href = await link.getAttribute("href")
  if (href !== SOURCE_URL) {
    throw new Error(`detail source link href mismatch: expected ${SOURCE_URL}, got ${href}`)
  }
  await page.locator('[aria-label="닫기"]').first().click()
}

async function assertNoSourceLinkWhenAbsent(page, baseUrl) {
  await page.goto(`${baseUrl}/`)
  await page.locator('[data-qa="gallery-card"]').first().waitFor()
  const cards = page.locator('[data-qa="gallery-card"]')
  const count = await cards.count()
  console.log(`debug: card count = ${count}`)
  let sawCardWithoutSource = false
  for (let i = 0; i < count; i += 1) {
    const hasSource = await cards
      .nth(i)
      .locator('[data-qa="item-card-source"]')
      .count()
    if (hasSource === 0) {
      sawCardWithoutSource = true
      break
    }
  }
  if (!sawCardWithoutSource) {
    throw new Error("expected at least one card without a source link (fixture seed)")
  }
}

async function run() {
  const app = await startLocalApp(OUTPUT)
  const browser = await chromium.launch()
  const artifacts = []
  try {
    await seedGalleryData(app.baseUrl)
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(`${app.baseUrl}/`)
    await page.locator('[data-qa="gallery-card"]').first().waitFor()

    await assertNoSourceLinkWhenAbsent(page, app.baseUrl)

    await page.locator('[aria-label="추가"]').first().click()
    await assertSourceFieldPresent(page)
    await page.locator('[aria-label="닫기"]').first().click()

    await createPromptWithSource(page, app.baseUrl)
    await assertCardSourceLink(page)
    artifacts.push(await screenshot(page, OUTPUT.replace(/\.md$/, ""), "desktop", "card-source"))
    await assertDetailSourceLink(page)
    artifacts.push(await screenshot(page, OUTPUT.replace(/\.md$/, ""), "desktop", "detail-source"))

    await page.close()
    console.log(`PASS wave-4 browser: ${artifacts.length} artifacts`)
  } finally {
    await browser.close()
    await stopProcess(app.child)
  }
}

run().catch((error) => {
  console.error(`FAIL wave-4 browser: ${error.message}`)
  process.exit(1)
})
