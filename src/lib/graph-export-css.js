// Concrete --rk-* token values for STANDALONE exports (SVG file, PNG
// rasterization). Inside the studio/diagram pages the tokens come from the
// page CSS; outside them the vars are undefined and every fill falls back to
// black — the "black blob" export. These blocks restore the component look.

// Safety: match the root element itself too (:root = the <svg> in a standalone
// SVG document), so tokens resolve even if the class is missing somewhere.
const wrap = body => `.rk-graph, :root {\n${body.split('\n').slice(1).join('\n')}\n}`;

const LIGHT = wrap(`.rk-graph {
  --rk-ground: #f4f5f7; --rk-ink: #23262b; --rk-muted: #6e7480;
  --rk-node-bg: #ffffff; --rk-node-border: #dee1e7; --rk-inset: #f4f5f7; --rk-band: #eff1f6; --rk-grid: #d3d7de;
  --rk-accent: #5e6ad2; --rk-accent-strong: #4f5bc4; --rk-accent-soft: #e9ebfa; --rk-on-accent: #ffffff;
  --rk-edge: #6e7a88; --rk-back: #9a5808; --rk-back-soft: #fdf0da; --rk-skip: #6d51b8; --rk-skip-soft: #f0ebfa;
  --rk-pill-bg: #ffffff; --rk-pill-border: #e2e4e9; --rk-pill-ink: #5a616e; --rk-select: #5e6ad2;
}`);

const DARK = wrap(`.rk-graph {
  --rk-ground: #0e1013; --rk-ink: #e6e8eb; --rk-muted: #8f96a1;
  --rk-node-bg: #191d23; --rk-node-border: #2b313b; --rk-inset: #0f1216; --rk-band: #262c36; --rk-grid: #262c35;
  --rk-accent: #8a90ee; --rk-accent-strong: #a6abf2; --rk-accent-soft: #272c4e; --rk-on-accent: #ffffff;
  --rk-edge: #5c6572; --rk-back: #e5a048; --rk-back-soft: #38291a; --rk-skip: #ab90e3; --rk-skip-soft: #2c2547;
  --rk-pill-bg: #15181d; --rk-pill-border: #262b33; --rk-pill-ink: #9aa3b2; --rk-select: #8a90ee;
}`);

// light by default, dark when the viewer prefers it
const AUTO = LIGHT + '\n@media (prefers-color-scheme: dark) { ' + DARK + ' }';

const COLORS = {
  light: { ground: '#f4f5f7', ink: '#23262b', accent: '#5e6ad2' },
  dark: { ground: '#0e1013', ink: '#e6e8eb', accent: '#8a90ee' },
};

module.exports = { LIGHT, DARK, AUTO, COLORS };
