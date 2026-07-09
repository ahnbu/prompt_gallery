import { Buffer } from "node:buffer"

export const publicStoragePattern = /r2\.dev|storage\.googleapis|githubusercontent/i
export const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
]

export class ImagePreviewError extends Error {}

export function assert(condition, message) {
  if (!condition) {
    throw new ImagePreviewError(message)
  }
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function requestJson(baseUrl, method, pathname, body) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(new URL(pathname, baseUrl), {
        method,
        headers: body === undefined ? undefined : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      })
      const bodyText = await response.text()
      return {
        status: response.status,
        bodyText,
        json: bodyText.length > 0 ? JSON.parse(bodyText) : null,
      }
    } catch (error) {
      lastError = error
      await delay(200)
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }
  throw new ImagePreviewError(`${pathname} request failed`)
}

export async function cleanupTask16Fixtures(baseUrl) {
  const response = await requestJson(baseUrl, "GET", "/api/items")
  if (response.status !== 200 || !Array.isArray(response.json?.items)) {
    return
  }

  for (const item of response.json.items) {
    if (
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      item.title.startsWith("Task16 Image ")
    ) {
      await requestJson(baseUrl, "DELETE", `/api/items/${item.id}`)
    }
  }
}

export async function assertVisible(locator, message) {
  try {
    await locator.first().waitFor({ state: "visible", timeout: 5000 })
  } catch (error) {
    if (error instanceof Error) {
      throw new ImagePreviewError(`${message}: ${error.message}`)
    }
    throw error
  }
}

export async function assertHidden(locator, message) {
  try {
    await locator.first().waitFor({ state: "hidden", timeout: 5000 })
  } catch (error) {
    if (error instanceof Error) {
      throw new ImagePreviewError(`${message}: ${error.message}`)
    }
    throw error
  }
}

export async function screenshot(page, screenshotStem, viewportName, stateName) {
  const screenshotPath = `${screenshotStem}-${viewportName}-${stateName}.png`
  const image = await page.screenshot({ path: screenshotPath, fullPage: true })
  assert(image.byteLength > 1000, `Screenshot is unexpectedly small: ${screenshotPath}`)
  return { viewport: viewportName, state: stateName, path: screenshotPath, bytes: image.byteLength }
}

export function itemCard(page, title) {
  return page.locator('[data-qa="gallery-card"]').filter({ hasText: title }).first()
}

export function activeDialog(page) {
  return page.locator('[data-qa="item-modal"]').first()
}

export function previewImage(page) {
  return activeDialog(page).locator('[data-qa="image-preview-img"]').first()
}

export async function imagePreviewSrc(page) {
  return previewImage(page).getAttribute("src")
}

export function assertNoPublicStorage(value, label) {
  assert(value !== null, `${label} is missing`)
  assert(!publicStoragePattern.test(value), `${label} exposed a public storage URL: ${value}`)
}

export async function assertNoInternalItemKeys(page) {
  const serialized = await page.evaluate(async () => {
    const response = await fetch("/api/items", { cache: "no-store" })
    return JSON.stringify(await response.json())
  })
  assert(!serialized.includes("imageKey"), "Item API response exposed imageKey")
  assert(!serialized.includes("previews/"), "Item API response exposed an internal object key")
  assert(!publicStoragePattern.test(serialized), "Item API response exposed a public storage URL")

  const markup = await page.locator("body").evaluate((node) => node.innerHTML)
  assert(!markup.includes("imageKey"), "DOM exposed imageKey")
  assert(!markup.includes("previews/"), "DOM exposed an internal object key")
  assert(!publicStoragePattern.test(markup), "DOM exposed a public storage URL")
}

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
      context.fillStyle = "#f7f8f8"
      context.fillRect(0, 0, imageWidth, imageHeight)
      context.strokeStyle = "#0f766e"
      context.lineWidth = 16
      for (let x = -imageHeight; x < imageWidth; x += 80) {
        context.beginPath()
        context.moveTo(x, imageHeight)
        context.lineTo(x + imageHeight, 0)
        context.stroke()
      }
      return canvas.toDataURL("image/png")
    },
    { imageWidth: width, imageHeight: height },
  )
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1)
  return { name, mimeType: "image/png", buffer: Buffer.from(base64, "base64") }
}

export async function setGeneratedImage(page, name, width, height) {
  await activeDialog(page)
    .locator('[data-qa="image-preview-file"]')
    .setInputFiles(await generatedImagePayload(page, name, width, height))
}

export async function assertResizedThumbnail(page) {
  const dimensions = await previewImage(page).evaluate((image) => ({
    width: image instanceof HTMLImageElement ? image.naturalWidth : 0,
    height: image instanceof HTMLImageElement ? image.naturalHeight : 0,
  }))
  assert(
    Math.max(dimensions.width, dimensions.height) <= 1200,
    `Uploaded thumbnail was not resized to 1200px max: ${dimensions.width}x${dimensions.height}`,
  )
}
