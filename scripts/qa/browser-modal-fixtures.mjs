class ModalFixtureError extends Error {}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function fetchJson(baseUrl, pathname, init) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${pathname}`, {
        ...init,
        headers: { "content-type": "application/json", ...init?.headers },
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new ModalFixtureError(
          `${pathname} returned ${response.status}: ${JSON.stringify(payload)}`,
        )
      }

      return payload
    } catch (error) {
      lastError = error
      await delay(200)
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }
  throw new ModalFixtureError(`${pathname} request failed`)
}

async function deleteResource(baseUrl, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, { method: "DELETE" })
  if (!response.ok && response.status !== 404) {
    throw new ModalFixtureError(`${pathname} cleanup returned ${response.status}`)
  }
}

export async function cleanupTask12Fixtures(baseUrl) {
  const itemsPayload = await fetchJson(baseUrl, "/api/items")
  for (const item of itemsPayload.items) {
    if (typeof item.title === "string" && item.title.startsWith("Task12 ")) {
      await deleteResource(baseUrl, `/api/items/${item.id}`)
    }
  }

  const tagsPayload = await fetchJson(baseUrl, "/api/tags")
  for (const tag of tagsPayload.tags) {
    if (typeof tag.name === "string" && tag.name.startsWith("modal-task12-")) {
      await deleteResource(baseUrl, `/api/tags/${tag.id}`)
    }
  }
}

export async function seedModalCrudData(baseUrl) {
  const suffix = `task12-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  const tagName = `modal-${suffix}`

  await fetchJson(baseUrl, "/api/tags", {
    method: "POST",
    body: JSON.stringify({ name: tagName, color: "#7170ff" }),
  })

  return {
    suffix,
    tagName,
    bodyOnly: `Task12 body-only prompt ${suffix}`,
    editedTitle: `Task12 Edited ${suffix}`,
    editedNotes: `Task12 edited notes ${suffix}`,
  }
}
