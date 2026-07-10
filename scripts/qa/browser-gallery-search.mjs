import { chromium } from "playwright"
import { cleanupTask11Fixtures, seedGalleryData } from "./browser-gallery-fixtures.mjs"
import {
  assert,
  assertBoundedImagePreview,
  assertCardHidden,
  assertCardVisible,
  assertCardWithinSection,
  assertHidden,
  assertSectionAddActions,
  assertSectionAddButton,
  assertShell,
  assertVisible,
  cardByTitle,
  screenshot,
  viewports,
} from "./browser-gallery-search-support.mjs"
export { renderGallerySearchEvidence } from "./browser-gallery-evidence.mjs"

async function assertAllView(page, fixture) {
  await assertVisible(
    page.locator('[data-qa="section-prompt"]'),
    "All view prompt section is missing",
  )
  await assertVisible(
    page.locator('[data-qa="section-image_prompt"]'),
    "All view image prompt section is missing",
  )
  await assertVisible(
    page.locator('[data-qa="section-workflow"]'),
    "All view workflow section is missing",
  )
  await assertVisible(page.locator('[data-qa="section-repo"]'), "All view repo section is missing")
  await assertVisible(page.getByText(fixture.promptTitle), "Seeded prompt card is missing")
  await assertVisible(page.getByText(fixture.imageTitle), "Seeded image prompt card is missing")
  await assertVisible(
    page.getByText(fixture.sampleImageTitle),
    "Seeded sample image prompt card is missing",
  )
  await assertVisible(page.getByText(fixture.workflowTitle), "Seeded workflow card is missing")
  await assertVisible(page.getByText(fixture.repoTitle), "Seeded repo card is missing")
  await assertSectionAddButton(page, "section-prompt", "프롬프트 추가")
  await assertSectionAddButton(page, "section-image_prompt", "이미지 프롬프트 추가")
  await assertSectionAddButton(page, "section-workflow", "Workflow 추가")
  await assertSectionAddButton(page, "section-repo", "레포 추가")
  await assertBoundedImagePreview(page, fixture.imageTitle)
  await assertBoundedImagePreview(page, fixture.sampleImageTitle)
  await assertCardWithinSection(page, "section-prompt", fixture.overflowTitle)
}

async function assertTypeBadges(page, fixture) {
  const expectedBadges = [
    { title: fixture.promptTitle, badge: "프롬프트" },
    { title: fixture.imageTitle, badge: "이미지" },
    { title: fixture.workflowTitle, badge: "워크플로우" },
    { title: fixture.repoTitle, badge: "레포" },
  ]

  for (const expected of expectedBadges) {
    await assertVisible(
      cardByTitle(page, expected.title).locator('[data-qa="type-badge"]').filter({
        hasText: expected.badge,
      }),
      `Type badge is missing for ${expected.title}`,
    )
  }
}

async function assertLatestSort(page, baseUrl, fixture) {
  const titles = await page
    .locator('[data-qa="section-prompt"] [data-qa="gallery-card"] h3')
    .allTextContents()
  const promptItems = await Promise.all(
    [fixture.overflowId, fixture.researchOnlyId, fixture.promptId].map((id) =>
      getItem(baseUrl, id),
    ),
  )
  const orderedTitles = promptItems
    .toSorted(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        right.createdAt.localeCompare(left.createdAt) ||
        right.id.localeCompare(left.id),
    )
    .map((item) => item.title)
  const positions = orderedTitles.map((title) => titles.indexOf(title))

  assert(
    positions.every((position) => position !== -1),
    `Prompt section is missing seeded titles: ${titles.join(", ")}`,
  )
  assert(
    positions[0] < positions[1] && positions[1] < positions[2],
    `Prompt cards are not latest-first: ${titles.join(" > ")}`,
  )
}

