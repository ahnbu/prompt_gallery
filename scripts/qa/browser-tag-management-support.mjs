import { stat } from "node:fs/promises"

export class TagManagementError extends Error {}

export function assert(condition, message) {
  if (!condition) {
    throw new TagManagementError(message)
  }
}

export async function requestJson(baseUrl, method, pathname, body) {
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
      let json = null
      try {
        json = bodyText.length > 0 ? JSON.parse(bodyText) : null
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new TagManagementError(
            `${method} ${pathname} returned non-JSON ${response.status}: ${bodyText.slice(0, 80)}`,
          )
        }
        throw error
      }
      return { status: response.status, bodyText, json }
    } catch (error) {
      lastError = error
      await new Promise((resolve) => {
        setTimeout(resolve, 200)
      })
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }
  throw new TagManagementError(`${pathname} request failed`)
}

export async function assertVisible(locator, message) {
  try {
    await locator.first().waitFor({ state: "visible", timeout: 5000 })
  } catch (error) {
    if (error instanceof Error) {
      throw new TagManagementError(`${message}: ${error.message}`)
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

export async function cleanupFixtures(baseUrl) {
  const items = await requestJson(baseUrl, "GET", "/api/items")
  if (items.status === 200 && Array.isArray(items.json?.items)) {
    for (const item of items.json.items) {
      if (
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        item.title.startsWith("Task19 ")
      ) {
        await requestJson(baseUrl, "DELETE", `/api/items/${item.id}`)
      }
    }
  }

  const tags = await requestJson(baseUrl, "GET", "/api/tags")
  if (tags.status === 200 && Array.isArray(tags.json?.tags)) {
    for (const tag of tags.json.tags) {
      if (
        typeof tag.id === "string" &&
        typeof tag.name === "string" &&
        tag.name.startsWith("task19-")
      ) {
        await requestJson(baseUrl, "DELETE", `/api/tags/${tag.id}`)
      }
    }
  }
}

export async function seedItem(baseUrl, title, body, tags) {
  const response = await requestJson(baseUrl, "POST", "/api/items", {
    type: "prompt",
    title,
    body,
    notes: null,
    githubUrl: null,
    tags,
  })
  assert(response.status === 201, `Item seed failed: ${response.status} ${response.bodyText}`)
  assert(typeof response.json?.item?.id === "string", `Item seed missing id: ${response.bodyText}`)
  return response.json.item
}

export function tagRowById(page, id) {
  return page.locator(`[data-qa="tag-management-row"][data-tag-id="${id}"]`).first()
}

export function tagRowByName(page, name) {
  return page
    .locator('[data-qa="tag-management-row"]')
    .filter({ has: page.locator('[data-qa="tag-row-name"]', { hasText: name }) })
    .first()
}

export async function openTagManagement(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await assertVisible(page.getByRole("heading", { name: "Prompt Gallery" }), "App shell missing")
  await page.getByRole("button", { name: "태그 관리", exact: true }).click()
  await assertVisible(
    page.getByRole("dialog", { name: "태그 관리" }),
    "Tag management modal missing",
  )
}

export async function getItem(baseUrl, id) {
  const response = await requestJson(baseUrl, "GET", `/api/items/${id}`)
  assert(response.status === 200, `Item fetch failed: ${response.status} ${response.bodyText}`)
  return response.json.item
}

export function sourcesForTag(item, name) {
  const tag = item.tags.find((candidate) => candidate.name === name)
  return tag?.sources ?? []
}

export async function saveExport(download, exportPath) {
  await download.saveAs(exportPath)
  const exportStats = await stat(exportPath)
  assert(exportStats.size > 100, `Export download is unexpectedly small: ${exportStats.size}`)
  return exportStats.size
}
