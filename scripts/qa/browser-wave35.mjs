import { chromium } from "playwright"
import { seedGalleryData } from "./browser-gallery-fixtures.mjs"
import { screenshot } from "./browser-image-preview-support.mjs"
import { startLocalApp, stopProcess } from "./browser-smoke-support.mjs"

const OUTPUT = ".omo/evidence/wave-3.5.md"

async function assertCardTitleBeforePreview(page) {
  const cards = page.locator('[data-qa="gallery-card"]')
  const count = await cards.count()
  if (count === 0) {
    throw new Error("no gallery cards rendered")
  }
  for (let i = 0; i < count; i += 1) {
    const order = await cards.nth(i).evaluate((node) => {
      const button = node.querySelector('[data-qa="card-open"]')
      if (button === null) {
        return "no-open-button"
      }
      const children = [...button.children]
      const h3 = children.findIndex((child) => child.tagName === "H3")
      const preview = children.findIndex((child) => child.classList.contains("card-preview"))
      if (h3 === -1 || preview === -1) {
        return "missing"
      }
      return h3 < preview ? "title-first" : "preview-first"
    })
    if (order !== "title-first") {
      throw new Error(`card ${i}: expected title before preview, got ${order}`)
    }
  }
}

async function assertModalTitleSingleLine(page) {
  const promptCard = page
    .locator('[data-qa="gallery-card"][data-card-type="prompt"] [data-qa="card-open"]')
    .first()
  await promptCard.click()
  const title = page.locator(".detail-title-section h3")
  await title.waitFor({ state: "visible" })
  const info = await title.evaluate((node) => {
    const style = getComputedStyle(node)
    return {
      clamp: style.webkitLineClamp,
      height: node.clientHeight,
      lineHeight: Number.parseFloat(style.lineHeight),
    }
  })
  if (info.clamp !== "1") {
    throw new Error(`modal title line-clamp expected 1, got ${info.clamp}`)
  }
  if (info.height > info.lineHeight * 1.6) {
    throw new Error(`modal title height ${info.height} exceeds one line (~${info.lineHeight})`)
  }
  await page.locator('[aria-label="닫기"]').first().click()
}

async function openNewImageModal(page, baseUrl) {
  await page.goto(`${baseUrl}/`)
  await page.locator('[aria-label="추가"]').first().click()
  const typeSelect = page.locator('[data-qa="item-type-select"]')
  await typeSelect.waitFor({ state: "visible" })
  await typeSelect.selectOption("image_prompt")
  await page.locator('[data-qa="image-preview-file"]').waitFor()
}

async function assertNewImageFileEnabled(page) {
  const disabled = await page.locator('[data-qa="image-preview-file"]').isDisabled()
  if (disabled) {
    throw new Error("new image_prompt: file input still disabled before save (regression)")
  }
}

async function assertDisabledCursorNotWait(page) {
  const cursor = await page.evaluate(() => {
    const button = document.querySelector('[data-qa="image-preview-upload"]')
    if (button === null) {
      return "no-button"
    }
    if (!button.disabled) {
      return "not-disabled"
    }
    return getComputedStyle(button).cursor
  })
  if (cursor === "wait") {
    throw new Error("disabled upload button still uses cursor: wait")
  }
  if (cursor === "no-button") {
    throw new Error("upload button not found in new image modal")
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

    await assertCardTitleBeforePreview(page)
    artifacts.push(await screenshot(page, OUTPUT.replace(/\.md$/, ""), "desktop", "cards"))
    await assertModalTitleSingleLine(page)

    await openNewImageModal(page, app.baseUrl)
    await assertNewImageFileEnabled(page)
    await assertDisabledCursorNotWait(page)
    artifacts.push(await screenshot(page, OUTPUT.replace(/\.md$/, ""), "desktop", "new-image-modal"))

    await page.close()
    console.log(`PASS wave-3.5 browser: ${artifacts.length} artifacts`)
  } finally {
    await browser.close()
    await stopProcess(app.child)
  }
}

run().catch((error) => {
  console.error(`FAIL wave-3.5 browser: ${error.message}`)
  process.exit(1)
})