async function assertVisibleTagLimit(page, fixture) {
  const overflowCard = cardByTitle(page, fixture.overflowTitle)
  const visibleTags = overflowCard.locator('[data-qa="card-tag"]')
  const hiddenCount = overflowCard.locator('[data-qa="hidden-tag-count"]')

  assert((await visibleTags.count()) === 10, "Cards should render at most 10 visible tags")
  const tagBoxes = await visibleTags.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect()
      return { height: box.height, width: box.width }
    }),
  )
  const oversizedTag = tagBoxes.find((box) => box.height > 24 || box.width > 148)
  assert(
    oversizedTag === undefined,
    `Tag chips should stay compact with ellipsis; got ${JSON.stringify(oversizedTag)}`,
  )
  await assertVisible(hiddenCount.filter({ hasText: "+2" }), "Hidden tag count should show +2")
}

async function getItem(baseUrl, id) {
  const response = await fetch(new URL(`/api/items/${id}`, baseUrl))
  const payload = await response.json()
  assert(response.ok, `Item fetch failed: ${response.status} ${JSON.stringify(payload)}`)
  return payload.item
}

async function waitForItemTag(baseUrl, itemId, tagName, expected) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const item = await getItem(baseUrl, itemId)
    const hasTag = item.tags.some((tag) => tag.name === tagName)
    if (hasTag === expected) {
      return item
    }
    await pageDelay(250)
  }

  throw new Error(`${tagName} tag did not become ${expected ? "present" : "absent"}`)
}

function pageDelay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function assertCardInlineTagEditing(page, baseUrl, fixture) {
  const researchCard = cardByTitle(page, fixture.researchOnlyTitle)
  await assertVisible(
    researchCard.getByText(fixture.tagResearch).first(),
    "Research-only card should start with research tag",
  )
  await assertHidden(
    researchCard.getByText(fixture.tagSlides).first(),
    "Research-only card should not start with slides tag",
  )

  await researchCard.getByRole("button", { name: "Tag", exact: true }).click()
  await researchCard
    .getByRole("combobox", { name: "태그 추가", exact: true })
    .selectOption(fixture.tagSlides)
  await waitForItemTag(baseUrl, fixture.researchOnlyId, fixture.tagSlides, true)
  await cardByTitle(page, fixture.researchOnlyTitle)
    .getByText(fixture.tagSlides)
    .first()
    .waitFor({ state: "visible", timeout: 5000 })

  await cardByTitle(page, fixture.researchOnlyTitle)
    .getByRole("button", { name: `${fixture.tagSlides} 태그 삭제`, exact: true })
    .click()
  await waitForItemTag(baseUrl, fixture.researchOnlyId, fixture.tagSlides, false)
  await page.reload({ waitUntil: "networkidle" })
  const reloadedCard = cardByTitle(page, fixture.researchOnlyTitle)
  await assertVisible(reloadedCard, "Research-only card should remain visible after reload")
  await assertVisible(
    reloadedCard.getByText(fixture.tagResearch).first(),
    "Inline tag edit should preserve existing manual tags after reload",
  )
  await assertHidden(
    reloadedCard.getByText(fixture.tagSlides).first(),
    "Inline tag delete should persist after reload",
  )
}

