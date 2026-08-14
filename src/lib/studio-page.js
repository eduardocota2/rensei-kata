// Studio editor page — served by studio-server.js at GET /.
// Bidirectional: visual edits ⇄ YAML text, synced through server roundtrips.
// Node dragging persists manual positions into graph.positions (saved to YAML).
const graphCss = require('./graph-css');

// Single source for every user-facing string in the studio UI (English-primary;
// kata's ES/EN trigger parity lives in the agents, not on this surface).
const STRINGS = {
  // topbar
  statusLoading: 'loading…',
  addNode: '+ node',
  addEdge: '+ transition',
  resetLayout: 'reset layout',
  resetLayoutTitle: 'Discard manual positions and return to the automatic layout',
  save: 'Save',
  saveTitle: 'Validate, save to rensei.graph.yaml and recompile (Ctrl+S)',
  inspectorToggle: 'inspector',
  inspectorToggleTitle: 'Show / hide the inspector panel',
  inspectorCloseTitle: 'Close inspector',
  // canvas
  hint: 'Drag to move · drag from a port to connect · drag an edge’s handles to rewire · double-click to edit · scroll to zoom · Ctrl+S saves · Ctrl+Z undoes',
  fitView: 'fit',
  connectFrom: 'Click a target node for the new transition from {from} — Esc cancels',
  selectSource: 'Select a source node first, then press + transition',
  selfLoop: 'A transition cannot start and end on the same node.',
  duplicateEdge: 'That transition already exists.',
  canvasLocked: 'Canvas is locked while you edit YAML',
  // yaml drawer
  yamlReadonly: 'read-only — mirrors the canvas',
  yamlEditing: 'editing — canvas is locked',
  yamlEdit: 'Edit YAML',
  yamlApply: 'Apply to canvas',
  yamlDiscard: 'Discard edits',
  // statuses
  unsaved: 'unsaved changes',
  validationFailed: 'validation failed — not saved',
  savedRecompiled: 'saved + recompiled',
  invalidGraph: 'invalid graph',
  validGraph: 'valid graph',
  saving: 'saving…',
  networkStatus: 'server unreachable — not saved',
  bootFailed: 'failed to load graph',
  // toasts ({n} = rebuilt file count)
  savedFilesOne: 'Graph saved. Recompiled {n} file.',
  savedFilesMany: 'Graph saved. Recompiled {n} files.',
  savedYamlFilesOne: 'YAML saved. Recompiled {n} file.',
  savedYamlFilesMany: 'YAML saved. Recompiled {n} files.',
  layoutRestored: 'Automatic layout restored — takes effect when you save.',
  appliedNotSaved: 'YAML applied to the canvas (not saved).',
  networkError: 'Cannot reach the studio server — changes not saved. Is the terminal still running?',
  // inspector
  inspectorTitle: 'Inspector',
  nodeTitle: 'Node',
  transitionTitle: 'Transition',
  inspectorEmpty:
    'Click a node or an arrow to edit it.<br><br>' +
    'Drag a node to move it — its position is saved to the YAML (<code>positions:</code>).<br>' +
    'Drag the background to pan · scroll to zoom.',
  // fields
  fieldId: 'id',
  fieldLabel: 'label',
  fieldAgent: 'agent',
  fieldModel: 'model',
  fieldEffort: 'effort',
  fieldLane: 'lane',
  fieldSummary: 'summary',
  fieldOptional: 'optional (conditional)',
  fieldSkills: 'skills (optional, this phase)',
  skillsInherited: 'inheriting @{agent} defaults — override to change them for this phase',
  skillsOverride: 'phase override active — matches against registry in rensei.config.yaml',
  skillsOverrideBtn: 'Override for this phase',
  skillsResetBtn: 'reset to inherited',
  skillsNone: 'no skills registered for @{agent} — add them in agents/{agent}/agent.yaml',
  fieldTerminal: 'terminal',
  fieldEntry: 'entry point',
  entryLockedTitle: 'This node is the entry point — to move it, set another node as entry first',
  fieldFrom: 'from',
  fieldTo: 'to',
  fieldWhen: 'when (gate condition)',
  fieldMax: 'max (loop bound: 3 or $ITERATIONS.x)',
  // actions
  deleteNode: 'Delete node',
  deleteEdge: 'Delete transition',
  confirmDelete: 'Confirm delete',
  confirmDeleteHint: 'Press Delete again to confirm',
  renameEmpty: 'Name cannot be empty — rename not applied.',
  renameTaken: 'A node with that name already exists — rename not applied.',
  renameChars: 'Use lowercase letters, digits and dashes only (a-z, 0-9, -) — rename not applied.',
  maxInvalid: 'Expected a number (3) or a variable ($ITERATIONS.x) — save will flag this',
  // data defaults
  newNodeBase: 'node',
  // theme
  themeAuto: 'auto',
  themeLight: 'light',
  themeDark: 'dark',
  // tools
  kataBtn: 'kata',
  kataBtnTitle: 'Routing simulator — see where kata sends a request, without spending tokens',
  exportSvgTitle: 'Download the graph as a standalone SVG',
  exportPngTitle: 'Download the graph as a PNG image',
  paletteTitle: 'Command palette — type to filter, Enter to run',
  // routing simulator
  routeTitle: 'kata · routing simulator',
  routeSub: 'Deterministic trigger matching over the compiled agents — the pre-view of what /kata decides in session.',
  routePlaceholder: 'e.g. corrige este bug en el login…',
  routeRun: 'Route',
  routeRunning: 'routing…',
  routeEmpty: 'no trigger matched — kata would fall back to @gate (evaluate first)',
  routeWinner: '→ routes to',
  routeAlso: 'also considered',
  routeNeedText: 'type a request first',
  // diff preview
  diffTitle: 'Review YAML changes',
  diffSub: 'Line diff of your edits against the graph on disk — apply only what you meant.',
  diffApply: 'Apply to canvas',
  diffCancel: 'Cancel',
  diffNone: 'no textual changes detected',
  // export
  exportSvgOk: 'rensei-graph.svg downloaded',
  exportPngOk: 'rensei-graph.png downloaded',
  exportFail: 'export failed — is the studio server still running?',
  // problems
  jumpToProblem: 'click to select the node',
};

const TOKENS = `
:root {
  --bg: #f4f5f7; --panel: #ffffff; --elevated: #fafbfc; --inset: #f4f5f7;
  --ink: #23262b; --muted: #616874; --faint: #656e7a;
  --border: #e2e4e9; --border-strong: #cfd3da;
  --accent: #5e6ad2; --accent-strong: #4f5bc4; --accent-soft: rgba(94,106,210,.12); --on-accent: #ffffff;
  --accent-fill: #5e6ad2; --accent-fill-strong: #4f5bc4;
  --ok: #27794f; --warn: #8a6800; --danger: #d13438;
  /* graph tokens that mirror the chrome scale — aliased once, follow every theme */
  --rk-ground: var(--bg); --rk-ink: var(--ink); --rk-inset: var(--inset);
  --rk-accent: var(--accent); --rk-accent-strong: var(--accent-strong); --rk-on-accent: var(--on-accent);
  --rk-select: var(--accent);
  /* graph-only tokens (values with no chrome counterpart) */
  --rk-muted: #6e7480;
  --rk-node-bg: #ffffff; --rk-node-border: #dee1e7; --rk-band: #eff1f6; --rk-grid: #d3d7de;
  --rk-accent-soft: #e9ebfa;
  --rk-edge: #6e7a88;
  --rk-back: #9a5808; --rk-back-soft: #fdf0da;
  --rk-skip: #6d51b8; --rk-skip-soft: #f0ebfa;
  --rk-pill-bg: #ffffff; --rk-pill-border: #e2e4e9; --rk-pill-ink: #5a616e;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0e1013; --panel: #15181d; --elevated: #1a1e24; --inset: #0f1216;
    --ink: #e6e8eb; --muted: #8f96a1; --faint: #6b7280;
    --border: #262b33; --border-strong: #353b46;
    --accent: #8a90ee; --accent-strong: #9ba0f2; --accent-soft: rgba(138,144,238,.16); --on-accent: #ffffff;
    --accent-fill: #5e6ad2; --accent-fill-strong: #555dd6;
    --ok: #4cc38a; --warn: #f2c94c; --danger: #f26d72;
    --rk-muted: #8f96a1;
    --rk-node-bg: #191d23; --rk-node-border: #2b313b; --rk-band: #262c36; --rk-grid: #262c35;
    --rk-accent-soft: #272c4e;
    --rk-edge: #5c6572;
    --rk-back: #e5a048; --rk-back-soft: #38291a;
    --rk-skip: #ab90e3; --rk-skip-soft: #2c2547;
    --rk-pill-bg: #15181d; --rk-pill-border: #262b33; --rk-pill-ink: #9aa3b2;
  }
}
:root[data-theme="dark"] {
  --bg: #0e1013; --panel: #15181d; --elevated: #1a1e24; --inset: #0f1216;
  --ink: #e6e8eb; --muted: #8f96a1; --faint: #6b7280;
  --border: #262b33; --border-strong: #353b46;
  --accent: #8a90ee; --accent-strong: #9ba0f2; --accent-soft: rgba(138,144,238,.16); --on-accent: #ffffff;
  --accent-fill: #5e6ad2; --accent-fill-strong: #555dd6;
  --ok: #4cc38a; --warn: #f2c94c; --danger: #f26d72;
  --rk-muted: #8f96a1;
  --rk-node-bg: #191d23; --rk-node-border: #2b313b; --rk-band: #262c36; --rk-grid: #262c35;
  --rk-accent-soft: #272c4e;
  --rk-edge: #5c6572;
  --rk-back: #e5a048; --rk-back-soft: #38291a;
  --rk-skip: #ab90e3; --rk-skip-soft: #2c2547;
  --rk-pill-bg: #15181d; --rk-pill-border: #262b33; --rk-pill-ink: #9aa3b2;
}
`;

