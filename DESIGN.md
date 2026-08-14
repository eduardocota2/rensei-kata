---
name: rensei-kata
description: Graph-driven AI engineering loop — studio editor and generated diagram in the Linear / VS Code / Raycast tool grammar.
colors:
  # light theme (default :root)
  canvas-light: "#f4f5f7"
  panel-light: "#ffffff"
  elevated-light: "#fafbfc"
  inset-light: "#f4f5f7"
  ink-light: "#23262b"
  muted-light: "#616874"
  faint-light: "#656e7a"
  graph-muted-light: "#6e7480"
  border-light: "#e2e4e9"
  border-strong-light: "#cfd3da"
  node-border-light: "#dee1e7"
  pill-ink-light: "#5a616e"
  # dark theme (prefers-color-scheme + data-theme="dark")
  canvas-dark: "#0e1013"
  panel-dark: "#15181d"
  elevated-dark: "#1a1e24"
  inset-dark: "#0f1216"
  ink-dark: "#e6e8eb"
  muted-dark: "#8f96a1"
  faint-dark: "#6b7280"
  border-dark: "#262b33"
  border-strong-dark: "#353b46"
  node-bg-dark: "#191d23"
  node-border-dark: "#2b313b"
  pill-ink-dark: "#9aa3b2"
  # the one accent
  accent-indigo: "#5e6ad2"
  accent-indigo-deep: "#4f5bc4"
  accent-indigo-soft: "rgba(94,106,210,.12)"
  accent-indigo-veil: "#e9ebfa"
  accent-indigo-bright: "#8a90ee"
  accent-indigo-brighter: "#9ba0f2"
  accent-indigo-soft-dark: "rgba(138,144,238,.16)"
  accent-indigo-veil-dark: "#272c4e"
  accent-fill: "#5e6ad2"
  accent-fill-strong: "#4f5bc4"
  accent-fill-strong-dark: "#555dd6"
  on-accent: "#ffffff"
  # graph edge semantics
  edge-slate: "#6e7a88"
  edge-slate-dark: "#5c6572"
  loopback-amber: "#9a5808"
  loopback-amber-soft: "#fdf0da"
  loopback-amber-dark: "#e5a048"
  loopback-amber-soft-dark: "#38291a"
  skip-violet: "#6d51b8"
  skip-violet-soft: "#f0ebfa"
  skip-violet-dark: "#ab90e3"
  skip-violet-soft-dark: "#2c2547"
  # studio status semantics
  ok-green: "#27794f"
  ok-green-dark: "#4cc38a"
  warn-amber: "#8a6800"
  warn-amber-dark: "#f2c94c"
  danger-red: "#d13438"
  danger-red-dark: "#f26d72"
typography:
  body:
    fontFamily: '"Inter", ui-sans-serif, system-ui, "Segoe UI", sans-serif'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  brand:
    fontFamily: '"Inter", ui-sans-serif, system-ui, "Segoe UI", sans-serif'
    fontSize: "13.5px"
    fontWeight: 650
    letterSpacing: ".01em"
  label:
    fontFamily: '"Inter", ui-sans-serif, system-ui, "Segoe UI", sans-serif'
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: ".02em"
  panel-head:
    fontFamily: '"Inter", ui-sans-serif, system-ui, "Segoe UI", sans-serif'
    fontSize: "11px"
    fontWeight: 650
    letterSpacing: ".07em"
  control:
    fontFamily: '"Inter", ui-sans-serif, system-ui, "Segoe UI", sans-serif'
    fontSize: "12.5px"
    fontWeight: 400
  code:
    fontFamily: '"Cascadia Code", "JetBrains Mono", ui-monospace, Consolas, monospace'
    fontSize: "12px"
    lineHeight: 1.6
  graph-label:
    fontFamily: '"Inter", ui-sans-serif, system-ui, "Segoe UI", sans-serif'
    fontSize: "13px"
    fontWeight: 650
    letterSpacing: ".02em"
  graph-meta:
    fontFamily: '"Inter", ui-sans-serif, system-ui, "Segoe UI", sans-serif'
    fontSize: "10px"
    fontWeight: 400
  section-head:
    fontFamily: '"Inter", ui-sans-serif, system-ui, "Segoe UI", sans-serif'
    fontSize: ".95rem"
    fontWeight: 650
  page-title:
    fontFamily: '"Inter", ui-sans-serif, system-ui, "Segoe UI", sans-serif'
    fontSize: "1.35rem"
    fontWeight: 650
    letterSpacing: ".01em"
