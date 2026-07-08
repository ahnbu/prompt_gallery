import { assertSmoke, expectStatus, requestJson, requireItem } from "./api-smoke-support.mjs"

function requireWorkflow(result, label) {
  const workflow = result.json?.workflow
  assertSmoke(
    typeof workflow?.id === "string",
    `${label} did not return workflow.id: ${result.bodyText}`,
  )
  assertSmoke(
    Array.isArray(workflow.steps),
    `${label} did not return workflow.steps: ${result.bodyText}`,
  )
  return workflow
}

async function deleteCreated(baseUrl, collection, id) {
  const result = await requestJson(baseUrl, "DELETE", `/api/${collection}/${id}`)
  expectStatus(result, 200, `DELETE /api/${collection}/${id}`)
  return `${collection}/${id}: ${result.status}`
}

async function cleanupCreated(baseUrl, created) {
  const cleanup = []
  for (const id of created.workflows.reverse()) {
    cleanup.push(await deleteCreated(baseUrl, "workflows", id))
  }
  for (const id of created.items.reverse()) {
    cleanup.push(await deleteCreated(baseUrl, "items", id))
  }
  for (const id of created.tags.reverse()) {
    cleanup.push(await deleteCreated(baseUrl, "tags", id))
  }
  return cleanup
}

async function createTag(baseUrl, created, name, color) {
  const result = await requestJson(baseUrl, "POST", "/api/tags", { name, color })
  expectStatus(result, 201, `POST /api/tags ${name}`)
  const tag = result.json?.tag
  assertSmoke(
    typeof tag?.id === "string" && tag.name === name,
    `POST /api/tags ${name} returned ${result.bodyText}`,
  )
  created.tags.push(tag.id)
  return tag
}

async function createItem(baseUrl, created, body) {
  const result = await requestJson(baseUrl, "POST", "/api/items", body)
  expectStatus(result, 201, "POST /api/items")
  const item = requireItem(result, "POST /api/items")
  created.items.push(item.id)
  return item
}

async function smokeHealth(baseUrl, context) {
  const health = await requestJson(baseUrl, "GET", "/api/health")
  expectStatus(health, 200, "GET /api/health")
  assertSmoke(health.json?.ok === true, `GET /api/health missing ok:true: ${health.bodyText}`)
  context.checks.push("GET /api/health -> 200 ok:true")
  return health
}

async function smokeItemsAndTags(baseUrl, context, created, marker) {
  const bodyOnly = `${marker} body-only prompt`
  const bodyOnlyItem = await createItem(baseUrl, created, { type: "prompt", body: bodyOnly })
  assertSmoke(
    bodyOnlyItem.title === bodyOnly && bodyOnlyItem.body === bodyOnly,
    "Body-only prompt fallback title/body failed",
  )
  context.checks.push(`POST /api/items body-only -> 201 fallback title/body id=${bodyOnlyItem.id}`)

  const research = await createTag(baseUrl, created, "research", "#3366cc")
  const slides = await createTag(baseUrl, created, "slides", "#22aa66")
  context.checks.push(`POST /api/tags -> 201 research=${research.id}, slides=${slides.id}`)

  const taggedItem = await createItem(baseUrl, created, {
    type: "prompt",
    body: `${marker} research slides tagged prompt`,
    tags: ["research", "slides"],
  })
  const researchOnlyItem = await createItem(baseUrl, created, {
    type: "prompt",
    body: `${marker} research only tagged prompt`,
    tags: ["research"],
  })
  const tagged = await requestJson(baseUrl, "GET", "/api/items?tags=research,slides")
  expectStatus(tagged, 200, "GET /api/items?tags=research,slides")
  const taggedMatches = tagged.json?.items?.filter((item) => item.body?.includes(marker)) ?? []
  assertSmoke(
    taggedMatches.length === 1 &&
      taggedMatches[0].id === taggedItem.id &&
      taggedMatches.every((item) => item.id !== researchOnlyItem.id),
    `Tag filter smoke marker mismatch: ${tagged.bodyText}`,
  )
  context.checks.push(
    `GET /api/items?tags=research,slides -> AND matched ${taggedItem.id} and excluded ${researchOnlyItem.id}`,
  )
  return taggedItem
}

async function smokeFavorite(baseUrl, context, taggedItem) {
  const favorite = await requestJson(baseUrl, "POST", `/api/items/${taggedItem.id}/favorite`, {
    favorite: true,
  })
  expectStatus(favorite, 200, "POST /api/items/:id/favorite")
  assertSmoke(
    requireItem(favorite, "POST favorite").favorite === true,
    "Favorite response did not set favorite:true",
  )
  const favorites = await requestJson(baseUrl, "GET", "/api/items?favorite=true")
  expectStatus(favorites, 200, "GET /api/items?favorite=true")
  assertSmoke(
    favorites.json?.items?.some((item) => item.id === taggedItem.id) === true,
    `Favorite item missing: ${favorites.bodyText}`,
  )
  context.checks.push(`POST favorite + GET favorite=true -> included id=${taggedItem.id}`)
}

async function smokeWorkflow(baseUrl, context, created, marker) {
  const promptStepItem = await createItem(baseUrl, created, {
    type: "prompt",
    body: `${marker} workflow prompt`,
  })
  const repoStepItem = await createItem(baseUrl, created, {
    type: "repo",
    githubUrl: "https://github.com/example/prompt-gallery-smoke",
  })
  const workflowResult = await requestJson(baseUrl, "POST", "/api/workflows", {
    name: `${marker} workflow`,
    steps: [
      { kind: "prompt", position: 1, itemId: promptStepItem.id },
      { kind: "repo", position: 2, itemId: repoStepItem.id },
      { kind: "memo", position: 3, memo: `${marker} memo` },
      { kind: "link", position: 4, url: "https://example.com/prompt-gallery-smoke" },
    ],
  })
  expectStatus(workflowResult, 201, "POST /api/workflows")
  const workflow = requireWorkflow(workflowResult, "POST /api/workflows")
  created.workflows.push(workflow.id)
  const positions = workflow.steps.map((step) => step.position).join(",")
  assertSmoke(
    positions === "1,2,3,4",
    `Workflow step positions were not ordered 1-4: ${workflowResult.bodyText}`,
  )
  context.checks.push(`POST /api/workflows -> 201 ordered positions ${positions} id=${workflow.id}`)
}

async function smokeMalformedFavorite(baseUrl, context, taggedItem) {
  const invalidFavorite = await requestJson(
    baseUrl,
    "POST",
    `/api/items/${taggedItem.id}/favorite`,
    { favorite: "yes" },
  )
  expectStatus(invalidFavorite, 400, "POST malformed favorite")
  assertSmoke(
    invalidFavorite.json?.error?.code === "invalid_item",
    `Malformed favorite did not return JSON invalid_item: ${invalidFavorite.bodyText}`,
  )
  context.checks.push("POST malformed favorite body -> JSON 400 invalid_item")
}

export async function runWave1(baseUrl, context) {
  const marker = `wave1-smoke-${Date.now()}`
  const created = { workflows: [], items: [], tags: [] }

  try {
    const health = await smokeHealth(baseUrl, context)
    const taggedItem = await smokeItemsAndTags(baseUrl, context, created, marker)
    await smokeFavorite(baseUrl, context, taggedItem)
    await smokeWorkflow(baseUrl, context, created, marker)
    await smokeMalformedFavorite(baseUrl, context, taggedItem)
    return { health }
  } finally {
    context.cleanup.push(...(await cleanupCreated(baseUrl, created)))
  }
}
