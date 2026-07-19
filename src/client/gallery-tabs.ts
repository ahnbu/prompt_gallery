import { FileText, Github, Image, Layers, Star, Workflow } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { GalleryTab } from "./gallery-model"

export type GalleryTabTone = "favorite" | "all" | "prompt" | "image" | "workflow" | "repo"

export type GalleryTabDefinition = {
  readonly value: GalleryTab
  readonly label: string
  readonly shortLabel: string
  readonly icon: LucideIcon
  readonly tone: GalleryTabTone
}

export const tabs: readonly GalleryTabDefinition[] = [
  { value: "all", label: "All", shortLabel: "All", icon: Layers, tone: "all" },
  { value: "prompt", label: "프롬프트", shortLabel: "프롬프트", icon: FileText, tone: "prompt" },
  {
    value: "image_prompt",
    label: "이미지 프롬프트",
    shortLabel: "이미지",
    icon: Image,
    tone: "image",
  },
  {
    value: "workflow",
    label: "Workflow",
    shortLabel: "Workflow",
    icon: Workflow,
    tone: "workflow",
  },
  { value: "repo", label: "레포", shortLabel: "레포", icon: Github, tone: "repo" },
  { value: "favorite", label: "즐겨찾기", shortLabel: "즐겨찾기", icon: Star, tone: "favorite" },
]