rounded:
  xs: "4px"
  sm: "5px"
  md: "6px"
  lg: "8px"
  pill: "99px"
spacing:
  xs: "0.3rem"
  sm: "0.45rem"
  md: "0.8rem"
  lg: "1rem"
  graph-pad: "60px"
  graph-col-gap: "100px"
  graph-row-gap: "100px"
  graph-lane-gap: "56px"
components:
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.md}"
    padding: "0.3rem 0.65rem"
    typography: "{typography.control}"
  button-ghost-hover:
    backgroundColor: "{colors.elevated-light}"
  button-primary:
    backgroundColor: "{colors.accent-fill}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: "0.3rem 0.65rem"
    typography: "{typography.control}"
  button-primary-hover:
    backgroundColor: "{colors.accent-fill-strong}"
  button-danger-armed:
    backgroundColor: "{colors.danger-red}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0.3rem 0.65rem"
    typography: "{typography.control}"
  status-pill:
    backgroundColor: "{colors.elevated-light}"
    textColor: "{colors.muted-light}"
    rounded: "{rounded.pill}"
    padding: "0.2rem 0.6rem"
    typography: "{typography.label}"
  field-input:
    backgroundColor: "{colors.inset-light}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.md}"
    padding: "0.34rem 0.5rem"
    typography: "{typography.control}"
  toast:
    backgroundColor: "{colors.elevated-light}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.lg}"
    padding: "0.45rem 0.75rem"
  # graph component language v4 — serpentine spine, lanes, banded cards
  graph-node-card:
    backgroundColor: "{colors.panel-light}"
    rounded: "{rounded.lg}"
    width: "216px"
    height: "98px"
    note: "30px header band (seq chip + uppercase label + flag) over a body: @agent in accent, 10px summary strip, model/effort meta chips bottom-left"
  graph-seq-chip:
    backgroundColor: "{colors.accent-indigo-veil}"
    textColor: "{colors.accent-indigo-deep}"
    rounded: "{rounded.sm}"
    size: "20px"
    note: "entry node fills the chip in accent and carries a drawn triangle glyph instead of a numeral"
  graph-meta-chip:
    backgroundColor: "{colors.inset-light}"
    textColor: "{colors.pill-ink-light}"
    rounded: "{rounded.xs}"
    height: "16px"
    note: "model + effort as data chips at the card's bottom-left"
  graph-port:
    size: "8px"
    backgroundColor: "{colors.edge-slate}"
    note: "filled dots on card borders, drawn only where a transition attaches; transitions plug into port centers"
  graph-terminal-stadium:
    backgroundColor: "{colors.accent-fill}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.pill}"
    width: "132px"
    height: "44px"
    note: "stadium (rx = h/2) with a drawn check polyline + DONE, letterspaced"
  graph-label-pill:
    backgroundColor: "{colors.panel-light}"
    textColor: "{colors.pill-ink-light}"
    rounded: "{rounded.pill}"
    height: "17px"
    typography: "{typography.graph-meta}"
    note: "annotation only — pointer-events:none so it never intercepts a click; spine pills float 14px above the card row; conditions truncate at 42 chars with the full text in a hover title; loop-carrying edges (max:) tint amber; merges tint violet"
  graph-lanes:
    note: "happy path on the spine; lane:'above' for optional branches (design), lane:'below' for rework (correct); set per node in rensei.graph.yaml"
---

# Design System: rensei-kata

## Overview

**Creative North Star: "The Category Standard at Full Fidelity"**

rensei-kata's visual world is the canon exit chosen over seed `08d19a9d` (roll #4 plus three challengers): the Linear / VS Code / Raycast grammar, executed without irony and without smuggled quirk. The tool panel a developer already trusts — restrained neutrals, one indigo accent, 6px radii, 1px borders, Inter-class type at tool density — rendered so precisely that the graph itself becomes the brand. The direction contract embedded in both shipped surfaces (`src/lib/studio-page.js`, `src/lib/diagram.js`) states it plainly: nothing decorates the data.

