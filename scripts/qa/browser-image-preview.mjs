import { Buffer } from "node:buffer"
import { chromium } from "playwright"
import {
  assert,
  activeDialog,
  assertBoundedPreviewFrame,
  assertHidden,
  assertNoInternalItemKeys,
  assertVisible,
  cleanupTask16Fixtures,
  itemCard,
  openEdit,
  screenshot,
  setGeneratedImage,
  uploadDraftImage,
  viewports,
  waitForAssetContentStatus,
  waitForCardNoImage,
  waitForCardThumbnail,
} from "./browser-image-preview-support.mjs"

async function runViewport(baseUrl, outputPath, viewport) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })
  const screenshotStem = outputPath.replace(/\.[^.]+$/, "")
  const artifacts = []
  const suffix = `${Date.now()}-${viewport.name}`
  const title = `Task16 Image ${suffix}`
  const unsavedTitle = `${title} unsaved`
  const body = `Task16 image prompt body ${suffix}`
  const uploadedAssetIds = []

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" })
    await assertVisible(page.getByRole("heading", { name: "Prompt Gallery" }), "App shell missing")

    await page.getByRole("button", { name: "이미지 프롬프트", exact: true }).click()
    await page.getByRole("button", { name: "추가", exact: true }).click()
    await assertVisible(page.getByRole("dialog", { name: "항목 추가" }), "Add modal missing")
    await page.getByLabel("제목").fill(title)
    await page.getByRole("textbox", { name: "본문", exact: true }).fill(body)
    await page.getByRole("button", { name: "저장", exact: true }).click()

    const card = itemCard(page, title)
    await assertVisible(card, "Created image prompt card missing")
    await assertVisible(card.locator('[data-qa="image-preview-empty"]'), "Card no-image missing")
    await assertBoundedPreviewFrame(card.locator(".image-preview-frame"), "Created card")
    await assertNoInternalItemKeys(page)
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "no-image"))

    await openEdit(page, title)
    await activeDialog(page)
      .locator('[data-qa="image-preview-file"]')
      .setInputFiles({
        name: "invalid.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("not an image"),
      })
    await activeDialog(page).locator('[data-qa="image-preview-upload"]').click()
    await assertVisible(
      activeDialog(page).getByRole("alert").filter({ hasText: "이미지를 읽지 못했습니다." }),
      "Invalid upload error UI missing",
    )

    await page.getByLabel("제목").fill(unsavedTitle)
    const unsavedUpload = await uploadDraftImage(page, "unsaved-large.png", 1800, 1400)
    uploadedAssetIds.push(unsavedUpload.assetId)
    await page.getByRole("button", { name: "취소", exact: true }).click()
    await assertVisible(itemCard(page, title), "Cancel should preserve original title")
    await assertHidden(itemCard(page, unsavedTitle), "Cancel should not save unsaved title")
    await assertVisible(card.locator('[data-qa="image-preview-empty"]'), "Cancel saved preview")
    await waitForAssetContentStatus(page, unsavedUpload.assetId, 404)
    await assertNoInternalItemKeys(page)

    await openEdit(page, title)
    const savedUpload = await uploadDraftImage(page, "uploaded-large.png", 1800, 1400)
    uploadedAssetIds.push(savedUpload.assetId)
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "uploaded-thumbnail"))
    await page.getByRole("button", { name: "저장", exact: true }).click()
    await waitForCardThumbnail(page, title)
    await assertBoundedPreviewFrame(
      itemCard(page, title).locator(".image-preview-frame"),
      "Saved card",
    )
    await assertNoInternalItemKeys(page)

    await openEdit(page, title)
    const discardedReplacement = await uploadDraftImage(page, "replacement-a-large.png", 1400, 1800)
    uploadedAssetIds.push(discardedReplacement.assetId)
    const savedReplacement = await uploadDraftImage(page, "replacement-b-large.png", 1400, 1800)
    uploadedAssetIds.push(savedReplacement.assetId)
    await waitForAssetContentStatus(page, discardedReplacement.assetId, 404)
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "replaced-thumbnail"))
    await page.getByRole("button", { name: "저장", exact: true }).click()
    await waitForCardThumbnail(page, title)
    await assertBoundedPreviewFrame(
      itemCard(page, title).locator(".image-preview-frame"),
      "Replaced card",
    )
    await assertNoInternalItemKeys(page)

    await openEdit(page, title)
    await activeDialog(page).locator('[data-qa="image-preview-remove"]').click()
    await assertVisible(
      activeDialog(page).locator('[data-qa="image-preview-empty"]'),
      "Draft remove did not show no-image",
    )
    await page.getByRole("button", { name: "저장", exact: true }).click()
    await waitForCardNoImage(page, title)
    await assertBoundedPreviewFrame(
      itemCard(page, title).locator(".image-preview-frame"),
      "Removed card",
    )
    await assertHidden(
      itemCard(page, title).locator('[data-qa="image-preview-img"]'),
      "Removed thumbnail visible",
    )
    await assertNoInternalItemKeys(page)
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "removed-no-image"))

    assert(
      uploadedAssetIds.length >= 4,
      `Expected four upload responses, got ${uploadedAssetIds.length}`,
    )
    return artifacts
  } finally {
    await browser.close()
    await cleanupTask16Fixtures(baseUrl)
  }
}

