// Shared CSS for the rensei graph SVG (component language v4) — used by the
// static diagram page and the studio editor. Token-driven: each page defines
// the --rk-* properties for its light/dark themes.
module.exports = `
.rk-graph { display: block; }
.rk-graph .bg { fill: var(--rk-ground, #f4f5f7); }
.rk-graph .grid-dot { fill: var(--rk-grid, var(--rk-node-border)); opacity: .8; }
.rk-graph .arrow-fill { fill: var(--rk-edge); }
.rk-graph .arrow-fill-back { fill: var(--rk-back); }
.rk-graph .arrow-fill-skip { fill: var(--rk-skip); }

/* node card: header band over body */
.rk-graph .node .card {
  fill: var(--rk-node-bg);
  stroke: var(--rk-node-border);
  stroke-width: 1;
  filter: url(#rkShadow);
}
.rk-graph .node .band { fill: var(--rk-band); }
.rk-graph .node .band-rule { stroke: var(--rk-node-border); stroke-width: 1; }
.rk-graph .node.entry .card { stroke: var(--rk-accent); stroke-width: 1.5; }
.rk-graph .node.entry .band { fill: var(--rk-accent); }
.rk-graph .node.entry .band-rule { stroke: var(--rk-accent); }
.rk-graph .node.entry .node-label, .rk-graph .node.entry .seq-glyph { fill: var(--rk-on-accent); }
.rk-graph .node.entry .node-flag { fill: var(--rk-on-accent); opacity: .75; }
.rk-graph .node.optional .card { stroke-dasharray: 4 4; }
.rk-graph .seq-chip-rect { fill: var(--rk-accent-soft); stroke: var(--rk-accent); stroke-width: 1; }
.rk-graph .node.entry .seq-chip-rect { fill: var(--rk-accent); }
.rk-graph .seq-num {
  font-size: 10px; font-weight: 700; fill: var(--rk-accent-strong, var(--rk-accent));
  font-variant-numeric: tabular-nums; text-anchor: middle;
}
.rk-graph .seq-glyph { fill: var(--rk-accent); }
.rk-graph .node-label {
  font-size: 11.5px; font-weight: 650; fill: var(--rk-ink);
  letter-spacing: .07em; text-transform: uppercase;
}
.rk-graph .node-flag {
  font-size: 9.5px; font-weight: 700; letter-spacing: .08em; fill: var(--rk-muted);
}
.rk-graph .node-flag.entry { fill: var(--rk-accent); }
.rk-graph .node-agent { font-size: 13px; font-weight: 600; fill: var(--rk-accent); }
.rk-graph .node-summary { font-size: 10px; fill: var(--rk-muted); }
.rk-graph .meta-chip rect { fill: var(--rk-inset); stroke: var(--rk-node-border); stroke-width: 1; }
.rk-graph .meta-chip text { font-size: 10px; fill: var(--rk-muted); font-variant-numeric: tabular-nums; }

/* ports — all four exist on interactive surfaces; attached ones stay visible,
   the rest appear on hover or in connect mode (they are drag handles) */
.rk-graph .port { fill: var(--rk-edge); }
.rk-graph [data-node] .port { opacity: 0; pointer-events: none; }
.rk-graph [data-node] .port.attached { opacity: 1; pointer-events: all; cursor: crosshair; }
.rk-graph [data-node]:hover .port { opacity: 1; pointer-events: all; cursor: crosshair; fill: var(--rk-select); }
.rk-graph .terminal .port { fill: var(--rk-accent); }
.rk-graph [data-node].drop-target .card, .rk-graph [data-node].drop-target .stadium {
  stroke: var(--rk-select); stroke-width: 2.5;
}
.rk-graph .edge-handle {
  fill: var(--rk-pill-bg); stroke: var(--rk-select); stroke-width: 2; cursor: grab;
}
.rk-graph .edge-handle:hover { fill: var(--rk-select); }
.rk-graph .rubber-edge {
  fill: none; stroke: var(--rk-select); stroke-width: 1.75;
  stroke-dasharray: 6 4; pointer-events: none;
}

/* terminal */
.rk-graph .terminal .stadium { fill: var(--rk-accent); filter: url(#rkShadow); }
.rk-graph .terminal .check {
  fill: none; stroke: var(--rk-on-accent); stroke-width: 2.5;
  stroke-linecap: round; stroke-linejoin: round;
}
.rk-graph .terminal-label {
  fill: var(--rk-on-accent); font-weight: 700; font-size: 11.5px; letter-spacing: .1em;
}

/* edges */
.rk-graph .edge { fill: none; stroke: var(--rk-edge); stroke-width: 1.75; }
.rk-graph .edge.back { stroke: var(--rk-back); stroke-width: 2; stroke-dasharray: 7 4; }
.rk-graph .edge.skip { stroke: var(--rk-skip); stroke-width: 1.75; stroke-dasharray: 2.5 3.5; }

/* gate-condition pills — colored by the edge they annotate; a dotted leader
   ties each pill to its own arrow so ownership reads at a glance */
.rk-graph .label-pill { pointer-events: none; }
.rk-graph .label-pill rect { fill: var(--rk-pill-bg); stroke: var(--rk-edge); stroke-width: 1; }
.rk-graph .label-pill text { font-size: 10px; fill: var(--rk-edge); font-weight: 550; font-variant-numeric: tabular-nums; }
.rk-graph .label-pill .label-lead { stroke: var(--rk-edge); stroke-width: 1; stroke-dasharray: 2 2; opacity: .8; }
.rk-graph .label-pill.back rect { fill: var(--rk-back-soft); stroke: var(--rk-back); }
.rk-graph .label-pill.back text { fill: var(--rk-back); font-weight: 600; }
.rk-graph .label-pill.back .label-lead { stroke: var(--rk-back); }
.rk-graph .label-pill.skip rect { fill: var(--rk-skip-soft); stroke: var(--rk-skip); }
.rk-graph .label-pill.skip text { fill: var(--rk-skip); }
.rk-graph .label-pill.skip .label-lead { stroke: var(--rk-skip); }

/* studio interactivity */
.rk-graph .hit { fill: none; stroke: transparent; stroke-width: 16; pointer-events: stroke; }
.rk-graph [data-node], .rk-graph [data-edge] { cursor: pointer; }
.rk-graph [data-node].dragging { cursor: grabbing; }
.rk-graph [data-node].dragging .card, .rk-graph [data-node].dragging .stadium { stroke: var(--rk-select); stroke-width: 2; }
.rk-graph [data-node]:hover .card, .rk-graph [data-node]:hover .stadium { stroke: var(--rk-select); }
.rk-graph [data-node].selected .card, .rk-graph [data-node].selected .stadium { stroke: var(--rk-select); stroke-width: 2.5; }
.rk-graph [data-node].selected { filter: drop-shadow(0 0 5px color-mix(in srgb, var(--rk-select) 35%, transparent)); }
.rk-graph [data-edge]:hover .edge, .rk-graph [data-edge].selected .edge { stroke: var(--rk-select); stroke-width: 2.5; }
.rk-graph [data-node]:focus-visible .card, .rk-graph [data-edge]:focus-visible .edge { stroke: var(--rk-select); stroke-width: 2.5; }
`;