Two surfaces carry the system: the **studio editor** (a full-viewport bench — 42px brand bar, pannable graph canvas, right inspector, YAML drawer) and the **generated graph.html diagram** (a quiet document page around the same SVG). Both share one renderer (`graph-render.js`), one graph stylesheet (`graph-css.js`), one token structure, and one theme key, so the loop looks identical whether you are reading it or editing it. Brand lives in two places only: the 錬成 kanji accent in the title, and the authored graph language (sequence chips, drawn glyphs, amber rework loop).

Dual light/dark themes with explicit `data-theme` override are mandatory on every surface — this is a standing brand commitment, not a preference. English is the primary UI language; the kanji gloss appears in brand moments only.

**Key Characteristics:**
- One indigo accent (`#5e6ad2` light text / `#8a90ee` dark) against a near-gray neutral ladder; no second hue in the chrome.
- Tool density: 13px base type in the studio, a 10–15px ramp across chrome and graph, 42px top bar, 330px inspector.
- Flat-by-default: 1px borders structure everything; shadows appear only on graph cards, floating messages, and overlays.
- Semantic color belongs to the graph (amber = rework loop, violet = merge/skip) and to save/validation state (green/amber/red status), never to decoration.
- Light and dark ship as equal citizens through a three-block cascade driven by `rk-theme` + `data-theme`.

## Colors

The palette is a cool neutral ladder with exactly one indigo accent; the remaining hues are reserved semantics for graph topology and validation state.

### Primary
- **Bench Indigo** (`#5e6ad2`): the single accent. Light-theme links, agent handles, focus rings, entry-node borders, selection stroke, the kanji in the brand title. In dark theme it brightens to **Bright Indigo** (`#8a90ee`) for text and strokes — but the filled-button indigo (`accent-fill`, `#5e6ad2`) deliberately does **not** brighten across themes; only its hover shifts (`#4f5bc4` light, `#555dd6` dark).
- **Indigo Soft** (light `rgba(94,106,210,.12)`, veil `#e9ebfa`; dark `rgba(138,144,238,.16)`, veil `#272c4e`): the accent at tint strength — selection background, focus ring, sequence-chip fill. Every accent wash in the system comes from these two forms (translucent for chrome, opaque veil for the graph).

### Secondary
- **Rework Amber** (light `#9a5808` on `#fdf0da`; dark `#e5a048` on `#38291a`): reserved for correction-loop semantics — the dashed back-edge in the graph, its label pill, and the `max ×` bound in the gate table. It never appears in chrome, buttons, or generic warnings.

### Tertiary
- **Merge Violet** (light `#6d51b8` on `#f0ebfa`; dark `#ab90e3` on `#2c2547`): reserved for merge/skip transitions — dotted edges that arc over the row, and their label pills. Nowhere else.

### Neutral
- **Canvas** (light `#f4f5f7` / dark `#0e1013`): app and page ground.
- **Panel** (light `#ffffff` / dark `#15181d`): topbar, inspector, drawer, node-card fill (dark node cards use a slightly lifted `#191d23`).
- **Elevated** (light `#fafbfc` / dark `#1a1e24`): hover washes, status-pill and toast background.
- **Inset** (light `#f4f5f7` / dark `#0f1216`): sunken fields — inputs, the YAML editor, inline code.
- **Ink / Muted / Faint** (light `#23262b` / `#616874` / `#656e7a`; dark `#e6e8eb` / `#8f96a1` / `#6b7280`): primary text, secondary text, tertiary metadata (paths, footers). The graph has its own muted (light `#6e7480`).
- **Border / Border Strong** (light `#e2e4e9` / `#cfd3da`; dark `#262b33` / `#353b46`): the structural 1px lines and their hover/dark-scrollbar escalation. Graph node borders run a touch cooler (`#dee1e7` / `#2b313b`).
- **Edge Slate** (light `#6e7a88` / dark `#5c6572`): neutral transition arrows — deliberately mid-gray so the amber and violet semantics own attention.
- **Pill Ink** (light `#5a616e` / dark `#9aa3b2`): text inside edge-label pills.

