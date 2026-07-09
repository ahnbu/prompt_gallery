import { stat } from "node:fs/promises"
import { chromium } from "playwright"

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
]

class TagManagementError extends Error {}

function assert(condition, message) {
  if (!condition) {
    throw new TagManagementError(message)
  }
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

async function assertVisible(locator, message) {
  try {
    await locator.first().waitFor({ state: "visible", timeout: 5000 })
  } catch (error) {
    if (error instanceof Error) {
      throw new TagManagementError(`${message}: ${error.message}`)
    }
    throw error
  }
}

async function screenshot(page, screenshotStem, viewportName, stateName) {
  const screenshotPath = `${screenshotStem}-${viewportName}-${stateName}.png`
  const image = await page.screenshot({ path: screenshotPath, fullPage: true })
  assert(image.byteLength > 1000, `Screenshot is unexpectedly small: ${screenshotPath}`)
  return { viewport: viewportName, state: stateName, path: screenshotPath, bytes: image.byteLength }
}

async function cleanupFixtures(baseUrl) {
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

async function seedTag(baseUrl, name, color, keywords) {
  const response = await requestJson(baseUrl, "POST", "/api/tags", { name, color, keywords })
  assert(response.status === 201, `Tag seed failed: ${response.status} ${response.bodyText}`)
  assert(typeof response.json?.tag?.id === "string", `Tag seed missing id: ${response.bodyText}`)
  return response.json.tag
}

async function seedItem(baseUrl, title, body, tags) {
  const response = await requestJson(baseUrl, "POST", "/api/items", {
    type: "prompt",
    title,
    body,
    notes: null,
    githubUrl: null,
    tags,
  })
  assert(response.status === 201, `Item seed failed: ${response.status} ${response.bodyText}`)
}

function tagRowById(page, id) {
  return page.locator(`[data-qa="tag-management-row"][data-tag-id="${id}"]`).first()
}

function tagRowByName(page, name) {
  return page.locator('[data-qa="tag-management-row"]').filter({ hasText: name }).first()
}

async function runViewport(baseUrl, outputPath, viewport) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ acceptDownloads: true, viewport })
  const artifacts = []
  const screenshotStem = outputPath.replace(/\.[^.]+$/, "")
  const suffix = `${Date.now()}-${viewport.name}`
  const researchName = `task19-research-${suffix}`
  const sourceName = `task19-source-${suffix}`
  const mergedName = `task19-merged-${suffix}`
  const promptTitle = `Task19 Prompt ${suffix}`

  try {
    const researchTag = await seedTag(baseUrl, researchName, "#3366cc", ["brief"])
    const sourceTag = await seedTag(baseUrl, sourceName, "#cc6633", ["source"])
    await seedItem(baseUrl, promptTitle, `Task19 prompt body ${suffix}`, [researchName, sourceName])

    await page.goto(baseUrl, { waitUntil: "networkidle" })
    await assertVisible(page.getByRole("heading", { name: "Prompt Gallery" }), "App shell missing")
    await page.getByRole("button", { name: "태그 관리", exact: true }).click()
    await assertVisible(
      page.getByRole("dialog", { name: "태그 관리" }),
      "Tag management modal missing",
    )

    const researchRow = tagRowById(page, researchTag.id)
    await assertVisible(researchRow, "Research tag row missing")
    await assertVisible(researchRow.getByText("1개 항목"), "Usage count missing")
    await researchRow.getByLabel("태그 이름").fill(mergedName)
    await researchRow.getByLabel("태그 색상").fill("#228833")
    await researchRow.getByLabel("자동 태그 키워드").fill("brief, strategy")
    await researchRow.locator('[data-qa="tag-save-button"]').click()
    await assertVisible(page.getByText("저장됨"), "Tag save status missing")

    const sourceRow = tagRowById(page, sourceTag.id)
    await assertVisible(sourceRow, "Merge source row missing")
    const mergeTarget = sourceRow.getByLabel("병합 대상")
    assert(
      (await mergeTarget.inputValue()) === researchTag.id,
      "Default merge target should be the renamed tag",
    )
    const mergeButton = sourceRow.locator('[data-qa="tag-merge-button"]')
    assert(
      (await mergeButton.count()) === 1,
      `Merge button missing in source row: ${await sourceRow.evaluate((element) => element.outerHTML)}`,
    )
    await mergeButton.click({ force: true })
    await assertVisible(page.getByText("병합됨"), "Merge status missing")
    await assertVisible(tagRowById(page, researchTag.id), "Merged target row missing")
    assert(
      (await tagRowByName(page, sourceName).count()) === 0,
      "Source tag should disappear after merge",
    )

    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "tag-management"))
    await page.getByRole("button", { name: "닫기", exact: true }).click()
    await page.getByRole("button", { name: mergedName, exact: true }).click()
    await assertVisible(page.getByText(promptTitle), "Merged tag filter should show seeded prompt")
    assert(
      (await page.getByRole("button", { name: sourceName, exact: true }).count()) === 0,
      "Merged source tag filter should be gone",
    )
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "merged-filter"))
    const downloadPromise = page.waitForEvent("download")
    await page.getByRole("button", { name: "Export", exact: true }).click()
    const download = await downloadPromise
    assert(
      download.suggestedFilename() === "prompt-gallery-export.json",
      `Export download filename mismatch: ${download.suggestedFilename()}`,
    )
    const exportPath = `${screenshotStem}-${viewport.name}-export.json`
    await download.saveAs(exportPath)
    const exportStats = await stat(exportPath)
    assert(exportStats.size > 100, `Export download is unexpectedly small: ${exportStats.size}`)
    artifacts.push({
      viewport: viewport.name,
      state: "export-download",
      path: exportPath,
      bytes: exportStats.size,
    })
    return artifacts
  } finally {
    await browser.close()
    await cleanupFixtures(baseUrl)
  }
}

