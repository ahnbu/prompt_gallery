class GalleryFixtureError extends Error {}

async function fetchJson(baseUrl, pathname, init) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new GalleryFixtureError(
      `${pathname} returned ${response.status}: ${JSON.stringify(payload)}`,
    )
  }

  return payload
}

async function createTag(baseUrl, name, color) {
  const payload = await fetchJson(baseUrl, "/api/tags", {
    method: "POST",
    body: JSON.stringify({ name, color }),
  })
  return payload.tag
}

async function createItem(baseUrl, item) {
  const payload = await fetchJson(baseUrl, "/api/items", {
    method: "POST",
    body: JSON.stringify(item),
  })
  return payload.item
}

async function createWorkflow(baseUrl, workflow) {
  const payload = await fetchJson(baseUrl, "/api/workflows", {
    method: "POST",
    body: JSON.stringify(workflow),
  })
  return payload.workflow
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function deleteResource(baseUrl, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, { method: "DELETE" })
  if (!response.ok && response.status !== 404) {
    throw new GalleryFixtureError(`${pathname} cleanup returned ${response.status}`)
  }
}

export async function cleanupTask11Fixtures(baseUrl) {
  const workflowsPayload = await fetchJson(baseUrl, "/api/workflows")
  for (const workflow of workflowsPayload.workflows) {
    if (typeof workflow.name === "string" && workflow.name.startsWith("Task11 Workflow task11-")) {
      await deleteResource(baseUrl, `/api/workflows/${workflow.id}`)
    }
  }

  const itemsPayload = await fetchJson(baseUrl, "/api/items")
  for (const item of itemsPayload.items) {
    if (typeof item.title === "string" && item.title.startsWith("Task11 ")) {
      await deleteResource(baseUrl, `/api/items/${item.id}`)
    }
  }

  const tagsPayload = await fetchJson(baseUrl, "/api/tags")
  for (const tag of tagsPayload.tags) {
    if (
      typeof tag.name === "string" &&
      (tag.name.startsWith("research-task11-") ||
        tag.name.startsWith("slides-task11-") ||
        tag.name.startsWith("overflow-task11-"))
    ) {
      await deleteResource(baseUrl, `/api/tags/${tag.id}`)
    }
  }
}

export async function seedGalleryData(baseUrl) {
  const suffix = `task11-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  const searchTerm = `needle-${suffix}`
  const tagResearch = `research-${suffix}`
  const tagSlides = `slides-${suffix}`
  const overflowTags = Array.from(
    { length: 12 },
    (_, index) => `overflow-${suffix}-${String(index + 1).padStart(2, "0")}`,
  )

  await createTag(baseUrl, tagResearch, "#7170ff")
  await createTag(baseUrl, tagSlides, "#16a34a")
  for (const tag of overflowTags) {
    await createTag(baseUrl, tag, "#7170ff")
  }

  const prompt = await createItem(baseUrl, {
    type: "prompt",
    title: `Task11 Prompt ${suffix}`,
    body: `Draft a launch plan with ${searchTerm}`,
    notes: "Used for gallery search QA.",
    favorite: true,
    tags: [tagResearch, tagSlides],
  })
  await delay(25)
  const researchOnly = await createItem(baseUrl, {
    type: "prompt",
    title: `Task11 Research Only ${suffix}`,
    body: "Research-only prompt that should disappear under AND filtering.",
    tags: [tagResearch],
  })
  await delay(25)
  const imagePrompt = await createItem(baseUrl, {
    type: "image_prompt",
    title: `Task11 Image Prompt ${suffix}`,
    body: "A compact image prompt without preview.",
    tags: [tagSlides],
  })
  await delay(25)
  const sampleImagePrompt = await createItem(baseUrl, {
    type: "image_prompt",
    title: `Task11 Sample Image Prompt ${suffix}`,
    body: "Create a square editorial card with a strong focal image and concise Korean caption.",
    notes: "Actual sample data that can be deleted like any other saved image prompt.",
    tags: [tagResearch, tagSlides],
  })
  await delay(25)
  const repo = await createItem(baseUrl, {
    type: "repo",
    title: `Task11 Repo ${suffix}`,
    githubUrl: "https://github.com/example/prompt-gallery-task11",
    tags: [tagSlides],
  })
  await delay(25)
  const overflow = await createItem(baseUrl, {
    type: "prompt",
    title: `Task11 Many Tags ${suffix}`,
    body: "Prompt with more than ten visible tags.",
    tags: overflowTags,
  })
  await delay(25)
  const workflow = await createWorkflow(baseUrl, {
    name: `Task11 Workflow ${suffix}`,
    notes: "Workflow section fixture.",
    steps: [
      { kind: "prompt", itemId: prompt.id, position: 1 },
      { kind: "memo", memo: "Review filtered cards.", position: 2 },
    ],
  })

  return {
    suffix,
    searchTerm,
    tagResearch,
    tagSlides,
    overflowTags,
    itemIds: [
      prompt.id,
      researchOnly.id,
      imagePrompt.id,
      sampleImagePrompt.id,
      repo.id,
      overflow.id,
    ],
    workflowIds: [workflow.id],
    promptTitle: prompt.title,
    researchOnlyTitle: researchOnly.title,
    imageTitle: imagePrompt.title,
    sampleImageTitle: sampleImagePrompt.title,
    repoTitle: repo.title,
    overflowTitle: overflow.title,
    workflowTitle: workflow.name,
  }
}
