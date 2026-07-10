import { chromium } from "playwright"

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
]

class WorkflowRepoError extends Error {}

function assert(condition, message) {
  if (!condition) {
    throw new WorkflowRepoError(message)
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
  throw new WorkflowRepoError(`${pathname} request failed`)
}

async function assertVisible(locator, message) {
  try {
    await locator.first().waitFor({ state: "visible", timeout: 5000 })
  } catch (error) {
    if (error instanceof Error) {
      throw new WorkflowRepoError(`${message}: ${error.message}`)
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

function workflowStep(page, index) {
  return page.locator('[data-qa="workflow-step"]').nth(index)
}

async function cleanupTask17Fixtures(baseUrl) {
  const workflows = await requestJson(baseUrl, "GET", "/api/workflows")
  if (workflows.status === 200 && Array.isArray(workflows.json?.workflows)) {
    for (const workflow of workflows.json.workflows) {
      if (
        typeof workflow.id === "string" &&
        typeof workflow.name === "string" &&
        workflow.name.startsWith("Task17 Workflow ")
      ) {
        await requestJson(baseUrl, "DELETE", `/api/workflows/${workflow.id}`)
      }
    }
  }

  const items = await requestJson(baseUrl, "GET", "/api/items")
  if (items.status !== 200 || !Array.isArray(items.json?.items)) {
    return
  }

  for (const item of items.json.items) {
    if (
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      (item.title.startsWith("Task17 Prompt ") || item.title.startsWith("Task17 Repo "))
    ) {
      await requestJson(baseUrl, "DELETE", `/api/items/${item.id}`)
    }
  }
}

async function seedPrompt(baseUrl, title, body) {
  const response = await requestJson(baseUrl, "POST", "/api/items", {
    type: "prompt",
    title,
    body,
    notes: null,
    githubUrl: null,
    tags: [],
  })
  assert(response.status === 201, `Prompt seed failed: ${response.status} ${response.bodyText}`)
  assert(
    typeof response.json?.item?.id === "string",
    `Prompt seed response missing id: ${response.bodyText}`,
  )
}

async function createRepoThroughUi(
  page,
  repoTitle,
  githubUrl,
  artifacts,
  screenshotStem,
  viewportName,
) {
  await page.getByRole("button", { name: "레포", exact: true }).click()
  await page.getByRole("button", { name: "추가", exact: true }).click()
  await assertVisible(page.getByRole("dialog", { name: "새 항목" }), "Repo add modal missing")
  await page.getByLabel("제목").fill(repoTitle)
  await page.getByLabel("GitHub URL").fill(githubUrl)
  await page.getByRole("button", { name: "저장", exact: true }).click()

  const card = itemCard(page, repoTitle)
  await assertVisible(card, "Repo card missing")
  const cardLink = card.locator('[data-qa="repo-card-github"]')
  await assertVisible(cardLink, "Repo card GitHub action missing")
  assert((await cardLink.getAttribute("href")) === githubUrl, "Repo card GitHub href mismatch")
  assert((await cardLink.getAttribute("target")) === "_blank", "Repo card GitHub target mismatch")
  artifacts.push(await screenshot(page, screenshotStem, viewportName, "repo-card"))

  await card.getByRole("button", { name: `${repoTitle} 상세 열기` }).click()
  await assertVisible(page.getByRole("dialog", { name: repoTitle }), "Repo detail modal missing")
  const detailLink = page.locator('[data-qa="repo-detail-github"]')
  await assertVisible(detailLink, "Repo detail GitHub action missing")
  assert((await detailLink.getAttribute("href")) === githubUrl, "Repo detail GitHub href mismatch")
  assert(
    (await detailLink.getAttribute("target")) === "_blank",
    "Repo detail GitHub target mismatch",
  )
  await page.getByRole("button", { name: "닫기", exact: true }).click()
}

async function createWorkflowThroughUi(page, fixture, artifacts, screenshotStem, viewportName) {
  await page.getByRole("button", { name: "Workflow", exact: true }).click()
  await page.getByRole("button", { name: "추가", exact: true }).click()
  await assertVisible(
    page.getByRole("dialog", { name: "Workflow 추가" }),
    "Workflow add modal missing",
  )

  await page.getByLabel("이름").fill(fixture.workflowName)
  await page.getByLabel("메모").first().fill(fixture.workflowNotes)
  await page.getByLabel("Step 1 참조").selectOption({ label: fixture.promptTitle })
  await page.getByLabel("Step 2 참조").selectOption({ label: fixture.repoTitle })
  await page.getByLabel("Step 3 메모").fill(fixture.stepMemo)
  await page.getByLabel("Step 4 링크").fill("ftp://example.com/task17")
  await page.getByRole("button", { name: "저장", exact: true }).click()
  await assertVisible(
    page.getByRole("alert").filter({ hasText: "Link workflow steps require a valid URL." }),
    "Workflow API validation error missing",
  )
  artifacts.push(await screenshot(page, screenshotStem, viewportName, "workflow-validation"))

  await page.getByLabel("Step 4 링크").fill(fixture.externalUrl)
  await page.getByRole("button", { name: "저장", exact: true }).click()
  await assertVisible(itemCard(page, fixture.workflowName), "Workflow card missing after save")
}

async function assertPersistedWorkflowDetail(
  page,
  fixture,
  artifacts,
  screenshotStem,
  viewportName,
) {
  await page.reload({ waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Workflow", exact: true }).click()
  await itemCard(page, fixture.workflowName)
    .getByRole("button", { name: `${fixture.workflowName} 상세 열기` })
    .click()
  await assertVisible(
    page.getByRole("dialog", { name: fixture.workflowName }),
    "Workflow detail modal missing after reload",
  )

  const steps = page.locator('[data-qa="workflow-step"]')
  assert((await steps.count()) === 4, "Workflow detail should show four ordered steps")
  await assertWorkflowStep(workflowStep(page, 0), "prompt", "1", "프롬프트", fixture.promptTitle)
  await assertWorkflowStep(workflowStep(page, 1), "repo", "2", "레포", fixture.repoTitle)
  await assertWorkflowStep(workflowStep(page, 2), "memo", "3", "메모", fixture.stepMemo)
  await assertWorkflowStep(workflowStep(page, 3), "link", "4", "링크", fixture.externalUrl)
  artifacts.push(await screenshot(page, screenshotStem, viewportName, "workflow-detail"))
}

async function assertWorkflowStep(locator, kind, position, label, value) {
  await assertVisible(locator, `Workflow ${kind} step missing`)
  assert((await locator.getAttribute("data-kind")) === kind, `Workflow step kind mismatch: ${kind}`)
  const text = await locator.textContent()
  assert(text?.includes(position) === true, `Workflow step position missing: ${position}`)
  assert(text?.includes(label) === true, `Workflow step label missing: ${label}`)
  assert(text?.includes(value) === true, `Workflow step value missing: ${value}`)
}

async function runViewport(baseUrl, outputPath, viewport) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })
  const screenshotStem = outputPath.replace(/\.[^.]+$/, "")
  const artifacts = []
  const suffix = `${Date.now()}-${viewport.name}`
  const fixture = {
    promptTitle: `Task17 Prompt ${suffix}`,
    promptBody: `Task17 prompt body ${suffix}`,
    repoTitle: `Task17 Repo ${suffix}`,
    githubUrl: `https://github.com/task17/repo-${suffix}`,
    workflowName: `Task17 Workflow ${suffix}`,
    workflowNotes: `Task17 workflow notes ${suffix}`,
    stepMemo: `Task17 memo ${suffix}`,
    externalUrl: `https://example.com/task17/${suffix}`,
  }

  try {
    await seedPrompt(baseUrl, fixture.promptTitle, fixture.promptBody)
    await page.goto(baseUrl, { waitUntil: "networkidle" })
    await assertVisible(page.getByRole("heading", { name: "Prompt Gallery" }), "App shell missing")
    await createRepoThroughUi(
      page,
      fixture.repoTitle,
      fixture.githubUrl,
      artifacts,
      screenshotStem,
      viewport.name,
    )
    await createWorkflowThroughUi(page, fixture, artifacts, screenshotStem, viewport.name)
    await assertPersistedWorkflowDetail(page, fixture, artifacts, screenshotStem, viewport.name)
    return artifacts
  } finally {
    await browser.close()
    await cleanupTask17Fixtures(baseUrl)
  }
}

export async function runWorkflowRepo(baseUrl, outputPath) {
  await cleanupTask17Fixtures(baseUrl)
  const artifacts = []

  for (const viewport of viewports) {
    artifacts.push(...(await runViewport(baseUrl, outputPath, viewport)))
  }

  return artifacts
}
