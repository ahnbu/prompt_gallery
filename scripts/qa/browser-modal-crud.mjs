import { chromium } from "playwright"
import { cleanupTask12Fixtures, seedModalCrudData } from "./browser-modal-fixtures.mjs"

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
]

class ModalCrudError extends Error {}

function assert(condition, message) {
  if (!condition) {
    throw new ModalCrudError(message)
  }
}

async function assertVisible(locator, message) {
  try {
    await locator.first().waitFor({ state: "visible", timeout: 5000 })
  } catch (error) {
    if (error instanceof Error) {
      throw new ModalCrudError(`${message}: ${error.message}`)
    }
    throw error
  }
}

async function assertHidden(locator, message) {
  try {
    await locator.first().waitFor({ state: "hidden", timeout: 5000 })
  } catch (error) {
    if (error instanceof Error) {
      throw new ModalCrudError(`${message}: ${error.message}`)
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

function itemCard(page, title) {
  return page.locator('[data-qa="gallery-card"]').filter({ hasText: title }).first()
}

function itemOpenButton(page, title) {
  return itemCard(page, title).getByRole("button", { name: `${title} 상세 열기` })
}

async function assertAddButtonFocused(page, message) {
  const focused = await page
    .getByRole("button", { name: "추가", exact: true })
    .evaluate((button) => button === document.activeElement)
  assert(focused, message)
}

async function assertDialogCloseAndFocusReturn(page) {
  const addButton = page.getByRole("button", { name: "추가", exact: true })
  const dialog = page.getByRole("dialog", { name: "새 항목" })

  await addButton.click()
  await assertVisible(dialog, "Add modal is missing before close-button test")
  await page.getByRole("button", { name: "닫기", exact: true }).click()
  await assertHidden(dialog, "Close button did not dismiss add modal")
  await assertAddButtonFocused(page, "Focus did not return to add button after close")

  await addButton.click()
  await assertVisible(dialog, "Add modal is missing before Escape test")
  await page.keyboard.press("Escape")
  await assertHidden(dialog, "Escape did not dismiss add modal")
  await assertAddButtonFocused(page, "Focus did not return to add button after Escape")
}

async function assertTabDefault(page, tabName, expectedType) {
  await page.getByRole("button", { name: tabName, exact: true }).click()
  await page.getByRole("button", { name: "추가", exact: true }).click()
  await assertVisible(page.getByRole("dialog", { name: "새 항목" }), `${tabName} add modal missing`)
  const value = await page.getByLabel("유형").inputValue()
  assert(value === expectedType, `${tabName} should default to ${expectedType}, got ${value}`)
  await page.getByRole("button", { name: "닫기", exact: true }).click()
}

async function assertTypeDefaults(page) {
  await page.getByRole("button", { name: "All", exact: true }).click()
  await page.getByRole("button", { name: "추가", exact: true }).click()
  assert((await page.getByLabel("유형").inputValue()) === "", "All add modal should require type")
  await page.getByRole("button", { name: "닫기", exact: true }).click()

  await assertTabDefault(page, "프롬프트", "prompt")
  await assertTabDefault(page, "이미지 프롬프트", "image_prompt")
  await assertTabDefault(page, "레포", "repo")
  await page.getByRole("button", { name: "All", exact: true }).click()
}

async function addBodyOnlyPrompt(page, fixture, artifacts, screenshotStem, viewportName) {
  await page.getByRole("button", { name: "추가", exact: true }).click()
  await assertVisible(page.getByRole("dialog", { name: "새 항목" }), "Add modal is missing")
  artifacts.push(await screenshot(page, screenshotStem, viewportName, "add"))

  await page.getByLabel("유형").selectOption("prompt")
  await page.getByRole("textbox", { name: "본문", exact: true }).fill(fixture.bodyOnly)
  await page.getByRole("button", { name: "저장", exact: true }).click()
  await assertVisible(
    itemCard(page, fixture.bodyOnly),
    "Body-only prompt fallback title is missing",
  )
}

async function editPrompt(page, fixture, artifacts, screenshotStem, viewportName) {
  await itemOpenButton(page, fixture.bodyOnly).click()
  await assertVisible(
    page.getByRole("dialog", { name: fixture.bodyOnly }),
    "Detail modal is missing",
  )
  artifacts.push(await screenshot(page, screenshotStem, viewportName, "detail"))

  await page.getByRole("button", { name: "수정", exact: true }).click()
  const editDialog = page.getByRole("dialog", { name: "편집" })
  await assertVisible(editDialog, "Edit modal is missing")
  await assertVisible(
    editDialog.getByText("프롬프트").first(),
    "Edit mode should show a type badge",
  )
  await assertHidden(
    page.locator('[data-qa="item-type-select"]'),
    "Edit mode should not expose a type select",
  )
  artifacts.push(await screenshot(page, screenshotStem, viewportName, "edit"))

  const unsavedTitle = `${fixture.editedTitle} unsaved`
  await page.getByLabel("제목").fill(unsavedTitle)
  await page.getByRole("button", { name: "취소", exact: true }).click()
  await assertVisible(
    itemCard(page, fixture.bodyOnly),
    "Unsaved edit cancel should preserve the original fallback title",
  )
  await assertHidden(
    itemCard(page, unsavedTitle),
    "Unsaved edit cancel should not update the card title",
  )

  await itemOpenButton(page, fixture.bodyOnly).click()
  await page.getByRole("button", { name: "수정", exact: true }).click()
  const reopenedEditDialog = page.getByRole("dialog", { name: "편집" })
  await assertVisible(reopenedEditDialog, "Edit modal did not reopen")
  await page.getByLabel("제목").fill(fixture.editedTitle)
  await page.getByLabel("메모").fill(fixture.editedNotes)
  await reopenedEditDialog.getByRole("button", { name: "Tag", exact: true }).click()
  await reopenedEditDialog
    .getByRole("combobox", { name: "태그 추가", exact: true })
    .selectOption(fixture.tagName)
  await page.getByRole("button", { name: "저장", exact: true }).click()
  await assertVisible(itemCard(page, fixture.editedTitle), "Edited prompt title is missing")
  await assertVisible(
    itemCard(page, fixture.editedTitle).getByText(fixture.tagName),
    "Edited tag missing",
  )
}

async function deletePrompt(page, fixture, artifacts, screenshotStem, viewportName) {
  await itemOpenButton(page, fixture.editedTitle).click()
  await page.getByRole("button", { name: "삭제", exact: true }).click()
  await assertVisible(
    page.getByText("삭제하면 되돌릴 수 없습니다"),
    "Delete confirmation text is missing",
  )
  artifacts.push(await screenshot(page, screenshotStem, viewportName, "delete-confirm"))

  await page.getByRole("button", { name: "취소", exact: true }).click()
  await assertVisible(
    page.getByRole("dialog", { name: fixture.editedTitle }),
    "Cancel closed detail",
  )
  await assertHidden(
    page.getByText("삭제하면 되돌릴 수 없습니다"),
    "Cancel did not hide confirmation",
  )

  await page.getByRole("button", { name: "삭제", exact: true }).click()
  await page.getByRole("button", { name: "삭제 확인", exact: true }).click()
  await assertHidden(itemCard(page, fixture.editedTitle), "Deleted prompt is still visible")
}

async function runViewport(baseUrl, outputPath, viewport) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })
  const screenshotStem = outputPath.replace(/\.[^.]+$/, "")
  const artifacts = []
  const fixture = await seedModalCrudData(baseUrl)

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" })
    await assertVisible(page.getByRole("heading", { name: "Prompt Gallery" }), "App shell missing")
    await assertDialogCloseAndFocusReturn(page)
    await assertTypeDefaults(page)
    await addBodyOnlyPrompt(page, fixture, artifacts, screenshotStem, viewport.name)
    await editPrompt(page, fixture, artifacts, screenshotStem, viewport.name)
    await deletePrompt(page, fixture, artifacts, screenshotStem, viewport.name)
    return artifacts
  } finally {
    await browser.close()
    await cleanupTask12Fixtures(baseUrl)
  }
}

