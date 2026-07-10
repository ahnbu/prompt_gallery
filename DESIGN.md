# Prompt Gallery Design System

## 1. Atmosphere & Identity

Prompt Gallery is a calm personal library for reusable prompts, image prompts,
workflows, and repo references. The visual direction is Notion-inspired paper
calm: a warm off-white canvas, quiet white cards, near-black text, whisper-thin
borders, and one confident blue for primary action and focus.

This is an app workspace, not a marketing page. Do not introduce a hero section,
pricing-style cards, decorative landing-page bands, or brand-copy patterns from
the reference. The first viewport must remain the working surface: search,
filters, tabs, sections, and cards.

The design is organized across four separate layers:

- Visual style: warm paper canvas, white surfaces, restrained blue action.
- Content layout: square card grid for prompt, workflow, and repo items;
  natural-ratio masonry for image prompt cards.
- Information structure: tabs plus sectioned gallery views where useful.
- Input UX: global add remains available, and section-level add actions are
  allowed when a section has a clear item type.

## 2. Color

### Palette

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Surface/base | `--surface-base` | `#f6f5f4` | App background, warm paper canvas |
| Surface/panel | `--surface-panel` | `#ffffff` | Header, content panels, cards, modals |
| Surface/raised | `--surface-raised` | `#ffffff` | Elevated card and modal surfaces |
| Surface/control | `--surface-control` | `rgba(0,0,0,0.04)` | Inputs, inactive tabs, secondary buttons |
| Surface/soft | `--surface-soft` | `#fbfaf8` | Empty states, subtle section fills |
| Text/primary | `--text-primary` | `#1f1f1d` | Titles, selected labels, primary content |
| Text/secondary | `--text-secondary` | `#31302e` | Body text, control labels |
| Text/muted | `--text-muted` | `#615d59` | Metadata, descriptions, inactive text |
| Text/faint | `--text-faint` | `#a39e98` | Placeholders, disabled labels |
| Border/subtle | `--border-subtle` | `rgba(0,0,0,0.08)` | Dividers and low-emphasis seams |
| Border/default | `--border-default` | `rgba(0,0,0,0.12)` | Cards, controls, panels |
| Accent/primary | `--accent-primary` | `#0075de` | Primary add/save actions, links, active state |
| Accent/hover | `--accent-hover` | `#005bab` | Primary hover and pressed state |
| Accent/focus | `--accent-focus` | `#097fe8` | Keyboard focus ring |
| Accent/soft | `--accent-soft` | `#f2f9ff` | Selected chips, small badges |

### Decorative Palette

These colors may appear only as small category dots, illustration fragments, or
thumbnail accents. They must not become structural fills or competing CTAs.

| Role | Token | Value |
|------|-------|-------|
| Decor/sky | `--decor-sky` | `#62aef0` |
| Decor/purple | `--decor-purple` | `#d6b6f6` |
| Decor/pink | `--decor-pink` | `#ff64c8` |
| Decor/orange | `--decor-orange` | `#dd5b00` |
| Decor/teal | `--decor-teal` | `#2a9d99` |
| Decor/green | `--decor-green` | `#1aae39` |

### Type Palette

Type colors are semantic aliases for badges and tab dots. They reuse the
existing accent/decorative direction rather than adding a second brand palette.

| Item Type | Token | Soft Token | Usage |
|-----------|-------|------------|-------|
| Prompt | `--type-prompt` `#0075de` | `--type-prompt-soft` `#f2f9ff` | Prompt badges, tab dot |
| Image Prompt | `--type-image` `#8a4edb` | `--type-image-soft` `#f7f0ff` | Image badges, tab dot |
| Repo | `--type-repo` `#1aae39` | `--type-repo-soft` `#eefbf1` | Repo badges, tab dot |
| Workflow | `--type-workflow` `#dd5b00` | `--type-workflow-soft` `#fff4ec` | Workflow badges, tab dot |
| Favorite | `--type-favorite` `#d88a00` | `--type-favorite-soft` `#fff7e8` | Favorite tab dot |
| All | `--type-all` `#615d59` | `--type-all-soft` `#f1efed` | All tab dot |

### Rules

- Use light mode only for the primary shell. Do not keep the previous black
  Linear-style shell.
- `--accent-primary` is the only structural saturated color.
- Do not introduce raw colors outside this document and the CSS token
  definitions.
- Keep text contrast high: primary text on the base or panel surfaces must meet
  WCAG AA.

## 3. Typography

### Font Stack

