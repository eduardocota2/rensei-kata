// Agent scaffolder — the bridge between "a node in the graph" and "a real agent".
// Under the node=agent model, every non-terminal node IS an agent: on save/build,
// missing .rensei/agents/<id>/ dirs are scaffolded (optionally seeded from an
// existing agent via node.based_on — an unlinked copy). The compiler then
// propagates the new agent into kata's routing, RENSEI.md and the runtime
// artifacts. Nothing else needs to know a new agent appeared.

const path = require('path');
const fs = require('fs');
const { exists, read, write, ensureDir } = require('./util');

function slug(label) {
  return String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function agentYaml(id, node, model) {
  const label = node.label || id;
  const summary = (node.summary || `${label} phase of the rensei loop.`).replace(/"/g, '\\"');
  const trigger = id.replace(/-/g, ' ');
  return `name: ${id}
alias: kata-${id}
description: ${summary}
model: ${model || node.model || 'balanced'}
tools: [Read, Write, Edit, Bash]
standalone: 'kata-${id} "${trigger}"'
fragments: [communication]
skills: []
triggers:
  es:
    - ${trigger}
  en:
    - ${trigger}
`;
}

function promptMd(id, node) {
  const label = node.label || id;
  const summary = node.summary || 'Do your part of the loop.';
  return `You are @${id} — the ${label} phase of the rensei loop.

${summary}

## Loop protocol
1. Read the incoming context from the previous phase
2. Do your part — ${summary}
3. Verify your exit gate before handing off
4. Record progress: npx rensei-kata status --set ${id}

## Principles
- Exact paths, never vague.
- Ask before guessing.
- Surface problems immediately.

<!-- This prompt is YOURS — edit it in .rensei/agents/${id}/prompt.md and rebuild. -->
`;
}

// Scaffold every non-terminal node whose agent dir is missing.
// `based_on` seeds the new agent as a COPY of an existing one (tools, triggers,
// prompt, skills, fragments) — the copy is unlinked: editing either never
// touches the other. The key is consumed (removed from the node) afterwards.
// Returns { created: [ids], seededFrom: {id: base} }.
function scaffoldAgents(coreDir, graph) {
  const agentsDir = path.join(coreDir, 'agents');
  const created = [];
  const seededFrom = {};
  const renamed = [];
  let mutated = false;

  for (const [id, node] of Object.entries(graph.nodes || {})) {
    if (node.terminal) continue;
    // legacy graphs carried an explicit agent key — redundant under node=agent
    if (node.agent !== undefined && node.agent === id) {
      delete node.agent;
      mutated = true;
    }
    const dir = path.join(agentsDir, id);
    if (exists(dir)) continue;

    // RENAMED agent: if a renames map (maintained by the studio) points at
    // an old id with a directory, MOVE it — the brain travels with the name
    if (graph.renames && graph.renames[id] && exists(path.join(agentsDir, graph.renames[id]))) {
      const from = graph.renames[id];
      fs.renameSync(path.join(agentsDir, from), dir);
      delete graph.renames[id];
      mutated = true;
      renamed.push({ from, to: id });
      continue;
    }

    ensureDir(dir);
    const base = node.based_on && !node.terminal ? String(node.based_on) : null;
    const baseDir = base ? path.join(agentsDir, base) : null;

    if (base && exists(baseDir)) {
      // unlinked copy: model/tools/triggers/prompt/skills come from the base
      for (const f of fs.readdirSync(baseDir)) {
        fs.copyFileSync(path.join(baseDir, f), path.join(dir, f));
      }
      // re-identify: the copy answers to its own name
      const defFile = path.join(dir, 'agent.yaml');
      const YAML = require('yaml');
      const def = YAML.parse(read(defFile));
      def.name = id;
      def.alias = `kata-${id}`;
      write(defFile, YAML.stringify(def));
      let prompt = read(path.join(dir, 'prompt.md'));
      prompt = prompt.replace(new RegExp(`@${base}\\b`, 'g'), `@${id}`);
      write(path.join(dir, 'prompt.md'), prompt);
      seededFrom[id] = base;
    } else {
      write(path.join(dir, 'agent.yaml'), agentYaml(id, node, node.model));
      write(path.join(dir, 'prompt.md'), promptMd(id, node));
    }
    created.push(id);

    if (node.based_on !== undefined) {
      delete node.based_on; // one-shot metadata — never compiled, never persisted again
      mutated = true;
    }
  }
  return { created, seededFrom, renamed, mutated };
}

module.exports = { scaffoldAgents, slug };
