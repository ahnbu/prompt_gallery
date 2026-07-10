import { chromium } from "playwright"
import {
  assert,
  assertVisible,
  cleanupFixtures,
  getItem,
  openTagManagement,
  saveExport,
  screenshot,
  seedItem,
  sourcesForTag,
  tagRowById,
  tagRowByName,
} from "./browser-tag-management-support.mjs"

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
]

async function runViewport(baseUrl, outputPath, viewport) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ acceptDownloads: true, viewport })
  const artifacts = []
  const screenshotStem = outputPath.replace(/\.[^.]+$/, "")
  const suffix = `${Date.now()}-${viewport.name}`
  const researchName = `task19-research-${suffix}`
  const sourceName = `task19-source-${suffix}`
  const mergedName = `task19-merged-${suffix}`
  const oldTitle = `Task19 Old ${suffix}`
  const newTitle = `Task19 New ${suffix}`
  const manualTitle = `Task19 Manual ${suffix}`

  try {
    await openTagManagement(page, baseUrl)

    await page.locator('[data-qa="tag-create-name"]').fill(researchName)
    await page.locator('[data-qa="tag-create-color"]').fill("#3366cc")
    await page.locator('[data-qa="tag-create-keywords"]').fill("old rule")
    await page.locator('[data-qa="tag-create-button"]').click()
    await assertVisible(page.getByText("생성됨"), "Tag create status missing")
    const researchRow = tagRowByName(page, researchName)
    await assertVisible(researchRow, "Research tag row missing")
    const researchTagId = await researchRow.getAttribute("data-tag-id")
    assert(typeof researchTagId === "string", "Created research row should expose tag id")

    await page.locator('[data-qa="tag-create-name"]').fill(sourceName)
    await page.locator('[data-qa="tag-create-color"]').fill("#cc6633")
    await page.locator('[data-qa="tag-create-keywords"]').fill("source")
    await page.locator('[data-qa="tag-create-button"]').click()
    const createdSourceRow = tagRowByName(page, sourceName)
    await assertVisible(createdSourceRow, "Source tag row missing")
    const sourceTagId = await createdSourceRow.getAttribute("data-tag-id")
    assert(typeof sourceTagId === "string", "Created source row should expose tag id")

    const oldItem = await seedItem(baseUrl, oldTitle, `Task19 old rule body ${suffix}`)
    const newItem = await seedItem(baseUrl, newTitle, `Task19 new rule body ${suffix}`)
    const manualItem = await seedItem(baseUrl, manualTitle, `Task19 manual body ${suffix}`, [
      researchName,
      sourceName,
    ])
    await openTagManagement(page, baseUrl)

    const updatedResearchRow = tagRowById(page, researchTagId)
    await assertVisible(updatedResearchRow.getByText("2개 항목"), "Usage count missing")
    await updatedResearchRow.getByLabel("태그 이름").fill(mergedName)
    await updatedResearchRow.getByLabel("태그 색상").fill("#228833")
    await updatedResearchRow.getByLabel("자동 태그 키워드").fill("new rule")
    await updatedResearchRow.locator('[data-qa="tag-save-button"]').click()
    await assertVisible(page.getByText("저장됨"), "Tag save status missing")
    await assertVisible(tagRowByName(page, mergedName), "Renamed target row missing")

    const oldAfter = await getItem(baseUrl, oldItem.id)
    const newAfter = await getItem(baseUrl, newItem.id)
    const manualAfter = await getItem(baseUrl, manualItem.id)
    assert(sourcesForTag(oldAfter, mergedName).length === 0, "Old automatic tag should be removed")
    assert(
      sourcesForTag(newAfter, mergedName).join(",") === "auto",
      "New automatic tag should be applied",
    )
    assert(
      sourcesForTag(manualAfter, mergedName).join(",") === "manual",
      "Manual tag should remain manual after keyword recompute",
    )

    const sourceRow = tagRowById(page, sourceTagId)
    await assertVisible(sourceRow, "Merge source row missing")
    const mergeTarget = sourceRow.getByLabel("병합 대상")
    const mergeOptions = await mergeTarget.locator("option").allTextContents()
    assert(
      mergeOptions.includes(mergedName),
      `Merge target option missing. Options: ${mergeOptions.join(" | ")}`,
    )
    await mergeTarget.selectOption({ label: mergedName })
    const mergeButton = sourceRow.locator('[data-qa="tag-merge-button"]')
    assert(
      (await mergeButton.count()) === 1,
      `Merge button missing in source row: ${await sourceRow.evaluate((element) => element.outerHTML)}`,
    )
    await mergeButton.click({ force: true })
    await assertVisible(page.getByText("병합됨"), "Merge status missing")
    await assertVisible(tagRowById(page, researchTagId), "Merged target row missing")
    assert(
      (await tagRowByName(page, sourceName).count()) === 0,
      "Source tag should disappear after merge",
    )

    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "tag-management"))
    await page.getByRole("button", { name: "닫기", exact: true }).click()
    await page.getByRole("button", { name: mergedName, exact: true }).click()
    await assertVisible(page.getByText(newTitle), "Merged tag filter should show automatic prompt")
    await assertVisible(page.getByText(manualTitle), "Merged tag filter should show manual prompt")
    assert(
      (await page.getByRole("button", { name: sourceName, exact: true }).count()) === 0,
      "Merged source tag filter should be gone",
    )
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "merged-filter"))
    const downloadPromise = page.waitForEvent("download")
    await page.getByRole("button", { name: "내보내기", exact: true }).click()
    const download = await downloadPromise
    assert(
      download.suggestedFilename() === "prompt-gallery-export.json",
      `Export download filename mismatch: ${download.suggestedFilename()}`,
    )
    const exportPath = `${screenshotStem}-${viewport.name}-export.json`
    const exportBytes = await saveExport(download, exportPath)
    artifacts.push({
      viewport: viewport.name,
      state: "export-download",
      path: exportPath,
      bytes: exportBytes,
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
      "- First tags are created through the modal, not API seed data.",
      "- Usage count is visible.",
      "- Rename, color edit, and keyword edit save through the API.",
      "- Keyword changes bulk remove and apply automatic tags on existing items.",
      "- Manual tag assignments stay manual after automatic recomputation.",
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