### Status (studio chrome only)
- **Valid Green** (light `#27794f` / dark `#4cc38a`): valid graph, saved + recompiled.
- **Pending Amber** (light `#8a6800` / dark `#f2c94c`): unsaved changes, saving, stale YAML, warnings. Lives only in the status pill, toasts, and the drawer badge — never inside the SVG, where amber means rework.
- **Invalid Red** (light `#d13438` / dark `#f26d72`): validation failed, network errors, and the two-step armed delete.

Status surfaces are tints, not floods: pills and toasts mix 8–14% of the status hue over transparent (`color-mix`), keeping the neutral canvas dominant.

### Theme switching
Both surfaces define three blocks in order: light `:root` defaults; `@media (prefers-color-scheme: dark)` gated on `:not([data-theme="light"])`; then `:root[data-theme="dark"]` as the explicit override. A head script stamps `data-theme` from `localStorage["rk-theme"]` before first paint (no flash), and a three-state icon toggle cycles auto → light → dark → auto. The key is shared across studio and diagram, so both surfaces always agree. In the studio, graph tokens that mirror the chrome scale (`--rk-ground`, `--rk-ink`, `--rk-accent`, `--rk-select`, …) are **aliases** (`var(--bg)`, `var(--accent)`, …) defined once in `:root` — only graph-only tokens carry per-theme values, so a retheme can never split the two scales.

### Named Rules
**The Reserved Amber Rule.** Amber/orange hues mean exactly one thing: the bounded correction loop (edge, pill, `max ×`). Warnings use the pending-amber status token in chrome and never appear in the graph. If you reach for amber for anything else, stop.
**The One Accent Rule.** Chrome speaks one accent — indigo. Violet exists only on merge/skip edges; green/red/amber exist only as state. A second decorative hue in the UI is a defect.

## Typography

**Body/Display Font:** Inter (named first, with `ui-sans-serif, system-ui, "Segoe UI", sans-serif` fallback)
**Mono Font:** Cascadia Code (with `JetBrains Mono, ui-monospace, Consolas, monospace` fallback)

**Character:** One family does everything. Inter is the user-chosen canon face — named first in the stack but never bundled; it resolves locally and degrades gracefully to the system sans. Hierarchy comes from weight (400/500/600/650/700) and size, not from a second face. The signature weight is **650** — page titles, section heads, panel heads, node labels all sit there; 700 is spent only on sequence numerals.

### Hierarchy
- **Page Title** (650, 1.35rem ≈ 21.6px, .01em): diagram `h1` only — the single display moment in the system. Studio brand title is 13.5px at the same weight.
- **Section Head** (650, .95rem ≈ 15.2px): diagram `h2` ("Quality gates").
- **Graph Node Label** (650, 11.5px, uppercase, .07em): phase names on cards, beside the sequence chip.
- **Body** (400, 13px studio / 14px diagram, 1.5): default UI text; diagram paragraphs cap at 72ch.
- **Control** (400–600, 12.5px): buttons, inputs, inline checkbox labels.
- **Field Label** (600, 11px, .02em): inspector labels.
- **Panel Head** (650, 11px, .07em, uppercase): inspector and drawer titles, gate-table headers (th at 600/.06em).
- **Meta** (400–600, 10–11px): node agent handle (600, accent), model · effort, summary strip, edge pills, status pill (600), hints, toasts (12px), skills hints (10.5px).
- **Code** (400, 12px mono, 1.6, tabular-nums): the YAML editor; inline `code` at .85em with inset chip styling (4px radius, 1px border).

Numerals that must align — paths, footer stats, sequence numbers, model · effort, pills — use `font-variant-numeric: tabular-nums`.

### Named Rules
**The Tool-Density Rule.** Chrome and graph text live at 10–15px; the studio bases at 13px. The only text above 15px in the entire system is the diagram page title. Do not add display scale.
**The 650 Rule.** When a label needs presence, reach for weight 650, not 700. 700 belongs to sequence numerals; 600 belongs to labels and handles; nothing uses 800/900.

## Layout

