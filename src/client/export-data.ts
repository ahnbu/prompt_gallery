export async function downloadExport(): Promise<void> {
  const response = await fetch("/api/export")
  if (!response.ok) {
    throw new Error(`Export failed with ${response.status}.`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "prompt-gallery-export.json"
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