const PAGE_CSS = `
* { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font-family: "Inter", ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  display: flex; flex-direction: column; height: 100vh; overflow: hidden;
  font-size: 13px; -webkit-font-smoothing: antialiased;
}
::selection { background: var(--accent-soft); }
* { scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent; }
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-thumb { background: var(--border-strong); border: 3px solid transparent; background-clip: content-box; border-radius: 8px; }
*::-webkit-scrollbar-track { background: transparent; }

button {
  font: inherit; font-size: 12.5px; color: var(--ink); background: transparent;
  border: 1px solid var(--border); border-radius: 6px;
  padding: .3rem .65rem; cursor: pointer;
  transition: background .12s ease-out, border-color .12s ease-out, color .12s ease-out;
}
button:hover { background: var(--elevated); border-color: var(--border-strong); }
button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
  outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft);
}
button.primary { background: var(--accent-fill); color: var(--on-accent); border-color: var(--accent-fill); font-weight: 600; }
button.primary:hover { background: var(--accent-fill-strong); border-color: var(--accent-fill-strong); }
button.danger { color: var(--danger); }
button.danger:hover { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, transparent); }
button.danger.armed { background: var(--danger); border-color: var(--danger); color: #fff; font-weight: 600; }
button:disabled { opacity: .45; cursor: default; pointer-events: none; }

/* topbar */
.topbar {
  display: flex; align-items: center; gap: .45rem; height: 42px; flex: none;
  padding: 0 .8rem; background: var(--panel); border-bottom: 1px solid var(--border);
}
.brand { display: flex; align-items: baseline; gap: .4rem; margin-right: .35rem; }
.brand h1 { font-size: 13.5px; margin: 0; letter-spacing: .01em; font-weight: 650; }
.brand h1 .kanji { color: var(--accent); }
.brand .path { color: var(--faint); font-size: 11px; max-width: 30ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.topbar .sep { width: 1px; height: 18px; background: var(--border); margin: 0 .3rem; }
.topbar .spacer { flex: 1; }
.topbar > *:not(.spacer) { flex: none; }
.zoom-readout { font-size: 11px; color: var(--faint); font-variant-numeric: tabular-nums; min-width: 4.2ch; text-align: right; }
#theme-toggle { display: inline-flex; align-items: center; justify-content: center; min-width: 2.1rem; }
#theme-toggle svg { display: block; }
@media (max-width: 1100px) { .brand .path { display: none; } }
@media (max-width: 720px) {
  .topbar { overflow-x: auto; scrollbar-width: none; }
  .topbar::-webkit-scrollbar { display: none; }
  /* the primary action never scrolls away: save packs with the brand at the
     left, utilities scroll off to the right */
  #save-btn { order: 0; }
  .topbar .spacer { order: 2; }
  .topbar > button:not(#save-btn), .topbar .sep, .zoom-readout { order: 3; }
}
.status {
  display: inline-flex; align-items: center; gap: .4rem;
  font-size: 11px; padding: .2rem .6rem; border-radius: 99px; font-weight: 600; letter-spacing: .01em;
  color: var(--muted); background: var(--elevated);
}
.status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.status.ok { color: var(--ok); background: color-mix(in srgb, var(--ok) 12%, transparent); }
.status.err { color: var(--danger); background: color-mix(in srgb, var(--danger) 12%, transparent); }
.status.warn { color: var(--warn); background: color-mix(in srgb, var(--warn) 14%, transparent); }

/* layout */
.main { display: flex; flex: 1; min-height: 0; position: relative; }
.canvas { flex: 1; overflow: hidden; position: relative; cursor: grab; }
.canvas.panning { cursor: grabbing; }
.canvas.connecting { cursor: crosshair; }
.canvas-inner { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
.hint {
  position: absolute; bottom: .65rem; left: 50%; transform: translateX(-50%);
  font-size: 11px; color: var(--muted);
  background: color-mix(in srgb, var(--panel) 88%, transparent); padding: .3rem .6rem; border-radius: 6px;
  pointer-events: none; border: 1px solid var(--border);
  max-width: min(72ch, 80%); line-height: 1.5;
}
.hint.gone { display: none; }
/* veil over the canvas while the YAML drawer is in edit mode */
.canvas-veil {
  position: absolute; inset: 0; z-index: 6; display: none;
  align-items: flex-start; justify-content: center; padding-top: 16vh;
  background: color-mix(in srgb, var(--bg) 58%, transparent); cursor: not-allowed;
}
.canvas-veil.on { display: flex; }
.veil-chip {
  background: var(--panel); border: 1px solid var(--border-strong); border-radius: 99px;
  padding: .35rem .85rem; font-size: 12px; color: var(--muted); box-shadow: 0 4px 16px rgb(0 0 0 / .10);
}

/* inspector */
.inspector {
  width: 330px; background: var(--panel); border-left: 1px solid var(--border);
  overflow-y: auto; display: none;
}
.inspector.open { display: block; }
.inspector-head {
  display: flex; align-items: center; justify-content: space-between; gap: .5rem;
  padding: .7rem .9rem; border-bottom: 1px solid var(--border);
  font-size: 11px; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); font-weight: 650;
}
.insp-close { padding: .1rem .35rem; border: 0; color: var(--muted); line-height: 1; }
.insp-close:hover { color: var(--ink); }
.insp-close svg { display: block; }
.inspector-body { padding: .8rem .9rem; }
.inspector-empty { color: var(--muted); font-size: 12px; padding: 1rem .9rem; line-height: 1.65; }
.field { margin-bottom: .7rem; }
.field label { display: block; font-size: 11px; color: var(--muted); margin-bottom: .3rem; font-weight: 600; letter-spacing: .02em; }
.field input[type="text"], .field select, .field textarea {
  width: 100%; font: inherit; font-size: 12.5px; color: var(--ink);
  background: var(--inset); border: 1px solid var(--border); border-radius: 6px; padding: .34rem .5rem;
}
.field textarea { resize: vertical; min-height: 2.3em; line-height: 1.45; }
.field.inline { display: flex; align-items: center; gap: .5rem; }
.field.inline label { margin: 0; font-weight: 500; font-size: 12.5px; color: var(--ink); }
.field.inline input[type="checkbox"] { accent-color: var(--accent); }
.skills-field { border: 1px solid var(--border); border-radius: 6px; padding: .5rem .6rem .3rem; }
.skills-hint { font-size: 10.5px; color: var(--muted); margin-bottom: .4rem; }
.skill-row { display: flex; align-items: baseline; gap: .45rem; padding: .16rem 0; font-size: 12px; cursor: pointer; }
.skill-row input { flex: none; position: relative; top: 1px; accent-color: var(--accent); }
.skill-row input:disabled { cursor: default; }
.skill-row em { color: var(--muted); font-style: normal; font-size: 11px; }
.skills-actions { margin: .35rem 0 .25rem; }
.skills-actions button { font-size: 11px; padding: .18rem .5rem; }
.inspector .actions { display: flex; gap: .5rem; margin-top: 1rem; padding-top: .8rem; border-top: 1px solid var(--border); }

/* yaml drawer */
.yaml-drawer {
  border-top: 1px solid var(--border); background: var(--panel);
  height: 38vh; display: none; flex-direction: column;
}
.yaml-drawer.open { display: flex; }
.yaml-head { display: flex; align-items: center; gap: .55rem; padding: .4rem .8rem; border-bottom: 1px solid var(--border); }
.yaml-head h2 { font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); font-weight: 650; }
.yaml-state { font-size: 11px; color: var(--faint); }
.yaml-state.editing { color: var(--warn); font-weight: 600; }
.yaml-editor { flex: 1; display: flex; min-height: 0; }
.yaml-gutter {
  margin: 0; padding: .7rem .5rem .7rem .8rem; text-align: right; user-select: none;
  font-family: "Cascadia Code", "JetBrains Mono", ui-monospace, Consolas, monospace;
  font-size: 12px; line-height: 1.6; color: var(--faint);
  background: var(--inset); border-right: 1px solid var(--border);
  overflow: hidden; min-width: 3.4ch; font-variant-numeric: tabular-nums;
}
.yaml-drawer textarea {
  flex: 1; resize: none; border: 0; padding: .7rem .8rem .7rem .55rem;
  font-family: "Cascadia Code", "JetBrains Mono", ui-monospace, Consolas, monospace; font-size: 12px; line-height: 1.6;
  background: var(--inset); color: var(--ink); tab-size: 2; font-variant-numeric: tabular-nums;
}
.yaml-drawer textarea[readonly] { cursor: default; }
.field input.invalid { border-color: var(--danger); }
/* connect mode: every port on the canvas surfaces as a drop target */
.canvas.connecting .rk-graph [data-node] .port { opacity: 1; pointer-events: all; }
.yaml-drawer textarea:focus { outline: none; box-shadow: inset 0 0 0 2px var(--accent-soft); }

/* messages — bottom-right: the top of the canvas is where the graph lives */
.messages {
  position: absolute; bottom: .65rem; right: .8rem;
  display: flex; flex-direction: column; gap: .35rem; z-index: 10; max-width: min(64ch, 92%);
  align-items: flex-end;
}
.msg {
  font-size: 12px; padding: .45rem .75rem; border-radius: 8px; line-height: 1.45;
  background: var(--elevated); border: 1px solid var(--border); box-shadow: 0 4px 16px rgb(0 0 0 / .10);
}
.msg.err { border-color: color-mix(in srgb, var(--danger) 45%, transparent); color: var(--danger); }
.msg.warn { border-color: color-mix(in srgb, var(--warn) 45%, transparent); color: var(--warn); }
.msg.ok { border-color: color-mix(in srgb, var(--ok) 45%, transparent); color: var(--ok); }

@media (max-width: 900px) {
  .inspector { position: absolute; right: 0; top: 0; bottom: 0; z-index: 5; box-shadow: -6px 0 20px rgb(0 0 0 / .18); }
}

/* validation anchoring — the node that carries the error wears the danger */
.rk-graph .node.invalid .card { stroke: var(--danger); stroke-width: 2; }
.rk-graph .node.invalid .band { fill: color-mix(in srgb, var(--danger) 22%, var(--rk-band)); }
.rk-graph .edge-wrap.invalid .edge { stroke: var(--danger); stroke-width: 2.5; }
.msg.anchor { cursor: pointer; }
.msg.anchor::after { content: ' ⤴'; opacity: .7; }

/* minimap — bottom-left overview; the hint retires on first interaction anyway */
.minimap {
  position: absolute; bottom: .65rem; left: .8rem; z-index: 4;
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  border: 1px solid var(--border); border-radius: 6px;
  padding: 4px; cursor: pointer; overflow: hidden;
  box-shadow: 0 4px 16px rgb(0 0 0 / .10);
}
.minimap svg { display: block; }
.minimap .mm-node { fill: var(--rk-accent-soft); stroke: var(--rk-node-border); }
.minimap .mm-node.entry { fill: var(--rk-accent); }
.minimap .mm-view { fill: color-mix(in srgb, var(--accent) 10%, transparent); stroke: var(--accent); stroke-width: 1; }
@media (max-width: 720px) { .minimap { display: none; } }

/* modal shell — route simulator, palette, diff preview */
.modal-root {
  position: fixed; inset: 0; z-index: 40; display: none;
  align-items: flex-start; justify-content: center; padding-top: 12vh;
  background: color-mix(in srgb, var(--bg) 55%, transparent);
}
.modal-root.on { display: flex; }
.modal {
  width: min(58ch, 92vw); background: var(--panel); border: 1px solid var(--border-strong);
  border-radius: 8px; box-shadow: 0 18px 60px rgb(0 0 0 / .25);
  display: flex; flex-direction: column; max-height: 74vh; overflow: hidden;
}
.modal-head {
  display: flex; align-items: baseline; justify-content: space-between; gap: .6rem;
  padding: .7rem .95rem .55rem; border-bottom: 1px solid var(--border);
}
.modal-head h2 { font-size: 12.5px; margin: 0; font-weight: 650; letter-spacing: .01em; }
.modal-head .sub { font-size: 11px; color: var(--muted); }
.modal-body { padding: .8rem .95rem; overflow-y: auto; }
.modal-actions { display: flex; gap: .5rem; justify-content: flex-end; padding: .6rem .95rem .8rem; }

/* route simulator */
.route-input { display: flex; gap: .5rem; }
.route-input textarea {
  flex: 1; font: inherit; font-size: 12.5px; color: var(--ink);
  background: var(--inset); border: 1px solid var(--border); border-radius: 6px;
  padding: .45rem .55rem; resize: vertical; min-height: 2.4em; line-height: 1.45;
}
.route-winner {
  display: flex; align-items: baseline; gap: .5rem; margin: .8rem 0 .2rem;
  font-size: 13px; color: var(--muted);
}
.route-winner strong { font-size: 14.5px; color: var(--ok); font-weight: 650; }
.route-hit { font-size: 12px; color: var(--muted); padding: .12rem 0 .12rem 1rem; }
.route-alt { font-size: 12px; color: var(--faint); padding: .3rem 0 .12rem 1rem; border-top: 1px dashed var(--border); margin-top: .5rem; }
.route-alt:first-child { border-top: 0; margin-top: 0; }

/* palette */
.palette-input {
  width: 100%; font: inherit; font-size: 13px; color: var(--ink);
  background: var(--inset); border: 1px solid var(--border); border-radius: 6px;
  padding: .45rem .6rem; margin-bottom: .5rem;
}
.palette-list { list-style: none; margin: 0; padding: 0; }
.palette-list li {
  display: flex; align-items: center; justify-content: space-between; gap: .8rem;
  padding: .4rem .6rem; border-radius: 6px; font-size: 12.5px; cursor: pointer;
}
.palette-list li.sel { background: var(--accent-soft); }
.palette-list li .k { color: var(--faint); font-size: 11px; font-variant-numeric: tabular-nums; }

/* diff preview */
.diff-body { font-family: "Cascadia Code", "JetBrains Mono", ui-monospace, Consolas, monospace; font-size: 11.5px; line-height: 1.55; }
.diff-line { white-space: pre-wrap; word-break: break-all; padding: 0 .3rem; border-radius: 3px; }
.diff-line.add { background: color-mix(in srgb, var(--ok) 14%, transparent); color: var(--ok); }
.diff-line.del { background: color-mix(in srgb, var(--danger) 12%, transparent); color: var(--danger); }
.diff-line.ctx { color: var(--faint); }
.diff-line.hunk { color: var(--accent); font-weight: 600; margin-top: .3rem; }
`;

