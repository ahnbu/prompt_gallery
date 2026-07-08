# Prompt Gallery Design System

## 1. Atmosphere & Identity

Prompt Gallery is a quiet personal command surface for finding reusable work assets. The signature is dense dark clarity: compact controls, subtle surface steps, and one restrained violet accent used only for interaction state.

## 2. Color

### Palette

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Surface/base | `--surface-base` | `#08090a` | App background |
| Surface/panel | `--surface-panel` | `#0f1011` | Header and control bands |
| Surface/raised | `--surface-raised` | `#191a1b` | Empty content region |
| Surface/control | `--surface-control` | `rgba(255,255,255,0.04)` | Inputs and tab buttons |
| Text/primary | `--text-primary` | `#f7f8f8` | Title and selected labels |
| Text/secondary | `--text-secondary` | `#d0d6e0` | Body text and control labels |
| Text/muted | `--text-muted` | `#8a8f98` | Placeholders and disabled labels |
| Border/subtle | `--border-subtle` | `rgba(255,255,255,0.05)` | Dividers |
| Border/default | `--border-default` | `rgba(255,255,255,0.08)` | Controls and panels |
| Accent/primary | `--accent-primary` | `#7170ff` | Active tab and focus ring |
| Accent/hover | `--accent-hover` | `#828fff` | Hover and focus emphasis |

### Rules

- The palette follows the Linear reference: dark-native, low chroma, and one violet accent.
- Accent color is only for active, focus, and selected states.
- No raw color outside this document and the token definitions in CSS.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| H1 | 32px | 590 | 1.15 | 0 | App title |
| Body | 15px | 400 | 1.5 | 0 | Default text |
| Label | 13px | 510 | 1.4 | 0 | Tabs and compact controls |
| Caption | 12px | 400 | 1.4 | 0 | Disabled placeholder text |

### Font Stack

- Primary: `Inter Variable, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Mono: `Berkeley Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

### Rules

- Use normal letter spacing for this dense app shell.
- Body text never drops below 12px for disabled placeholder labels and 13px for controls.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a 4px base unit.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight icon gap |
| `--space-2` | `8px` | Compact control padding |
| `--space-3` | `12px` | Input padding |
| `--space-4` | `16px` | Header padding |
| `--space-6` | `24px` | Page gutters |
| `--space-8` | `32px` | Section separation |

### Grid

- Max content width: `1120px`.
- Layout: single-column app shell, compact toolbar, empty main region.
- Breakpoints: mobile below `640px`, desktop above `960px`.

### Rules

- Controls use stable heights so icons, labels, and disabled text do not shift layout.
- No landing-page hero composition. The first viewport is the working surface.

## 5. Components

### App Shell

- **Structure**: page root, top header, disabled search, icon tab bar, content region.
- **Variants**: single placeholder state only for Wave 0.
- **Spacing**: `--space-4` header, `--space-6` page gutters, `--space-8` main gap.
- **States**: default, focus-visible, disabled.
- **Accessibility**: one `main`, labelled navigation, disabled search labelled with placeholder.
- **Motion**: none in Wave 0.

### Icon Tab Button

- **Structure**: native `button` with lucide icon and short label.
- **Variants**: active, inactive, disabled placeholder.
- **Spacing**: `--space-2` internal gap, `--space-3` horizontal padding.
- **States**: hover, active, focus-visible, disabled.
- **Accessibility**: visible label plus `aria-current` on active item.
- **Motion**: color and background transition at 120ms.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 120ms | ease-out | Tab hover and active feedback |

Rules:

- Animate only color, border-color, background-color, opacity, or transform.
- Respect `prefers-reduced-motion` by disabling transitions.

## 7. Depth & Surface

### Strategy

Use mixed tonal shift and subtle borders.

| Level | Value | Usage |
|-------|-------|-------|
| Base | `--surface-base` | App background |
| Panel | `--surface-panel` plus `--border-subtle` | Header |
| Raised | `--surface-raised` plus `--border-default` | Empty content region |
