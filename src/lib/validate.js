// Graph validator — turns the loop-as-data into something checkable.
// Returns { errors: [], warnings: [] }.

function stronglyConnectedComponents(nodes, edges) {
  const index = new Map();
  const low = new Map();
  const onStack = new Set();
  const stack = [];
  const sccs = [];
  let counter = 0;

  // Iterative Tarjan to avoid stack overflow on large graphs.
  for (const start of nodes) {
    if (index.has(start)) continue;
    const work = [[start, 0]];
    while (work.length) {
      const [v, pi] = work[work.length - 1];
      if (pi === 0) {
        index.set(v, counter);
        low.set(v, counter);
        counter++;
        stack.push(v);
        onStack.add(v);
      }
      const succs = edges.filter(e => e.from === v).map(e => e.to);
      let recursed = false;
      for (let i = pi; i < succs.length; i++) {
        const w = succs[i];
        if (!index.has(w)) {
          work[work.length - 1][1] = i + 1;
          work.push([w, 0]);
          recursed = true;
          break;
        } else if (onStack.has(w)) {
          low.set(v, Math.min(low.get(v), index.get(w)));
        }
      }
      if (recursed) continue;
      work.pop();
      if (work.length) {
        const parent = work[work.length - 1][0];
        low.set(parent, Math.min(low.get(parent), low.get(v)));
      }
      if (low.get(v) === index.get(v)) {
        const scc = [];
        let w;
        do {
          w = stack.pop();
          onStack.delete(w);
          scc.push(w);
        } while (w !== v);
        sccs.push(scc);
      }
    }
  }
  return sccs;
}

function collectTriggers(agentName, def) {
  // Returns [{ trigger, lang, where }] for the agent and each of its modes.
  const out = [];
  const push = (list, lang, where) => {
    for (const t of list || []) out.push({ trigger: String(t).toLowerCase().trim(), lang, where });
  };
  push(def.triggers && def.triggers.es, 'es', `@${agentName}`);
  push(def.triggers && def.triggers.en, 'en', `@${agentName}`);
  for (const [mode, m] of Object.entries(def.modes || {})) {
    push(m.triggers && m.triggers.es, 'es', `@${agentName} (${mode})`);
    push(m.triggers && m.triggers.en, 'en', `@${agentName} (${mode})`);
  }
  return out;
}

// Tier tables may be flat (all runtimes) or nested per runtime
// (MODELS: { claude: {...}, codex: {...} }). This flattens for validation:
// a tier is valid if it exists in ANY runtime.
function tierTable(config, tier) {
  const raw = tier === 'model' ? config.MODELS : config.EFFORT;
  if (!raw || typeof raw !== 'object') return raw;
  const values = Object.values(raw);
  const nested = values.every(v => v && typeof v === 'object');
  if (!nested) return raw; // flat
  const flat = {};
  for (const rt of values) Object.assign(flat, rt);
  return flat;
}

// Runtime-aware table for UI/compile: models for ONE runtime (flat fallback).
function tierTableFor(config, tier, runtime) {
  const raw = tier === 'model' ? config.MODELS : config.EFFORT;
  if (!raw || typeof raw !== 'object') return raw;
  const values = Object.values(raw);
  const nested = values.every(v => v && typeof v === 'object');
  if (!nested) return raw;
  return raw[runtime] || raw.claude || values[0] || {};
}

function runtimesOf(config) {
  const raw = config.MODELS;
  if (!raw || typeof raw !== 'object') return ['claude'];
  const values = Object.values(raw);
  const nested = values.every(v => v && typeof v === 'object');
  return nested ? Object.keys(raw) : ['claude'];
}

