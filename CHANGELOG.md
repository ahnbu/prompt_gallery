# CHANGELOG

모든 Git 커밋 이력을 최신순으로 기록합니다. 새 커밋은 표 최상단에 추가합니다.

| 일시 | 유형 | 범위 | 변경내용 | 변경사유 | 작성AI |
|---|---|---|---|---|---|
| 2026-07-19 18:48 | feat | modal | 편집 폼 필드 순서 재배치, '본문'→'프롬프트' 라벨 통일 | - | Claude |
| 2026-07-19 18:48 | feat | modal | 상세/편집 모달 헤더 재구성, 상세 뷰 순서 재배치, 복사 버튼 확장 | - | Claude |
| 2026-07-19 18:47 | docs | plan | Wave 3.5·4 원격 배포 완료 기록 추가 | - | Claude |
| 2026-07-19 18:47 | docs | backlog | 저우선 상태 표기 규칙 추가 | - | Claude |
| 2026-07-19 18:47 | docs | agents | AGENTS.md·src/client/AGENTS.md 한국어 번역 | - | Claude |
| 2026-07-19 16:55 | docs | plan | Wave 3.5·4 원격 배포 완료 기록 (D1 백업·마이그레이션·deploy) | - | Claude |
| 2026-07-19 16:51 | style | qa | browser-wave4.mjs 포맷 정리·디버그 로그 제거 | - | Claude |
| 2026-07-19 16:46 | docs | plan | Wave 4 구현계획·플랜검수·완료검수 문서 기록 | - | Claude |
| 2026-07-19 16:45 | style | qa | browser-wave35.mjs 포맷 정리 (biome 재포맷 잔여) | - | Claude |
| 2026-07-19 16:44 | feat | ui | 아이템 출처 링크 입력·표시 UI 추가 — 전 타입 공통 | - | Claude |
| 2026-07-19 16:43 | feat | item | worker에 출처 링크(source_url) 필드 배선 — 타입·검증·저장 | - | Claude |
| 2026-07-19 13:54 | chore | db | source_url 컬럼 마이그레이션 추가 — 아이템 출처 링크 필드 신규 | - | Claude |
| 2026-07-19 13:41 | docs | plan | Wave 3.5 구현계획·플랜검수·완료검수 문서 기록 | - | Claude |
| 2026-07-19 13:39 | feat | image | 이미지 업로드 UX 개선 — 저장 전 업로드 허용·add 케이스 orphan cleanup·드래그앤드롭 | - | Claude |
| 2026-07-19 13:39 | fix | ui | 비활성 버튼 커서 wait→not-allowed — 로딩 오인 스피너 제거 | - | Claude |
| 2026-07-19 13:38 | feat | ui | 카드·모달 제목 정리 — 모달 제목 1줄, 카드 제목을 본문 위로 이동(제목 y축 정렬) | - | Claude |
| 2026-07-19 13:01 | docs | agents-rules | AGENTS.md에 DEPLOYMENT 섹션 추가 — AI 직접 배포 절차(인증·마이그레이션 확인 포함), 낡은 'deploy 스크립트 없음' 서술 수정 | - | Claude |
| 2026-07-19 12:51 | docs | rules | CLAUDE.md 파일 추가(@AGENTS.md 포인터) — 이전 CHANGELOG 행의 실제 파일 커밋 | - | Claude |
| 2026-07-19 12:47 | refactor | client-ui | 탭바·카드·모달 타입 뱃지를 점에서 아이콘으로 통일 — 카테고리/뷰 식별성 개선, 탭과 카드가 동일 아이콘 사용 | - | Claude |
| 2026-07-19 12:47 | docs | rules | CLAUDE.md를 @AGENTS.md 포인터로 통일 — Claude Code의 AGENTS.md 인식 확보 | - | Claude |
| 2026-07-19 12:35 | feat | brand | 브랜드 로크업 개편 — Fraunces 세리프 타이틀 self-host 번들, 타이틀 30→24px 축소, 파비콘 P를 세리프로 통일 | - | Claude |
| 2026-07-19 12:24 | docs | ui-plan | Wave 5 규칙에 반응형 단일행 회귀 방지(액션 버튼 2줄 wrap 금지) 항목 추가 | - | Claude |
| 2026-07-19 12:23 | fix | client-ui | 중간 폭(681~860px)에서 상단 액션 버튼 2줄 wrap 수정 — 해당 구간부터 아이콘화. QA에 액션 버튼 단일행 회귀 검사 추가 | - | Claude |
| 2026-07-19 12:19 | fix | client-ui | 모바일 상단 레이아웃 개선(로고 유지+액션 아이콘화), 탭바 2줄 단어깨짐 수정, 탭 뱃지를 카드와 동일하게 점+라벨로 통일(아이콘 제거) | - | Claude |
| 2026-07-19 12:09 | docs | ui-plan | UI 피드백 검토·반응성 전수진단·구현계획 A 및 plan-check/done-check 검수보고서 추가 | - | Claude |
| 2026-07-19 12:07 | feat | client-ui | Wave 1~3 UI 개선 — 파비콘 P 심볼, 뱃지 1줄 고정, 즐겨찾기·태그 optimistic update, All 탭 masonry 통합 뷰, 탭 순서 재배치, 레포 제목 owner/repo, 반응형 타이틀 숨김 | - | Claude |
| 2026-07-10 14:09 | fix | deploy | 원격 D1 migration 누락 검사를 테스트 가능하게 보강하고 완료검수 보고서 추가 | - | Codex |
| 2026-07-10 13:56 | fix | deploy | Windows 환경 wrangler 실행 인자 보정 | - | Antigravity |
| 2026-07-10 13:56 | fix | deploy | 원격 D1 마이그레이션 누락 검증 로직 및 배포 스크립트 추가 — 배포 전 스키마 불일치 예방 | - | Antigravity |
| 2026-07-10 13:55 | feat | client-ui | 갤러리 카드 GitHub 링크 아이콘화 및 액션 그룹 통합 사후 검증 반영 | - | Antigravity |
| 2026-07-10 13:34 | docs | plan-check | 카드 상세 수정 UI 변경계획 검수보고서 추가 — 기획 리스크 및 검증 누락 지적 | - | Antigravity |
| 2026-07-10 13:23 | feat | client-ui | 통합 카드·모달·헤더 UI와 태그 편집 QA 보강 | - | Unknown |
| 2026-07-09 19:51 | chore | backlog | 프로젝트 백로그(BACKLOG.md) 업데이트 | - | Antigravity |
| 2026-07-09 19:51 | docs | ui | 카드 상세 개선안, UI 변경계획, 개선 목업 및 통합 실행계획 추가 | - | Antigravity |
| 2026-07-09 19:50 | docs | plans | 자동 및 수동 태그 분리 계획서 수정 내용 반영 | - | Antigravity |
| 2026-07-09 19:50 | docs | plans | gitignore OMO 임시파일 제외 계획서 최종 완료 상태 반영 | - | Antigravity |
| 2026-07-09 19:23 | chore | git | .gitignore에 OMO 임시 파일 및 증적 제외 패턴 추가 | - | Antigravity |
| 2026-07-09 18:35 | feat | tags | 자동·수동 태그 부여 출처 분리와 태그 관리 UI 생성 흐름 추가 | - | Unknown |
| 2026-07-09 17:35 | docs | drafts | 자동 수동 태그 계획 게이트 초안 구체화 | - | Codex |
| 2026-07-09 17:34 | docs | plans | 자동 수동 태그 계획 초안 보존 | - | Codex |
| 2026-07-09 17:32 | docs | evidence | 디자인 적용 검토와 QA 산출물 정리 | - | Codex |
| 2026-07-09 17:28 | fix | ui | 헤더 브랜드 표시를 favicon과 앱명으로 정리 | - | Codex |
| 2026-07-09 17:13 | feat | ui | 디자인 계약 기반 카드 갤러리와 QA 보강 | - | Unknown |
| 2026-07-09 15:55 | feat | favicon | Gallery Grid favicon과 미리보기 HTML 추가 | 브라우저 탭 식별성 개선 | Codex |
| 2026-07-09 15:51 | docs | agents | 계층형 AGENTS 지식베이스 추가 | init-deep 결과 보존 | Codex |
| 2026-07-09 15:46 | docs | knowledge | 프로젝트 지식베이스와 디자인 레이아웃 QA 초안 추가 | - | Unknown |
| 2026-07-09 15:42 | docs | plans | 디자인 적용 계획 본문과 evidence 경로 정리 | - | Unknown |
| 2026-07-09 15:41 | docs | drafts | 디자인 적용 계획 초안 세부 검토 내용 보강 | - | Unknown |
| 2026-07-09 15:39 | docs | plans | 디자인 적용 계획 초안과 배포 점검 evidence 기록 | - | Unknown |
| 2026-07-09 15:37 | feat | ui | 갤러리 섹션 추가 버튼과 정사각형 이미지 프롬프트 카드 개선 | - | Unknown |
| 2026-07-09 14:24 | docs | final-gate | Final gate 검증 결과와 구현 계획 완료 상태 반영 | Wave 4 이후 F1-F5 완료 근거 기록 | Codex |
| 2026-07-09 13:54 | feat | ops | 태그 관리 UI와 export/local backup, deploy readiness 검증 흐름 추가 | - | Unknown |
| 2026-07-09 12:48 | feat | media-workflows | 이미지 preview와 Workflow 실행 흐름 추가 | - | Codex |
| 2026-07-09 01:10 | feat | ui | 갤러리 검색·필터·모달 CRUD·본문 복사·즐겨찾기 UX와 Wave 2 브라우저 QA 추가 | - | Unknown |
| 2026-07-08 22:24 | feat | api | D1 기반 항목·태그·즐겨찾기·워크플로우 API와 Wave 1 검증 smoke 추가 | - | Unknown |
| 2026-07-08 15:49 | docs | cost-management | 비용관리 문서 참조를 wikilink로 정리하고 Budget Alert 설정 완료 기록 | - | Codex |
| 2026-07-08 15:43 | docs | repo | GitHub 원격 초기 LICENSE 이력 병합 | - | Unknown |
| 2026-07-08 15:40 | docs | evidence | Wave 0 보안 QA 로그 증거 추가 | - | Unknown |
| 2026-07-08 15:35 | chore | app | Cloudflare Workers React scaffold와 Wave 0 QA 검증 기반 추가 | - | Unknown |
| 2026-07-08 14:58 | docs | cost-management | R2 비용관리 판단 문서와 이미지 업로드 비용 방어 백로그 정리 | - | Codex |
| 2026-07-08 14:13 | docs | implementation-plan | Prompt Gallery 구현 계획과 Cloudflare 환경세팅 값 반영 | - | Unknown |
| 2026-07-08 13:39 | docs | 저장-배포-리서치 | Prompt Gallery 저장·배포 리서치의 Workers+D1+R2 권장안과 초보자용 용어 설명을 보강 | - | Unknown |
| 2026-07-08 13:35 | docs | research-artifacts | 저장·배포 리서치 근거 로그 추가 | - | Unknown |
| 2026-07-08 13:35 | docs | research | Prompt Gallery 저장·배포 리서치와 검수 보고서 추가 | - | Unknown |
| 2026-07-08 13:35 | docs | specs | Prompt Gallery 요구사항 SPEC 추가 | - | Unknown |
| 2026-07-08 13:35 | chore | repo | 초기 레포 제외 규칙 추가 | - | Unknown |
| YYYY-MM-DD HH:MM | feat/fix/refactor/docs/chore | area-or-folder | 변경 요약 | 변경 이유·목적 | Claude/Codex/Gemini |
