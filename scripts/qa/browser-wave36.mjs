import { chromium } from "playwright"
import { seedGalleryData } from "./browser-gallery-fixtures.mjs"
import { screenshot } from "./browser-image-preview-support.mjs"
import { startLocalApp, stopProcess } from "./browser-smoke-support.mjs"

const OUTPUT = ".omo/evidence/wave-3.6.md"

async function createItem(baseUrl, item) {
  const response = await fetch(`${baseUrl}/api/items`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(item),
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(`createItem failed ${response.status}: ${JSON.stringify(payload)}`)
  }
  return payload.item
}

async function openDetailByTitle(page, title) {
  const card = page
    .locator('[data-qa="gallery-card"]', { hasText: title })
    .locator('[data-qa="card-open"]')
    .first()
  await card.click()
  await page.locator('[data-qa="item-modal"]').waitFor({ state: "visible" })
}

async function closeModal(page) {
  await page.locator('[data-qa="item-modal"] [aria-label="닫기"]').first().click()
  await page.locator('[data-qa="item-modal"]').waitFor({ state: "hidden" })
}

// DC-B1: 본문 하단 중복 제목 섹션 부재
async function assertNoDuplicateTitleSection(page) {
  const count = await page.locator(".detail-title-section").count()
  if (count !== 0) {
    throw new Error(`DC-B1: detail-title-section should be absent, found ${count}`)
  }
}

// DC-B2: detail 헤더에 제목 h2 존재 + line-clamp:1
async function assertDetailHeaderTitle(page, expectedTitle) {
  const h2 = page.locator('[data-qa="item-modal"] header h2#item-modal-title')
  await h2.waitFor({ state: "visible" })
  const info = await h2.evaluate((node) => ({
    text: node.textContent,
    clamp: getComputedStyle(node).webkitLineClamp,
  }))
  if (info.clamp !== "1") {
    throw new Error(`DC-B2: detail title line-clamp expected 1, got ${info.clamp}`)
  }
  if (!info.text?.includes(expectedTitle)) {
    throw new Error(`DC-B2: detail header title expected "${expectedTitle}", got "${info.text}"`)
  }
}

// DC-C1: 상세 순서 프롬프트 → (이미지) → (GitHub) → 메모 → 태그 → 구분선 → 메타
async function assertDetailOrder(page, expected) {
  const order = await page.locator('[data-qa="item-modal"] .detail-stack').evaluate((stack) => {
    const map = (node) => {
      if (node.classList.contains("detail-body")) return "body"
      if (node.classList.contains("image-preview")) return "image"
      if (node.querySelector?.('[data-qa="repo-detail-github"]')) return "github"
      if (node.getAttribute?.("data-qa") === "repo-detail-github") return "github"
      if (node.classList.contains("detail-notes")) return "notes"
      if (node.classList.contains("card-tags")) return "tags"
      if (node.classList.contains("detail-divider")) return "divider"
      if (node.classList.contains("detail-meta")) return "meta"
      return null
    }
    return [...stack.children].map(map).filter((value) => value !== null)
  })
  const filtered = order.filter((value) => expected.includes(value))
  if (JSON.stringify(filtered) !== JSON.stringify(expected)) {
    throw new Error(`DC-C1: detail order expected ${expected.join(",")}, got ${filtered.join(",")}`)
  }
}

// DC-E1: 메타 텍스트 "YYYY-MM-DD 수정"
async function assertMetaDateFormat(page) {
  const time = page.locator('[data-qa="item-modal"] .detail-meta time')
  const text = (await time.textContent())?.trim() ?? ""
  if (!/^\d{4}-\d{2}-\d{2} 수정$/.test(text)) {
    throw new Error(`DC-E1: meta date expected "YYYY-MM-DD 수정", got "${text}"`)
  }
}

// 출처 링크가 메타줄 안에 위치
async function assertSourceLinkInMeta(page) {
  const inMeta = await page
    .locator('[data-qa="item-modal"] .detail-meta [data-qa="item-detail-source"]')
    .count()
  if (inMeta !== 1) {
    throw new Error(`source link expected inside .detail-meta, found ${inMeta}`)
  }
}

