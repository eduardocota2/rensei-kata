// Static HTML diagram generated from rensei.graph.yaml at build time.
// The SVG itself comes from graph-render.js (shared with the studio editor).
const { renderSvg } = require('./graph-render');
const graphCss = require('./graph-css');
const exportCss = require('./graph-export-css');
const { resolveVar } = require('./util');

const CONTRACT = `<!--
DIRECTION CONTRACT · rensei studio + graph.html
THESIS: the category standard at full fidelity — the tool panel a dev already trusts, executed so precisely that the graph itself becomes the brand. Refuses the roll's worlds and any smuggled quirk.
OWN-WORLD: Linear / VS Code / Raycast grammar — restrained neutrals, one indigo accent, 6px radii, 1px borders, Inter-class system type at tool density, amber reserved for loop-back semantics. Dual light/dark, explicit data-theme override.
STORY: a developer opens the bench and sees the whole loop fit-to-view; every edit, save, and validation state reads instantly; nothing decorates the data.
FIRST VIEWPORT: 42px brand bar with 錬成 accent and status pill; canvas with the loop centered; right inspector of dense labeled fields; YAML cut-list drawer closed below.
FORM: canon — the standing exit chosen by the user over seed 08d19a9d (roll #4 + 3 challengers). Referents: Linear, VS Code, Raycast.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

const THEME_CSS = `
:root {
  --bg: #f4f5f7; --panel: #ffffff; --elevated: #fafbfc; --inset: #f4f5f7;
  --ink: #23262b; --muted: #616874; --faint: #656e7a;
  --border: #e2e4e9; --border-strong: #cfd3da;
  --accent: #5e6ad2; --accent-strong: #4f5bc4; --accent-soft: rgba(94,106,210,.12); --on-accent: #ffffff;
  --accent-fill: #5e6ad2; --accent-fill-strong: #4f5bc4;
  --rk-ground: #f4f5f7; --rk-ink: #23262b; --rk-muted: #6e7480;
  --rk-node-bg: #ffffff; --rk-node-border: #dee1e7; --rk-inset: #f4f5f7; --rk-band: #eff1f6; --rk-grid: #d3d7de;
  --rk-accent: #5e6ad2; --rk-accent-strong: #4f5bc4; --rk-accent-soft: #e9ebfa; --rk-on-accent: #ffffff;
  --rk-edge: #6e7a88;
  --rk-back: #9a5808; --rk-back-soft: #fdf0da;
  --rk-skip: #6d51b8; --rk-skip-soft: #f0ebfa;
  --rk-pill-bg: #ffffff; --rk-pill-border: #e2e4e9; --rk-pill-ink: #5a616e;
  --rk-select: #5e6ad2;
  --table-border: #e2e4e9;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0e1013; --panel: #15181d; --elevated: #1a1e24; --inset: #0f1216;
    --ink: #e6e8eb; --muted: #8f96a1; --faint: #6b7280;
    --border: #262b33; --border-strong: #353b46;
    --accent: #8a90ee; --accent-strong: #9ba0f2; --accent-soft: rgba(138,144,238,.16); --on-accent: #ffffff;
    --accent-fill: #5e6ad2; --accent-fill-strong: #555dd6;
    --warn: #f2c94c;
    --rk-ground: #0e1013; --rk-ink: #e6e8eb; --rk-muted: #8f96a1;
    --rk-node-bg: #191d23; --rk-node-border: #2b313b; --rk-inset: #0f1216; --rk-band: #262c36; --rk-grid: #262c35;
    --rk-accent: #8a90ee; --rk-accent-strong: #a6abf2; --rk-accent-soft: #272c4e; --rk-on-accent: #ffffff;
    --rk-edge: #5c6572;
    --rk-back: #e5a048; --rk-back-soft: #38291a;
    --rk-skip: #ab90e3; --rk-skip-soft: #2c2547;
    --rk-pill-bg: #15181d; --rk-pill-border: #262b33; --rk-pill-ink: #9aa3b2;
    --rk-select: #8a90ee;
    --table-border: #262b33;
  }
}
:root[data-theme="dark"] {
  --bg: #0e1013; --panel: #15181d; --elevated: #1a1e24; --inset: #0f1216;
  --ink: #e6e8eb; --muted: #8f96a1; --faint: #6b7280;
  --border: #262b33; --border-strong: #353b46;
  --accent: #8a90ee; --accent-strong: #9ba0f2; --accent-soft: rgba(138,144,238,.16); --on-accent: #ffffff;
  --accent-fill: #5e6ad2; --accent-fill-strong: #555dd6;
  --warn: #f2c94c;
  --rk-ground: #0e1013; --rk-ink: #e6e8eb; --rk-muted: #8f96a1;
  --rk-node-bg: #191d23; --rk-node-border: #2b313b; --rk-inset: #0f1216; --rk-band: #262c36; --rk-grid: #262c35;
  --rk-accent: #8a90ee; --rk-accent-strong: #a6abf2; --rk-accent-soft: #272c4e; --rk-on-accent: #ffffff;
  --rk-edge: #5c6572;
  --rk-back: #e5a048; --rk-back-soft: #38291a;
  --rk-skip: #ab90e3; --rk-skip-soft: #2c2547;
  --rk-pill-bg: #15181d; --rk-pill-border: #262b33; --rk-pill-ink: #9aa3b2;
  --rk-select: #8a90ee;
  --table-border: #262b33;
}
* { box-sizing: border-box; }
body {
  background: var(--bg); color: var(--ink);
  font-family: "Inter", ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  margin: 0; padding: 2rem clamp(1rem, 4vw, 3rem); line-height: 1.5; font-size: 14px;
  -webkit-font-smoothing: antialiased;
}
* { scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent; }
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-thumb { background: var(--border-strong); border: 3px solid transparent; background-clip: content-box; border-radius: 8px; }
*::-webkit-scrollbar-track { background: transparent; }
header { max-width: 72ch; }
h1 { font-size: 1.35rem; margin: 0 0 .3rem; letter-spacing: .01em; font-weight: 650; }
h1 .kanji { color: var(--rk-accent); }
.sub { color: var(--muted); margin: 0 0 1.5rem; font-size: .85rem; }
figure { margin: 0 0 1rem; }
figcaption { color: var(--muted); font-size: .8rem; margin-top: .5rem; max-width: 72ch; }
.scroll { overflow-x: auto; padding-bottom: 1rem; }
.scroll .rk-graph { max-width: 100%; height: auto; }
.theme-btn {
  position: fixed; right: 1rem; bottom: 1rem; z-index: 5;
  font: inherit; font-size: .72rem; color: var(--ink); background: var(--panel);
  border: 1px solid var(--border); border-radius: 6px; padding: .3rem .6rem; cursor: pointer;
  box-shadow: 0 2px 8px rgb(0 0 0 / .08);
}
.legend { display: flex; flex-wrap: wrap; gap: 1.25rem; margin: 1rem 0 2rem; font-size: .78rem; color: var(--muted); }
.legend span { display: inline-flex; align-items: center; gap: .4rem; }
.swatch { width: 22px; height: 0; border-top: 2px solid var(--rk-edge); }
.swatch.back { border-top: 2px dashed var(--rk-back); }
.swatch.skip { border-top: 2px dotted var(--rk-skip); }
.swatch.entry { width: 13px; height: 13px; border: 2px solid var(--rk-accent); border-radius: 4px; }
h2 { font-size: .95rem; margin: 2rem 0 .75rem; font-weight: 650; }
.tablewrap { overflow-x: auto; max-width: 60rem; }
table { border-collapse: collapse; width: 100%; font-size: .82rem; }
th, td { text-align: left; padding: .45rem .8rem; border-bottom: 1px solid var(--table-border); }
th { color: var(--muted); font-weight: 600; font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; }
.max { color: var(--rk-back); font-weight: 600; }
footer { margin-top: 2.5rem; color: var(--faint); font-size: .75rem; font-variant-numeric: tabular-nums; }
code { font-size: .85em; background: var(--inset); border: 1px solid var(--border); border-radius: 4px; padding: .08em .35em; font-family: "Cascadia Code", "JetBrains Mono", ui-monospace, Consolas, monospace; }
`;

function renderDiagram(core) {
  const { graph, config } = core;
  const { markup } = renderSvg(graph, config);

  const gateRows = (graph.edges || [])
    .filter(e => e.when)
    .map(e => {
      const max = e.max !== undefined ? ` <span class="max">max ${resolveVar(e.max, config)}×</span>` : '';
      return `<tr><td>${e.from} → ${e.to}</td><td>${e.when}${max}</td></tr>`;
    }).join('\n');

  const EXPORT_JS = `
