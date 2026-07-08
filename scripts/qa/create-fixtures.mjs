import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { deflateSync } from "node:zlib"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const fixturePath = path.join(rootDir, "test/fixtures/preview.png")
const evidencePath = path.join(rootDir, ".omo/evidence/wave-0-fixtures.md")

function crc32(buffer) {
  let crc = 0xffffffff

  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii")
  const length = Buffer.alloc(4)
  const checksum = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, checksum])
}

function createPng() {
  const width = 64
  const height = 40
  const rows = []

  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4)
    row[0] = 0
    for (let x = 0; x < width; x += 1) {
      const offset = 1 + x * 4
      const accent = (x + y) % 9 === 0
      row[offset] = accent ? 40 : 232
      row[offset + 1] = accent ? 160 : 235
      row[offset + 2] = accent ? 180 : 226
      row[offset + 3] = 255
    }
    rows.push(row)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

const png = createPng()

await mkdir(path.dirname(fixturePath), { recursive: true })
await mkdir(path.dirname(evidencePath), { recursive: true })
await writeFile(fixturePath, png)
await writeFile(
  evidencePath,
  [
    "# Wave 0 Fixtures",
    "",
    "Result: PASS",
    `Generated: ${fixturePath}`,
    `Bytes: ${png.byteLength}`,
    "Network: not used",
    "",
  ].join("\n"),
)

console.log(`PASS fixture generated: ${fixturePath} (${png.byteLength} bytes)`)
