export function renderCopyFavoriteEvidence(result) {
  const lines = [
    "# Wave 2 Copy Favorite",
    "",
    `Scenario: ${result.scenario}`,
    `Base URL: ${result.baseUrl}`,
    `Command: ${result.invocation ?? "pnpm qa:browser -- --scenario copy-favorite"}`,
    `Output: ${result.output ?? ".omo/evidence/wave-2-copy-favorite.md"}`,
    `Exit code: ${result.exitCode ?? (result.ok ? 0 : 1)}`,
    `Local app started: ${result.started ? "yes" : "no"}`,
    `Result: ${result.ok ? "PASS" : "FAIL"}`,
    "",
    result.ok ? "## GREEN Evidence" : "## RED Evidence",
  ]

  if (result.artifacts !== undefined) {
    lines.push(
      "## Assertions",
      "- Card copy writes exactly the prompt body to clipboard.",
      "- Keyboard copy on a card control does not open the detail modal and exposes copy status.",
      "- Detail copy writes exactly the image prompt body to clipboard.",
      "- Detail copy exposes copy status to the user and screen reader.",
      "- Repo cards do not expose body copy.",
      "- Keyboard favorite on a card control does not open the detail modal.",
      "- Card favorite toggle includes and excludes the item in the Favorite tab.",
      "- Modal favorite toggle updates detail state and the Favorite tab.",
      "- Favorite tab shows prompt, image prompt, and repo favorites in the official scenario.",
      "",
      "## Screenshots",
    )
    for (const artifact of result.artifacts) {
      lines.push(
        `- ${artifact.viewport} ${artifact.state}: ${artifact.path} (${artifact.bytes} bytes)`,
      )
    }
  }
  if (result.error !== undefined) {
    lines.push("", "## Failure", result.error)
  }
  if (result.devLogs !== undefined) {
    lines.push("", "## Dev Logs", `stdout: ${result.devLogs.stdoutPath}`)
    lines.push(`stderr: ${result.devLogs.stderrPath}`)
  }
  lines.push(
    "",
    "## Binary Observable",
    result.ok
      ? "Playwright clipboard, favorite tab, and screenshot assertions passed"
      : "Nonzero CLI exit with captured browser assertion failure",
  )

  return `${lines.join("\n")}\n`
}