- Primary: `Inter Variable, Inter, ui-sans-serif, system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif`
- Mono: `Berkeley Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

The reference mentions NotionInter, but Prompt Gallery must use the available
Inter/system stack. Do not depend on proprietary brand fonts.

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| H1 | 30px | 700 | 1.12 | 0 | App title |
| H2 | 18px | 650 | 1.3 | 0 | Section heading |
| Card title | 15.5px | 700 | 1.35 | 0 | Gallery card title |
| Card preview | 12.5px | 400 | 1.5 | 0 | Gallery card body preview |
| Detail body | 14.5px | 400 | 1.65 | 0 | Modal detail primary content |
| Body | 15px | 400 | 1.5 | 0 | Default content |
| Label | 13px | 560 | 1.4 | 0 | Tabs, controls, badges |
| Caption | 12px | 400 | 1.4 | 0 | Metadata and disabled text |

### Rules

- Letter spacing is always `0`. Do not copy the reference's negative display
  tracking into this app.
- Use weight and whitespace for hierarchy, not oversized marketing type.
- Body text never drops below 12px for metadata and 13px for controls.
- Korean and English labels must fit within controls without clipping on mobile.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a 4px base unit. This preserves the current app's
compact working rhythm while moving the visual language to a warmer surface.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight icon gap |
| `--space-2` | `8px` | Chip and compact control padding |
| `--space-3` | `12px` | Input padding, card inner gaps |
| `--space-4` | `16px` | Header padding, card padding |
| `--space-6` | `24px` | Page gutters, panel padding |
| `--space-8` | `32px` | Section separation |

### Grid

- Max content width: `1180px`.
- Page layout: single app shell with topbar, tabbar, tag filter, and gallery.
- Non-image card grid: fixed-rhythm square cards, capped at 4 columns on
  desktop wide viewports.
- Image prompt grid: masonry columns with the same column width rhythm as the
  non-image grid, but card heights follow the actual image aspect ratio.
- Image prompt media: do not force `aspect-ratio: 1 / 1` in compact gallery
  cards. Wide, square, and tall source images must produce visibly different
  card heights.
- Do not use wide banner media for compact image prompt cards. Wide images may
  remain wide inside their masonry card; the card itself should stay compact in
  column width.
- Breakpoints: mobile below `640px`, tablet `640px` to `959px`, desktop
  `960px` and above.

### Rules

- The first viewport is the product surface, not a landing page.
- Cards should feel scan-friendly, not like horizontal banners.
- Prompt, Workflow, and Repo cards share one square card primitive.
- Image Prompt cards intentionally diverge from the square primitive only for
  masonry image preview height.
- Avoid nested cards. Panels can contain repeated cards, but cards must not
  contain additional card shells.
- Controls use stable heights so labels, icons, counters, and loading states do
  not shift layout.

## 5. Components

### App Shell

- Structure: root app surface, topbar, action group, search, tabs, tag filter,
  gallery region.
- Surface: `--surface-base` page with `--surface-panel` controls.
- Width: centered `1180px` max container with responsive gutters.
- Accessibility: exactly one `main`, labelled navigation, labelled search.

States:

- Loading: content panel with concise loading copy.
- Error: content panel with clear failure copy and no decorative distraction.
- Empty: `--surface-soft` empty state with a concrete next action where possible.

### Topbar

- White panel with whisper border and subtle radius.
- Title block remains compact; no hero-scale type.
- Action buttons align to the right on desktop and wrap cleanly on mobile.
- Search keeps a document-tool feel: white or translucent black control, faint
  border, visible focus ring.

### Buttons

Primary buttons:

- Use `--accent-primary` fill and white text.
- Reserved for add, save, and other irreversible forward actions.
- Hover/pressed uses `--accent-hover`.

Secondary buttons:

- Use white or `--surface-control` fill, `--border-default`, and
  `--text-secondary`.
- Used for export, tag management, cancel, and neutral utilities.

Icon buttons:

- Use Lucide icons.
- Fixed square hit area, minimum `36px` desktop and `40px` mobile.

States:

- Hover: color or border change only.
- Active: optional `transform: scale(0.98)`.
- Focus-visible: `2px solid var(--accent-focus)` with `2px` offset.
- Disabled/loading: reduced opacity, no layout shift.

### Tabs

- Tabs are compact utility controls, not marketing pills.
- Active tab uses `--accent-soft` fill, `--accent-primary` text or border.
- Inactive tabs stay neutral with `--surface-control`.
- Icons and labels remain visible. Do not replace text labels with icon-only
  controls unless a tooltip and accessible label are present.

### Tag Chips

- Tags use small rounded rectangles or subtle pills with `--surface-control`.
- Selected tags use `--accent-soft` and `--accent-primary`.
- Long tag names truncate with ellipsis.
- Tags should not use the decorative palette unless they are category markers,
  and even then color must remain secondary to text.

### Sectioned Gallery

- All view may group content into sections when that improves scanning.
- Each section header contains the title, count, and optional section-level add
  action when the section maps to one item type.
- Section-level add buttons must set the correct default type. If a section is
  not directly addable, omit the button rather than showing a vague action.
- Search results may switch to a unified result grid.

### Gallery Card

- Surface: white card on warm paper canvas.
- Shape: 8px to 12px radius, depending on density.
- Border: `--border-default`; shadow is optional and very soft.
- Prompt, Workflow, and Repo cards use `aspect-ratio: 1 / 1` so the gallery
  scans as a square card board. Text inside these cards may clamp, but the card
  shell must remain square.
- Desktop wide viewports show at most 4 cards per row. Tablet and mobile may
  reduce columns according to available width.
- Content order: type badge/actions, preview/media, title, tags. Date metadata
  does not appear on gallery cards; it belongs in detail/edit surfaces.
- Card title uses stronger weight while preview text is smaller and muted. This
  keeps auto-derived titles visible without making title/body duplication feel
  like two equal headings.
- Manual tags may expose chip-level remove/add controls. Auto tags remain
  readable chips with no delete affordance.

States:

- Hover/focus: border plus soft shadow lift, not a loud color wash.
- Favorite: star icon uses accent color but does not dominate the card.
- Copy status: icon changes to a check and a compact toast/status appears near
  the action.

### Image Prompt Card

- Image prompt gallery cards use masonry layout. The media frame width follows
  the card column; its height follows the actual image aspect ratio.
- Empty image prompt cards use a compact intentional placeholder with a stable
  minimum height so an empty upload slot does not collapse.
- Empty media frame should still look like an intentional example/placeholder,
  not a broken upload slot.
- Preview images use `width: 100%` and `height: auto` in compact gallery cards.
  Do not crop normal gallery thumbnails to a fixed square.
- Extremely tall images may use a conservative thumbnail max-height guard in the
  gallery, but the normal case must still show tall images as taller cards than
  square or wide images. Detail views may show the larger/full image separately.

### Example and Empty Cards

- Example cards must be real saved sample data that can be edited or deleted
  through the same flow as any other item.
- Empty states should include the section's next action when available.
- Do not add fake DOM-only examples that cannot be managed as saved items.

### Modals

- Modal surface uses `--surface-panel`, `--border-default`, and Level 2 shadow.
- Form fields use white surfaces, 4px to 6px radius, and a visible focus ring.
- Modal headers and actions remain compact. Detail headers show the type badge
  and icon actions; edit/add footers keep destructive, cancel, and confirm
  actions in a stable left-to-right order.
- Detail body is the primary content, followed by a divider, subdued title,
  tags, and quiet date metadata.
- Destructive actions use text or border emphasis first; do not add a second
  saturated destructive palette unless the interaction requires it.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 120ms | ease-out | Tab, chip, button color feedback |
| Surface | 160ms | ease-out | Card border/shadow emphasis |

Rules:

- Animate only color, border-color, background-color, opacity, and transform.
- Motion must communicate interaction or state. Do not add decorative motion.
- Card hover may use `translateY(-2px)` with a soft shadow. Copy and save
  confirmations use compact status/toast feedback without shifting layout.
- Respect `prefers-reduced-motion` by disabling non-essential transitions.
- Avoid large press scaling from the reference. Use at most `scale(0.98)` for
  buttons.

## 7. Depth & Surface

### Strategy

Use warm contrast, hairline borders, and very soft shadows. The surface should
feel like paper and cards, not glass, neon, or black dashboards.

| Level | Treatment | Usage |
|-------|-----------|-------|
| Base | `--surface-base` | App background |
| Panel | `--surface-panel` plus `--border-subtle` | Header, content panels |
| Card | `--surface-panel` plus `--border-default` | Gallery cards |
| Soft elevated | `0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)` | Hovered cards, popovers |
| Modal | `0 20px 60px rgba(0,0,0,0.14)` | Dialogs |

### Reference Translation Notes

- Source direction: `_temp/DESIGN-notion.md`.
- Adopted: warm paper canvas, white cards, near-black text, blue primary action,
  whisper borders, restrained layered depth.
- Rejected: Notion marketing hero, pricing/auth/cart examples, proprietary font
  dependency, negative letter spacing, wide promotional content patterns.
- Added for this app: square prompt/workflow/repo gallery cards, max-four
  desktop card rows, natural-ratio masonry image prompt cards, section-level add
  actions, image prompt empty/example cards, and app-specific topbar/tab/tag/modal
  rules.
