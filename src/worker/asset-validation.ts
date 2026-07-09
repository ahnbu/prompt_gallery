import { ApiError } from "./item-types"

const ACCEPTED_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])
const MAX_ASSET_BYTES = 2_000_000

export function validateAssetEnvelope(file: File): void {
  if (!ACCEPTED_CONTENT_TYPES.has(file.type)) {
    throw new ApiError(
      "invalid_asset",
      "Asset content type must be image/png, image/jpeg, or image/webp.",
      400,
    )
  }
  if (file.size === 0 || file.size > MAX_ASSET_BYTES) {
    throw new ApiError("invalid_asset", "Asset size must be between 1 byte and 2 MB.", 400)
  }
}

export function validateAssetBytes(contentType: string, buffer: ArrayBuffer): void {
  const bytes = new Uint8Array(buffer)
  if (!bytesMatchContentType(contentType, bytes)) {
    throw new ApiError(
      "invalid_asset",
      "Asset bytes must match the declared PNG, JPEG, or WebP content type.",
      400,
    )
  }
}

export function extensionFor(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return "png"
    case "image/jpeg":
      return "jpg"
    case "image/webp":
      return "webp"
    default:
      return "bin"
  }
}

export function filenameFor(file: File, extension: string): string {
  const trimmed = file.name.trim()
  return trimmed.length === 0 ? `asset.${extension}` : trimmed
}

export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function bytesMatchContentType(contentType: string, bytes: Uint8Array): boolean {
  switch (contentType) {
    case "image/png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff])
    case "image/webp":
      return (
        startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        startsWith(bytes.slice(8), [0x57, 0x45, 0x42, 0x50])
      )
    default:
      return false
  }
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte)
}
