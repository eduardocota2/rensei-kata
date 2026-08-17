// Shared graph layout + SVG renderer. Runs in Node (require) and in the
// browser (window.RenseiGraph) — single implementation, no duplication.
// Pure: no Node APIs, no DOM. renderSvg returns SVG markup.
//
// Component language (v4):
//   · serpentine spine — the happy path wraps into rows (boustrophedon)
//   · lanes — lane:"above" floats optional branches, lane:"below" drops rework
//   · node = header band (sequence + phase + flag) over a body (agent + chips)
//   · ports are drawn ONLY where a transition actually attaches
//   · the bounded loop returns through a right-margin channel
//   · color is semantics — loop edges amber, merges violet, spine slate
//   · dot-grid ground; manual overrides via graph.positions (studio drag)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RenseiGraph = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const NODE_W = 216;
  const NODE_H = 98;
  const BAND_H = 30;
  const COL_GAP = 100;
  const ROW_GAP = 100;
  const LANE_GAP = 56;
  const PAD = 60;
  const CORNER = 14;
  const DONE_W = 132;
  const DONE_H = 44;
  const LABEL_MAX = 42;
  const NODE_LABEL_MAX = 22;
  const SUMMARY_MAX = 34;

  // --- structure -------------------------------------------------------------
  function visitOrder(graph) {
    const order = [];
    const backEdges = new Set();
    const visited = new Set();
    const inStack = new Set(); // only edges to an ANCESTOR close a cycle;
    // edges to already-finished nodes are merges, not loops
    (function dfs(name) {
      if (!name || visited.has(name)) return;
      visited.add(name);
      inStack.add(name);
      order.push(name);
      (graph.edges || []).forEach(function (e) {
        if (e.from !== name) return;
        if (visited.has(e.to)) {
          if (inStack.has(e.to)) backEdges.add(e);
        } else {
          dfs(e.to);
        }
      });
      inStack.delete(name);
    })(graph.entry && graph.nodes[graph.entry] ? graph.entry : Object.keys(graph.nodes)[0]);
    Object.keys(graph.nodes).forEach(n => { if (!visited.has(n)) order.push(n); });
    return { order, backEdges };
  }

  function sequence(graph) {
    const { order } = visitOrder(graph);
    const seq = {};
    order.forEach((n, i) => { seq[n] = i + 1; });
    return seq;
  }

  const laneOf = (graph, n) => {
    const l = graph.nodes[n] && graph.nodes[n].lane;
    return l === 'above' ? -1 : l === 'below' ? 1 : 0;
  };

  function sizeOf(graph, n) {
    const node = graph.nodes[n];
    if (node && node.terminal) {
      const label = String(node.label || 'DONE');
      return { w: Math.max(DONE_W, 66 + trunc(label, 18).length * 7.4), h: DONE_H };
    }
    return { w: NODE_W, h: NODE_H };
  }

  // --- layout -----------------------------------------------------------------
  function layout(graph) {
    const { order, backEdges } = visitOrder(graph);
    const hasEdge = {};
    (graph.edges || []).forEach(e => { hasEdge[e.from] = hasEdge[e.to] = true; });
    const isOrphan = n => !hasEdge[n];
    // orphans (no transitions yet) never join the serpentine — they stage below
    // the graph instead of silently reordering the flow when added
    const spine = order.filter(n => laneOf(graph, n) === 0 && !isOrphan(n));
    const wrap = spine.length > 6 ? Math.ceil(spine.length / 2) : spine.length;

    const spineRow = {}, spineCol = {};
    spine.forEach((name, i) => {
      const row = Math.floor(i / wrap);
      const idx = i % wrap;
      spineRow[name] = row;
      spineCol[name] = row % 2 === 0 ? idx : wrap - 1 - idx;
    });

    const rowY = row => PAD + (NODE_H + LANE_GAP) + row * (NODE_H + ROW_GAP);
    const colX = col => PAD + col * (NODE_W + COL_GAP);

    const manual = graph.positions || {};
    // the canvas is unbounded: manual positions may go negative — the viewBox
    // adapts (minX/minY), so dragging past the top-left grows the canvas
    // exactly like dragging past the bottom-right always did
    const validManual = p => p && isFinite(p.x) && isFinite(p.y) && Math.abs(p.x) < 100000 && Math.abs(p.y) < 100000;
    const pos = {};

    spine.forEach(function (name) {
      let x = colX(spineCol[name]);
      let y = rowY(spineRow[name]);
      const s = sizeOf(graph, name);
      if (s.h !== NODE_H) y += (NODE_H - s.h) / 2;
      pos[name] = validManual(manual[name]) ? { x: manual[name].x, y: manual[name].y } : { x, y };
    });

    order.filter(n => laneOf(graph, n) !== 0).forEach(function (name) {
      if (validManual(manual[name])) { pos[name] = { x: manual[name].x, y: manual[name].y }; return; }
      const lane = laneOf(graph, name);
      const incoming = (graph.edges || []).find(e => e.to === name && spineRow[e.from] !== undefined);
      const parent = incoming ? incoming.from : spine[0];
      const successor = spine[spine.indexOf(parent) + 1];
      let x;
      if (lane === -1 && successor && spineRow[successor] === spineRow[parent]) {
        x = (colX(spineCol[parent]) + colX(spineCol[successor])) / 2 + (NODE_W - sizeOf(graph, name).w) / 2;
      } else {
        x = colX(spineCol[parent]);
      }
      const y = lane === -1
        ? rowY(spineRow[parent]) - LANE_GAP - NODE_H
        : rowY(spineRow[parent]) + NODE_H + LANE_GAP;
      pos[name] = { x, y };
    });

    // orphans: manual positions honoured; the rest stage in a row below the graph
    let stageY = PAD;
    Object.keys(pos).forEach(n => { stageY = Math.max(stageY, pos[n].y + sizeOf(graph, n).h); });
    let staged = 0;
    order.filter(n => laneOf(graph, n) === 0 && isOrphan(n)).forEach(function (name) {
      if (validManual(manual[name])) { pos[name] = { x: manual[name].x, y: manual[name].y }; return; }
      pos[name] = { x: PAD + staged++ * (NODE_W + 24), y: stageY + 40 };
    });

    // bounds over RENDERED positions (auto + manual, negatives included) —
    // these drive the viewBox, so the graph is always fully visible
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    Object.keys(pos).forEach(function (n) {
      minX = Math.min(minX, pos[n].x);
      minY = Math.min(minY, pos[n].y);
      maxX = Math.max(maxX, pos[n].x + sizeOf(graph, n).w);
      maxY = Math.max(maxY, pos[n].y + NODE_H);
    });
    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 100; maxY = 100; }
    const bx0 = minX - PAD, by0 = minY - PAD;
    return {
      pos, backEdges, spine, spineRow, spineCol, wrap,
      minX: bx0, minY: by0, maxX, maxY,
      width: maxX - bx0 + PAD + 96,
      height: maxY - by0 + PAD + 90,
    };
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resolveVar(value, config) {
    if (typeof value !== 'string' || value.charAt(0) !== '$') return value;
    let v = config;
    value.slice(1).split('.').forEach(function (p) { v = v == null ? undefined : v[p]; });
    return v === undefined ? value : v;
  }

  function orthoPath(points, r) {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1], p1 = points[i], p2 = points[i + 1];
      const v1x = Math.sign(p1.x - p0.x), v1y = Math.sign(p1.y - p0.y);
      const v2x = Math.sign(p2.x - p1.x), v2y = Math.sign(p2.y - p1.y);
      const rr = Math.min(r, Math.hypot(p1.x - p0.x, p1.y - p0.y) / 2, Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2);
      d += ` L ${p1.x - v1x * rr} ${p1.y - v1y * rr} Q ${p1.x} ${p1.y} ${p1.x + v2x * rr} ${p1.y + v2y * rr}`;
    }
    const last = points[points.length - 1];
    return d + ` L ${last.x} ${last.y}`;
  }

  function trunc(s, max) {
    s = String(s);
    const n = max || LABEL_MAX;
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function labelPill(cx, cy, text, cls, anchor) {
    // display text is truncated; the full condition rides in <title> (hover).
    // anchor {ax, ay} = on-path point: a short dotted leader ties the pill
    // to ITS arrow — same color as the edge class — so ownership reads at a glance
    const w = trunc(text).length * 5.8 + 16;
    const h = 17;
    let lead = '';
    if (anchor && isFinite(anchor.ax) && isFinite(anchor.ay)) {
      const dx = anchor.ax - cx, dy = anchor.ay - cy;
      if (Math.hypot(dx, dy) > 3) {
        // land on the pill edge nearest to the anchor
        const ex = Math.abs(dx) > w / 2 ? cx + Math.sign(dx) * w / 2 : cx;
        const ey = Math.abs(dy) > h / 2 ? cy + Math.sign(dy) * h / 2 : cy;
        lead = `<line class="label-lead" x1="${ex}" y1="${ey}" x2="${anchor.ax}" y2="${anchor.ay}"/>`;
      }
    }
    return (
      `<g class="label-pill ${cls || ''}">` +
      `<title>${esc(text)}</title>` +
      lead +
      `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${h / 2}"/>` +
      `<text x="${cx}" y="${cy + 3.5}" text-anchor="middle">${esc(trunc(text))}</text>` +
      `</g>`
    );
  }

  function metaChip(x, y, text) {
    const w = String(text).length * 5.6 + 14;
    return {
      w,
      markup:
        `<g class="meta-chip">` +
        `<rect x="${x}" y="${y}" width="${w}" height="16" rx="4"/>` +
        `<text x="${x + w / 2}" y="${y + 11.5}" text-anchor="middle">${esc(text)}</text>` +
        `</g>`,
    };
  }

  // --- render ------------------------------------------------------------------
  // midpoint of a polyline + orientation of the segment it lands on — pills
  // anchor to the routed path, never to a cached row coordinate. frac lets the
  // caller probe other spots along the path (label collision avoidance).
  function pathAnchor(pts, frac) {
    const f = frac === undefined ? 0.5 : frac;
    let total = 0;
    const segs = [];
    for (let i = 1; i < pts.length; i++) {
      const len = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      segs.push(len); total += len;
    }
    let want = total * f;
    for (let i = 0; i < segs.length; i++) {
      if (want <= segs[i] || i === segs.length - 1) {
        const p0 = pts[i], p1 = pts[i + 1];
        const t = segs[i] ? Math.min(1, want / segs[i]) : 0;
        return {
          x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t,
          horizontal: Math.abs(p1.y - p0.y) <= Math.abs(p1.x - p0.x),
        };
      }
      want -= segs[i];
    }
    return { x: pts[0].x, y: pts[0].y, horizontal: true };
  }

  function renderSvg(graph, config, opts) {
    opts = opts || {};
    const L = layout(graph);
    const seq = sequence(graph);
    const pos = L.pos;
    const onSpine = n => L.spineRow[n] !== undefined;
    const edges = [];
    const nodes = [];
    const pills = [];
    const usedPorts = {}; // name -> Set of 'l'|'r'|'t'|'b' — attached sides
    const edgeEnds = {}; // index -> {a, b} port points — the studio draws rewire handles from these

    function usePort(name, side) {
      (usedPorts[name] = usedPorts[name] || new Set()).add(side);
    }

    const size = n => sizeOf(graph, n);
    const portR = n => ({ x: pos[n].x + size(n).w, y: pos[n].y + size(n).h / 2 });
    const portL = n => ({ x: pos[n].x, y: pos[n].y + size(n).h / 2 });
    const portT = n => ({ x: pos[n].x + size(n).w / 2, y: pos[n].y });
    const portB = n => ({ x: pos[n].x + size(n).w / 2, y: pos[n].y + size(n).h });

    const feedsBranch = n => (graph.edges || []).some(e => e.from === n && !onSpine(e.to));

    // Label placement with collision avoidance: probe spots along the path
    // (center first, then outward) and take the first that clears both node
    // boxes — pills never sit on top of the components they annotate. Returns
    // the on-path anchor too, so a leader line can tie pill to its arrow.
    function labelSpot(text, pts, e) {
      const w = trunc(text).length * 5.8 + 16;
      const h = 17;
      const boxes = [];
      for (const n of [e.from, e.to]) {
        if (!(n in pos)) continue;
        const s = size(n);
        boxes.push({ x: pos[n].x - 6, y: pos[n].y - 6, w: s.w + 12, h: s.h + 12 });
      }
      const hits = (cx, cy) => boxes.some(r =>
        cx + w / 2 > r.x && cx - w / 2 < r.x + r.w && cy + h / 2 > r.y && cy - h / 2 < r.y + r.h);
      for (const frac of [0.5, 0.62, 0.38, 0.7, 0.3, 0.8, 0.2]) {
        const an = pathAnchor(pts, frac);
        const cx = an.horizontal ? an.x : an.x + 14;
        const cy = an.horizontal ? an.y - 14 : an.y;
        if (!hits(cx, cy)) return { x: cx, y: cy, ax: an.x, ay: an.y };
      }
      // nodes very close — float the pill clear above the pair
      const mid = pathAnchor(pts, 0.5);
      return { x: mid.x, y: Math.min(...boxes.map(b => b.y)) - 14, ax: mid.x, ay: mid.y };
    }

    // nearest-port machinery: side midpoints + proximity pick
    const portsOf = n => {
      const p = pos[n], s = size(n);
      return {
        l: { x: p.x, y: p.y + s.h / 2 },
        r: { x: p.x + s.w, y: p.y + s.h / 2 },
        t: { x: p.x + s.w / 2, y: p.y },
        b: { x: p.x + s.w / 2, y: p.y + s.h },
      };
    };
    const centerOf = n => {
      const p = pos[n], s = size(n);
      return { x: p.x + s.w / 2, y: p.y + s.h / 2 };
    };
    const nearestSide = (ports, target) => {
      let best = 'l', d = Infinity;
      for (const k of ['l', 'r', 't', 'b']) {
        const dd = Math.hypot(ports[k].x - target.x, ports[k].y - target.y);
        if (dd < d) { d = dd; best = k; }
      }
      return best;
    };
    // pull the endpoint 7px back along the port normal so the arrowhead
    // lands at the border instead of inside the card
    const endFor = (b, side) => {
      if (side === 'l') return { x: b.x - 7, y: b.y };
      if (side === 'r') return { x: b.x + 7, y: b.y };
      if (side === 't') return { x: b.x, y: b.y - 7 };
      return { x: b.x, y: b.y + 7 };
    };

    // Every edge is a list of waypoints first, a path string second. ENDPOINTS
    // ATTACH AT THE NEAREST PORT: for each end, the side midpoint closest to
    // the other end — so rewiring lands the tail where the arrow actually
    // points, and manual positions never produce backwards stubs.
    (graph.edges || []).forEach(function (e, i) {
      if (!(e.from in pos) || !(e.to in pos)) return;
      const inter = opts.interactive ? ` data-edge="${i}" tabindex="0" role="button" aria-label="transition ${esc(e.from)} to ${esc(e.to)}"` : '';
      const isLoop = (e.max !== undefined && e.max !== null && e.max !== '') || L.backEdges.has(e);
      const label = [e.when, e.max !== undefined && e.max !== null && e.max !== '' ? '≤' + resolveVar(e.max, config) + '×' : null]
        .filter(Boolean).join(' · ');

      let pts, cls, marker, labelX, labelY, labelAx, labelAy, a, b;

      if (L.backEdges.has(e)) {
        // the correction loop: out the bottom, down to a dip, up the right
        // margin, and back IN THROUGH THE TOP — ports keep their meaning
        // (right/bottom exit, left/top enter) even on the way back
        a = portB(e.from);
        b = portT(e.to);
        const dip = Math.max(a.y, b.y) + 46;
        const margin = L.maxX + 56;
        const aboveY = pos[e.to].y - 30;
        pts = [a, { x: a.x, y: dip }, { x: margin, y: dip }, { x: margin, y: aboveY }, { x: b.x, y: aboveY }, { x: b.x, y: b.y - 7 }];
        cls = ' back'; marker = 'rkArrowBack';
        labelX = (a.x + margin) / 2; labelY = dip; labelAx = labelX; labelAy = dip;
        usePort(e.from, 'b'); usePort(e.to, 't');
      } else {
        const portsA = portsOf(e.from), portsB = portsOf(e.to);
        const sideA = nearestSide(portsA, centerOf(e.to));
        const sideB = nearestSide(portsB, centerOf(e.from));
        a = portsA[sideA];
        b = portsB[sideB];
        usePort(e.from, sideA); usePort(e.to, sideB);

        const skip = feedsBranch(e.from) || !onSpine(e.from) || !onSpine(e.to);
        cls = (isLoop ? ' back' : '') + (skip ? ' skip' : '');
        marker = isLoop ? 'rkArrowBack' : skip ? 'rkArrowSkip' : 'rkArrow';

        const end = endFor(b, sideB);
        const hA = sideA === 'l' || sideA === 'r';
        const hB = sideB === 'l' || sideB === 'r';
        if (Math.abs(a.x - b.x) < 2 || Math.abs(a.y - b.y) < 2) {
          pts = [a, end];
        } else if (hA && hB) {
          const midX = (a.x + b.x) / 2;
          pts = [a, { x: midX, y: a.y }, { x: midX, y: b.y }, end];
        } else if (!hA && !hB) {
          const midY = (a.y + b.y) / 2;
          pts = [a, { x: a.x, y: midY }, { x: b.x, y: midY }, end];
        } else if (hA) {
          pts = [a, { x: b.x, y: a.y }, end];
        } else {
          pts = [a, { x: a.x, y: b.y }, end];
        }
        const lp = labelSpot(label, pts, e);
        labelX = lp.x; labelY = lp.y; labelAx = lp.ax; labelAy = lp.ay;
      }

      edgeEnds[i] = { a, b };
      const d = pts.length > 2
        ? orthoPath(pts, CORNER)
        : `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

      edges.push(
        `<g class="edge-wrap${cls}"${inter}>` +
        `<path class="edge${cls}" d="${d}" marker-end="url(#${marker})"/>` +
        (opts.interactive ? `<path class="hit" d="${d}"/>` : '') +
        `</g>`
      );
      // the pill inherits its arrow's color and leans on it with a leader
      if (label) pills.push(labelPill(labelX, labelY, label, cls.trim().split(' ').pop() || '', { ax: labelAx, ay: labelAy }));
    });

    function portsFor(name, h, w) {
      const sides = usedPorts[name];
      const P = {
        l: { x: pos[name].x, y: pos[name].y + h / 2 },
        r: { x: pos[name].x + w, y: pos[name].y + h / 2 },
        t: { x: pos[name].x + w / 2, y: pos[name].y },
        b: { x: pos[name].x + w / 2, y: pos[name].y + h },
      };
      // interactive: all four ports exist (they are drag handles) — CSS decides
      // which are visible; static documents only get the attached ones
      const keys = opts.interactive ? ['l', 'r', 't', 'b'] : (sides ? [...sides] : []);
      return keys.map(s =>
        `<circle class="port${sides && sides.has(s) ? ' attached' : ''}"${opts.interactive ? ` data-port="${s}"` : ''} cx="${P[s].x}" cy="${P[s].y}" r="4"/>`
      ).join('');
    }

    Object.entries(graph.nodes).forEach(function (pair) {
      const name = pair[0], node = pair[1];
      if (!(name in pos)) return;
      const x = pos[name].x, y = pos[name].y;
      const isEntry = name === graph.entry;
      const inter = label => opts.interactive ? ` data-node="${esc(name)}" tabindex="0" role="button" aria-label="${label}"` : '';

      if (node.terminal) {
        const w = sizeOf(graph, name).w;
        const cy = y + DONE_H / 2;
        nodes.push(
          `<g class="node terminal"${inter(`terminal node ${esc(name)}`)}>` +
          `<rect class="stadium" x="${x}" y="${y}" width="${w}" height="${DONE_H}" rx="${DONE_H / 2}"/>` +
          `<polyline class="check" points="${x + 22},${cy} ${x + 28},${cy + 6} ${x + 36},${cy - 6}"/>` +
          `<text class="terminal-label" x="${x + 48}" y="${cy + 4}">${esc(trunc(node.label || 'DONE', 18).toUpperCase())}</text>` +
          portsFor(name, DONE_H, w) +
          `</g>`
        );
        return;
      }

      const model = (config.MODELS && config.MODELS[node.model]) || node.model || '';
      const effort = (config.EFFORT && config.EFFORT[node.effort]) || node.effort || '';
      const cls = 'node' + (isEntry ? ' entry' : '') + (node.optional ? ' optional' : '');
      const flag = isEntry ? 'ENTRY' : node.optional ? 'OPTIONAL' : null;
      // the label yields to the flag: truncate to the space actually left
      const flagW = flag ? flag.length * 6.8 + 10 : 0;
      const labelMaxChars = Math.max(8, Math.floor((NODE_W - 52 - flagW) / 7.2));

      const chipModel = metaChip(x + 13, y + 76, model);
      const chipEffort = metaChip(x + 13 + chipModel.w + 6, y + 76, effort);

      nodes.push(
        `<g class="${cls}"${inter(`node ${esc(node.label || name)}, agent ${esc(name)}`)}>` +
        `<rect class="card" x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="8"/>` +
        // header band: square bottom, rounded top (card clips it)
        `<path class="band" d="M ${x} ${y + 8} Q ${x} ${y} ${x + 8} ${y} L ${x + NODE_W - 8} ${y} Q ${x + NODE_W} ${y} ${x + NODE_W} ${y + 8} L ${x + NODE_W} ${y + BAND_H} L ${x} ${y + BAND_H} Z"/>` +
        `<line class="band-rule" x1="${x}" y1="${y + BAND_H}" x2="${x + NODE_W}" y2="${y + BAND_H}"/>` +
        // sequence chip: 20px square, veil fill — the numeral never touches the label
        `<rect class="seq-chip-rect" x="${x + 12}" y="${y + 5}" width="20" height="20" rx="5"/>` +
        (isEntry
          ? `<polygon class="seq-glyph" points="${x + 18},${y + 10.5} ${x + 18},${y + 19.5} ${x + 26},${y + 15}"/>`
          : `<text class="seq-num" x="${x + 22}" y="${y + 19}">${esc(String(seq[name]).padStart(2, '0'))}</text>`) +
        `<text class="node-label" x="${x + 40}" y="${y + 20}">${esc(trunc(node.label || name, labelMaxChars))}</text>` +
        (flag ? `<text class="node-flag${isEntry ? ' entry' : ''}" x="${x + NODE_W - 12}" y="${y + 20}" text-anchor="end">${flag}</text>` : '') +
        `<text class="node-agent" x="${x + 13}" y="${y + 50}">@${esc(node.terminal ? '?' : name)}</text>` +
        (node.summary ? `<text class="node-summary" x="${x + 13}" y="${y + 66}">${esc(trunc(node.summary, SUMMARY_MAX))}</text>` : '') +
        chipModel.markup + chipEffort.markup +
        portsFor(name, NODE_H, NODE_W) +
        `</g>`
      );
    });

    return {
      width: L.width,
      height: L.height,
      minX: L.minX,
      minY: L.minY,
      ends: edgeEnds,
      markup:
        `<svg class="rk-graph" width="${L.width}" height="${L.height}" viewBox="${L.minX} ${L.minY} ${L.width} ${L.height}" ${opts.interactive ? 'role="group" aria-label="rensei loop graph editor"' : 'role="img" aria-label="rensei loop graph"'}>` +
        `<defs>` +
        `<filter id="rkShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="2.5" flood-opacity="0.12"/></filter>` +
        `<pattern id="rkGrid" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.2" class="grid-dot"/></pattern>` +
        `<marker id="rkArrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" class="arrow-fill"/></marker>` +
        `<marker id="rkArrowBack" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" class="arrow-fill-back"/></marker>` +
        `<marker id="rkArrowSkip" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" class="arrow-fill-skip"/></marker>` +
        `</defs>` +
        `<rect class="bg" x="${L.minX}" y="${L.minY}" width="${L.width}" height="${L.height}"/>` +
        `<rect class="grid" x="${L.minX}" y="${L.minY}" width="${L.width}" height="${L.height}" fill="url(#rkGrid)"/>` +
        edges.join('\n') + '\n' + nodes.join('\n') + '\n' + pills.join('\n') +
        `</svg>`,
    };
  }

  return { layout, sequence, renderSvg, esc, resolveVar, NODE_W, NODE_H, sizeOf };
});
