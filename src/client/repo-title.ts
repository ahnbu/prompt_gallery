export function repoDisplayTitle(title: string, githubUrl: string | null): string {
  if (githubUrl === null) {
    return title
  }
  if (title !== githubUrl) {
    return title
  }

  const ownerRepo = ownerRepoFromUrl(githubUrl)
  return ownerRepo ?? title
}

function ownerRepoFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== "github.com") {
      return null
    }
    const parts = parsed.pathname.split("/").filter((part) => part.length > 0)
    if (parts.length < 2) {
      return null
    }
    return `${parts[0]}/${parts[1]}`
  } catch (error) {
    if (error instanceof TypeError) {
      return null
    }
    throw error
  }
}
