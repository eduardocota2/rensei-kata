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
    // out-of-canvas manual positions (e.g. saved before drag clamping) fall back to auto
    const validManual = p => p && isFinite(p.x) && isFinite(p.y) && p.x >= 0 && p.y >= 0 && p.x < 20000 && p.y < 20000;
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

    let maxX = 0, maxY = 0;
    Object.keys(pos).forEach(function (n) {
      maxX = Math.max(maxX, pos[n].x + sizeOf(graph, n).w);
      maxY = Math.max(maxY, pos[n].y + NODE_H);
    });
    return {
      pos, backEdges, spine, spineRow, spineCol, wrap,
      width: maxX + PAD + 96,
      height: maxY + PAD + 90,
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

  function labelPill(cx, cy, text, cls) {
    // display text is truncated; the full condition rides in <title> (hover)
    const w = trunc(text).length * 5.8 + 16;
    const h = 17;
    return (
      `<g class="label-pill ${cls || ''}">` +
      `<title>${esc(text)}</title>` +
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
  // anchor to the routed path, never to a cached row coordinate
  function pathAnchor(pts) {
    let total = 0;
    const segs = [];
    for (let i = 1; i < pts.length; i++) {
      const len = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      segs.push(len); total += len;
    }
    let half = total / 2;
    for (let i = 0; i < segs.length; i++) {
      if (half <= segs[i] || i === segs.length - 1) {
        const p0 = pts[i], p1 = pts[i + 1];
        const t = segs[i] ? Math.min(1, half / segs[i]) : 0;
        return {
          x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t,
          horizontal: Math.abs(p1.y - p0.y) <= Math.abs(p1.x - p0.x),
        };
      }
      half -= segs[i];
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

    // Every edge is a list of waypoints first, a path string second. Aligned
    // endpoints get a straight segment; misaligned endpoints BEND orthogonally
    // (14px rounded corners) — a diagonal straight line never ships.
    (graph.edges || []).forEach(function (e, i) {
      if (!(e.from in pos) || !(e.to in pos)) return;
      const inter = opts.interactive ? ` data-edge="${i}" tabindex="0" role="button" aria-label="transition ${esc(e.from)} to ${esc(e.to)}"` : '';
      const isLoop = (e.max !== undefined && e.max !== null && e.max !== '') || L.backEdges.has(e);
      const label = [e.when, e.max !== undefined && e.max !== null && e.max !== '' ? '≤' + resolveVar(e.max, config) + '×' : null]
        .filter(Boolean).join(' · ');

      let pts, cls, marker, labelX, labelY, a, b;
      const bothSpine = onSpine(e.from) && onSpine(e.to);

      if (L.backEdges.has(e)) {
        // the correction loop: out the bottom, down to a dip, up the right
        // margin, and back IN THROUGH THE TOP — ports keep their meaning
        // (right/bottom exit, left/top enter) even on the way back
        a = portB(e.from);
        b = portT(e.to);
        const dip = Math.max(a.y, b.y) + 46;
        const margin = L.width - PAD - 40;
        const aboveY = pos[e.to].y - 30;
        pts = [a, { x: a.x, y: dip }, { x: margin, y: dip }, { x: margin, y: aboveY }, { x: b.x, y: aboveY }, { x: b.x, y: b.y - 7 }];
        cls = ' back'; marker = 'rkArrowBack';
        labelX = (a.x + margin) / 2; labelY = dip;
        usePort(e.from, 'b'); usePort(e.to, 't');
      } else if (bothSpine && L.spineRow[e.from] === L.spineRow[e.to]) {
        const forward = portR(e.from).x < portL(e.to).x;
        a = forward ? portR(e.from) : portL(e.from);
        b = forward ? portL(e.to) : portR(e.to);
        const skip = feedsBranch(e.from);
        cls = (isLoop ? ' back' : '') + (skip ? ' skip' : '');
        marker = isLoop ? 'rkArrowBack' : skip ? 'rkArrowSkip' : 'rkArrow';
        const end = { x: b.x + (forward ? -7 : 7), y: b.y };
        if (Math.abs(a.y - b.y) < 2) {
          pts = [a, end];
          // aligned: the pill floats above the row — it is wider than the column gap
          labelX = (a.x + b.x) / 2; labelY = Math.min(pos[e.from].y, pos[e.to].y) - 14;
        } else {
          const midX = (a.x + b.x) / 2;
          pts = [a, { x: midX, y: a.y }, { x: midX, y: b.y }, end];
          const an = pathAnchor(pts);
          labelX = an.horizontal ? an.x : an.x + 14;
          labelY = an.horizontal ? an.y - 14 : an.y;
        }
        usePort(e.from, forward ? 'r' : 'l'); usePort(e.to, forward ? 'l' : 'r');
      } else if (bothSpine) {
        a = portB(e.from);
        b = portT(e.to);
        cls = isLoop ? ' back' : ''; marker = isLoop ? 'rkArrowBack' : 'rkArrow';
        const end = { x: b.x, y: b.y - 7 };
        if (Math.abs(a.x - b.x) < 2) {
          pts = [a, end];
        } else {
          const midY = (a.y + b.y) / 2;
          pts = [a, { x: a.x, y: midY }, { x: b.x, y: midY }, end];
        }
        const an = pathAnchor(pts);
        labelX = an.horizontal ? an.x : an.x + 14;
        labelY = an.horizontal ? an.y - 14 : an.y;
        usePort(e.from, 'b'); usePort(e.to, 't');
      } else {
        const off = onSpine(e.from) ? e.to : e.from;
        const lane = laneOf(graph, off);
        if (!onSpine(e.from)) {
          a = portR(e.from); b = portT(e.to);
          pts = [a, { x: b.x, y: a.y }, { x: b.x, y: b.y - 7 }];
          usePort(e.from, 'r'); usePort(e.to, 't');
        } else if (lane === -1) {
          a = portT(e.from); b = portL(e.to);
          pts = [a, { x: a.x, y: b.y }, { x: b.x - 7, y: b.y }];
          usePort(e.from, 't'); usePort(e.to, 'l');
        } else {
          a = portB(e.from); b = portT(e.to);
          pts = Math.abs(a.x - b.x) < 2 ? [a, { x: b.x, y: b.y - 7 }]
            : [a, { x: a.x, y: b.y }, { x: b.x, y: b.y - 7 }];
          usePort(e.from, 'b'); usePort(e.to, 't');
        }
        cls = isLoop ? ' back' : ' skip'; marker = isLoop ? 'rkArrowBack' : 'rkArrowSkip';
        const an = pathAnchor(pts);
        labelX = an.horizontal ? an.x : an.x + 14;
        labelY = an.horizontal ? an.y - 14 : an.y;
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
      if (label) pills.push(labelPill(labelX, labelY, label, cls.trim().split(' ').pop() || ''));
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
        `<g class="${cls}"${inter(`node ${esc(node.label || name)}, agent ${esc(node.agent || '?')}`)}>` +
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
        `<text class="node-agent" x="${x + 13}" y="${y + 50}">@${esc(node.agent || '?')}</text>` +
        (node.summary ? `<text class="node-summary" x="${x + 13}" y="${y + 66}">${esc(trunc(node.summary, SUMMARY_MAX))}</text>` : '') +
        chipModel.markup + chipEffort.markup +
        portsFor(name, NODE_H, NODE_W) +
        `</g>`
      );
    });

    return {
      width: L.width,
      height: L.height,
      ends: edgeEnds,
      markup:
        `<svg class="rk-graph" width="${L.width}" height="${L.height}" viewBox="0 0 ${L.width} ${L.height}" ${opts.interactive ? 'role="group" aria-label="rensei loop graph editor"' : 'role="img" aria-label="rensei loop graph"'}>` +
        `<defs>` +
        `<filter id="rkShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="2.5" flood-opacity="0.12"/></filter>` +
        `<pattern id="rkGrid" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.2" class="grid-dot"/></pattern>` +
        `<marker id="rkArrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" class="arrow-fill"/></marker>` +
        `<marker id="rkArrowBack" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" class="arrow-fill-back"/></marker>` +
        `<marker id="rkArrowSkip" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" class="arrow-fill-skip"/></marker>` +
        `</defs>` +
        `<rect class="grid" x="0" y="0" width="${L.width}" height="${L.height}" fill="url(#rkGrid)"/>` +
        edges.join('\n') + '\n' + nodes.join('\n') + '\n' + pills.join('\n') +
        `</svg>`,
    };
  }

  return { layout, sequence, renderSvg, esc, resolveVar, NODE_W, NODE_H, sizeOf };
});