async function assertTabFiltering(page, fixture) {
  await page.getByRole("button", { name: "프롬프트", exact: true }).click()
  await assertCardVisible(page, fixture.promptTitle, "Prompt tab should include prompt item")
  await assertCardVisible(page, fixture.researchOnlyTitle, "Prompt tab should include prompt item")
  await assertCardVisible(page, fixture.overflowTitle, "Prompt tab should include prompt item")
  await assertCardHidden(page, fixture.imageTitle, "Prompt tab should hide image prompt item")
  await assertCardHidden(page, fixture.workflowTitle, "Prompt tab should hide workflow item")
  await assertCardHidden(page, fixture.repoTitle, "Prompt tab should hide repo item")

  await page.getByRole("button", { name: "이미지 프롬프트", exact: true }).click()
  await assertCardVisible(page, fixture.imageTitle, "Image prompt tab should include image item")
  await assertCardVisible(
    page,
    fixture.sampleImageTitle,
    "Image prompt tab should include sample image item",
  )
  await assertCardHidden(page, fixture.promptTitle, "Image prompt tab should hide prompt item")
  await assertCardHidden(page, fixture.workflowTitle, "Image prompt tab should hide workflow item")
  await assertCardHidden(page, fixture.repoTitle, "Image prompt tab should hide repo item")

  await page.getByRole("button", { name: "Workflow", exact: true }).click()
  await assertCardVisible(page, fixture.workflowTitle, "Workflow tab should include workflow item")
  await assertCardHidden(page, fixture.promptTitle, "Workflow tab should hide prompt item")
  await assertCardHidden(page, fixture.imageTitle, "Workflow tab should hide image item")
  await assertCardHidden(page, fixture.repoTitle, "Workflow tab should hide repo item")

  await page.getByRole("button", { name: "레포", exact: true }).click()
  await assertCardVisible(page, fixture.repoTitle, "Repo tab should include repo item")
  await assertCardHidden(page, fixture.promptTitle, "Repo tab should hide prompt item")
  await assertCardHidden(page, fixture.imageTitle, "Repo tab should hide image item")
  await assertCardHidden(page, fixture.workflowTitle, "Repo tab should hide workflow item")

  await page.getByRole("button", { name: "즐겨찾기", exact: true }).click()
  await assertCardVisible(page, fixture.promptTitle, "Favorite tab should include favorite item")
  await assertCardHidden(
    page,
    fixture.researchOnlyTitle,
    "Favorite tab should hide non-favorite item",
  )
  await assertCardHidden(page, fixture.imageTitle, "Favorite tab should hide non-favorite item")
  await assertCardHidden(page, fixture.workflowTitle, "Favorite tab should hide workflow item")
  await assertCardHidden(page, fixture.repoTitle, "Favorite tab should hide non-favorite item")

  await page.getByRole("button", { name: "All", exact: true }).click()
  await assertAllView(page, fixture)
}

async function assertSearchView(page, fixture) {
  await page.getByRole("searchbox", { name: "통합검색" }).fill(fixture.searchTerm)
  await assertVisible(
    page.locator('[data-qa="unified-results"]'),
    "Search should switch to unified results",
  )
  await assertVisible(
    page.getByText(fixture.promptTitle),
    "Search result does not include the matching prompt",
  )
  await assertHidden(
    page.locator('[data-qa="section-prompt"]'),
    "Search result should not show sectioned lists",
  )
}

async function assertTagView(page, fixture) {
  await page.getByRole("searchbox", { name: "통합검색" }).fill("")
  await page.getByRole("button", { name: fixture.tagResearch, exact: true }).click()
  await page.getByRole("button", { name: fixture.tagSlides, exact: true }).click()
  await assertVisible(
    page.locator('[data-qa="unified-results"]'),
    "Tag filter should show unified filtered results",
  )
  await assertVisible(
    page.getByText(fixture.promptTitle),
    "AND tag filter should include item with both tags",
  )
  await assertVisible(
    page.getByText(fixture.sampleImageTitle),
    "AND tag filter should include sample image prompt with both tags",
  )
  await assertHidden(
    page.getByText(fixture.researchOnlyTitle),
    "AND tag filter included item with only one tag",
  )
}

async function runViewport(baseUrl, outputPath, fixture, viewport) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })
  const screenshotStem = outputPath.replace(/\.[^.]+$/, "")
  const artifacts = []

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" })
    await assertShell(page)
    await assertAllView(page, fixture)
    await assertTypeBadges(page, fixture)
    await assertLatestSort(page, baseUrl, fixture)
    await assertVisibleTagLimit(page, fixture)
    await assertCardInlineTagEditing(page, baseUrl, fixture)
    await assertSectionAddActions(page)
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "all"))

    await assertTabFiltering(page, fixture)
    await assertSearchView(page, fixture)
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "search"))

    await assertTagView(page, fixture)
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "tags"))

    return artifacts
  } finally {
    await browser.close()
  }
}

export async function runGallerySearch(baseUrl, outputPath) {
  await cleanupTask11Fixtures(baseUrl)
  const fixture = await seedGalleryData(baseUrl)
  const artifacts = []

  try {
    for (const viewport of viewports) {
      artifacts.push(...(await runViewport(baseUrl, outputPath, fixture, viewport)))
    }
  } finally {
    await cleanupTask11Fixtures(baseUrl)
  }

  return artifacts
}
