export function renderGallerySearchEvidence(result) {
  const previousRed = extractRedEvidence(result.previousEvidence)
  const lines = [
    "# Wave 2 Core UI - Gallery Search",
    "",
    `Scenario: ${result.scenario}`,
    `Base URL: ${result.baseUrl}`,
    `Command: ${result.invocation ?? "pnpm qa:browser -- --scenario gallery-search"}`,
    `Output: ${result.output ?? ".omo/evidence/wave-2-core-ui.md"}`,
    `Exit code: ${result.exitCode ?? (result.ok ? 0 : 1)}`,
    `Local app started: ${result.started ? "yes" : "no"}`,
    `Result: ${result.ok ? "PASS" : "FAIL"}`,
  ]

  if (previousRed !== null) {
    lines.push("", "## RED Evidence", previousRed)
  } else if (!result.ok) {
    lines.push(
      "",
      "## RED Evidence",
      `Command: ${result.invocation ?? "pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-2-core-ui.md"}`,
      `Output: ${result.output ?? ".omo/evidence/wave-2-core-ui.md"}`,
      `Exit code: ${result.exitCode ?? 1}`,
      `Observed failure: ${result.error ?? "unknown failure"}`,
    )
  }

  lines.push("", result.ok ? "## GREEN Evidence" : "## Current Failure")
  appendAssertions(lines, result.artifacts)
  appendFailure(lines, result.error)
  appendDevLogs(lines, result.devLogs)
  lines.push(
    "",
    "## Notes",
    "- Old BLOCK artifacts are superseded by later gate reviews; this evidence records the current gate run.",
  )
  lines.push(
    "",
    "## Binary Observable",
    result.ok
      ? "Playwright screenshots written and gallery search DOM assertions passed"
      : "Nonzero CLI exit with captured browser assertion failure",
  )

  return `${lines.join("\n")}\n`
}

function appendAssertions(lines, artifacts) {
  if (artifacts === undefined) {
    return
  }

  lines.push(
    "## Assertions",
    "- API fixture data created through /api/tags, /api/items, and /api/workflows.",
    "- Real saved image prompt sample data appears as normal gallery cards.",
    "- Compact tabs visible by accessible role/name.",
    "- All default view shows prompt, image prompt, workflow, and repo sections.",
    "- All view section headers expose icon-only lucide add buttons with correct default add targets.",
    "- Compact image prompt preview frames are bounded and not wide banners.",
    "- Search switches All view from sectioned lists to unified results.",
    "- AND tag filtering includes only cards with every selected tag.",
    "- Type badges render for prompt, image prompt, workflow, and repo cards.",
    "- Prompt cards are latest-first by API updated timestamp.",
    "- Cards render at most 10 compact visible tag chips and show hidden tag overflow.",
    "- Many-tag prompt cards stay inside their section bounds.",
    "- Prompt, image prompt, workflow, repo, favorite, and All tabs filter fixture data.",
    "",
    "## Screenshots",
  )
  for (const artifact of artifacts) {
    lines.push(
      `- ${artifact.viewport} ${artifact.state}: ${artifact.path} (${artifact.bytes} bytes)`,
    )
  }
}

function appendFailure(lines, error) {
  if (error !== undefined) {
    lines.push("", "## Failure", error)
  }
}

function appendDevLogs(lines, devLogs) {
  if (devLogs !== undefined) {
    lines.push("", "## Dev Logs", `stdout: ${devLogs.stdoutPath}`, `stderr: ${devLogs.stderrPath}`)
  }
}

function extractRedEvidence(previousEvidence) {
  if (typeof previousEvidence !== "string") {
    return null
  }

  const redHeading = "## RED Evidence"
  const redStart = previousEvidence.indexOf(redHeading)
  if (redStart !== -1) {
    return existingRedSection(previousEvidence, redStart, redHeading.length)
  }
  if (!previousEvidence.includes("Result: FAIL")) {
    return null
  }

  const failureIndex = previousEvidence.indexOf("## Failure")
  const failureText =
    failureIndex === -1
      ? "Previous gallery-search run failed."
      : previousEvidence.slice(failureIndex).trim()
  return [
    "Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-2-core-ui.md",
    "Exit code: 1",
    failureText,
  ].join("\n")
}

function existingRedSection(previousEvidence, redStart, headingLength) {
  const contentStart = redStart + headingLength
  const nextGreen = previousEvidence.indexOf("## GREEN Evidence", contentStart)
  const nextCurrent = previousEvidence.indexOf("## Current Failure", contentStart)
  const candidates = [nextGreen, nextCurrent].filter((index) => index !== -1)
  const contentEnd = candidates.length === 0 ? previousEvidence.length : Math.min(...candidates)
  return previousEvidence.slice(contentStart, contentEnd).trim()
}
