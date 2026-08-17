// kata trigger matcher — scores a natural-language request (ES/EN) against
// every agent's trigger vocabulary. Shared by `rensei-kata route` (CLI) and
// the studio routing simulator (/api/route). This is the deterministic
// approximation of what the compiled /kata command does in-session.

const { collectTriggers } = require('./validate');

function normalize(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// word-ish boundary match so "add" does not fire inside "address"
function countMatches(haystack, trigger) {
  const re = new RegExp('(^|[^a-záéíóúñ])' + escapeRe(normalize(trigger)) + '($|[^a-záéíóúñ])', 'g');
  const m = haystack.match(re);
  return m ? m.length : 0;
}

function route(core, text) {
  const hay = normalize(text);
  if (!hay) return { text, matches: [] };

  // The graph is the source of truth: kata routes within the USER's workflow.
  // Agents in agents/ but not in the graph are at most a suggestion (on_demand
  // helpers like @sentinel) — never the primary answer.
  const inGraph = new Set();
  for (const [id, node] of Object.entries(core.graph.nodes || {})) {
    if (!node.terminal) inGraph.add(id);
  }
  const onDemand = new Set();
  for (const [name, { def }] of core.agents) {
    if (def && def.on_demand) onDemand.add(name);
  }

  const results = [];
  const suggestions = [];
  for (const [name, { def }] of core.agents) {
    let score = 0;
    const hits = [];
    for (const t of collectTriggers(name, def)) {
      const n = countMatches(hay, t.trigger);
      if (n > 0) {
        // longer triggers are more specific → weigh more; modes add context
        score += n * (t.trigger.length + 4);
        hits.push({ trigger: t.trigger, lang: t.lang, where: t.where, count: n });
      }
    }
    if (score > 0) {
      if (inGraph.has(name)) results.push({ agent: name, score, hits });
      else suggestions.push({ agent: name, score, hits, on_demand: onDemand.has(name) });
    }
  }

  results.sort((a, b) => b.score - a.score || a.agent.localeCompare(b.agent));
  suggestions.sort((a, b) => b.score - a.score || a.agent.localeCompare(b.agent));
  return { text, matches: results.slice(0, 6).concat(suggestions.slice(0, 2)) };
}

function routeTable(core) {
  // printable vocabulary index — `rensei-kata route --list`
  const rows = [];
  for (const [name, { def }] of core.agents) {
    for (const t of collectTriggers(name, def)) rows.push({ agent: name, where: t.where, lang: t.lang, trigger: t.trigger });
  }
  return rows;
}

module.exports = { route, routeTable };
