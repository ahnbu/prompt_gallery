class CopyFavoriteFixtureError extends Error {}

async function fetchJson(baseUrl, pathname, init) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new CopyFavoriteFixtureError(
      `${pathname} returned ${response.status}: ${JSON.stringify(payload)}`,
    )
  }

  return payload
}

async function createItem(baseUrl, item) {
  const payload = await fetchJson(baseUrl, "/api/items", {
    method: "POST",
    body: JSON.stringify(item),
  })
  return payload.item
}

async function deleteResource(baseUrl, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, { method: "DELETE" })
  if (!response.ok && response.status !== 404) {
    throw new CopyFavoriteFixtureError(`${pathname} cleanup returned ${response.status}`)
  }
}

export async function cleanupTask13Fixtures(baseUrl) {
  const payload = await fetchJson(baseUrl, "/api/items")
  for (const item of payload.items) {
    if (typeof item.title === "string" && item.title.startsWith("Task13 ")) {
      await deleteResource(baseUrl, `/api/items/${item.id}`)
    }
  }
}

export async function seedCopyFavoriteData(baseUrl) {
  const suffix = `task13-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  const promptBody = `Task13 prompt body only ${suffix}`
  const modalPromptBody = `Task13 modal prompt body only ${suffix}`
  const imageBody = `Task13 image prompt body only ${suffix}`
  const prompt = await createItem(baseUrl, {
    type: "prompt",
    title: `Task13 Prompt ${suffix}`,
    body: promptBody,
    favorite: false,
    notes: `Task13 prompt notes ${suffix}`,
  })
  const modalPrompt = await createItem(baseUrl, {
    type: "prompt",
    title: `Task13 Modal Prompt ${suffix}`,
    body: modalPromptBody,
    favorite: false,
  })
  const image = await createItem(baseUrl, {
    type: "image_prompt",
    title: `Task13 Image ${suffix}`,
    body: imageBody,
    favorite: false,
  })
  const repo = await createItem(baseUrl, {
    type: "repo",
    title: `Task13 Repo ${suffix}`,
    favorite: false,
    githubUrl: "https://github.com/example/task13",
  })

  return { image, imageBody, modalPrompt, prompt, promptBody, repo }
}