The studio is a full-viewport application shell (`100vh`, no page scroll): a 42px topbar, a flex row of canvas + 330px inspector, and a 38vh YAML drawer that toggles below. The canvas pans (drag), zooms (wheel, 0.25×–3×), and boots fit-to-view with the whole loop centered. The diagram page is the opposite posture: a scrolling document with `2rem` / `clamp(1rem, 4vw, 3rem)` padding, a 72ch header, the SVG in a horizontal scroll guard, and a 60rem-max gate table.

The graph itself lays out as a serpentine spine (boustrophedon) from the entry node: 216×98px cards, 100px column gap, 100px row gap, 56px lane gap, 60px canvas padding, with manual position overrides persisted to the YAML. Back-edges return through a right-margin channel, dipping 46px below the row; gate-condition pills on the spine float 14px above the card row so they never cover a card.

Responsive behavior is three honest degradations, not a redesign: below 1100px the file path in the brand bar hides; below 900px the inspector becomes an absolute overlay with a left shadow; below 720px the topbar scrolls horizontally with Save pinned to the visible right edge.

## Elevation & Depth

Flat by default. Structure comes from 1px borders and the neutral ladder (canvas → panel → elevated → inset), not from shadows. Shadows are reserved for things that genuinely float above the canvas.

### Shadow Vocabulary
- **Node Card** (`feDropShadow dy=1, stdDeviation=2, flood-opacity=.12`): the only resting shadow — graph cards sit a whisper above the canvas. Equivalent CSS: `0 1px 2px rgb(0 0 0 / .12)`.
- **Toast** (`0 4px 16px rgb(0 0 0 / .10)`): messages float over the canvas.
- **Theme Button** (`0 2px 8px rgb(0 0 0 / .08)`): the diagram's fixed corner control.
- **Inspector Overlay** (`-6px 0 20px rgb(0 0 0 / .18)`): only in the ≤900px overlay mode.
- **Selection Glow** (`drop-shadow(0 0 5px color-mix(in srgb, select 35%, transparent))`): state, not elevation — selected nodes/edges in the studio.
- **Focus Ring** (`0 0 0 3px` accent-soft): every interactive control; the outline is removed and the border shifts to accent in the same beat.

### Named Rules
**The Flat-By-Default Rule.** Panels, cards, and drawers are flat at rest and separated by 1px borders. A shadow that isn't a graph card, a toast, an overlay, or a state ring does not ship.

## Shapes

The form language is small-radius rectangles with fully-round pills, plus drawn geometry inside the graph. Chrome controls (buttons, inputs, hint chip, theme button) take a 6px radius; content cards and toasts take 8px; inline code and legend swatches take 4px; graph sequence chips take 5px on a 20px square. Pills — the status pill and every edge label — are fully round (99px, or `rx = height/2` in SVG).

The graph's signature geometry: node cards are 216×98 rounded rectangles (rx 8); entry nodes carry a 1.5px accent border; optional nodes a `4 4` dashed border. Glyphs are **drawn paths, never icon fonts or emoji** — the entry marker is a filled right-pointing triangle inside the sequence chip, and the terminal node is a filled stadium (rx = height/2, width adapts to its label, min 132px) with a stroked check (2.5px, round caps) and the label in letterspaced caps. Every non-terminal node carries its agent as plain `@name` text in accent indigo on the body's first line. Edges are orthogonal polylines with 14px rounded corners — **always**: an edge whose endpoints fall out of alignment bends (horizontal–vertical–horizontal), and a diagonal straight line never ships, dragged nodes included. Solid 1.75px slate for transitions, dashed 2px (`7 4`) amber for the rework loop, dotted 1.75px (`2.5 3.5`) violet for merge/skip; markers are filled triangles, one per edge class in its own color. The rework loop exits through the bottom port, dips 46px below the row, climbs the right-margin channel, and **re-enters through the top port** — port semantics never invert (right/bottom exit, left/top enter). Gate-condition pills anchor to the midpoint of the routed path (offset off the line; spine pills float 14px above the card row), truncate at 42 characters with the full condition in a hover `<title>`, and are event-transparent (`pointer-events: none`) — annotation, never a click target. Nodes without any transition never join the serpentine: they stage in a row below the graph instead of reordering the flow.

## Components

