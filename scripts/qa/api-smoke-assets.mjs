import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { assertSmoke, expectStatus, requestJson, requireItem } from "./api-smoke-support.mjs"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const fixturePath = path.join(rootDir, "test/fixtures/preview.png")

async function requestMultipart(baseUrl, pathname, formData) {
  const response = await fetch(new URL(pathname, baseUrl), {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(5000),
  })
  const bodyText = await response.text()
  try {
    return {
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      bodyText,
      json: JSON.parse(bodyText),
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`POST ${pathname} response is not JSON: ${bodyText}`)
    }
    throw error
  }
}

async function requestBytes(baseUrl, pathname) {
  const response = await fetch(new URL(pathname, baseUrl), {
    method: "GET",
    signal: AbortSignal.timeout(5000),
  })
  return {
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    bytes: new Uint8Array(await response.arrayBuffer()),
  }
}

function requireAsset(result, label) {
  const asset = result.json?.asset
  assertSmoke(typeof asset?.id === "string", `${label} did not return asset.id: ${result.bodyText}`)
  assertSmoke(
    !result.bodyText.includes("objectKey") && !result.bodyText.includes("previews/"),
    `${label} exposed internal object key: ${result.bodyText}`,
  )
  assertSmoke(
    asset.contentUrl === `/api/assets/${asset.id}/content`,
    `${label} did not return protected contentUrl: ${result.bodyText}`,
  )
  return asset
}

async function uploadPreview(baseUrl, itemId, filename, bytes) {
  const formData = new FormData()
  formData.set("itemId", itemId)
  formData.set("file", new Blob([bytes], { type: "image/png" }), filename)
  return requestMultipart(baseUrl, "/api/assets", formData)
}

async function cleanup(baseUrl, created) {
  const cleanupResults = []
  for (const assetId of created.assets.reverse()) {
    const result = await requestJson(baseUrl, "DELETE", "/api/assets", { id: assetId })
    cleanupResults.push(`assets/${assetId}: ${result.status}`)
  }
  for (const itemId of created.items.reverse()) {
    const result = await requestJson(baseUrl, "DELETE", `/api/items/${itemId}`)
    cleanupResults.push(`items/${itemId}: ${result.status}`)
  }
  return cleanupResults
}

export async function runAssets(baseUrl, context) {
  const created = { assets: [], items: [] }
  const bytes = await readFile(fixturePath)

  try {
    const itemResult = await requestJson(baseUrl, "POST", "/api/items", {
      type: "image_prompt",
      body: `asset smoke ${Date.now()}`,
    })
    expectStatus(itemResult, 201, "POST /api/items image_prompt")
    const item = requireItem(itemResult, "POST /api/items image_prompt")
    created.items.push(item.id)
    context.checks.push(`POST /api/items image_prompt -> 201 id=${item.id}`)

    const upload = await uploadPreview(baseUrl, item.id, "preview.png", bytes)
    expectStatus(upload, 201, "POST /api/assets")
    const firstAsset = requireAsset(upload, "POST /api/assets")
    created.assets.push(firstAsset.id)
    assertSmoke(
      firstAsset.contentType === "image/png" && firstAsset.sizeBytes === bytes.byteLength,
      `POST /api/assets metadata mismatch: ${upload.bodyText}`,
    )
    context.checks.push(
      `POST /api/assets -> 201 id=${firstAsset.id} internal object key not emitted`,
    )

    const content = await requestBytes(baseUrl, `/api/assets/${firstAsset.id}/content`)
    assertSmoke(content.status === 200, `GET asset content expected 200, got ${content.status}`)
    assertSmoke(content.contentType.includes("image/png"), "Asset content type was not image/png")
    assertSmoke(content.bytes.byteLength === bytes.byteLength, "Asset content byte size mismatch")
    context.checks.push(
      `GET /api/assets/${firstAsset.id}/content -> 200 image/png ${content.bytes.byteLength} bytes`,
    )

    const replacement = await uploadPreview(
      baseUrl,
      item.id,
      "replacement.png",
      Buffer.concat([bytes, Buffer.from([1])]),
    )
    expectStatus(replacement, 201, "POST /api/assets replacement")
    const secondAsset = requireAsset(replacement, "POST /api/assets replacement")
    created.assets.push(secondAsset.id)
    const oldContent = await requestBytes(baseUrl, `/api/assets/${firstAsset.id}/content`)
    assertSmoke(oldContent.status === 404, "Replacement did not remove prior asset content")
    context.checks.push(
      `POST /api/assets replacement -> old asset ${firstAsset.id} returns 404, new id=${secondAsset.id}`,
    )

    const deleted = await requestJson(baseUrl, "DELETE", "/api/assets", { id: secondAsset.id })
    expectStatus(deleted, 200, "DELETE /api/assets")
    created.assets = created.assets.filter((id) => id !== secondAsset.id)
    const missing = await requestBytes(baseUrl, `/api/assets/${secondAsset.id}/content`)
    assertSmoke(missing.status === 404, "Deleted asset content did not return 404")
    context.checks.push(`DELETE /api/assets -> 200 and content 404 id=${secondAsset.id}`)

    return { health: await requestJson(baseUrl, "GET", "/api/health") }
  } finally {
    context.cleanup.push(...(await cleanup(baseUrl, created)))
  }
}
