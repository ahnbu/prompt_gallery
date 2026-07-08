import { FileText, Github, Image, Layers, Search, Star, Workflow } from "lucide-react"

const tabs = [
  { label: "즐겨찾기", shortLabel: "즐겨찾기", icon: Star, active: false },
  { label: "All", shortLabel: "All", icon: Layers, active: true },
  { label: "프롬프트", shortLabel: "프롬프트", icon: FileText, active: false },
  { label: "이미지 프롬프트", shortLabel: "이미지", icon: Image, active: false },
  { label: "Workflow", shortLabel: "Workflow", icon: Workflow, active: false },
  { label: "레포", shortLabel: "레포", icon: Github, active: false },
] as const

export function App() {
  return (
    <main className="app-shell" aria-labelledby="app-title">
      <header className="topbar">
        <div className="title-block">
          <p className="eyebrow">Personal workspace</p>
          <h1 id="app-title">Prompt Gallery</h1>
        </div>
        <label className="search-control">
          <Search aria-hidden="true" size={16} strokeWidth={1.8} />
          <input type="search" placeholder="검색 준비 중" disabled aria-label="검색 준비 중" />
        </label>
      </header>

      <nav className="tabbar" aria-label="Prompt Gallery sections">
        {tabs.map((tab) => {
          const Icon = tab.icon

          return (
            <button
              aria-current={tab.active ? "page" : undefined}
              aria-label={tab.label}
              className={tab.active ? "tab-button active" : "tab-button"}
              key={tab.label}
              title={tab.label}
              type="button"
            >
              <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
              <span>{tab.shortLabel}</span>
            </button>
          )
        })}
      </nav>

      <section className="content-empty" aria-label="빈 콘텐츠 영역" />
    </main>
  )
}