export async function runImagePreview(baseUrl, outputPath) {
  await cleanupTask16Fixtures(baseUrl)
  const artifacts = []

  for (const viewport of viewports) {
    artifacts.push(...(await runViewport(baseUrl, outputPath, viewport)))
  }

  return artifacts
}

export function renderImagePreviewEvidence(result) {
  const lines = [
    "# Wave 3 Image Preview Browser QA",
    "",
    `Scenario: ${result.scenario}`,
    `Base URL: ${result.baseUrl}`,
    `Command: ${result.invocation ?? "pnpm qa:browser -- --scenario image-preview"}`,
    `Output: ${result.output ?? ".omo/evidence/wave-3-image-preview.md"}`,
    `Exit code: ${result.exitCode}`,
    `Local app started: ${result.started ? "yes" : "no"}`,
    `Result: ${result.ok ? "PASS" : "FAIL"}`,
    "",
    "## Assertions",
    "- Image prompt can be created with no image.",
    "- Card and detail modal show a lucide no-image state without placeholder files.",
    "- Compact gallery image prompt preview frames stay visible and bounded after create, upload, replace, and remove.",
    "- Invalid file upload exposes an accessible error state.",
    "- Browser-side canvas resize/compress keeps uploaded preview content at 1200px max edge.",
    "- Unsaved preview/title edits are discarded on cancel.",
    "- Cancel after staged upload and staged replacement both clean temporary assets through DELETE /api/assets.",
    "- Upload, replace, and remove are reflected only after explicit Save.",
    "- Thumbnails display through the Worker content proxy.",
    "- Asset responses, item responses, and DOM do not expose imageKey, objectKey, previews/, or public storage URLs.",
    "",
  ]

  if (!result.ok) {
    lines.push("## Failure", result.error ?? "Unknown failure", "")
  }

  if (Array.isArray(result.artifacts) && result.artifacts.length > 0) {
    lines.push("## Screenshots")
    for (const artifact of result.artifacts) {
      lines.push(
        `- ${artifact.viewport} ${artifact.state}: ${artifact.path} (${artifact.bytes} bytes)`,
      )
    }
    lines.push("")
  }

  if (result.devLogs !== undefined) {
    lines.push(
      "## Dev Logs",
      `stdout: ${result.devLogs.stdoutPath}`,
      `stderr: ${result.devLogs.stderrPath}`,
      "",
    )
  }

  lines.push(
    "## Binary Observable",
    result.ok
      ? "Playwright invalid upload, bounded preview, resize, explicit-save preview, protected thumbnail, and screenshot assertions passed."
      : "Scenario failed before all assertions completed.",
    "",
  )

  return `${lines.join("\n")}\n`
}