function validate(core) {
  const { graph, config, agents } = core;
  const errors = [];
  const warnings = [];
  const issues = { errors: [], warnings: [] };

  const pushError = (message, anchor = {}, fix = null) => {
    errors.push(fix ? `${message} → fix: ${fix}` : message);
    issues.errors.push({ message, ...anchor, ...(fix ? { fix } : {}) });
  };
  const pushWarning = (message, anchor = {}) => {
    warnings.push(message);
    issues.warnings.push({ message, ...anchor });
  };

  const nodeNames = Object.keys(graph.nodes || {});
  const nodeSet = new Set(nodeNames);

  // -- entry ---------------------------------------------------------------
  if (!graph.entry || !nodeSet.has(graph.entry)) {
    pushError(`graph.entry "${graph.entry}" is not a defined node`, { node: graph.entry || null },
      'set entry to an existing node id (e.g. entry: gate)');
  }

  // -- nodes ---------------------------------------------------------------
  for (const [name, node] of Object.entries(graph.nodes || {})) {
    if (node.terminal) continue;
    if (node.agent !== undefined && node.agent !== name) {
      pushError(`node "${name}" references agent "${node.agent}" — under the node=agent model every phase IS its own agent (drop the "agent:" key; it is derived from the node id)`, { node: name },
        `remove \`agent: ${node.agent}\` from node "${name}" — the agent name is the node id`);
    }
    if (!agents.has(name)) {
      pushError(`node "${name}" has no agent — agents/${name}/ will be scaffolded automatically on save/build`, { node: name },
        'run `npx rensei-kata build` (or save from the studio) to scaffold agents/<id>/');
    }
    for (const tier of ['model', 'effort']) {
      if (!node[tier]) continue;
      const table = tierTable(config, tier);
      if (table && !(node[tier] in table)) {
        pushError(`node "${name}" uses unknown ${tier} tier "${node[tier]}" (not in rensei.config.yaml ${tier.toUpperCase()})`, { node: name },
          `use one of: ${Object.keys(table).join(', ')}`);
      }
    }
  }

  // -- edges ---------------------------------------------------------------
  for (const [i, e] of (graph.edges || []).entries()) {
    for (const end of ['from', 'to']) {
      if (!nodeSet.has(e[end])) pushError(`edge #${i} (${e.from} → ${e.to}): unknown node "${e[end]}"`, { edge: i, node: e[end] });
    }
    if (e.from === e.to) pushError(`edge #${i}: self-loop on "${e.from}"`, { edge: i, node: e.from });
  }

  // -- duplicate / parallel edges --------------------------------------------
  const exactSeen = new Map();
  const pairSeen = new Map();
  for (const [i, e] of (graph.edges || []).entries()) {
    const pair = `${e.from} → ${e.to}`;
    const exact = `${pair} · when=${e.when || ''} · max=${e.max || ''}`;
    if (exactSeen.has(exact)) {
      pushError(`edge #${i}: duplicate of edge #${exactSeen.get(exact)} (${pair}, same condition) — remove one`, { edge: i },
        `delete edge #${i} or edge #${exactSeen.get(exact)}`);
      continue;
    }
    exactSeen.set(exact, i);
    if (pairSeen.has(pair)) {
      pushWarning(`parallel edges ${pair} (#${pairSeen.get(pair)} and #${i}) — merge conditions or remove one`, { edge: i });
    } else {
      pairSeen.set(pair, i);
    }
  }

  // -- reachability from entry ---------------------------------------------
  if (graph.entry && nodeSet.has(graph.entry)) {
    const seen = new Set([graph.entry]);
    const queue = [graph.entry];
    while (queue.length) {
      const v = queue.shift();
      for (const e of graph.edges || []) {
        if (e.from === v && !seen.has(e.to)) {
          seen.add(e.to);
          queue.push(e.to);
        }
      }
    }
    for (const name of nodeNames) {
      if (!seen.has(name)) pushError(`node "${name}" is unreachable from entry "${graph.entry}"`, { node: name },
        `add a transition into "${name}" or remove the node`);
    }
  }

  // -- every non-terminal node must have an outgoing path -------------------
  for (const [name, node] of Object.entries(graph.nodes || {})) {
    if (node.terminal) continue;
    if (!(graph.edges || []).some(e => e.from === name)) {
      pushError(`node "${name}" is a dead end (no outgoing edges, not terminal)`, { node: name },
        'add an outgoing transition or mark it terminal: true');
    }
  }

  // -- cycles must be bounded -----------------------------------------------
  const sccs = stronglyConnectedComponents(nodeNames, graph.edges || []);
  for (const scc of sccs) {
    const inScc = new Set(scc);
    const internal = (graph.edges || []).filter(e => inScc.has(e.from) && inScc.has(e.to));
    const isCycle = scc.length > 1;
    if (!isCycle) continue;
    if (!internal.some(e => e.max !== undefined)) {
      const loopEdge = internal[0];
      pushError(`unbounded cycle detected: ${scc.join(' → ')} — add "max:" to at least one edge in the loop`,
        { node: scc[0], edge: loopEdge ? (graph.edges || []).indexOf(loopEdge) : undefined },
        `add max: 3 (or max: "$ITERATIONS.correction_loop") to the edge ${loopEdge.from} → ${loopEdge.to}`);
    }
  }

  // -- skills must exist in the registry (warning: skills are environment-dependent)
  const registry = config.SKILLS || {};
  for (const [name, { def }] of agents) {
    for (const s of def.skills || []) {
      if (!(s in registry)) pushWarning(`agent "${name}" uses skill "${s}" — not in SKILLS registry (rensei.config.yaml)`);
    }
  }
  for (const [nodeName, node] of Object.entries(graph.nodes || {})) {
    for (const s of node.skills || []) {
      if (!(s in registry)) pushWarning(`node "${nodeName}" enables skill "${s}" — not in SKILLS registry (rensei.config.yaml)`, { node: nodeName });
      const pool = node.agent && agents.has(node.agent) ? (agents.get(node.agent).def.skills || []) : [];
      if (node.agent && !pool.includes(s)) pushWarning(`node "${nodeName}" enables skill "${s}" — not in @${node.agent}'s pool (agents/${node.agent}/agent.yaml)`, { node: nodeName });
    }
  }

  // -- trigger collisions across agents -------------------------------------
  const seen = new Map();
  for (const [name, { def }] of agents) {
    for (const t of collectTriggers(name, def)) {
      const key = `${t.lang}:${t.trigger}`;
      if (seen.has(key)) {
        pushWarning(`trigger collision (${t.lang}): "${t.trigger}" routes to both ${seen.get(key)} and ${t.where} — kata will need a tie-break`);
      } else {
        seen.set(key, t.where);
      }
    }
  }

  // -- agents that no graph node uses ---------------------------------------
  for (const [name, { def }] of agents) {
    if (def.on_demand) continue;
    const used = nodeNames.includes(name);
    if (!used) pushWarning(`agent "${name}" is not referenced by any graph node (standalone-only? mark on_demand: true if intentional)`);
  }

  return { errors, warnings, issues };
}

module.exports = { validate, stronglyConnectedComponents, collectTriggers, tierTable, tierTableFor, runtimesOf };
