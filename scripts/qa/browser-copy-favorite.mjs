import { chromium } from "playwright"
import { cleanupTask13Fixtures, seedCopyFavoriteData } from "./browser-copy-favorite-fixtures.mjs"
export { renderCopyFavoriteEvidence } from "./browser-copy-favorite-evidence.mjs"

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
]

class CopyFavoriteError extends Error {}

export function assert(condition, message) {
  if (!condition) {
    throw new CopyFavoriteError(message)
  }
}

async function assertVisible(locator, message) {
  try {
    await locator.first().waitFor({ state: "visible", timeout: 5000 })
  } catch (error) {
    if (error instanceof Error) {
      throw new CopyFavoriteError(`${message}: ${error.message}`)
    }
    throw error
  }
}

async function assertHidden(locator, message) {
  try {
    await locator.first().waitFor({ state: "hidden", timeout: 5000 })
  } catch (error) {
    if (error instanceof Error) {
      throw new CopyFavoriteError(`${message}: ${error.message}`)
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

function cardByTitle(page, title) {
  return page.locator('[data-qa="gallery-card"]').filter({ hasText: title }).first()
}

function cardOpenButton(page, title) {
  return cardByTitle(page, title).getByRole("button", { name: `${title} 상세 열기` })
}

async function favoriteItemIds(page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/items", { cache: "no-store" })
    const payload = await response.json()
    return Array.isArray(payload.items)
      ? payload.items.filter((item) => item.favorite === true).map((item) => item.id)
      : []
  })
}

async function assertClipboard(page, expected, message) {
  const text = await page.evaluate(() => navigator.clipboard.readText())
  assert(
    text === expected,
    `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(text)}`,
  )
}

async function assertNoDialog(page, title, message) {
  await assertHidden(page.getByRole("dialog", { name: title }), message)
}

async function ensureFavorite(page, title) {
  const card = cardByTitle(page, title)
  const toggle = card.locator('[data-qa="favorite-toggle"]').first()
  const state = await toggle.getAttribute("data-state")
  if (state !== "favorite") {
    await toggle.click()
  }
  await assertVisible(
    card.locator('[data-qa="favorite-toggle"][data-state="favorite"]'),
    `${title} favorite state missing`,
  )
}

async function runViewport(baseUrl, outputPath, fixture, viewport) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport })
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl })
  const page = await context.newPage()
  const screenshotStem = outputPath.replace(/\.[^.]+$/, "")
  const artifacts = []
  const favoritePosts = []
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/favorite")) {
      favoritePosts.push(request.url())
    }
  })

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" })
    await assertVisible(page.getByRole("heading", { name: "Prompt Gallery" }), "App shell missing")
    assert(
      favoritePosts.length === 0,
      `Page load should not POST favorite: ${favoritePosts.join(",")}`,
    )

    const copyButton = cardByTitle(page, fixture.prompt.title).getByRole("button", {
      name: `${fixture.prompt.title} 본문 복사`,
    })
    await copyButton.focus()
    await page.keyboard.press("Enter")
    await assertClipboard(page, fixture.promptBody, "Card copy must write prompt body only")
    await assertNoDialog(page, fixture.prompt.title, "Keyboard copy should not open detail modal")
    await assertVisible(
      cardByTitle(page, fixture.prompt.title).getByRole("status").filter({ hasText: "복사됨" }),
      "Card copy status missing",
    )
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "copy-action"))

    await assertHidden(
      cardByTitle(page, fixture.repo.title).getByRole("button", {
        name: `${fixture.repo.title} 본문 복사`,
      }),
      "Repo card should not expose body copy",
    )

    await cardByTitle(page, fixture.prompt.title)
      .getByRole("button", { name: `${fixture.prompt.title} 즐겨찾기 추가` })
      .focus()
    await page.keyboard.press("Space")
    await assertNoDialog(
      page,
      fixture.prompt.title,
      "Keyboard favorite should not open detail modal",
    )
    await assertVisible(
      cardByTitle(page, fixture.prompt.title).locator(
        '[data-qa="favorite-toggle"][data-state="favorite"]',
      ),
      "Card favorite toggle did not update prompt state",
    )
    const cardFavoriteIds = await favoriteItemIds(page)
    assert(
      cardFavoriteIds.includes(fixture.prompt.id),
      `Card favorite should include prompt=${fixture.prompt.id} and exclude modalPrompt=${fixture.modalPrompt.id}; got ${cardFavoriteIds.join(",")}`,
    )
    await ensureFavorite(page, fixture.image.title)
    await ensureFavorite(page, fixture.repo.title)
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "card-favorite"))

    await page.getByRole("button", { name: "즐겨찾기", exact: true }).click()
    await assertVisible(
      cardByTitle(page, fixture.prompt.title),
      "Favorite tab should include card favorite",
    )
    await assertVisible(
      cardByTitle(page, fixture.image.title),
      "Favorite tab should include image prompt favorite",
    )
    await assertVisible(
      cardByTitle(page, fixture.repo.title),
      "Favorite tab should include repo favorite",
    )
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "favorite-tab"))
    await cardByTitle(page, fixture.prompt.title)
      .getByRole("button", { name: `${fixture.prompt.title} 즐겨찾기 해제` })
      .click()
    await assertHidden(
      cardByTitle(page, fixture.prompt.title),
      "Favorite tab should exclude unfavorited card",
    )

    await page.getByRole("button", { name: "All", exact: true }).click()
    await cardOpenButton(page, fixture.image.title).click()
    const dialog = page.getByRole("dialog", { name: fixture.image.title })
    await assertVisible(dialog, "Detail modal is missing")
    await dialog.getByRole("button", { name: `${fixture.image.title} 본문 복사` }).click()
    await assertClipboard(page, fixture.imageBody, "Detail copy must write image prompt body only")
    await assertVisible(
      dialog.getByRole("status").filter({ hasText: "복사됨" }),
      "Modal copy status missing",
    )
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "modal-copy"))
    await page.getByRole("button", { name: "닫기", exact: true }).click()

    await cardOpenButton(page, fixture.modalPrompt.title).click()
    const modalFavoriteDialog = page.getByRole("dialog", { name: fixture.modalPrompt.title })
    await assertVisible(modalFavoriteDialog, "Modal favorite detail is missing")
    const startsFavorite =
      (await modalFavoriteDialog
        .locator('[data-qa="favorite-toggle"][data-state="favorite"]')
        .count()) > 0
    await modalFavoriteDialog.locator('[data-qa="favorite-toggle"]').click()
    if (startsFavorite) {
      await assertVisible(
        modalFavoriteDialog.locator('[data-qa="favorite-toggle"][data-state="not-favorite"]'),
        "Modal favorite toggle did not unset state",
      )
      const unfavoriteIds = await favoriteItemIds(page)
      assert(
        !unfavoriteIds.includes(fixture.modalPrompt.id),
        `Favorite API did not unset ${fixture.modalPrompt.id}`,
      )
      await modalFavoriteDialog.locator('[data-qa="favorite-toggle"]').click()
    }
    await assertVisible(
      modalFavoriteDialog.locator('[data-qa="favorite-toggle"][data-state="favorite"]'),
      "Modal favorite toggle did not set state",
    )
    const favoriteIds = await favoriteItemIds(page)
    assert(
      favoriteIds.includes(fixture.modalPrompt.id),
      `Favorite API should include modal favorite ${fixture.modalPrompt.id}`,
    )
    artifacts.push(await screenshot(page, screenshotStem, viewport.name, "modal-favorite"))
    await page.getByRole("button", { name: "닫기", exact: true }).click()

    await page.getByRole("button", { name: "즐겨찾기", exact: true }).click()
    await assertVisible(
      cardByTitle(page, fixture.modalPrompt.title),
      "Favorite tab should include modal favorite",
    )
    await assertVisible(
      cardByTitle(page, fixture.image.title),
      "Favorite tab should keep image prompt favorite",
    )
    await assertVisible(
      cardByTitle(page, fixture.repo.title),
      "Favorite tab should keep repo favorite",
    )
    await assertHidden(
      cardByTitle(page, fixture.prompt.title),
      "Favorite tab should keep unfavorite excluded",
    )

    return artifacts
  } finally {
    await browser.close()
  }
}

export async function runCopyFavorite(baseUrl, outputPath) {
  await cleanupTask13Fixtures(baseUrl)
  const fixture = await seedCopyFavoriteData(baseUrl)
  const artifacts = []

  try {
    for (const viewport of viewports) {
      artifacts.push(...(await runViewport(baseUrl, outputPath, fixture, viewport)))
    }
  } finally {
    await cleanupTask13Fixtures(baseUrl)
  }

  return artifacts
}