(function () {
  function cssForSvg() {
    // page styles carry the tokens; standalone exports ALSO inline the
    // concrete values — without them every var(--rk-*) is undefined outside
    // the page and the SVG renders as a black blob
    var tokens = ${JSON.stringify(exportCss.AUTO)};
    var css = tokens + '\\n';
    var sheets = document.querySelectorAll('style');
    for (var i = 0; i < sheets.length; i++) css += sheets[i].textContent + '\\n';
    return css;
  }
  function standaloneSvg() {
    var el = document.querySelector('svg.rk-graph');
    if (!el) return null;
    var clone = el.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    var w = el.viewBox.baseVal.width || el.clientWidth;
    var h = el.viewBox.baseVal.height || el.clientHeight;
    clone.setAttribute('width', w); clone.setAttribute('height', h);
    var style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = cssForSvg();
    clone.insertBefore(style, clone.firstChild);
    return '<?xml version="1.0" encoding="UTF-8"?>\\n' + new XMLSerializer().serializeToString(clone);
  }
  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function bg() {
    return getComputedStyle(document.documentElement).getPropertyValue('--rk-ground').trim() || '#ffffff';
  }
  document.getElementById('export-svg').addEventListener('click', function () {
    var svg = standaloneSvg();
    if (svg) download(new Blob([svg], { type: 'image/svg+xml' }), 'rensei-graph.svg');
  });
  document.getElementById('export-png').addEventListener('click', function () {
    var svg = standaloneSvg();
    if (!svg) return;
    var blob = new Blob([svg], { type: 'image/svg+xml' });
    var url = URL.createObjectURL(blob);
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = img.width * 2; c.height = img.height * 2;
      var ctx = c.getContext('2d');
      ctx.fillStyle = bg();
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(function (b) { if (b) download(b, 'rensei-graph.png'); }, 'image/png');
    };
    img.src = url;
  });
})();
`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>(function(){try{var t=localStorage.getItem('rk-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}})();</script>
<title>rensei graph</title>
<style>${THEME_CSS}${graphCss}</style>
</head>
<body>
${CONTRACT}
<header>
  <h1>rensei <span class="kanji">錬成</span> — loop graph</h1>
  <p class="sub">Generated from <code>.rensei/rensei.graph.yaml</code>. Want to edit it? <code>npx rensei-kata studio</code> — bidirectional visual ⇄ YAML editor.</p>
</header>
<div class="legend">
  <span><span class="swatch entry"></span> entry point</span>
  <span><span class="swatch"></span> transition</span>
  <span><span class="swatch back"></span> correction loop</span>
  <span><span class="swatch skip"></span> merge / skip</span>
  <span class="exports"><button id="export-svg" class="theme-btn" style="position:static">SVG</button> <button id="export-png" class="theme-btn" style="position:static">PNG</button></span>
</div>
<div class="scroll">
<figure>
${markup}
<figcaption>The full rensei loop: each node is a phase with its agent, model and effort; each arrow carries its quality-gate condition. The dashed orange arrow is the (bounded) correction loop.</figcaption>
</figure>
</div>
<h2>Quality gates</h2>
<div class="tablewrap">
<table>
<thead><tr><th>Transition</th><th>Condition</th></tr></thead>
<tbody>
${gateRows}
</tbody>
</table>
</div>
<footer>rensei-kata · graph v${graph.version} · ${Object.keys(graph.nodes).length} nodes · ${(graph.edges || []).length} transitions</footer>
<button id="theme-toggle" class="theme-btn">theme: auto</button>
<script>${EXPORT_JS}</script>
<script>(function(){var b=document.getElementById('theme-toggle');function m(){try{return localStorage.getItem('rk-theme')||'auto'}catch(e){return'auto'}}function a(x){if(x==='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=x;b.textContent='theme: '+x}b.addEventListener('click',function(){var n={auto:'light',light:'dark',dark:'auto'}[m()];try{localStorage.setItem('rk-theme',n)}catch(e){}a(n)});a(m())})();</script>
</body>
</html>
`;
}

module.exports = { renderDiagram };
