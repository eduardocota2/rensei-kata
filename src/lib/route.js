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

  const results = [];
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
    if (score > 0) results.push({ agent: name, score, hits });
  }

  results.sort((a, b) => b.score - a.score || a.agent.localeCompare(b.agent));
  return { text, matches: results.slice(0, 6) };
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