export async function runModalCrud(baseUrl, outputPath) {
  await cleanupTask12Fixtures(baseUrl)
  const artifacts = []

  for (const viewport of viewports) {
    artifacts.push(...(await runViewport(baseUrl, outputPath, viewport)))
  }

  return artifacts
}

export function renderModalCrudEvidence(result) {
  const lines = [
    "# Wave 2 Modal CRUD",
    "",
    `Scenario: ${result.scenario}`,
    `Base URL: ${result.baseUrl}`,
    `Command: ${result.invocation ?? "pnpm qa:browser -- --scenario modal-crud"}`,
    `Output: ${result.output ?? ".omo/evidence/wave-2-modal-crud.md"}`,
    `Exit code: ${result.exitCode ?? (result.ok ? 0 : 1)}`,
    `Local app started: ${result.started ? "yes" : "no"}`,
    `Result: ${result.ok ? "PASS" : "FAIL"}`,
  ]

  lines.push("", result.ok ? "## GREEN Evidence" : "## RED Evidence")
  if (result.artifacts !== undefined) {
    lines.push(
      "## Assertions",
      "- All tab add flow requires explicit type selection.",
      "- Prompt, image prompt, and repo tabs default the add form type.",
      "- Native dialog close button and Escape dismiss the modal and return focus to + 추가.",
      "- Body-only prompt saves and shows the API fallback title.",
      "- Detail modal opens from a card click.",
      "- Edit mode renders item type as read-only and does not expose a type select.",
      "- Unsaved edit cancel leaves the gallery card unchanged.",
      "- Edit mode saves title, notes, and existing tag changes only on explicit save.",
      "- Delete confirmation supports one cancel and one confirm path.",
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
    lines.push("", "## Dev Logs", `stdout: ${result.devLogs.stdoutPath}`)
    lines.push(`stderr: ${result.devLogs.stderrPath}`)
  }
  lines.push(
    "",
    "## Binary Observable",
    result.ok
      ? "Playwright screenshots written and modal CRUD DOM assertions passed"
      : "Nonzero CLI exit with captured browser assertion failure",
  )

  return `${lines.join("\n")}\n`
}
