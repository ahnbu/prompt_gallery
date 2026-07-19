export const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 900 },
  { name: "desktop", width: 1280, height: 800 },
]

const expectedTabs = ["All", "프롬프트", "이미지 프롬프트", "Workflow", "레포", "즐겨찾기"]

export class GallerySearchError extends Error {}

export function assert(condition, message) {
  if (!condition) {
    throw new GallerySearchError(message)
  }
}

export async function assertVisible(locator, message) {
  assert((await locator.count()) > 0 && (await locator.first().isVisible()), message)
}

export async function assertHidden(locator, message) {
  assert((await locator.count()) === 0 || !(await locator.first().isVisible()), message)
}

export function cardByTitle(page, title) {
  return page.locator('[data-qa="gallery-card"]').filter({ hasText: title })
}

export async function assertCardVisible(page, title, message) {
  await assertVisible(cardByTitle(page, title), message)
}

export async function assertCardHidden(page, title, message) {
  await assertHidden(cardByTitle(page, title), message)
}

export async function assertCardWithinSection(page, sectionQa, title) {
  const sectionBox = await page.locator(`[data-qa="${sectionQa}"]`).boundingBox()
  const cardBox = await cardByTitle(page, title).first().boundingBox()
  assert(sectionBox !== null, `Section has no layout box: ${sectionQa}`)
  assert(cardBox !== null, `Card has no layout box: ${title}`)
  assert(
    cardBox.y + cardBox.height <= sectionBox.y + sectionBox.height,
    `${title} overflows ${sectionQa}: card bottom ${cardBox.y + cardBox.height}, section bottom ${
      sectionBox.y + sectionBox.height
    }`,
  )
}

export async function assertSectionAddButton(page, sectionQa, label) {
  const section = page.locator(`[data-qa="${sectionQa}"]`)
  const button = section.getByRole("button", { name: label, exact: true })
  await assertVisible(button, `Section add button is missing: ${label}`)
  const visibleText = (await button.textContent())?.trim() ?? ""
  assert(visibleText.length === 0, `Section add button should be icon-only: ${label}`)
}

async function selectTab(page, tabName) {
  await page.getByRole("button", { name: tabName, exact: true }).click()
}

async function assertHeaderAddAction(page, tabName, expectedType) {
  await selectTab(page, tabName)
  await page.getByRole("button", { name: "추가", exact: true }).click()
  await assertVisible(page.getByRole("dialog", { name: "새 항목" }), `${tabName} add modal missing`)
  const selectedType = await page.locator('[data-qa="item-type-select"]').inputValue()
  assert(
    selectedType === expectedType,
    `${tabName} add selected ${selectedType}, expected ${expectedType}`,
  )
  await page.getByRole("button", { name: "닫기", exact: true }).click()
}

// After the masonry unification the per-section add buttons were removed; the
// header "추가" button now opens a create modal defaulted to the active tab type.
export async function assertSectionAddActions(page) {
  await assertHeaderAddAction(page, "프롬프트", "prompt")
  await assertHeaderAddAction(page, "이미지 프롬프트", "image_prompt")

  await selectTab(page, "Workflow")
  await page.getByRole("button", { name: "추가", exact: true }).click()
  await assertVisible(
    page.getByRole("dialog", { name: "Workflow 추가" }),
    "Workflow add modal missing",
  )
  await page.getByRole("button", { name: "닫기", exact: true }).click()

  await assertHeaderAddAction(page, "레포", "repo")
  await selectTab(page, "All")
}

export async function assertBoundedImagePreview(page, title) {
  const frame = cardByTitle(page, title).locator(".image-preview-frame").first()
  await assertVisible(frame, `Image preview frame is missing for ${title}`)
  const box = await frame.boundingBox()
  assert(box !== null, `Image preview frame has no layout box for ${title}`)
  assert(box.width >= 120, `Image preview is too narrow for ${title}: ${box.width}x${box.height}`)
  assert(box.height >= 96, `Image preview is too short for ${title}: ${box.width}x${box.height}`)
  assert(box.height <= 430, `Image preview is too tall for ${title}: ${box.width}x${box.height}`)
}

export async function screenshot(page, screenshotStem, viewportName, stateName) {
  const screenshotPath = `${screenshotStem}-${viewportName}-${stateName}.png`
  const image = await page.screenshot({ path: screenshotPath, fullPage: true })
  assert(image.byteLength > 1000, `Screenshot is unexpectedly small: ${screenshotPath}`)
  return { viewport: viewportName, state: stateName, path: screenshotPath, bytes: image.byteLength }
}

export async function assertShell(page) {
  const width = page.viewportSize()?.width ?? 1280
  if (width > 680) {
    await assertVisible(
      page.getByRole("heading", { name: "Prompt Gallery" }),
      "Prompt Gallery heading is missing",
    )
  }
  for (const tabName of expectedTabs) {
    await assertVisible(
      page.getByRole("button", { name: tabName, exact: true }),
      `Tab is missing: ${tabName}`,
    )
  }
}
