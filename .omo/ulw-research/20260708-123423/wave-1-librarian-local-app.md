# Wave 1 - Local desktop app

## Key Findings
- Electron and Tauri both bypass browser file-write limits by running as desktop apps.
- Electron is more straightforward for a JS-first app, but security hygiene requires preload/context isolation and careful API exposure.
- Tauri has stronger permission and scope defaults and a mobile story, but adds Rust/WebView/build prerequisite complexity.
- Neither solves multi-PC/mobile sync by itself; backup/sync is a separate app design decision.

## Sources
- https://www.electronjs.org/docs/latest/tutorial/context-isolation
- https://www.electronjs.org/docs/latest/tutorial/security
- https://v2.tauri.app/plugin/file-system/
- https://v2.tauri.app/security/permissions/
- https://v2.tauri.app/plugin/updater/

## EXPAND
- LEAD: 로컬-first 동기화/백업 패턴 — WHY: 다른 PC 접근을 서버 없이 풀 수 있는지 결정 — ANGLE: Syncthing/WebDAV/Cloud drive sync patterns.
