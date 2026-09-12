# The Skin Atelier — Design System (Master)

Global source of truth for both surfaces. Page-specific overrides live in
`./pages/<page-name>.md` and take precedence over this file.

## How this was derived

Generated with the `ui-ux-pro-max` skill, then **corrected**. The first
`--design-system` pass auto-matched the query "dermatology clinic" to a generic
healthcare profile — cyan `#0891B2`, Neumorphism, Atkinson Hyperlegible — which
is precisely what the brief rules out ("excessive blue medical colours",
"generic hospital design"). That result was rejected and replaced with explicit,
verified domain searches:

| Layer | Query | Verified match | Source |
|---|---|---|---|
| Style | `editorial luxury minimal fashion brand --domain style` | `minimalism-and-swiss-style` | `styles.csv` |
| Colour | `luxury beauty neutral beige warm premium --domain color` | `Luxury/Premium Brand` | `colors.csv` |
| Type | `elegant serif headings luxury editorial --domain typography` | `Classic Elegant` | `typography.csv` |

Design dials: **variance 4** (balanced/modern), **motion 4** (standard),
**density 3** (spacious) for the public site; density is raised for the admin.

---

## 1. Colour

Tokens are defined in `src/app/globals.css` under `@theme`, in three layers:
primitive ramps → semantic roles → component usage. Components reference
semantic names only (`bg-canvas`, `text-ink-muted`), never raw hex.

### Verified base (from `Luxury/Premium Brand`)

| Role | Value |
|---|---|
| Primary | `#1C1917` charcoal |
| On primary | `#FFFFFF` |
| Accent | `#A16207` gold |
| Background | `#FAFAF9` → warmed to `#FBFAF7` |
| Border | `#D6D3D1` |

### Extended brand ramps

Added to cover the brief's ivory / beige / nude / champagne language:

- `ivory` 50–300 — page grounds, sunken surfaces
- `sand` 100–400 — image placeholders, warm tints
- `champagne` 300–500 — **decorative only**: hairlines, rules, dots, icons
- `gold` 600–700 — accent that carries text or fills a button
- `charcoal` 700–950 — ink, inverse surfaces
- `stone` 300–600 — borders and muted text

### Contrast rules

- `--color-accent` (`#A16207`) on `--color-canvas` (`#FBFAF7`) ≈ **5.0:1** — passes AA for body text.
- `--color-champagne-400` (`#C8A96A`) is **never** used for text. Decoration only.
- Hero and inverse sections always apply a scrim, so headline contrast holds regardless of which photograph the CMS supplies.
- Status is never conveyed by colour alone: every badge carries a text label, and the optional dot is `aria-hidden`.

---

## 2. Typography

`Classic Elegant` — Playfair Display + Inter, self-hosted via `next/font` (no
render-blocking request to Google, no layout shift).

| Token | Use |
|---|---|
| `font-display` | Playfair Display 400 — all headings |
| `font-sans` | Inter 300–700 — body, UI, tabular figures |
| `text-display-xl/lg/md/sm` | Fluid `clamp()` editorial sizes |
| `eyebrow` | 11px, `0.18em` tracking, uppercase |

Rules: headings stay at weight 400 (weight is not how this brand signals
importance — size and space are). Body never below 14px. `text-wrap: balance`
on headings, `pretty` on paragraphs. Tabular numerals on all money and counts.

---

## 3. Spacing & layout

Swiss grid, generous whitespace, `max-width: 84rem`.

| Token | Value |
|---|---|
| `--spacing-section` | `clamp(4.5rem, 9vw, 9rem)` |
| `--spacing-section-sm` | `clamp(3rem, 6vw, 5.5rem)` |
| `--spacing-gutter` | `clamp(1.25rem, 4vw, 3rem)` |

Admin tightens this: cards use `p-5`/`p-6`, tables `px-4 py-3`. The two
surfaces share tokens but not density.

---

## 4. Elevation & shape

Radii are deliberately small (`2/4/6/10px`) — a luxury editorial surface reads
as *cut*, not *rounded*. Shadows are wide and faint, never dark:

`--shadow-subtle` → `--shadow-card` → `--shadow-lifted` → `--shadow-overlay`

Borders do most of the separation work (`--color-line-subtle`), shadows only
signal interactivity on hover.

---

## 5. Motion — standard tier

| Interaction | Duration | Easing |
|---|---|---|
| Hover / colour | 150–200ms | `ease-editorial` |
| Card lift, image scale | 300–500ms | `ease-editorial` |
| Scroll reveal | 700ms, 80–100ms stagger | `ease-editorial` |
| Hero Ken Burns | 24s alternate | `ease-editorial` |
| Exit | faster than enter | `ease-exit` |

`--ease-editorial: cubic-bezier(0.22, 1, 0.36, 1)`

`prefers-reduced-motion: reduce` collapses every animation and transition to
`0.01ms` and forces `.reveal` to its final state. `Reveal` also skips creating
the IntersectionObserver entirely when reduced motion is set.

---

## 6. Accessibility (non-negotiable)

- Focus is **restyled, never removed** — 2px gold outline, 3px offset.
- Minimum 44×44px interactive target (`Button` `md`/`lg`, all icon buttons `size-9`+ with padding).
- Every icon is SVG (lucide-react). **No emoji as icons, anywhere.**
- Decorative icons `aria-hidden`; icon-only buttons carry `aria-label`.
- Modal and drawer trap focus, close on Escape, restore focus to the trigger, lock body scroll.
- Carousel: pause control, stops on hover and focus, every slide reachable by button, position in a polite live region, inactive slides `inert`.
- Tabs follow the WAI-ARIA pattern with arrow-key roving focus.
- Charts expose the same data as a visually hidden `<table>`.
- Zoom is never disabled (`maximumScale: 5`).
- Only tables, rails and the calendar scroll horizontally — the page body never does.

---

## 7. Anti-patterns for this project

Avoid, per the brief and the style profile:

- Blue/cyan medical palettes · generic hospital chrome
- Cheap gradients, neon, AI purple-pink
- Heavy shadows, large radii, glassmorphism
- Motion-heavy choreography, parallax, autoplaying video with sound
- Emoji as iconography
- Crowded layouts; anything that reduces whitespace to gain density on the public site
- Superlative marketing claims ("best clinic") and any guaranteed-outcome language

---

## 8. Voice

Calm, precise, unhurried. Short declarative sentences. Confidence without
salesmanship — the site says what a treatment does, what it costs, what it
involves, and what it will not fix.

Every clinical surface carries: *results vary from person to person*, and
*treatment suitability is determined by a qualified clinician at consultation*.
These are not disclaimers bolted on — they are the position the copy argues.