// DC-A1: 레포 상세에 detail-body 텍스트 부재 + GitHub 링크만
async function assertRepoNoBody(page) {
  const bodyCount = await page.locator('[data-qa="item-modal"] .detail-body').count()
  if (bodyCount !== 0) {
    throw new Error(`DC-A1: repo detail should have no .detail-body, found ${bodyCount}`)
  }
  const github = await page.locator('[data-qa="repo-detail-github"]').count()
  if (github !== 1) {
    throw new Error(`DC-A1: repo detail should show GitHub link, found ${github}`)
  }
}

// DC-B2 (edit): 편집 헤더에 제목 h2 부재 + dialog aria-label 존재, aria-labelledby 부재
async function assertEditHeaderNoTitle(page) {
  await page.locator('[data-qa="item-modal"] .modal-actions').getByText("수정").click()
  await page.locator('[data-qa="item-type-select"], .form-grid').first().waitFor()
  const h2 = await page.locator('[data-qa="item-modal"] header h2').count()
  if (h2 !== 0) {
    throw new Error(`DC-B2(edit): edit header should have no h2, found ${h2}`)
  }
  const aria = await page.locator('[data-qa="item-modal"]').evaluate((node) => ({
    labelledby: node.getAttribute("aria-labelledby"),
    label: node.getAttribute("aria-label"),
  }))
  if (aria.labelledby !== null) {
    throw new Error(
      `DC-B2(edit): edit dialog aria-labelledby should be absent, got ${aria.labelledby}`,
    )
  }
  if (aria.label === null || aria.label.length === 0) {
    throw new Error("DC-B2(edit): edit dialog should carry aria-label")
  }
  const badge = await page.locator('[data-qa="item-modal"] header .type-badge').count()
  if (badge < 1) {
    throw new Error("DC-B2(edit): edit header should still show type badge")
  }
}

// DC-C2 / DC-A2/A3: 편집 폼 필드 순서 + 프롬프트 라벨/placeholder
async function assertEditFormOrder(page, expected) {
  const order = await page.locator('[data-qa="item-modal"] .form-grid').evaluate((grid) => {
    const map = (node) => {
      const labelText = node.querySelector?.("label > *")?.textContent ?? node.textContent ?? ""
      const text = (node.tagName === "LABEL" ? node.childNodes[0]?.textContent : labelText) ?? ""
      const trimmed = text.trim()
      if (node.querySelector?.('[data-qa="item-source-url"]')) return "source"
      if (node.classList.contains("form-field")) return "tags"
      if (node.classList.contains("image-preview")) return "image"
      if (trimmed.startsWith("제목")) return "title"
      if (trimmed.startsWith("프롬프트")) return "prompt"
      if (trimmed.startsWith("GitHub")) return "github"
      if (trimmed.startsWith("메모")) return "notes"
      if (trimmed.startsWith("유형")) return "type"
      return null
    }
    return [...grid.children].map(map).filter((value) => value !== null)
  })
  const filtered = order.filter((value) => expected.includes(value))
  if (JSON.stringify(filtered) !== JSON.stringify(expected)) {
    throw new Error(
      `DC-C2: edit form order expected ${expected.join(",")}, got ${filtered.join(",")}`,
    )
  }
}

async function assertPromptLabelAndPlaceholder(page) {
  const labels = await page
    .locator('[data-qa="item-modal"] .form-grid label')
    .evaluateAll((nodes) => nodes.map((n) => (n.childNodes[0]?.textContent ?? "").trim()))
  if (!labels.some((label) => label === "프롬프트")) {
    throw new Error(`DC-A3: edit form should have "프롬프트" label, got ${labels.join("|")}`)
  }
  const placeholder = await page
    .locator('[data-qa="item-modal"] .form-grid input')
    .first()
    .getAttribute("placeholder")
  if (!placeholder?.includes("프롬프트")) {
    throw new Error(`DC-A3: title placeholder should mention 프롬프트, got "${placeholder}"`)
  }
}

// DC-D2: 레포 상세 복사 버튼 → clipboard githubUrl / 프롬프트 복사 → clipboard body
async function assertCopy(page, expectedText) {
  const button = page.locator('[data-qa="item-modal"] [data-qa="copy-body-button"]')
  const count = await button.count()
  if (count !== 1) {
    throw new Error(`DC-D2: copy button expected 1, found ${count}`)
  }
  await button.click()
  const clip = await page.evaluate(() => navigator.clipboard.readText())
  if (!clip.includes(expectedText)) {
    throw new Error(`DC-D2: clipboard expected to include "${expectedText}", got "${clip}"`)
  }
}

