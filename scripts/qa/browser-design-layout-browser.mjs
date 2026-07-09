import { Buffer } from "node:buffer"
import { chromium } from "playwright"
import {
  assert,
  cleanupFixtures,
  relativePath,
  seedFixtures,
} from "./browser-design-layout-api.mjs"

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 900 },
  { name: "desktop", width: 1280, height: 800 },
]

async function generatedImagePayload(page, name, width, height) {
  const dataUrl = await page.evaluate(
    ({ imageWidth, imageHeight }) => {
      const canvas = document.createElement("canvas")
      canvas.width = imageWidth
      canvas.height = imageHeight
      const context = canvas.getContext("2d")
      if (context === null) {
        throw new Error("canvas context unavailable")
      }
      context.fillStyle = "#f6f5f4"
      context.fillRect(0, 0, imageWidth, imageHeight)
      context.fillStyle = "#0075de"
      context.fillRect(0, 0, imageWidth, Math.max(24, Math.round(imageHeight * 0.16)))
      context.fillStyle = "#2a9d99"
      context.fillRect(
        0,
        Math.round(imageHeight * 0.42),
        imageWidth,
        Math.max(24, Math.round(imageHeight * 0.12)),
      )
      context.strokeStyle = "#1f1f1d"
      context.lineWidth = Math.max(8, Math.round(Math.min(imageWidth, imageHeight) * 0.018))
      context.strokeRect(12, 12, imageWidth - 24, imageHeight - 24)
      return canvas.toDataURL("image/png")
    },
    { imageWidth: width, imageHeight: height },
  )
  return { name, mimeType: "image/png", buffer: Buffer.from(dataUrl.split(",")[1], "base64") }
}

function cardByTitle(page, title) {
  return page.locator('[data-qa="gallery-card"]').filter({ hasText: title }).first()
}

async function uploadImageForItem(page, item) {
  await cardByTitle(page, item.title)
    .getByRole("button", { name: `${item.title} 상세 열기` })
    .click()
  await page.getByRole("button", { name: "수정", exact: true }).click()
  const dialog = page.locator('[data-qa="item-modal"]').first()
  await dialog
    .locator('[data-qa="image-preview-file"]')
    .setInputFiles(await generatedImagePayload(page, `${item.key}.png`, item.width, item.height))
  const responsePromise = page.waitForResponse(
    (response) => response.request().method() === "POST" && response.url().includes("/api/assets"),
  )
  await dialog.locator('[data-qa="image-preview-upload"]').click()
  await responsePromise
  await dialog.locator('[data-qa="image-preview-img"]').first().waitFor({ state: "visible" })
  await page.getByRole("button", { name: "저장", exact: true }).click()
  await cardByTitle(page, item.title)
    .locator('[data-qa="image-preview-img"]')
    .first()
    .waitFor({ state: "visible" })
}

async function screenshot(page, outputPath, viewportName, stateName) {
  const screenshotPath = outputPath.replace(/\.md$/, `-${viewportName}-${stateName}.png`)
  const image = await page.screenshot({ path: screenshotPath, fullPage: true })
  assert(image.byteLength > 1000, `Screenshot is unexpectedly small: ${screenshotPath}`)
  return {
    viewport: viewportName,
    state: stateName,
    path: relativePath(screenshotPath),
    bytes: image.byteLength,
  }
}

async function cardBox(page, title) {
  const box = await cardByTitle(page, title).boundingBox()
  assert(box !== null, `Card has no box: ${title}`)
  return box
}

function assertSquareBox(box, label) {
  const delta = Math.abs(box.width - box.height)
  assert(
    delta <= 4,
    `${label} card is not square: ${Math.round(box.width)}x${Math.round(box.height)}`,
  )
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  assert(overflow <= 1, `${label} has horizontal overflow: ${overflow}px`)
  return overflow
}

async function assertDesktopGrid(page, fixture) {
  const promptBoxes = []
  for (const title of fixture.prompts) {
    promptBoxes.push(await cardBox(page, title))
  }
  const firstRowTop = Math.min(...promptBoxes.map((box) => Math.round(box.y)))
  const firstRowCount = promptBoxes.filter(
    (box) => Math.abs(Math.round(box.y) - firstRowTop) <= 4,
  ).length
  assert(firstRowCount <= 4, `Desktop prompt row has more than 4 cards: ${firstRowCount}`)

  return { firstRowCount }
}

async function assertNonImageSquares(page, fixture) {
  for (const title of [...fixture.prompts, ...fixture.repos, ...fixture.workflows]) {
    assertSquareBox(await cardBox(page, title), title)
  }

  const squareCards = {}
  for (const title of [...fixture.prompts, ...fixture.repos, ...fixture.workflows]) {
    const box = await cardBox(page, title)
    squareCards[title] = { width: Math.round(box.width), height: Math.round(box.height) }
  }

  return squareCards
}

async function assertImageMasonry(page, fixture) {
  const heights = new Map()
  for (const image of fixture.images) {
    heights.set(image.key, Math.round((await cardBox(page, image.title)).height))
  }
  const wide = heights.get("wide")
  const square = heights.get("square")
  const tall = heights.get("tall")
  assert(
    wide !== undefined && square !== undefined && tall !== undefined,
    "Missing image card heights",
  )
  assert(
    wide < square && square < tall,
    `Image cards are not natural-ratio masonry: wide=${wide}, square=${square}, tall=${tall}`,
  )
  return { wide, square, tall }
}

async function assertLightSurface(page) {
  const colors = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    return {
      colorScheme: root.colorScheme,
      surfaceBase: root.getPropertyValue("--surface-base").trim(),
      bodyBackground: getComputedStyle(document.body).backgroundColor,
    }
  })
  assert(
    colors.colorScheme.includes("light"),
    `Expected light color-scheme, got ${colors.colorScheme}`,
  )
  assert(
    colors.surfaceBase === "#f6f5f4",
    `Expected --surface-base #f6f5f4, got ${colors.surfaceBase}`,
  )
  return colors
}

async function runViewport(baseUrl, outputPath, fixture, viewport) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })
  const artifacts = []
  const metrics = { viewport: viewport.name }

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: "All", exact: true }).click()
    for (const image of fixture.images) {
      await uploadImageForItem(page, image)
    }
    await page.getByRole("button", { name: "All", exact: true }).click()

    const colors = await assertLightSurface(page)
    metrics.overflowPx = await assertNoHorizontalOverflow(page, viewport.name)
    metrics.squareCards = await assertNonImageSquares(page, fixture)
    if (viewport.name === "desktop") {
      metrics.desktopGrid = await assertDesktopGrid(page, fixture)
      metrics.imageMasonry = await assertImageMasonry(page, fixture)
    }
    artifacts.push(await screenshot(page, outputPath, viewport.name, "all"))
    return { artifacts, colors, metrics }
  } finally {
    await browser.close()
  }
}

export async function runDesignLayout(baseUrl, outputPath) {
  await cleanupFixtures(baseUrl)
  const fixture = await seedFixtures(baseUrl)
  const artifacts = []
  const colorSamples = []
  const metrics = []
  try {
    for (const viewport of viewports) {
      const result = await runViewport(baseUrl, outputPath, fixture, viewport)
      artifacts.push(...result.artifacts)
      colorSamples.push({ viewport: viewport.name, ...result.colors })
      metrics.push(result.metrics)
    }
    return { fixture, artifacts, colorSamples, metrics }
  } finally {
    await cleanupFixtures(baseUrl)
  }
}
