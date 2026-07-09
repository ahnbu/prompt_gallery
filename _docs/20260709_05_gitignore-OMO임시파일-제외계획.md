---
title: gitignore-OMO임시파일-제외계획
date: 2026-07-09 19:22
tags:
  - plan
session_id: 16203191-8429-4cbf-9bec-9a5caea59b14
session_path: C:/Users/ahnbu/.antigravity/export/conversations_export.json
ai: antigravity
status: 완료
next_resume: 없음
created: 2026-07-09 19:22
---

# gitignore-OMO임시파일-제외계획

이 계획은 OMO(OpenClaw Task Lifecycle) 실행 도중 발생하는 임시 상태 파일, 드래프트, 증적(evidence) 등을 Git 버전 관리에서 선별 제외하여 `git status`를 깔끔하게 유지하는 데 목적이 있습니다. 

단, 핵심 산출물인 계획서(`.omo/plans/*.md`) 및 종합 보고서 등은 추후 협업 및 기록을 위해 계속 Git으로 추적 가능하도록 제외 대상에서 배제합니다.

## 다음 재개 지점

없음 (완료)

## Wave 진척

| Wave | Task | 상태 | 완료시각 | 완료 기준 / 검증 방법 |
|------|------|------|----------|----------------------|
| **Wave 1** | `.gitignore` 파일 수정 및 OMO 제외 패턴 추가 | 완료 | 2026-07-09 19:23 | `.gitignore` 파일 끝에 OMO 임시 파일용 제외 패턴이 누락 없이 기록된다. |
| **Wave 2** | 이미 추적 중인 임시/증적 파일 Git 인덱스에서 제거 | 완료 | 2026-07-09 19:23 | `git rm -r --cached` 실행 후 `git status`에서 해당 파일들이 `deleted` 상태로 스테이징된다. |
| **Wave 3** | 로컬 검증 및 CHANGELOG 업데이트 | 완료 | 2026-07-09 19:24 | `git status` 확인 시 `.omo/plans/...`만 untracked로 남고, `CHANGELOG.md` 최상단에 수정 이력이 추가된다. |
| **Wave 4** | `cp` 스킬을 활용한 커밋 및 원격 저장소 푸시 | 완료 | 2026-07-09 19:24 | `git push`가 성공적으로 완료되며 원격 저장소에 반영된다. |

## 세부 구현 계획

### Wave 1: `.gitignore` 파일 수정
`.gitignore` 파일의 마지막 줄에 아래 내용을 추가합니다.
```gitignore
# OMO Temp & Evidences (Git 추적 제외)
.omo/drafts/
.omo/evidence/
.omo/boulder.json
wave-*
claim-*
expansion-log.md
NOTEPAD.md
verify-*
```

### Wave 2: Git 추적 파일 해제
현재 `.omo/drafts/`와 `.omo/evidence/` 폴더 내 파일들이 이미 추적 중이므로 다음 명령어를 수행합니다.
```bash
git rm -r --cached .omo/drafts/ .omo/evidence/
```

### Wave 3: 검증 및 CHANGELOG 업데이트
- **검증**: `git status` 명령을 실행하여 `.omo/drafts/` 및 `.omo/evidence/` 내 파일이 untracked 목록에 뜨지 않고, `.omo/plans/` 하위 파일만 안전하게 추적 대상에 잡히는지 실측합니다.
- **CHANGELOG 업데이트**: `D:/vibe-coding/prompt-gallery/CHANGELOG.md` 상단 표에 커밋 이력을 추가합니다.

### Wave 4: cp 스킬 실행
`cp` 스킬을 호출하여 레포지토리의 최종 변경사항을 원격 저장소에 커밋 및 푸시합니다.
- 커밋 메시지: `chore(git): .gitignore에 OMO 임시 파일 및 증거 제외 패턴 추가`