async function run() {
  const app = await startLocalApp(OUTPUT)
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ["clipboard-read", "clipboard-write"],
  })
  const artifacts = []
  try {
    const seed = await seedGalleryData(app.baseUrl)
    // 출처 링크 검증용 항목(어느 fixture에도 sourceUrl 없음)
    const sourced = await createItem(app.baseUrl, {
      type: "prompt",
      title: `Task11 Sourced ${seed.suffix}`,
      body: "Prompt with a source link for meta-row verification.",
      notes: "Sourced prompt notes.",
      sourceUrl: "https://example.com/wave36-source",
    })

    const page = await context.newPage()
    await page.goto(`${app.baseUrl}/`)
    await page.locator('[data-qa="gallery-card"]').first().waitFor()

    // --- 프롬프트 상세 (풀데이터: body/notes/tags, 출처 있음) ---
    await openDetailByTitle(page, sourced.title)
    await assertNoDuplicateTitleSection(page)
    await assertDetailHeaderTitle(page, sourced.title)
    await assertDetailOrder(page, ["body", "notes", "divider", "meta"])
    await assertMetaDateFormat(page)
    await assertSourceLinkInMeta(page)
    await assertCopy(page, "source link for meta-row")
    artifacts.push(await screenshot(page, OUTPUT.replace(/\.md$/, ""), "desktop", "detail-prompt"))
    // --- 편집 폼(프롬프트): 제목→프롬프트→메모→출처→태그 ---
    await assertEditHeaderNoTitle(page)
    await assertEditFormOrder(page, ["title", "prompt", "notes", "source", "tags"])
    await assertPromptLabelAndPlaceholder(page)
    artifacts.push(await screenshot(page, OUTPUT.replace(/\.md$/, ""), "desktop", "edit-prompt"))
    await closeModal(page)

    // --- 레포 상세 (body 없음, GitHub 링크만) ---
    await openDetailByTitle(page, seed.repoTitle)
    await assertNoDuplicateTitleSection(page)
    await assertRepoNoBody(page)
    await assertDetailOrder(page, ["github", "divider", "meta"])
    await assertCopy(page, "github.com/example/prompt-gallery-task11")
    // --- 편집 폼(레포): 제목→GitHub→메모→출처→태그 ---
    await assertEditHeaderNoTitle(page)
    await assertEditFormOrder(page, ["title", "github", "notes", "source", "tags"])
    artifacts.push(await screenshot(page, OUTPUT.replace(/\.md$/, ""), "desktop", "detail-repo"))
    await closeModal(page)

    // --- 이미지 상세 (body/notes/tags) ---
    await openDetailByTitle(page, seed.sampleImageTitle)
    await assertNoDuplicateTitleSection(page)
    await assertDetailHeaderTitle(page, seed.sampleImageTitle)
    await assertDetailOrder(page, ["body", "image", "notes", "divider", "meta"])
    // --- 편집 폼(이미지): 제목→프롬프트→이미지업로드→메모→출처→태그 ---
    await assertEditHeaderNoTitle(page)
    await assertEditFormOrder(page, ["title", "prompt", "image", "notes", "source", "tags"])
    artifacts.push(await screenshot(page, OUTPUT.replace(/\.md$/, ""), "desktop", "detail-image"))
    await closeModal(page)

    // --- 모바일 증거(프롬프트 상세) ---
    await page.setViewportSize({ width: 390, height: 844 })
    await openDetailByTitle(page, sourced.title)
    await assertDetailHeaderTitle(page, sourced.title)
    artifacts.push(await screenshot(page, OUTPUT.replace(/\.md$/, ""), "mobile", "detail-prompt"))
    await closeModal(page)

    await page.close()
    console.log(`PASS wave-3.6 browser: ${artifacts.length} artifacts`)
  } finally {
    await context.close()
    await browser.close()
    await stopProcess(app.child)
  }
}

run().catch((error) => {
  console.error(`FAIL wave-3.6 browser: ${error.message}`)
  process.exit(1)
})