### Buttons
- **Shape:** gently rounded (6px), 12.5px type, `.3rem .65rem` padding, 1px border.
- **Default (ghost):** transparent on panel, ink text, border-light; hover lifts to elevated with border-strong. Transition `.12s ease-out` on background/border/color.
- **Primary:** indigo fill (`#5e6ad2` in **both** themes) with white text and 600 weight; hover deepens (`#4f5bc4` light / `#555dd6` dark). Reserved for the single Save action — one primary per surface, never two on screen at once.
- **Danger:** text-only red at rest; hover gains a red border and an 8% red wash. Delete is a **two-step armed control**: first click arms it (filled red, white "Confirm delete", 3s timeout), second click executes. Disabled state is opacity .45 with events off.

### Status Pill
- **Style:** fully-round pill (99px), 11px/600, elevated background, muted text, with a 6px dot (`::before`, currentColor) as the state marker.
- **States:** ok / warn / err recolor both text and dot and lay a 12–14% `color-mix` tint of the status hue underneath. Announces via `role="status"`.

### Inputs / Fields
- **Style:** inset background (sunken, not raised), 6px radius, 1px border-light, 12.5px, `.34rem .5rem` padding; labels are 11px/600 muted.
- **Focus:** border shifts to accent plus a 3px accent-soft ring; the YAML editor instead draws an inset 2px accent-soft ring.
- **Checkbox groups** (skills): bordered 6px sub-panel with a 10.5px hint; native checkboxes use `accent-color: var(--accent)`.

### Toasts
- **Style:** bottom-right of the canvas (the top is where the graph lives), elevated background, 8px radius, 1px border, the toast shadow, 12px/1.45. The stack caps at three — the oldest leaves.
- **State:** variants recolor text and set a 45% `color-mix` border in the status hue. Errors persist 9s; everything else 4s.

### Navigation / Chrome
- **Topbar:** 42px, panel background, 1px bottom border, `.8rem` horizontal padding. Left to right: brand wordmark ("rensei **錬成** studio" — kanji in accent indigo), truncated file path (11px faint, tabular-nums), status pill, then ghost actions (add node / add transition / reset layout / fit), a tabular zoom readout, the theme icon toggle, the inspector toggle, a 1×18px separator, YAML toggle, and the primary Save. The wordmark is 13.5px/650 — brand presence without display type. Below 720px the bar scrolls horizontally but Save stays pinned to the visible right edge (`position: sticky` + a panel-colored occluder shadow).
- **Theme toggle:** a small ghost button showing a drawn state icon (half-filled circle / sun / moon) with the current and next mode in its `title`; cycles auto → light → dark → auto, persisted to `rk-theme`; on the diagram it becomes a fixed bottom-right chip with its own shadow.

### Inspector & YAML Drawer
- **Inspector:** 330px right rail, panel background, 1px left border. It earns its space: closed at boot, it opens on selection (uppercase 11px/650 head "Node · gate" with a close ✕, dense labeled fields at .7rem rhythm, actions pinned above a top border) and closes when the selection clears. A topbar toggle pins it open — the only way to see the empty state, which teaches the canvas gestures in 12px muted text. The boot hint chip on the canvas retires permanently (localStorage) after the first real interaction.
- **YAML drawer:** 38vh bottom sheet. Default state is a **read-only projection** of the model ("read-only — mirrors the canvas"); an explicit **Edit YAML** mode makes the text editable, locks the canvas behind a veil ("editing — canvas is locked"), and offers Apply/Discard. There is exactly **one Save action** (topbar primary): it persists whichever surface is currently editable, so the two representations can never silently overwrite each other. The editor is inset, mono 12px/1.6, tab-size 2, borderless, with a line-number gutter (the parser cites line numbers, so the editor shows them).

