// Loop execution state — makes the graph observable while the agents run it.
// `.rensei/state.json` is written by the CLI (`rensei-kata status …`) and the
// compiled agents update it as they enter each phase (protocol appended by
// compile.js). Read-only for everything else.

const path = require('path');
const { read, write, exists } = require('./util');

const STATE_FILE = 'state.json';

function statePath(targetDir) {
  return path.join(targetDir, '.rensei', STATE_FILE);
}

function defaultState() {
  return {
    schema: 1,
    task: null,
    phase: null,
    iterations: {}, // "from>to" -> times taken
    history: [], // { ts, type, phase?, note? }
    created_at: null,
    updated_at: null,
  };
}

function loadState(targetDir) {
  const file = statePath(targetDir);
  if (!exists(file)) return null;
  try {
    const raw = JSON.parse(read(file));
    return Object.assign(defaultState(), raw);
  } catch (e) {
    return { ...defaultState(), corrupt: String(e.message || e) };
  }
}

function saveState(targetDir, state) {
  state.updated_at = new Date().toISOString();
  write(statePath(targetDir), JSON.stringify(state, null, 2) + '\n');
}

function logEvent(state, type, extra) {
  state.history = state.history || [];
  state.history.push({ ts: new Date().toISOString(), type, ...(extra || {}) });
  if (state.history.length > 80) state.history = state.history.slice(-80);
}

function setPhase(state, graph, phase, note) {
  if (!graph.nodes || !graph.nodes[phase]) return { ok: false, error: `unknown phase "${phase}"` };
  const edgeKey = state.phase ? `${state.phase}>${phase}` : null;
  if (edgeKey) {
    const bounded = (graph.edges || []).find(e => `${e.from}>${e.to}` === edgeKey && e.max !== undefined);
    state.iterations[edgeKey] = (state.iterations[edgeKey] || 0) + 1;
    if (bounded && state.iterations[edgeKey] > 1) {
      logEvent(state, 'loop', { phase, note: `iteration ${state.iterations[edgeKey]} of ${edgeKey}` });
    }
  }
  const prev = state.phase;
  state.phase = phase;
  logEvent(state, 'phase', { from: prev, phase, note });
  return { ok: true };
}

// Human-readable status: where the loop is, what got it here, what can follow.
function renderStatus(targetDir, core) {
  const state = loadState(targetDir);
  const { graph, config } = core;
  if (!state) {
    return { active: false, text: 'no active loop — start one with:\n  npx rensei-kata status --start "task description"' };
  }
  if (state.corrupt) {
    return { active: false, text: `state file is corrupt (${state.corrupt}) — reset with: npx rensei-kata status --reset` };
  }

  const L = [];
  const node = state.phase && graph.nodes ? graph.nodes[state.phase] : null;
  L.push(`task:    ${state.task || '(unnamed)'}`);
  if (node) {
    const model = (config.MODELS && config.MODELS[node.model]) || node.model || '—';
    const effort = (config.EFFORT && config.EFFORT[node.effort]) || node.effort || '—';
    L.push(`phase:   ${node.label || state.phase}  (@${node.agent || '?'}, ${model}, effort ${effort})`);
  } else {
    L.push('phase:   — (not started)');
  }
  if (state.updated_at) L.push(`updated: ${state.updated_at}`);

  const loops = Object.entries(state.iterations).filter(([, n]) => n > 1);
  if (loops.length) {
    L.push(`loops:   ${loops.map(([k, n]) => `${k} ×${n}`).join(', ')}`);
  }

  const next = (graph.edges || []).filter(e => e.from === state.phase);
  if (next.length) {
    L.push('');
    L.push('next transitions:');
    for (const e of next) {
      const max = e.max !== undefined ? ` (max ${e.max}×)` : '';
      L.push(`  → ${e.to}${e.when ? `  when: ${e.when}` : ''}${max}`);
    }
  }

  const tail = (state.history || []).slice(-6);
  if (tail.length) {
    L.push('');
    L.push('recent history:');
    for (const h of tail) {
      const t = h.ts ? h.ts.replace('T', ' ').slice(0, 16) : '';
      const d = h.type === 'phase'
        ? `${h.from || '∅'} → ${h.phase}${h.note ? ` — ${h.note}` : ''}`
        : `${h.type}${h.note ? ` — ${h.note}` : ''}`;
      L.push(`  ${t}  ${d}`);
    }
  }
  return { active: true, text: L.join('\n'), state };
}

module.exports = { loadState, saveState, renderStatus, setPhase, logEvent, defaultState, statePath };
