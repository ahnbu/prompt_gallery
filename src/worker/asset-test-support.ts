import { env } from "cloudflare:test"
import { expect } from "vitest"
import { handleRequest } from "./index"

export const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
])
export const COLLISION_ID = "00000000-0000-4000-8000-000000000000"

export type UploadedAsset = {
  readonly id: string
  readonly itemId: string | null
  readonly objectKey: string
  readonly filename: string
  readonly contentType: string
  readonly sizeBytes: number
  readonly contentUrl: string
}

type ItemImageRow = {
  readonly image_key: string | null
}

type AssetObjectKeyRow = {
  readonly object_key: string
}

export async function apiRequest(method: string, path: string, body?: object): Promise<Response> {
  const requestInit =
    body === undefined
      ? { method }
      : {
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }

  return handleRequest(new Request(`https://prompt-gallery.test${path}`, requestInit), env)
}

export async function uploadAsset(options: {
  readonly bytes?: Uint8Array
  readonly contentType?: string
  readonly filename?: string
  readonly itemId?: string
}): Promise<Response> {
  const formData = new FormData()
  const bytes = options.bytes ?? PNG_BYTES
  const contentType = options.contentType ?? "image/png"
  const filename = options.filename ?? "preview.png"
  formData.set("file", new File([arrayBufferFromBytes(bytes)], filename, { type: contentType }))
  if (options.itemId !== undefined) {
    formData.set("itemId", options.itemId)
  }

  return handleRequest(
    new Request("https://prompt-gallery.test/api/assets", { method: "POST", body: formData }),
    env,
  )
}

export async function requireUploadedAsset(response: Response): Promise<UploadedAsset> {
  expect(response.status).toBe(201)
  const payload: unknown = await response.json()
  const serialized = JSON.stringify(payload)
  expect(serialized).not.toContain("objectKey")
  expect(serialized).not.toContain("previews/")
  const asset = field(payload, "asset")
  const id = readString(asset, "id")
  const itemId = readNullableString(asset, "itemId")
  const filename = readString(asset, "filename")
  const contentType = readString(asset, "contentType")
  const sizeBytes = readNumber(asset, "sizeBytes")
  const contentUrl = readString(asset, "contentUrl")

  if (
    id === undefined ||
    itemId === undefined ||
    filename === undefined ||
    contentType === undefined ||
    sizeBytes === undefined ||
    contentUrl === undefined
  ) {
    throw new Error("Asset response did not include the expected metadata fields.")
  }

  return {
    id,
    itemId,
    objectKey: await objectKeyForAsset(id),
    filename,
    contentType,
    sizeBytes,
    contentUrl,
  }
}

export async function createItem(body: object): Promise<string> {
  const response = await apiRequest("POST", "/api/items", body)
  expect(response.status).toBe(201)
  const payload: unknown = await response.json()
  const item = field(payload, "item")
  const id = readString(item, "id")
  if (id === undefined) {
    throw new Error("Created item response did not include item.id.")
  }
  return id
}

export async function imageKeyForItem(itemId: string): Promise<string | null> {
  const row = await env.DB.prepare("SELECT image_key FROM items WHERE id = ?")
    .bind(itemId)
    .first<ItemImageRow>()
  return row?.image_key ?? null
}

export async function objectKeyForAsset(assetId: string): Promise<string> {
  const row = await env.DB.prepare("SELECT object_key FROM assets WHERE id = ?")
    .bind(assetId)
    .first<AssetObjectKeyRow>()
  if (row === null) {
    throw new Error("Asset metadata row was not found.")
  }
  return row.object_key
}

export async function clearPreviewBucket(): Promise<void> {
  const listed = await env.PREVIEWS.list({ prefix: "previews/" })
  for (const object of listed.objects) {
    await env.PREVIEWS.delete(object.key)
  }
}

function arrayBufferFromBytes(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

function field(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined
}

function readString(value: unknown, key: string): string | undefined {
  const valueField = field(value, key)
  return typeof valueField === "string" ? valueField : undefined
}

function readNumber(value: unknown, key: string): number | undefined {
  const valueField = field(value, key)
  return typeof valueField === "number" ? valueField : undefined
}

function readNullableString(value: unknown, key: string): string | null | undefined {
  const valueField = field(value, key)
  return typeof valueField === "string" || valueField === null ? valueField : undefined
}