const CONTRACT = `<!--
DIRECTION CONTRACT · rensei studio + graph.html
THESIS: the category standard at full fidelity — the tool panel a dev already trusts, executed so precisely that the graph itself becomes the brand. Refuses the roll's worlds and any smuggled quirk.
OWN-WORLD: Linear / VS Code / Raycast grammar — restrained neutrals, one indigo accent, 6px radii, 1px borders, Inter-class system type at tool density, amber reserved for loop-back semantics. Dual light/dark, explicit data-theme override.
STORY: a developer opens the bench and sees the whole loop fit-to-view; every edit, save, and validation state reads instantly; nothing decorates the data.
FIRST VIEWPORT: 42px brand bar with 錬成 accent and status pill; canvas with the loop centered; right inspector of dense labeled fields; YAML cut-list drawer closed below.
FORM: canon — the standing exit chosen by the user over seed 08d19a9d (roll #4 + 3 challengers). Referents: Linear, VS Code, Raycast.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

const PAGE_JS = `
(function () {
  var S = ${JSON.stringify(STRINGS)};
  var RG = window.RenseiGraph;
  var state = {
    graph: null, config: {}, agents: [], yamlText: '',
    selected: null, // { kind: 'node'|'edge', key }
    dirty: false, // graph differs from disk → save button + beforeunload
    yamlMode: false, yamlEdited: false, // yamlMode: drawer is being edited; canvas locked, one Save routes to the text
    inspectorPinned: false, // manually opened with no selection — stays until closed explicitly
    history: [], future: [], lastHistKey: null, lastHistTime: 0,
    connect: null, // { from } while picking a transition target
    problems: null, // { nodes: {name:[msg]}, edges: {idx:[msg]} } — from the last validation
  };

  var canvas = document.getElementById('canvas');
  var inner = document.getElementById('canvas-inner');
  var inspector = document.getElementById('inspector');
  var messages = document.getElementById('messages');
  var yamlDrawer = document.getElementById('yaml-drawer');
  var yamlArea = document.getElementById('yaml-area');
  var statusEl = document.getElementById('status');
  var saveBtn = document.getElementById('save-btn');
  var zoomEl = document.getElementById('zoom-readout');
  var veil = document.getElementById('canvas-veil');
  var hintEl = document.getElementById('hint');

  // ---------- helpers ----------
  function api(path, body) {
    return fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .catch(function () { return { status: 0, body: { ok: false, errors: [S.networkError], warnings: [] } }; });
  }

  function toast(text, kind, anchor) {
    while (messages.children.length >= 3) messages.firstChild.remove(); // cap the stack — errors never bury the canvas
    var el = document.createElement('div');
    el.className = 'msg ' + (kind || '') + (anchor ? ' anchor' : '');
    el.textContent = text;
    if (anchor) {
      el.title = S.jumpToProblem;
      el.addEventListener('click', function () {
        if (state.yamlMode) return; // canvas is locked while YAML is being edited
        select(anchor);
        el.remove();
      });
    }
    messages.appendChild(el);
    setTimeout(function () { el.remove(); }, kind === 'err' ? 9000 : 4000);
  }

  // Validation surfaces twice: as toasts (clickable → jumps to the culprit)
  // and as marks on the canvas — the broken node/edge wears the danger until
  // the next successful validation clears it.
  function showProblems(errors, warnings, issues) {
    state.problems = { nodes: {}, edges: {} };
    var anchorOf = function (iss) {
      if (!iss) return null;
      if (iss.node && state.graph && state.graph.nodes[iss.node]) return { kind: 'node', key: iss.node };
      if (iss.edge !== undefined && state.graph && state.graph.edges[iss.edge]) return { kind: 'edge', key: iss.edge };
      return null;
    };
    var errList = (issues && issues.errors && issues.errors.length) ? issues.errors : (errors || []).map(function (m) { return { message: m }; });
    var warnList = (issues && issues.warnings && issues.warnings.length) ? issues.warnings : (warnings || []).map(function (m) { return { message: m }; });
    errList.forEach(function (iss) {
      var a = anchorOf(iss);
      if (a) (a.kind === 'node' ? state.problems.nodes[a.key] = state.problems.nodes[a.key] || [] : state.problems.edges[a.key] = state.problems.edges[a.key] || []).push(iss.message);
      toast(iss.message, 'err', a);
    });
    warnList.forEach(function (iss) {
      var a = anchorOf(iss);
      toast(iss.message, 'warn', a);
    });
    applyProblemMarks();
  }

  function applyProblemMarks() {
    var svg = inner.querySelector('svg.rk-graph');
    if (!svg) return;
    inner.querySelectorAll('.invalid').forEach(function (el) { el.classList.remove('invalid'); });
    if (!state.problems) return;
    Object.keys(state.problems.nodes).forEach(function (name) {
      var el = inner.querySelector('[data-node="' + name + '"]');
      if (el) {
        el.classList.add('invalid');
        var t = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        t.textContent = state.problems.nodes[name].join(NL);
        el.appendChild(t);
      }
    });
    Object.keys(state.problems.edges).forEach(function (idx) {
      var el = inner.querySelector('[data-edge="' + idx + '"]');
      if (el) el.classList.add('invalid');
    });
  }

  function agentNames() { return state.agents.map(function (a) { return a.name; }); }
  function agentDefaults(name) {
    var a = state.agents.find(function (x) { return x.name === name; });
    return (a && a.skills) || [];
  }
  function nstr(one, many, n) { return (n === 1 ? S[one] : S[many]).replace('{n}', n); }

  // ---------- render ----------
  var renderQueued = false;
  var lastEnds = {}; // edge index -> {a, b} port points, from the last render
  function render() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(function () {
      renderQueued = false;
      var out = RG.renderSvg(state.graph, state.config, { interactive: true });
      inner.innerHTML = out.markup;
      lastEnds = out.ends || {};
      applySelection();
      applyProblemMarks();
      updateMinimap();
      if (dragState && dragState.kind === 'node' && dragState.active) {
        var el = inner.querySelector('[data-node="' + dragState.key + '"]');
        if (el) el.classList.add('dragging');
      }
    });
  }

  // rewire handles on the selected edge: tail (from) and head (to) ports
  function applyHandles() {
    if (!state.selected || state.selected.kind !== 'edge') return;
    var ends = lastEnds[state.selected.key];
    var svg = inner.querySelector('svg.rk-graph');
    if (!ends || !svg) return;
    svg.insertAdjacentHTML('beforeend',
      '<circle class="edge-handle" data-handle="tail" data-edge="' + state.selected.key + '" cx="' + ends.a.x + '" cy="' + ends.a.y + '" r="6"/>' +
      '<circle class="edge-handle" data-handle="head" data-edge="' + state.selected.key + '" cx="' + ends.b.x + '" cy="' + ends.b.y + '" r="6"/>');
  }

  function applySelection() {
    inner.querySelectorAll('.selected').forEach(function (el) { el.classList.remove('selected'); });
    inner.querySelectorAll('.edge-handle').forEach(function (el) { el.remove(); }); // stale handles die with any selection change
    if (!state.selected) return;
    var sel = state.selected.kind === 'node'
      ? inner.querySelector('[data-node="' + state.selected.key + '"]')
      : inner.querySelector('[data-edge="' + state.selected.key + '"]');
    if (sel) sel.classList.add('selected');
    applyHandles();
  }

  function markDirty() {
    state.dirty = true;
    updateSaveBtn();
    statusEl.textContent = S.unsaved;
    statusEl.className = 'status warn';
    scheduleYamlSync();
  }

  // one Save, one rule: enabled when the canvas model is dirty, or when the
  // YAML text was edited in edit mode. Never two competing save buttons.
  function updateSaveBtn() {
    saveBtn.disabled = !(state.dirty || (state.yamlMode && state.yamlEdited));
  }

  // the YAML pane is a read-only projection of the canvas: visual edits re-sync
  // it automatically. It only diverges in edit mode, where the canvas is locked.
  var yamlSyncTimer = null;
  function scheduleYamlSync() {
    clearTimeout(yamlSyncTimer);
    yamlSyncTimer = setTimeout(function () {
      if (state.yamlMode) return; // while editing, the textarea belongs to the user
      api('/api/to-yaml', { graph: state.graph }).then(function (r) {
        if (!r.body || !r.body.text || state.yamlMode) return;
        state.yamlText = r.body.text;
        yamlArea.value = r.body.text;
        updateGutter();
      });
    }, 400);
  }

  // one save flight at a time
  function setSaving(on) {
    saveBtn.disabled = on || !(state.dirty || (state.yamlMode && state.yamlEdited));
    if (on) { statusEl.textContent = S.saving; statusEl.className = 'status warn'; }
  }

  // ---------- pointer: pan, node drag, port connect, edge rewire ----------
  // Listeners live on window: a drag that leaves the canvas must keep tracking,
  // and a release outside must still end it — otherwise the drag sticks to the
  // cursor with no button pressed.
  var view = { x: 24, y: 24, k: 1 };
  var dragState = null; // { kind:'pan'|'node'|'connect'|'rewire', active, moved, startClient, ... }
  var suppressNextClick = false;

  function applyView() {
    inner.style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.k + ')';
    if (zoomEl) zoomEl.textContent = Math.round(view.k * 100) + '%';
    updateMinimap();
  }

  // ---------- minimap ----------
  // A scaled projection of layout() — nodes as chips, the viewport as a frame.
  // Click (or drag) to travel; the frame is the source of truth for position.
  var minimapEl = document.getElementById('minimap');
  var MM_W = 176, MM_H = 104;
  function updateMinimap() {
    if (!minimapEl || !state.graph) return;
    var L = RG.layout(state.graph);
    var s = Math.min(MM_W / L.width, MM_H / L.height);
    var w = Math.max(1, Math.round(L.width * s)), h = Math.max(1, Math.round(L.height * s));
    var svg = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">';
    Object.keys(L.pos).forEach(function (n) {
      var p = L.pos[n], sz = RG.sizeOf(state.graph, n);
      svg += '<rect class="mm-node' + (n === state.graph.entry ? ' entry' : '') + '" x="' + (p.x * s).toFixed(1) + '" y="' + (p.y * s).toFixed(1) + '" width="' + Math.max(2, sz.w * s) + '" height="' + Math.max(2, sz.h * s) + '" rx="1.5"/>';
    });
    var rect = canvas.getBoundingClientRect();
    var vx = (-view.x / view.k) * s, vy = (-view.y / view.k) * s;
    svg += '<rect class="mm-view" x="' + vx.toFixed(1) + '" y="' + vy.toFixed(1) + '" width="' + (rect.width / view.k * s).toFixed(1) + '" height="' + (rect.height / view.k * s).toFixed(1) + '"/>';
    svg += '</svg>';
    minimapEl.innerHTML = svg;
    minimapEl._scale = s;
  }
  function minimapJump(e) {
    var box = minimapEl.getBoundingClientRect();
    var s = minimapEl._scale;
    if (!s) return;
    var mx = (e.clientX - box.left) / s, my = (e.clientY - box.top) / s;
    var rect = canvas.getBoundingClientRect();
    view.x = rect.width / 2 - mx * view.k;
    view.y = rect.height / 2 - my * view.k;
    state.viewTouched = true;
    applyView();
  }
  if (minimapEl) {
    minimapEl.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      minimapJump(e);
      var move = function (ev) { minimapJump(ev); };
      var up = function () { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  // fit the whole loop into the viewport (boot default; button / key "0")
  function fitView() {
    var rect = canvas.getBoundingClientRect();
    var out = RG.layout(state.graph);
    var k = Math.min(1, (rect.width - 48) / out.width, (rect.height - 48) / out.height);
    view.k = Math.max(0.25, Math.min(3, k));
    view.x = (rect.width - out.width * view.k) / 2;
    view.y = (rect.height - out.height * view.k) / 2;
    state.viewTouched = false;
    applyView();
  }
  function toSvg(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    return { x: (clientX - rect.left - view.x) / view.k, y: (clientY - rect.top - view.y) / view.k };
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return; // left button only — right/middle never drag
    var handleEl = e.target.closest ? e.target.closest('[data-handle]') : null;
    var portEl = e.target.closest ? e.target.closest('[data-port]') : null;
    var nodeEl = e.target.closest ? e.target.closest('[data-node]') : null;
    // already connecting: a press on another node completes the transition
    if (state.connect && nodeEl) {
      var toC = nodeEl.getAttribute('data-node');
      if (toC !== state.connect.from) { completeConnect(toC); suppressNextClick = true; }
      return;
    }
    // rewire: drag the selected edge's head/tail handle to re-target it
    if (handleEl && state.selected && state.selected.kind === 'edge') {
      dragState = { kind: 'rewire', active: true, moved: false,
        edge: Number(handleEl.getAttribute('data-edge')),
        end: handleEl.getAttribute('data-handle'),
        startClient: { x: e.clientX, y: e.clientY } };
      return;
    }
    // a port is a drag handle: pressing one starts a connection from that node
    if (portEl && nodeEl) {
      var from = nodeEl.getAttribute('data-node');
      select({ kind: 'node', key: from });
      state.connect = { from: from };
      canvas.classList.add('connecting');
      toast(S.connectFrom.replace('{from}', from), 'ok');
      dragState = { kind: 'connect', active: true, moved: false, startClient: { x: e.clientX, y: e.clientY } };
      return;
    }
    if (nodeEl) {
      var name = nodeEl.getAttribute('data-node');
      var p = state.graph.positions && state.graph.positions[name];
      var current = p || svgNodePos(name);
      dragState = { kind: 'node', active: false, moved: false, key: name, startClient: { x: e.clientX, y: e.clientY }, startPos: current };
    } else {
      dragState = { kind: 'pan', active: false, moved: false, startClient: { x: e.clientX, y: e.clientY }, startView: { x: view.x, y: view.y } };
    }
  });

  function svgNodePos(name) {
    // read current rendered position from layout
    var out = RG.layout(state.graph);
    return out.pos[name] || { x: 0, y: 0 };
  }

  window.addEventListener('pointermove', function (e) {
    if (!dragState) return;
    // released outside any listener — end cleanly instead of sticking to the cursor
    if (dragState.active && e.buttons === 0) { finishDrag(e); return; }
    var dx = e.clientX - dragState.startClient.x;
    var dy = e.clientY - dragState.startClient.y;
    if (!dragState.active && Math.hypot(dx, dy) > 5) {
      dragState.active = true;
      if (dragState.kind === 'pan') canvas.classList.add('panning');
      else if (dragState.kind === 'node') { pushHistory('drag:' + dragState.key); dismissHint(); }
    }
    if (!dragState.active) return;
    if (Math.hypot(dx, dy) > 5) dragState.moved = true;
    suppressNextClick = true;
    if (dragState.kind === 'pan') {
      view.x = dragState.startView.x + dx;
      view.y = dragState.startView.y + dy;
      state.viewTouched = true;
      applyView();
    } else if (dragState.kind === 'node') {
      var svg = toSvg(e.clientX, e.clientY);
      var startSvg = toSvg(dragState.startClient.x, dragState.startClient.y);
      if (!state.graph.positions) state.graph.positions = {};
      var bounds = RG.layout(state.graph);
      var nx = Math.round(dragState.startPos.x + (svg.x - startSvg.x));
      var ny = Math.round(dragState.startPos.y + (svg.y - startSvg.y));
      if (!e.shiftKey) { nx = Math.round(nx / 8) * 8; ny = Math.round(ny / 8) * 8; } // snap to grid; Shift = free
      var sz = RG.sizeOf(state.graph, dragState.key);
      // clamp: a node can never leave the canvas (negative coords clip out of the viewBox)
      nx = Math.max(8, Math.min(nx, bounds.width - sz.w - 8));
      ny = Math.max(8, Math.min(ny, bounds.height - sz.h - 8));
      state.graph.positions[dragState.key] = { x: nx, y: ny };
      markDirty();
      render();
    } else {
      updateRubber(e);
      highlightDropTarget(e);
    }
  });

  function clearDropTargets() {
    inner.querySelectorAll('.drop-target').forEach(function (el) { el.classList.remove('drop-target'); });
  }

  function finishDrag(e) {
    if (!dragState) return;
    var ds = dragState;
    dragState = null;
    canvas.classList.remove('panning');
    if (ds.kind === 'node' && ds.active) {
      select({ kind: 'node', key: ds.key });
      resolveOverlap(ds.key);
      suppressNextClick = true;
    } else if (ds.kind === 'connect' || ds.kind === 'rewire') {
      var nodeEl = e && e.target && e.target.closest ? e.target.closest('[data-node]') : null;
      if (ds.kind === 'connect') {
        if (nodeEl && ds.moved) {
          var to = nodeEl.getAttribute('data-node');
          if (state.connect && to !== state.connect.from) completeConnect(to);
          suppressNextClick = true;
        }
        // no movement → stay in connect mode; the click-click flow continues
      } else {
        finishRewire(ds, nodeEl);
        suppressNextClick = true;
      }
      removeRubber();
      clearDropTargets();
    }
    setTimeout(function () { suppressNextClick = false; }, 0);
  }
  window.addEventListener('pointerup', finishDrag);
  window.addEventListener('pointercancel', function () {
    dragState = null;
    canvas.classList.remove('panning');
    removeRubber();
    clearDropTargets();
  });

  // ---------- rubber band + drop targets (connect / rewire) ----------
  function rubberPath() {
    var svg = inner.querySelector('svg.rk-graph');
    if (!svg) return null;
    var p = svg.querySelector('.rubber-edge');
    if (!p) {
      svg.insertAdjacentHTML('beforeend', '<path class="rubber-edge"/>');
      p = svg.querySelector('.rubber-edge');
    }
    return p;
  }
  function removeRubber() { var p = inner.querySelector('.rubber-edge'); if (p) p.remove(); }
  function rubberFromPoint() {
    if (dragState && dragState.kind === 'rewire') {
      var ends = lastEnds[dragState.edge];
      if (ends) return dragState.end === 'head' ? ends.a : ends.b; // the fixed end
    }
    var name = state.connect && state.connect.from;
    if (!name) return { x: 0, y: 0 };
    var pos = (state.graph.positions && state.graph.positions[name]) || svgNodePos(name);
    var s = RG.sizeOf(state.graph, name);
    return { x: pos.x + s.w, y: pos.y + s.h / 2 };
  }
  function updateRubber(e) {
    var p = rubberPath();
    if (!p) return;
    var from = rubberFromPoint();
    var to = toSvg(e.clientX, e.clientY);
    var midX = (from.x + to.x) / 2;
    p.setAttribute('d', 'M ' + from.x + ' ' + from.y + ' L ' + midX + ' ' + from.y + ' L ' + midX + ' ' + to.y + ' L ' + to.x + ' ' + to.y);
  }
  function highlightDropTarget(e) {
    var nodeEl = e.target && e.target.closest ? e.target.closest('[data-node]') : null;
    var key = nodeEl ? nodeEl.getAttribute('data-node') : null;
    var invalid = null;
    if (dragState && dragState.kind === 'connect' && state.connect) invalid = state.connect.from;
    if (dragState && dragState.kind === 'rewire') {
      var edge = state.graph.edges[dragState.edge];
      if (edge) invalid = dragState.end === 'head' ? edge.from : edge.to;
    }
    clearDropTargets();
    if (nodeEl && key !== invalid) nodeEl.classList.add('drop-target');
  }

  function finishRewire(ds, nodeEl) {
    var edge = state.graph.edges[ds.edge];
    if (!edge || !nodeEl) return; // dropped on empty canvas — nothing was mutated, nothing to revert
    var target = nodeEl.getAttribute('data-node');
    var other = ds.end === 'head' ? edge.from : edge.to;
    if (target === other) { toast(S.selfLoop, 'warn'); return; }
    var f = ds.end === 'head' ? edge.from : target;
    var t = ds.end === 'head' ? target : edge.to;
    var dup = state.graph.edges.some(function (x, j) {
      return j !== ds.edge && x.from === f && x.to === t &&
        (x.when || '') === (edge.when || '') && (x.max || '') === (edge.max || '');
    });
    if (dup) { toast(S.duplicateEdge, 'warn'); return; }
    pushHistory('rewire:' + ds.edge);
    if (ds.end === 'head') edge.to = target; else edge.from = target;
    markDirty(); render(); select({ kind: 'edge', key: ds.edge });
  }

  // never let a drop bury another card: nudge out until overlap is minor
  function overlapArea(a, sa, b, sb) {
    var w = Math.min(a.x + sa.w, b.x + sb.w) - Math.max(a.x, b.x);
    var h = Math.min(a.y + sa.h, b.y + sb.h) - Math.max(a.y, b.y);
    return (w > 0 && h > 0) ? w * h : 0;
  }
  function resolveOverlap(name) {
    var p = state.graph.positions && state.graph.positions[name];
    if (!p) return;
    var s = RG.sizeOf(state.graph, name);
    var moved = false;
    for (var tries = 0; tries < 48; tries++) {
      var bounds = RG.layout(state.graph);
      var hit = false;
      Object.keys(state.graph.nodes).forEach(function (n) {
        if (n === name || hit) return;
        var op = bounds.pos[n];
        if (op && overlapArea(p, s, op, RG.sizeOf(state.graph, n)) > 0.45 * s.w * s.h) hit = true;
      });
      if (!hit) break;
      moved = true;
      p.x += 28;
      if (p.x > bounds.width - s.w - 8) { p.x = 8; p.y += 28; }
    }
    if (moved) { markDirty(); render(); }
  }

  // the only way to create a transition — shared by mouse and keyboard.
  // Stays in connect mode on a rejected target so the gesture isn't lost.
  function completeConnect(to) {
    var from = state.connect.from;
    if (to === from) { toast(S.selfLoop, 'warn'); return; }
    var dup = state.graph.edges.some(function (e) { return e.from === from && e.to === to && !e.when && !e.max; });
    if (dup) { toast(S.duplicateEdge, 'warn'); return; }
    pushHistory('add-edge');
    state.graph.edges.push({ from: from, to: to });
    cancelConnect();
    markDirty(); render(); select({ kind: 'edge', key: state.graph.edges.length - 1 });
    // a transition without a gate condition is semantically empty — land in the field
    requestAnimationFrame(function () { var w = document.getElementById('edge-when'); if (w) w.focus(); });
  }

  // click selection (delegated; suppressed right after a drag)
  canvas.addEventListener('click', function (e) {
    if (suppressNextClick) return;
    var nodeEl = e.target.closest ? e.target.closest('[data-node]') : null;
    var edgeEl = e.target.closest ? e.target.closest('[data-edge]') : null;
    if (state.connect) {
      if (nodeEl) completeConnect(nodeEl.getAttribute('data-node'));
      else cancelConnect();
      return;
    }
    if (nodeEl) select({ kind: 'node', key: nodeEl.getAttribute('data-node') });
    else if (edgeEl) select({ kind: 'edge', key: Number(edgeEl.getAttribute('data-edge')) });
    else select(null);
  });

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    var dk = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    var k2 = Math.min(3, Math.max(0.25, view.k * dk));
    view.x = mx - (mx - view.x) * (k2 / view.k);
    view.y = my - (my - view.y) * (k2 / view.k);
    view.k = k2;
    state.viewTouched = true;
    applyView();
  }, { passive: false });

  // double-click = edit in place: select and land focused in the right field
  canvas.addEventListener('dblclick', function (e) {
    var nodeEl = e.target.closest ? e.target.closest('[data-node]') : null;
    var edgeEl = !nodeEl && e.target.closest ? e.target.closest('[data-edge]') : null;
    if (nodeEl) {
      select({ kind: 'node', key: nodeEl.getAttribute('data-node') });
      requestAnimationFrame(function () { var i = document.getElementById('node-id'); if (i) { i.focus(); i.select(); } });
    } else if (edgeEl) {
      select({ kind: 'edge', key: Number(edgeEl.getAttribute('data-edge')) });
      requestAnimationFrame(function () { var i = document.getElementById('edge-when'); if (i) i.focus(); });
    }
  });

  function select(sel) {
    state.selected = sel;
    if (sel) dismissHint();
    applySelection();
    inspect();
  }

  // the boot hint teaches gestures once — after the first real interaction it
  // is noise (and it overlaps the bottom row when the drawer opens), so it
  // retires permanently (localStorage) instead of nagging on every launch.
  function dismissHint() {
    if (!hintEl || hintEl.classList.contains('gone')) return;
    hintEl.classList.add('gone');
    try { localStorage.setItem('rk-hint-seen', '1'); } catch (e) {}
  }

  // ---------- inspector ----------
  var fieldIdSeq = 0;
  function field(labelText, input) {
    var wrap = document.createElement('div');
    wrap.className = 'field';
    var lab = document.createElement('label');
    lab.textContent = labelText;
    if (!input.id) input.id = 'f' + (++fieldIdSeq);
    lab.htmlFor = input.id;
    wrap.appendChild(lab); wrap.appendChild(input);
    return wrap;
  }
  function textInput(value, oninput) {
    var i = document.createElement('input');
    i.type = 'text'; i.value = value == null ? '' : value;
    i.addEventListener('input', function () { oninput(i.value); });
    return i;
  }
  function selectInput(options, value, oninput) {
    var s = document.createElement('select');
    options.forEach(function (o) {
      var v = typeof o === 'string' ? o : o.value;
      var t = typeof o === 'string' ? o : o.text;
      var opt = document.createElement('option');
      opt.value = v; opt.textContent = t;
      if (v === value) opt.selected = true;
      s.appendChild(opt);
    });
    s.addEventListener('change', function () { oninput(s.value); });
    return s;
  }
  // tier selects speak both languages: the stored key AND its resolved value,
  // so the panel and the card stop disagreeing about what "balanced" means
  function tierOptions(table) {
    return Object.keys(table || {}).map(function (k) { return { value: k, text: k + ' · ' + table[k] }; });
  }
  function areaInput(value, oninput) {
    var i = document.createElement('textarea');
    i.rows = 2; i.value = value == null ? '' : value;
    i.addEventListener('input', function () { oninput(i.value); });
    return i;
  }
  function checkInput(labelText, checked, onchange, lockTitle) {
    var wrap = document.createElement('div');
    wrap.className = 'field inline';
    var c = document.createElement('input');
    c.type = 'checkbox'; c.checked = !!checked; c.id = 'f' + (++fieldIdSeq);
    if (lockTitle) { c.disabled = true; wrap.title = lockTitle; }
    c.addEventListener('change', function () { onchange(c.checked); });
    var lab = document.createElement('label');
    lab.textContent = labelText; lab.htmlFor = c.id;
    wrap.appendChild(c); wrap.appendChild(lab);
    return wrap;
  }
  function dangerButton(text, onclick) {
    var b = document.createElement('button');
    b.className = 'danger'; b.textContent = text;
    var armed = false, timer = null;
    b.addEventListener('click', function () {
      if (!armed) {
        armed = true; b.textContent = S.confirmDelete; b.classList.add('armed');
        timer = setTimeout(function () { armed = false; b.textContent = text; b.classList.remove('armed'); }, 3000);
        return;
      }
      clearTimeout(timer);
      onclick();
    });
    return b;
  }

  // Skills checkbox group for a node. The offerable pool comes from the agent
  // definition (agent.yaml → skills:) — skills irrelevant to the agent (e.g.
  // design skills on @gate) are never shown. node.skills overrides the default.
  // Inherited checkboxes are read-only: materializing an override is an explicit
  // button, so a casual click can never silently fork the agent's list.
  function skillsField(node) {
    var registry = state.config.SKILLS || {};
    var pool = agentDefaults(node.agent);
    var wrap = document.createElement('div');
    wrap.className = 'field skills-field';
    var lab = document.createElement('label');
    lab.textContent = S.fieldSkills;
    wrap.appendChild(lab);
    var hint = document.createElement('div');
    hint.className = 'skills-hint';
    if (!pool.length) {
      hint.textContent = S.skillsNone.split('{agent}').join(node.agent);
      wrap.appendChild(hint);
      return wrap;
    }
    var overridden = node.skills !== undefined;
    hint.textContent = overridden
      ? S.skillsOverride
      : S.skillsInherited.split('{agent}').join(node.agent);
    wrap.appendChild(hint);
    pool.forEach(function (skill) {
      var effective = overridden ? node.skills : pool;
      var row = document.createElement('label');
      row.className = 'skill-row';
      var c = document.createElement('input');
      c.type = 'checkbox';
      c.checked = effective.indexOf(skill) !== -1;
      c.disabled = !overridden;
      c.addEventListener('change', function () {
        pushHistory('skills:' + node.label);
        var cur = node.skills.slice();
        var i = cur.indexOf(skill);
        if (c.checked && i === -1) cur.push(skill);
        if (!c.checked && i !== -1) cur.splice(i, 1);
        var sameAsDefault = cur.length === pool.length && cur.every(function (s) { return pool.indexOf(s) !== -1; });
        if (sameAsDefault) delete node.skills; else node.skills = cur;
        markDirty(); inspect();
      });
      var txt = document.createElement('span');
      var strong = document.createElement('strong');
      strong.textContent = skill;
      var em = document.createElement('em');
      em.textContent = String(registry[skill] || '');
      txt.appendChild(strong); txt.appendChild(document.createTextNode(' ')); txt.appendChild(em);
      row.appendChild(c); row.appendChild(txt);
      wrap.appendChild(row);
    });
    var actions = document.createElement('div');
    actions.className = 'skills-actions';
    var btn = document.createElement('button');
    if (!overridden) {
      btn.textContent = S.skillsOverrideBtn;
      btn.addEventListener('click', function () {
        pushHistory('skills:' + node.label);
        node.skills = pool.slice();
        markDirty(); inspect();
      });
    } else {
      btn.textContent = S.skillsResetBtn;
      btn.addEventListener('click', function () {
        pushHistory('skills:' + node.label);
        delete node.skills;
        markDirty(); inspect();
      });
    }
    actions.appendChild(btn);
    wrap.appendChild(actions);
    return wrap;
  }

  function renameNode(oldName, newName) {
    newName = newName.trim();
    if (!newName || newName === oldName || state.graph.nodes[newName]) return;
    var nodes = {};
    Object.keys(state.graph.nodes).forEach(function (k) {
      nodes[k === oldName ? newName : k] = state.graph.nodes[k];
    });
    state.graph.nodes = nodes;
    state.graph.edges.forEach(function (e) {
      if (e.from === oldName) e.from = newName;
      if (e.to === oldName) e.to = newName;
    });
    if (state.graph.positions && state.graph.positions[oldName]) {
      state.graph.positions[newName] = state.graph.positions[oldName];
      delete state.graph.positions[oldName];
    }
    if (state.graph.entry === oldName) state.graph.entry = newName;
    state.selected = { kind: 'node', key: newName };
  }

  // rename commits on blur/Enter (Escape cancels) — never per keystroke
  function tryRename(oldName, v) {
    v = (v || '').trim();
    if (v === oldName) return;
    if (!v) { toast(S.renameEmpty, 'err'); render(); inspect(); return; }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(v)) { toast(S.renameChars, 'err'); render(); inspect(); return; }
    if (state.graph.nodes[v]) { toast(S.renameTaken, 'err'); render(); inspect(); return; }
    pushHistory('rename');
    renameNode(oldName, v); markDirty(); render(); inspect();
  }
  function commitInput(value, oncommit) {
    var i = document.createElement('input');
    i.type = 'text'; i.value = value == null ? '' : value;
    i.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') i.blur();
      else if (e.key === 'Escape') { i.value = value == null ? '' : value; i.blur(); }
    });
    i.addEventListener('blur', function () { oncommit(i.value); });
    return i;
  }

  function closeBtn() {
    return '<button class="insp-close" id="insp-close" title="' + S.inspectorCloseTitle + '" aria-label="' + S.inspectorCloseTitle + '">' +
      '<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>';
  }
  function wireClose() {
    var b = document.getElementById('insp-close');
    if (b) b.addEventListener('click', function () { state.inspectorPinned = false; select(null); });
  }

  function inspect() {
    // the panel earns its 330px only when it has content — or when pinned open
    if (!state.selected && !state.inspectorPinned) {
      inspector.classList.remove('open');
      inspector.innerHTML = '';
      return;
    }
    inspector.classList.add('open');
    if (!state.selected) {
      inspector.innerHTML =
        '<div class="inspector-head"><span>' + S.inspectorTitle + '</span>' + closeBtn() + '</div>' +
        '<div class="inspector-empty">' + S.inspectorEmpty + '</div>';
      wireClose();
      return;
    }

    if (state.selected.kind === 'node') {
      var name = state.selected.key;
      var node = state.graph.nodes[name];
      if (!node) { state.selected = null; return inspect(); }
      inspector.innerHTML = '<div class="inspector-head"><span>' + S.nodeTitle + ' · ' + RG.esc(name) + '</span>' + closeBtn() + '</div>';
      wireClose();
      var body = document.createElement('div');
      body.className = 'inspector-body';

      var idInput = commitInput(name, function (v) { tryRename(name, v); });
      idInput.id = 'node-id';
      body.appendChild(field(S.fieldId, idInput));
      body.appendChild(field(S.fieldLabel, textInput(node.label, function (v) { pushHistory('field:' + name + ':label'); node.label = v; markDirty(); render(); })));
      if (!node.terminal) {
        body.appendChild(field(S.fieldAgent, selectInput(agentNames(), node.agent, function (v) { pushHistory('sel:' + name + ':agent'); node.agent = v; markDirty(); render(); inspect(); })));
        body.appendChild(field(S.fieldModel, selectInput(tierOptions(state.config.MODELS), node.model, function (v) { pushHistory('sel:' + name + ':model'); node.model = v; markDirty(); render(); })));
        body.appendChild(field(S.fieldEffort, selectInput(tierOptions(state.config.EFFORT), node.effort, function (v) { pushHistory('sel:' + name + ':effort'); node.effort = v; markDirty(); render(); })));
        body.appendChild(field(S.fieldLane, selectInput(['spine', 'above', 'below'], node.lane || 'spine', function (v) {
          pushHistory('sel:' + name + ':lane');
          if (v === 'spine') delete node.lane; else node.lane = v;
          if (state.graph.positions) delete state.graph.positions[name]; // lane change reclaims auto layout
          markDirty(); render();
        })));
        body.appendChild(field(S.fieldSummary, areaInput(node.summary, function (v) { pushHistory('field:' + name + ':summary'); node.summary = v; markDirty(); render(); })));
        body.appendChild(skillsField(node));
        body.appendChild(checkInput(S.fieldOptional, node.optional, function (v) { pushHistory('flag:' + name + ':optional'); node.optional = v; markDirty(); render(); }));
      }
      // terminal is non-destructive: phase data (agent/model/effort/summary) stays
      // on the node — inert while terminal (validator + compiler ignore it there),
      // and instantly restored when the node becomes a phase again
      body.appendChild(checkInput(S.fieldTerminal, node.terminal, function (v) {
        pushHistory('flag:' + name + ':terminal');
        node.terminal = v;
        markDirty(); render(); inspect();
      }));
      var isEntry = state.graph.entry === name;
      body.appendChild(checkInput(S.fieldEntry, isEntry, function (v) {
        if (v) { pushHistory('flag:' + name + ':entry'); state.graph.entry = name; markDirty(); render(); }
      }, isEntry ? S.entryLockedTitle : ''));

      var actions = document.createElement('div');
      actions.className = 'actions';
      actions.appendChild(dangerButton(S.deleteNode, deleteSelected));
      body.appendChild(actions);
      inspector.appendChild(body);
    } else {
      var idx = state.selected.key;
      var edge = state.graph.edges[idx];
      if (!edge) { state.selected = null; return inspect(); }
      inspector.innerHTML = '<div class="inspector-head"><span>' + S.transitionTitle + ' · ' + RG.esc(edge.from) + ' → ' + RG.esc(edge.to) + '</span>' + closeBtn() + '</div>';
      wireClose();
      var body2 = document.createElement('div');
      body2.className = 'inspector-body';
      var nodeNames = Object.keys(state.graph.nodes);
      body2.appendChild(field(S.fieldFrom, selectInput(nodeNames, edge.from, function (v) {
        if (v === edge.to) { toast(S.selfLoop, 'err'); inspect(); return; } // the validator rejects self-loops — reject them here first
        pushHistory('edge:' + idx + ':from'); edge.from = v; markDirty(); render(); inspect();
      })));
      body2.appendChild(field(S.fieldTo, selectInput(nodeNames, edge.to, function (v) {
        if (v === edge.from) { toast(S.selfLoop, 'err'); inspect(); return; }
        pushHistory('edge:' + idx + ':to'); edge.to = v; markDirty(); render(); inspect();
      })));
      var whenInput = textInput(edge.when, function (v) {
        pushHistory('edge:' + idx + ':when');
        if (v) edge.when = v; else delete edge.when;
        markDirty(); render();
      });
      whenInput.id = 'edge-when';
      body2.appendChild(field(S.fieldWhen, whenInput));
      var maxInput = textInput(edge.max, function (v) {
        pushHistory('edge:' + idx + ':max');
        if (v) edge.max = v; else delete edge.max;
        var bad = !!v && !/^(\d+|\$[A-Za-z_][\w.]*)$/.test(v);
        maxInput.classList.toggle('invalid', bad);
        maxInput.title = bad ? S.maxInvalid : '';
        markDirty(); render();
      });
      body2.appendChild(field(S.fieldMax, maxInput));
      var actions2 = document.createElement('div');
      actions2.className = 'actions';
      actions2.appendChild(dangerButton(S.deleteEdge, deleteSelected));
      body2.appendChild(actions2);
      inspector.appendChild(body2);
    }
  }

  // ---------- keyboard ----------
  function isFormTarget(t) { return t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName); }

  // ---------- undo/redo ----------
  // Snapshot BEFORE every mutation, coalesced per operation key (700ms) so a
  // drag or a typed sentence is one undo step. Redo dies on any new mutation.
  function pushHistory(key) {
    var now = Date.now();
    if (key && key === state.lastHistKey && now - state.lastHistTime < 700) { state.lastHistTime = now; return; }
    state.history.push(JSON.stringify(state.graph));
    if (state.history.length > 60) state.history.shift();
    state.future = [];
    state.lastHistKey = key; state.lastHistTime = now;
  }
  function restoreFrom(snap) {
    state.graph = JSON.parse(snap);
    state.lastHistKey = null; state.connect = null;
    canvas.classList.remove('connecting');
    if (state.selected) {
      var gone = state.selected.kind === 'node'
        ? !state.graph.nodes[state.selected.key]
        : !state.graph.edges[state.selected.key];
      if (gone) state.selected = null;
    }
    markDirty(); render(); inspect();
  }
  function undo() {
    if (!state.history.length) return;
    state.future.push(JSON.stringify(state.graph));
    restoreFrom(state.history.pop());
  }
  function redo() {
    if (!state.future.length) return;
    state.history.push(JSON.stringify(state.graph));
    restoreFrom(state.future.pop());
  }

  var keyDelete = { armed: false, timer: null };
  function requestDelete() {
    if (!keyDelete.armed) {
      keyDelete.armed = true;
      toast(S.confirmDeleteHint, 'warn');
      keyDelete.timer = setTimeout(function () { keyDelete.armed = false; }, 3000);
      return;
    }
    clearTimeout(keyDelete.timer); keyDelete.armed = false;
    deleteSelected();
  }

  function deleteSelected() {
    if (!state.selected) return;
    pushHistory('delete');
    if (state.selected.kind === 'node') {
      var name = state.selected.key;
      delete state.graph.nodes[name];
      if (state.graph.positions) delete state.graph.positions[name];
      state.graph.edges = state.graph.edges.filter(function (e) { return e.from !== name && e.to !== name; });
    } else {
      state.graph.edges.splice(state.selected.key, 1);
    }
    state.selected = null; markDirty(); render(); inspect();
  }

  function nudge(name, key, step) {
    pushHistory('nudge:' + name);
    if (!state.graph.positions) state.graph.positions = {};
    var p = state.graph.positions[name] || svgNodePos(name);
    var d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[key];
    if (!d) return;
    state.graph.positions[name] = { x: Math.round(p.x + d[0]), y: Math.round(p.y + d[1]) };
    markDirty(); render();
    // render() rebuilds the SVG — hand focus back to the moved node
    requestAnimationFrame(function () {
      var el = inner.querySelector('[data-node="' + name + '"]');
      if (el) el.focus();
    });
  }

  function duplicateSelected() {
    if (!state.selected || state.selected.kind !== 'node') return;
    var src = state.selected.key;
    var node = state.graph.nodes[src];
    if (!node) return;
    pushHistory('duplicate:' + src);
    var base = src + '-copy', name = base, n = 2;
    while (state.graph.nodes[name]) { name = base + '-' + n; n++; }
    var copy = JSON.parse(JSON.stringify(node));
    copy.label = (node.label || src.toUpperCase()) + ' COPY';
    state.graph.nodes[name] = copy;
    var p = (state.graph.positions && state.graph.positions[src]) || svgNodePos(src);
    if (!state.graph.positions) state.graph.positions = {};
    var bounds = RG.layout(state.graph);
    var s = RG.sizeOf(state.graph, name);
    state.graph.positions[name] = {
      x: Math.max(8, Math.min(p.x + 28, bounds.width - s.w - 8)),
      y: Math.max(8, Math.min(p.y + 24, bounds.height - s.h - 8)),
    };
    markDirty(); render(); select({ kind: 'node', key: name });
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      // one Save button, always: in YAML edit mode it saves the text, else the model
      if (!saveBtn.disabled) saveBtn.click();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (modalRoot.classList.contains('on')) closeModal(); else openPalette();
      return;
    }
    if (isFormTarget(e.target)) return; // inputs handle their own Enter/Escape/undo
    if (state.yamlMode) return; // canvas is locked while the YAML text is being edited
    if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); duplicateSelected(); return; }
    if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'n' || e.key === 'N')) { document.getElementById('add-node').click(); return; }
    if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'e' || e.key === 'E')) { document.getElementById('add-edge').click(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); return; }
    if (e.key === '0') { fitView(); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      var nEl = e.target && e.target.closest ? e.target.closest('[data-node]') : null;
      var eEl = !nEl && e.target && e.target.closest ? e.target.closest('[data-edge]') : null;
      // keyboard parity: Enter on a target node completes a pending connection
      if (nEl && state.connect) { e.preventDefault(); completeConnect(nEl.getAttribute('data-node')); return; }
      if (nEl) { e.preventDefault(); select({ kind: 'node', key: nEl.getAttribute('data-node') }); return; }
      if (eEl) { e.preventDefault(); select({ kind: 'edge', key: Number(eEl.getAttribute('data-edge')) }); return; }
    }
    if (e.key === 'Escape') {
      if (state.connect) cancelConnect();
      else select(null);
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.selected) {
      e.preventDefault(); requestDelete(); return;
    }
    if (e.key.indexOf('Arrow') === 0) {
      e.preventDefault();
      if (state.selected && state.selected.kind === 'node') {
        nudge(state.selected.key, e.key, e.shiftKey ? 24 : 8);
      } else {
        var s = e.shiftKey ? 120 : 40;
        if (e.key === 'ArrowLeft') view.x += s;
        else if (e.key === 'ArrowRight') view.x -= s;
        else if (e.key === 'ArrowUp') view.y += s;
        else if (e.key === 'ArrowDown') view.y -= s;
        state.viewTouched = true;
        applyView();
      }
    }
  });

  // keep the graph framed on window resize — unless the user framed it themselves
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (!state.viewTouched) fitView(); }, 200);
  });

  // ---------- toolbar ----------
  // spawn at the centre of the current view — cascading past whatever already
  // occupies it, so consecutive spawns never stack invisibly
  function spawnSpot() {
    var rect = canvas.getBoundingClientRect();
    var c = toSvg(rect.left + rect.width / 2, rect.top + rect.height / 2);
    var x = Math.round(c.x - RG.NODE_W / 2), y = Math.round(c.y - RG.NODE_H / 2);
    var bounds = RG.layout(state.graph);
    for (var k = 0; k < 24; k++) {
      var clash = Object.keys(bounds.pos).some(function (n) {
        var p = bounds.pos[n], s = RG.sizeOf(state.graph, n);
        return Math.abs((p.x + s.w / 2) - (x + RG.NODE_W / 2)) < (s.w + RG.NODE_W) / 2 * 0.8 &&
               Math.abs((p.y + s.h / 2) - (y + RG.NODE_H / 2)) < (s.h + RG.NODE_H) / 2 * 0.8;
      });
      if (!clash) break;
      x += 28; y += 24;
    }
    return {
      x: Math.max(8, Math.min(x, bounds.width - RG.NODE_W - 8)),
      y: Math.max(8, Math.min(y, bounds.height - RG.NODE_H - 8)),
    };
  }
  document.getElementById('add-node').addEventListener('click', function () {
    pushHistory('add-node');
    var base = S.newNodeBase, n = 1;
    while (state.graph.nodes[base + '-' + n]) n++;
    var name = base + '-' + n;
    state.graph.nodes[name] = {
      agent: agentNames()[0],
      model: Object.keys(state.config.MODELS || {})[0],
      effort: Object.keys(state.config.EFFORT || {})[0],
      label: name.toUpperCase(),
    };
    if (!state.graph.positions) state.graph.positions = {};
    state.graph.positions[name] = spawnSpot();
    markDirty(); render(); select({ kind: 'node', key: name });
  });
  document.getElementById('add-edge').addEventListener('click', function () {
    if (state.connect) { cancelConnect(); return; }
    if (!state.selected || state.selected.kind !== 'node') {
      toast(S.selectSource, 'warn');
      return;
    }
    state.connect = { from: state.selected.key };
    canvas.classList.add('connecting');
    toast(S.connectFrom.replace('{from}', state.selected.key), 'ok');
  });
  function cancelConnect() {
    state.connect = null;
    canvas.classList.remove('connecting');
    removeRubber();
    clearDropTargets();
  }
  document.getElementById('reset-layout').addEventListener('click', function () {
    pushHistory('layout');
    delete state.graph.positions;
    markDirty(); render();
    toast(S.layoutRestored, 'ok');
  });
  document.getElementById('yaml-toggle').addEventListener('click', function () {
    var opening = !yamlDrawer.classList.contains('open');
    if (!opening && state.yamlMode) setYamlMode(false); // closing the drawer ends the edit session
    yamlDrawer.classList.toggle('open', opening);
    fitView(); // the canvas just gained/lost 38vh — re-fit so nothing slides under the drawer
  });
  document.getElementById('inspector-toggle').addEventListener('click', function () {
    if (inspector.classList.contains('open')) {
      state.inspectorPinned = false;
      state.selected = null;
      applySelection();
    } else {
      state.inspectorPinned = true;
    }
    inspect();
  });
  document.getElementById('fit-view').addEventListener('click', fitView);

  // ---------- theme (shared key across studio + diagram) ----------
  var themeBtn = document.getElementById('theme-toggle');
  var THEME_ICONS = {
    auto: '<svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true"><circle cx="7" cy="7" r="5.3" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M7 1.7 A5.3 5.3 0 0 1 7 12.3 Z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true"><circle cx="7" cy="7" r="3.2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M7 .7v1.7M7 11.6v1.7M.7 7h1.7M11.6 7h1.7M2.6 2.6l1.2 1.2M10.2 10.2l1.2 1.2M11.4 2.6l-1.2 1.2M3.8 10.2l-1.2 1.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
    dark: '<svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true"><path d="M12 8.8 A5.5 5.5 0 1 1 5.2 2 A4.4 4.4 0 0 0 12 8.8 Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  };
  function themeMode() { try { return localStorage.getItem('rk-theme') || 'auto'; } catch (e) { return 'auto'; } }
  function applyTheme(mode) {
    if (mode === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = mode;
    var next = { auto: 'light', light: 'dark', dark: 'auto' }[mode];
    var label = mode === 'light' ? S.themeLight : mode === 'dark' ? S.themeDark : S.themeAuto;
    var nextLabel = next === 'light' ? S.themeLight : next === 'dark' ? S.themeDark : S.themeAuto;
    themeBtn.innerHTML = THEME_ICONS[mode];
    themeBtn.title = 'Theme: ' + label + ' — click for ' + nextLabel;
    themeBtn.setAttribute('aria-label', themeBtn.title);
  }
  themeBtn.addEventListener('click', function () {
    var next = { auto: 'light', light: 'dark', dark: 'auto' }[themeMode()];
    try { localStorage.setItem('rk-theme', next); } catch (e) {}
    applyTheme(next);
  });
  applyTheme(themeMode());

  function saveSucceeded(r, fromYaml) {
    if (fromYaml && r.body.graph) state.graph = r.body.graph;
    state.yamlText = r.body.yamlText;
    yamlArea.value = r.body.yamlText;
    state.dirty = false;
    state.yamlEdited = false;
    state.problems = null;
    applyProblemMarks();
    setYamlMode(false);
    updateSaveBtn();
    statusEl.textContent = S.savedRecompiled;
    statusEl.className = 'status ok';
    toast(nstr(fromYaml ? 'savedYamlFilesOne' : 'savedFilesOne', fromYaml ? 'savedYamlFilesMany' : 'savedFilesMany', (r.body.rebuilt || []).length), 'ok');
    showProblems([], r.body.warnings);
    if (fromYaml) { state.selected = null; render(); inspect(); } // graph was replaced — drop the stale selection
  }
  function saveFailed(r) {
    showProblems(r.body.errors, r.body.warnings, r.body.issues);
    statusEl.textContent = r.status === 0 ? S.networkStatus : S.validationFailed;
    statusEl.className = 'status err';
    setSaving(false);
  }

  // ONE save action. What it persists depends on the single editable surface:
  // the YAML text in edit mode, the canvas model otherwise.
  saveBtn.addEventListener('click', function () {
    setSaving(true);
    if (state.yamlMode) {
      api('/api/save-yaml', { text: yamlArea.value }).then(function (r) {
        if (!r.body.ok) { saveFailed(r); return; }
        api('/api/model').then(function (m) {
          if (!m.body || !m.body.graph) { toast(S.networkError, 'err'); setSaving(false); return; }
          m.body.rebuilt = r.body.rebuilt; m.body.warnings = r.body.warnings;
          saveSucceeded(m, true);
        });
      });
      return;
    }
    api('/api/model', { graph: state.graph }).then(function (r) {
      if (!r.body.ok) { saveFailed(r); return; }
      saveSucceeded(r, false);
    });
  });

  // ---------- yaml pane ----------
  // The drawer is a read-only projection of the model by default. "Edit YAML"
  // enters an explicit edit mode: the canvas locks behind a veil and Save
  // persists the text. Two representations, but never two editable at once —
  // so they can never silently overwrite each other.
  var yamlEditBtn = document.getElementById('yaml-edit');
  var yamlApplyBtn = document.getElementById('yaml-preview');
  var yamlDiscardBtn = document.getElementById('yaml-discard');
  var yamlState = document.getElementById('yaml-state');
  var yamlGutter = document.getElementById('yaml-gutter');

  // the parser cites line numbers — so the editor shows line numbers
  // (NL via charCode: a backslash-n escape would be eaten by the PAGE_JS template literal)
  var NL = String.fromCharCode(10);
  function updateGutter() {
    if (!yamlGutter) return;
    var n = yamlArea.value.split(NL).length;
    if (n === updateGutter.last) return;
    updateGutter.last = n;
    var s = '';
    for (var i = 1; i <= n; i++) s += (i === 1 ? '' : NL) + i;
    yamlGutter.textContent = s;
  }
  yamlArea.addEventListener('scroll', function () { if (yamlGutter) yamlGutter.scrollTop = yamlArea.scrollTop; });

  function setYamlMode(on) {
    if (on && state.selected) select(null); // close the inspector — the model is not editable while the text is
    state.yamlMode = on;
    yamlArea.readOnly = !on;
    veil.classList.toggle('on', on);
    veil.textContent = '';
    if (on) {
      var chip = document.createElement('span');
      chip.className = 'veil-chip';
      chip.textContent = S.canvasLocked;
      veil.appendChild(chip);
    }
    yamlEditBtn.style.display = on ? 'none' : '';
    yamlApplyBtn.style.display = on ? '' : 'none';
    yamlDiscardBtn.style.display = on ? '' : 'none';
    yamlState.textContent = on ? S.yamlEditing : S.yamlReadonly;
    yamlState.className = 'yaml-state' + (on ? ' editing' : '');
    if (!on) { state.yamlEdited = false; yamlArea.value = state.yamlText; }
    updateGutter();
    updateSaveBtn();
  }

  yamlEditBtn.addEventListener('click', function () {
    setYamlMode(true);
    yamlArea.focus();
  });
  yamlDiscardBtn.addEventListener('click', function () { setYamlMode(false); });

  // ---------- modal shell ----------
  var modalRoot = document.getElementById('modal-root');
  function openModal(build) {
    closeModal();
    var m = document.createElement('div');
    m.className = 'modal';
    modalRoot.appendChild(m);
    modalRoot.classList.add('on');
    build(m);
    return m;
  }
  function closeModal() {
    modalRoot.classList.remove('on');
    modalRoot.innerHTML = '';
  }
  modalRoot.addEventListener('pointerdown', function (e) { if (e.target === modalRoot) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalRoot.classList.contains('on')) { closeModal(); e.stopPropagation(); }
  }, true);

  // ---------- line diff (YAML preview) ----------
  // Classic LCS over lines — graphs are ~150 lines, O(n·m) is nothing.
  function lineDiff(a, b) {
    var A = a.split(NL), B = b.split(NL);
    var n = A.length, m = B.length;
    var dp = [];
    for (var i = 0; i <= n; i++) { dp.push(new Array(m + 1).fill(0)); }
    for (var ii = n - 1; ii >= 0; ii--) {
      for (var jj = m - 1; jj >= 0; jj--) {
        dp[ii][jj] = A[ii] === B[jj] ? dp[ii + 1][jj + 1] + 1 : Math.max(dp[ii + 1][jj], dp[ii][jj + 1]);
      }
    }
    var rows = [], ai = 0, bi = 0;
    while (ai < n && bi < m) {
      if (A[ai] === B[bi]) { rows.push({ t: 'ctx', s: '  ' + A[ai] }); ai++; bi++; }
      else if (dp[ai + 1][bi] >= dp[ai][bi + 1]) { rows.push({ t: 'del', s: '- ' + A[ai] }); ai++; }
      else { rows.push({ t: 'add', s: '+ ' + B[bi] }); bi++; }
    }
    while (ai < n) { rows.push({ t: 'del', s: '- ' + A[ai] }); ai++; }
    while (bi < m) { rows.push({ t: 'add', s: '+ ' + B[bi] }); bi++; }
    return rows;
  }
  // compress: context collapses to hunks — review what changed, not the file
  function hunksOf(rows, ctx) {
    var keep = new Array(rows.length).fill(false);
    rows.forEach(function (r, i) {
      if (r.t !== 'ctx') {
        for (var k = i - ctx; k <= i + ctx; k++) if (k >= 0 && k < rows.length) keep[k] = true;
      }
    });
    var out = [], gap = false;
    rows.forEach(function (r, i) {
      if (keep[i]) { out.push(r); gap = false; }
      else if (!gap) { out.push({ t: 'hunk', s: '⋯' }); gap = true; }
    });
    return out;
  }

  function applyYamlText() {
    api('/api/parse-yaml', { text: yamlArea.value }).then(function (r) {
      if (!r.body.ok) { showProblems(r.body.errors, r.body.warnings, r.body.issues); return; }
      pushHistory('yaml-apply');
      state.graph = r.body.graph;
      state.selected = null;
      state.problems = null;
      setYamlMode(false);
      markDirty(); render(); inspect();
      toast(S.appliedNotSaved, 'ok');
    });
  }

  yamlApplyBtn.addEventListener('click', function () {
    if (yamlArea.value === state.yamlText) { applyYamlText(); return; }
    openModal(function (m) {
      m.innerHTML =
        '<div class="modal-head"><h2>' + S.diffTitle + '</h2></div>' +
        '<div class="modal-body diff-body" id="diff-body"></div>' +
        '<div class="modal-actions">' +
        '<button id="diff-cancel">' + S.diffCancel + '</button>' +
        '<button id="diff-apply" class="primary">' + S.diffApply + '</button></div>';
      var body = m.querySelector('#diff-body');
      var rows = hunksOf(lineDiff(state.yamlText, yamlArea.value), 2);
      var changed = rows.some(function (r) { return r.t === 'add' || r.t === 'del'; });
      if (!changed) body.textContent = S.diffNone;
      else rows.forEach(function (r) {
        var d = document.createElement('div');
        d.className = 'diff-line ' + r.t;
        d.textContent = r.s;
        body.appendChild(d);
      });
      m.querySelector('#diff-cancel').addEventListener('click', closeModal);
      m.querySelector('#diff-apply').addEventListener('click', function () { closeModal(); applyYamlText(); });
    });
  });

  // ---------- export (SVG from the server; PNG rasterized in-page) ----------
  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function exportSvg() {
    fetch('/api/export.svg')
      .then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (text) {
        download(new Blob([text], { type: 'image/svg+xml' }), 'rensei-graph.svg');
        toast(S.exportSvgOk, 'ok');
      })
      .catch(function () { toast(S.exportFail, 'err'); });
  }
  function exportPng() {
    fetch('/api/export.svg')
      .then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (text) {
        var blob = new Blob([text], { type: 'image/svg+xml' });
        var url = URL.createObjectURL(blob);
        var img = new Image();
        img.onload = function () {
          var scale = 2;
          var c = document.createElement('canvas');
          c.width = img.width * scale; c.height = img.height * scale;
          var ctx = c.getContext('2d');
          ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--rk-ground').trim() || '#ffffff';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          c.toBlob(function (b) {
            if (!b) { toast(S.exportFail, 'err'); return; }
            download(b, 'rensei-graph.png');
            toast(S.exportPngOk, 'ok');
          }, 'image/png');
        };
        img.onerror = function () { URL.revokeObjectURL(url); toast(S.exportFail, 'err'); };
        img.src = url;
      })
      .catch(function () { toast(S.exportFail, 'err'); });
  }
  document.getElementById('export-svg').addEventListener('click', exportSvg);
  document.getElementById('export-png').addEventListener('click', exportPng);

  // ---------- kata routing simulator ----------
  function openRouteModal() {
    openModal(function (m) {
      m.innerHTML =
        '<div class="modal-head"><div><h2>' + S.routeTitle + '</h2></div></div>' +
        '<div class="modal-body">' +
        '<div class="sub" style="font-size:11px;color:var(--muted);margin-bottom:.55rem">' + S.routeSub + '</div>' +
        '<div class="route-input"><textarea id="route-text" rows="2" placeholder="' + S.routePlaceholder + '"></textarea>' +
        '<button id="route-run" class="primary" style="align-self:flex-end">' + S.routeRun + '</button></div>' +
        '<div id="route-out"></div></div>';
      var ta = m.querySelector('#route-text');
      var out = m.querySelector('#route-out');
      function run() {
        var text = ta.value.trim();
        if (!text) { out.textContent = ''; return; }
        out.textContent = S.routeRunning;
        api('/api/route', { text: text }).then(function (r) {
          out.innerHTML = '';
          var ms = (r.body && r.body.matches) || [];
          if (!ms.length) {
            var p = document.createElement('div');
            p.className = 'route-winner';
            p.textContent = S.routeEmpty;
            out.appendChild(p);
            return;
          }
          ms.forEach(function (mt, i) {
            if (i === 0) {
              var w = document.createElement('div');
              w.className = 'route-winner';
              var strong = document.createElement('strong');
              strong.textContent = '@' + mt.agent;
              w.appendChild(document.createTextNode(S.routeWinner + ' '));
              w.appendChild(strong);
              w.appendChild(document.createTextNode('  · score ' + mt.score));
              out.appendChild(w);
            } else {
              var alt = document.createElement('div');
              alt.className = 'route-alt';
              alt.textContent = S.routeAlso + ': @' + mt.agent + ' (' + mt.score + ') — ' + mt.hits.slice(0, 3).map(function (h) { return '"' + h.trigger + '"'; }).join(', ');
              out.appendChild(alt);
            }
            if (i === 0) mt.hits.slice(0, 6).forEach(function (h) {
              var hit = document.createElement('div');
              hit.className = 'route-hit';
              hit.textContent = '"' + h.trigger + '" (' + h.lang + ') ×' + h.count + ' — ' + h.where;
              out.appendChild(hit);
            });
          });
        });
      }
      m.querySelector('#route-run').addEventListener('click', run);
      ta.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); }
      });
      setTimeout(function () { ta.focus(); }, 0);
    });
  }
  document.getElementById('kata-btn').addEventListener('click', openRouteModal);

  // ---------- command palette (Ctrl+K) ----------
  var paletteActions = [
    { label: 'Add node', hint: 'N', run: function () { document.getElementById('add-node').click(); } },
    { label: 'Add transition', hint: 'E', run: function () { document.getElementById('add-edge').click(); } },
    { label: 'Save (validate + recompile)', hint: 'Ctrl+S', run: function () { if (!saveBtn.disabled) saveBtn.click(); } },
    { label: 'Undo', hint: 'Ctrl+Z', run: undo },
    { label: 'Redo', hint: 'Ctrl+Y', run: redo },
    { label: 'Fit view', hint: '0', run: fitView },
    { label: 'Reset layout', hint: '', run: function () { document.getElementById('reset-layout').click(); } },
    { label: 'Toggle YAML drawer', hint: '', run: function () { document.getElementById('yaml-toggle').click(); } },
    { label: 'Toggle inspector', hint: '', run: function () { document.getElementById('inspector-toggle').click(); } },
    { label: 'kata routing simulator', hint: '', run: openRouteModal },
    { label: 'Export SVG', hint: '', run: exportSvg },
    { label: 'Export PNG', hint: '', run: exportPng },
    { label: 'Theme: cycle auto / light / dark', hint: '', run: function () { document.getElementById('theme-toggle').click(); } },
  ];
  function openPalette() {
    openModal(function (m) {
      m.style.width = 'min(46ch, 92vw)';
      m.innerHTML =
        '<div class="modal-body">' +
        '<input class="palette-input" id="palette-q" placeholder="' + S.paletteTitle + '" autocomplete="off">' +
        '<ul class="palette-list" id="palette-list"></ul></div>';
      var q = m.querySelector('#palette-q');
      var list = m.querySelector('#palette-list');
      var sel = 0;
      var filtered = paletteActions.slice();
      function draw() {
        list.innerHTML = '';
        filtered.forEach(function (a, i) {
          var li = document.createElement('li');
          if (i === sel) li.classList.add('sel');
          var name = document.createElement('span');
          name.textContent = a.label;
          var k = document.createElement('span');
          k.className = 'k';
          k.textContent = a.hint;
          li.appendChild(name); li.appendChild(k);
          li.addEventListener('click', function () { closeModal(); a.run(); });
          list.appendChild(li);
        });
      }
      q.addEventListener('input', function () {
        var v = q.value.toLowerCase();
        filtered = paletteActions.filter(function (a) { return a.label.toLowerCase().indexOf(v) !== -1; });
        sel = 0;
        draw();
      });
      q.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(filtered.length - 1, sel + 1); draw(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
        else if (e.key === 'Enter') { e.preventDefault(); var a = filtered[sel]; if (a) { closeModal(); a.run(); } }
      });
      draw();
      setTimeout(function () { q.focus(); }, 0);
    });
  }

  // ---------- boot ----------
  window.addEventListener('beforeunload', function (e) {
    if (state.dirty || state.yamlEdited) { e.preventDefault(); e.returnValue = ''; }
  });
  yamlArea.addEventListener('input', function () {
    if (!state.yamlMode) return;
    state.yamlEdited = yamlArea.value !== state.yamlText;
    updateGutter();
    updateSaveBtn();
  });
  try { if (localStorage.getItem('rk-hint-seen')) hintEl.classList.add('gone'); } catch (e) {}

  api('/api/model').then(function (r) {
    if (!r.body || !r.body.graph) {
      statusEl.textContent = S.bootFailed;
      statusEl.className = 'status err';
      saveBtn.disabled = true;
      showProblems((r.body && r.body.errors) || [S.networkError], []);
      return;
    }
    state.graph = r.body.graph;
    state.config = r.body.config || {};
    state.agents = r.body.agents || [];
    state.yamlText = r.body.yamlText;
    yamlArea.value = r.body.yamlText;
    document.getElementById('core-path').textContent = r.body.coreDir;
    updateGutter();
    if (r.body.errors && r.body.errors.length) {
      statusEl.textContent = S.invalidGraph;
      statusEl.className = 'status err';
      showProblems(r.body.errors, r.body.warnings, r.body.issues);
    } else {
      statusEl.textContent = S.validGraph;
      statusEl.className = 'status ok';
      showProblems([], r.body.warnings, r.body.issues);
    }
    (r.body.drift || []).forEach(function (d) { toast(d, 'warn'); });
    setYamlMode(false);
    render(); inspect(); fitView();
  });
})();
`;

function studioPage() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>(function(){try{var t=localStorage.getItem('rk-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}})();</script>
<title>rensei studio</title>
<style>${TOKENS}${PAGE_CSS}${graphCss}</style>
</head>
<body>
${CONTRACT}
<div class="topbar">
  <div class="brand">
    <h1>rensei <span class="kanji">錬成</span> studio</h1>
    <span class="path" id="core-path"></span>
  </div>
  <span class="status" id="status" role="status">${STRINGS.statusLoading}</span>
  <span class="spacer"></span>
  <button id="add-node">${STRINGS.addNode}</button>
  <button id="add-edge">${STRINGS.addEdge}</button>
  <button id="reset-layout" title="${STRINGS.resetLayoutTitle}">${STRINGS.resetLayout}</button>
  <button id="fit-view">${STRINGS.fitView}</button>
  <span class="zoom-readout" id="zoom-readout" aria-hidden="true">100%</span>
  <button id="kata-btn" title="${STRINGS.kataBtnTitle}">${STRINGS.kataBtn}</button>
  <button id="export-svg" title="${STRINGS.exportSvgTitle}">SVG</button>
  <button id="export-png" title="${STRINGS.exportPngTitle}">PNG</button>
  <button id="theme-toggle"></button>
  <button id="inspector-toggle" title="${STRINGS.inspectorToggleTitle}">${STRINGS.inspectorToggle}</button>
  <span class="sep"></span>
  <button id="yaml-toggle">YAML</button>
  <button id="save-btn" class="primary" title="${STRINGS.saveTitle}">${STRINGS.save}</button>
</div>
<div class="main">
  <div class="canvas" id="canvas">
    <div class="canvas-inner" id="canvas-inner"></div>
    <div class="canvas-veil" id="canvas-veil"></div>
    <div class="messages" id="messages" aria-live="polite"></div>
    <div class="minimap" id="minimap" title="minimap — click to navigate"></div>
    <div class="hint" id="hint">${STRINGS.hint}</div>
  </div>
  <aside class="inspector" id="inspector"></aside>
</div>
<div class="modal-root" id="modal-root"></div>
<div class="yaml-drawer" id="yaml-drawer">
  <div class="yaml-head">
    <h2>rensei.graph.yaml</h2>
    <span class="yaml-state" id="yaml-state">${STRINGS.yamlReadonly}</span>
    <span style="flex:1"></span>
    <button id="yaml-edit">${STRINGS.yamlEdit}</button>
    <button id="yaml-preview" style="display:none">${STRINGS.yamlApply}</button>
    <button id="yaml-discard" style="display:none">${STRINGS.yamlDiscard}</button>
  </div>
  <div class="yaml-editor">
    <pre class="yaml-gutter" id="yaml-gutter" aria-hidden="true"></pre>
    <textarea id="yaml-area" spellcheck="false" readonly aria-label="rensei.graph.yaml source"></textarea>
  </div>
</div>
<script src="/graph-render.js"></script>
<script>${PAGE_JS}</script>
</body>
</html>
`;
}

module.exports = { studioPage };