### Graph Node Card (signature)
- **Composition:** 216×98 rounded rect (rx 8), panel fill, 1px node border, the node-card drop shadow. A 30px header band (band fill + 1px rule) holds a 20px square sequence chip (5px radius, accent veil fill, 1px accent stroke) with a 10px/700 tabular numeral in accent-strong — or, on the entry node, a solid accent chip with a drawn white triangle — plus the label at 11.5px/650 uppercase with .07em tracking and an ENTRY/OPTIONAL flag right-anchored at 9.5px/700. The body sets `@agent` at 13px/600 in accent, an optional summary strip at 10px muted (truncated to 34 chars), and model · effort as 16px meta chips bottom-left at 10px muted tabular.
- **Variants:** entry = 1.5px accent border; optional = dashed `4 4` border; terminal = accent stadium (min 132×44, grows with its label) with a drawn check, no card.
- **Studio states:** hover strokes the card in select indigo; selection doubles the stroke to 2.5px and adds the 35% selection glow; keyboard focus matches at 2.5px. A 16px transparent hit path owns edge clicks; label pills never intercept them. Cards snap to an 8px grid when dragged (Shift = free), drag continues and ends correctly even off-canvas (window-level pointer tracking), and a drop can never fully bury another card (the dropped node nudges out).

### Edge Label Pill
- **Style:** 17px-high fully-round rect (width = display text length × 5.8 + 16), panel fill, 1px border, 10px tabular text in pill-ink. Pills render above everything and are event-transparent (`pointer-events: none`); the full (untruncated) condition rides in a `<title>` for hover.
- **Placement:** anchored to the midpoint of the routed path, offset perpendicular off the line — the pill follows its edge when nodes move. The one exception: an aligned spine edge floats its pill 14px above the card row, since a pill is wider than the column gap.
- **Variants:** rework pills flip to amber-soft fill, amber border, 600 amber text; merge/skip pills to violet-soft fill and violet border/text.

### Ports & Edge Interaction (studio)
- **Ports:** 8px dots on the four card borders. Attached ports stay visible; the rest appear on node hover and in connect mode — they are drag handles, not decoration. Dragging from any port starts a transition (rubber-band dashed indigo line, valid targets highlight in select indigo); dropping on a node completes it. Click-click still works as a fallback.
- **Rewire handles:** the selected edge grows two 6px handles — tail (from) and head (to). Dragging either re-targets that end; dropping on empty canvas cancels without mutating. Self-loops and exact duplicates are rejected with a toast, in the field, not at save time.

### Gate Table (diagram)
- **Style:** borderless except 1px row rules, .82rem cells with `.45rem .8rem` padding; headers are .72rem/600 uppercase at .06em in muted. The loop bound (`max 3×`) renders in 600 rework amber — the only colored cell content.

## Do's and Don'ts

### Do:
- **Do** structure with 1px borders (`border-light`) and the neutral ladder; escalate to `border-strong` on hover only.
- **Do** keep chrome at 6px radius, cards/toasts at 8px, and pills fully round (99px / `rx = h/2`).
- **Do** use accent-soft (translucent) for chrome washes and accent-veil (opaque) for graph tints — that split is deliberate.
- **Do** ship every color decision in both theme blocks, and stamp `data-theme` from `rk-theme` before first paint on any new surface.
- **Do** set numerals that align (paths, stats, sequence chips, pills) in `font-variant-numeric: tabular-nums`.
- **Do** draw glyphs as SVG paths (entry triangle, terminal check, agent glyphs, warning triangle) — the graph language is authored, not imported.
- **Do** keep the 錬成 kanji accent in brand moments (titles) and English-primary copy everywhere else.
- **Do** route rework loops below the row (dashed, 2px, amber) and merge/skip transitions above it (dotted, violet) — topology is read from shape and hue together.

### Don't:
- **Don't** introduce a second accent hue into chrome; indigo is the only decorative color the UI is allowed (The One Accent Rule).
- **Don't** use amber/orange for warnings, highlights, or decoration — it is loop-back semantics only (The Reserved Amber Rule). Warnings use the pending-amber status token and never enter the SVG.
- **Don't** put shadows on resting panels, buttons, or inputs (The Flat-By-Default Rule); elevation is for graph cards, toasts, overlays, and state rings.
- **Don't** add display type above ~15px in tools (the diagram page title is the sole exception), and don't add a second typeface — weight 650 is the display voice.
- **Don't** brighten the primary button fill in dark theme; the indigo fill is constant and only its hover shifts.
- **Don't** use icon fonts, emoji, or images inside the graph or status glyphs.
- **Don't** let edges cross nodes as straight diagonals; all routing is orthogonal with 14px rounded corners.
- **Don't** bundle the Inter webfont or hard-require it — the stack must degrade to system sans cleanly.