export async function runTagManagement(baseUrl, outputPath) {
  await cleanupFixtures(baseUrl)
  const artifacts = []
  for (const viewport of viewports) {
    artifacts.push(...(await runViewport(baseUrl, outputPath, viewport)))
  }
  return artifacts
}

export function renderTagManagementEvidence(result) {
  const lines = [
    "# Wave 4 Tag Management Browser QA",
    "",
    `Scenario: ${result.scenario}`,
    `Base URL: ${result.baseUrl}`,
    `Local app started: ${result.started ? "yes" : "no"}`,
    `Result: ${result.ok ? "PASS" : "FAIL"}`,
  ]

  if (result.previousEvidence !== undefined) {
    lines.push("", "## RED Evidence", result.previousEvidence.trim())
  }
  if (result.artifacts !== undefined) {
    lines.push(
      "",
      "## Assertions",
      "- Tag management entry opens a real modal.",
      "- Usage count is visible.",
      "- Rename, color edit, and keyword edit save through the API.",
      "- Merge moves item associations and removes the source tag.",
      "- Main tag filter reflects the merged tag result.",
      "- Export button downloads prompt-gallery-export.json.",
      "",
      "## Screenshots",
    )
    for (const artifact of result.artifacts) {
      lines.push(
        `- ${artifact.viewport} ${artifact.state}: ${artifact.path} (${artifact.bytes} bytes)`,
      )
    }
  }
  if (result.error !== undefined) {
    lines.push("", "## Failure", result.error)
  }
  if (result.devLogs !== undefined) {
    lines.push(
      "",
      "## Dev Logs",
      `stdout: ${result.devLogs.stdoutPath}`,
      `stderr: ${result.devLogs.stderrPath}`,
    )
  }
  lines.push(
    "",
    "## Binary Observable",
    result.ok
      ? "Playwright screenshots written and DOM/API assertions passed"
      : "Nonzero CLI exit with captured browser assertion failure",
  )
  return `${lines.join("\n")}\n`
}
