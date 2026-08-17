// rensei-kata studio — local server for bidirectional graph editing.
// The browser edits a JSON model (or raw YAML); every save is validated
// BEFORE touching disk, and a successful save recompiles all artifacts.
const http = require('http');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const YAML = require('yaml');
const { read, write, exists, log, toPosix } = require('./util');
const { findCoreDir, loadCore } = require('./load');
const { validate, tierTableFor, runtimesOf } = require('./validate');
const { compile, checkDrift, driftWarnings } = require('./compile');
const { scaffoldAgents } = require('./scaffold');
const { renderSvg } = require('./graph-render');
const graphCss = require('./graph-css');
const exportCss = require('./graph-export-css');
const { studioPage } = require('./studio-page');

const GRAPH_RENDER_JS = path.join(__dirname, 'graph-render.js');
const CONFIG_FILE = 'rensei.config.yaml';

// Agents living on the shelf: a complete agents/<id>/ directory whose node
// is NOT in the graph (and is not on_demand). Deactivated, not deleted —
// their brain (prompt, config, skills) waits for reactivation.
function inactiveAgents(core) {
  const fs = require('fs');
  const inGraph = new Set();
  for (const [id, node] of Object.entries(core.graph.nodes || {})) {
    if (!node.terminal) inGraph.add(id);
  }
  const out = [];
  const agentsDir = path.join(core.coreDir, 'agents');
  if (!fs.existsSync(agentsDir)) return out;
  for (const entry of fs.readdirSync(agentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const id = entry.name;
    if (inGraph.has(id)) continue;
    const defFile = path.join(agentsDir, id, 'agent.yaml');
    const promptFile = path.join(agentsDir, id, 'prompt.md');
    if (!fs.existsSync(defFile) || !fs.existsSync(promptFile)) continue; // incomplete dir — not a shelf item
    let def = {};
    try { def = YAML.parse(read(defFile)) || {}; } catch (e) { /* unreadable def — still shelvable */ }
    if (def.on_demand) continue; // on-demand helpers are a different state
    const defaultPrompt = /You are @[\w-]+ — the .* phase of the rensei loop\./;
    out.push({
      name: id,
      description: def.description || '',
      skills: def.skills || [],
      hasCustomPrompt: !defaultPrompt.test(read(promptFile).slice(0, 120)),
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

function send(res, status, body, type = 'application/json') {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8` });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 5e6) req.destroy(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

function startStudio(targetDir, { port = 4789, open = true } = {}) {
  const coreDir = findCoreDir(targetDir);
  const graphFile = path.join(coreDir, 'rensei.graph.yaml');

  const loadState = () => {
    const core = loadCore(coreDir);
    const { errors, warnings, issues } = validate(core);
    const drift = checkDrift(targetDir);
    return { core, errors, warnings, issues, drift, driftMessages: driftWarnings(drift) };
  };

  // Shared save path: validate FIRST (no side effects on failure), then
  // scaffold new agents, persist and recompile. Returns { status, body }.
  function trySave(graph, rawYamlText, { runtime = null } = {}) {
    // 1. validate with a virtual view of the agents the graph NEEDS — the
    //    scaffold hasn't happened yet, so "no agent" for new nodes is expected
    //    and never blocks (it becomes a warning here, the scaffold follows)
    const pre = loadCore(coreDir);
    const SCAFFOLD_MSG = /will be scaffolded automatically/;
    const v = validate({ ...pre, graph });
    const errors = v.errors.filter(e => !SCAFFOLD_MSG.test(e));
    if (errors.length) {
      return { status: 422, body: { ok: false, errors, warnings: v.warnings, issues: v.issues } };
    }

    // 2. NOW scaffold: node = agent (may consume node.based_on → mutate graph)
    const sc = scaffoldAgents(coreDir, graph);

    const core = loadCore(coreDir);
    const { errors: e2, warnings, issues } = validate({ ...core, graph });
    if (e2.length) {
      return { status: 422, body: { ok: false, errors: e2, warnings, issues } };
    }
    if (runtime) {
      const configFile = path.join(coreDir, CONFIG_FILE);
      const cfg = YAML.parse(read(configFile));
      cfg.RUNTIME = runtime;
      write(configFile, YAML.stringify(cfg));
    }
    const yamlOut = rawYamlText !== undefined && !sc.mutated
      ? rawYamlText
      : YAML.stringify(graph, { indent: 2 });
    write(graphFile, yamlOut);
    const fresh = loadCore(coreDir);
    const { written, purged } = compile(fresh, targetDir, { runtime: runtime || fresh.config.RUNTIME });

    // renamed agents: the source directory is gone, so compile can't see it —
    // purge the stale compiled artifact by hand
    const fs = require('fs');
    const extraPurged = [];
    for (const rn of sc.renamed || []) {
      for (const t of ['claude', 'opencode']) {
        const ghost = path.join(targetDir, t === 'claude' ? '.claude' : '.opencode', 'agents', `${rn.from}.md`);
        if (fs.existsSync(ghost)) { fs.rmSync(ghost); extraPurged.push(toPosix(path.relative(targetDir, ghost))); }
      }
    }
    return {
      status: 200,
      body: {
        ok: true,
        warnings,
        yamlText: read(graphFile),
        rebuilt: written.map(f => toPosix(path.relative(targetDir, f))),
        purged: [...(purged || []), ...extraPurged],
        scaffolded: sc.created,
        seededFrom: sc.seededFrom,
      },
    };
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');

      if (req.method === 'GET' && url.pathname === '/') {
        return send(res, 200, studioPage(), 'text/html');
      }
      if (req.method === 'GET' && url.pathname === '/graph-render.js') {
        return send(res, 200, read(GRAPH_RENDER_JS), 'text/javascript');
      }
      if (req.method === 'GET' && url.pathname === '/api/model') {
        const st = loadState();
        const runtime = st.core.config.RUNTIME || runtimesOf(st.core.config)[0] || 'claude';
        return send(res, 200, {
          graph: st.core.graph,
          config: st.core.config,
          agents: [...st.core.agents].map(([name, a]) => ({ name, skills: a.def.skills || [] })),
          inactive: inactiveAgents(st.core),
          yamlText: read(graphFile),
          errors: st.errors,
          warnings: st.warnings,
          issues: st.issues,
          drift: st.driftMessages,
          runtime,
          runtimes: runtimesOf(st.core.config),
          models: tierTableFor(st.core.config, 'model', runtime),
          efforts: tierTableFor(st.core.config, 'effort', runtime),
          coreDir: toPosix(coreDir),
        });
      }
      if (req.method === 'POST' && url.pathname === '/api/model') {
        const { graph, runtime } = JSON.parse(await readBody(req));
        const r = trySave(graph, undefined, { runtime: runtime || null });
        return send(res, r.status, r.body);
      }
      // Convert JSON model → YAML text without saving (keeps the YAML pane in sync).
      // Shelf: delete a deactivated agent FOREVER (removes agents/<id>/).
      // Only allowed for shelf items — an active agent must be deactivated
      // (node removed from the graph) first.
      const delMatch = url.pathname.match(/^\/api\/agent\/([a-z0-9-]+)$/);
      if (delMatch && req.method === 'DELETE') {
        const fs = require('fs');
        const id = delMatch[1];
        const shelf = inactiveAgents(loadCore(coreDir));
        if (!shelf.some(a => a.name === id)) {
          return send(res, 409, { ok: false, errors: [`"${id}" is not on the shelf — remove its node from the graph first`] });
        }
        fs.rmSync(path.join(coreDir, 'agents', id), { recursive: true, force: true });
        return send(res, 200, { ok: true, deleted: id });
      }

      if (req.method === 'POST' && url.pathname === '/api/to-yaml') {
        const { graph } = JSON.parse(await readBody(req));
        return send(res, 200, { text: YAML.stringify(graph, { indent: 2 }) });
      }
      // Prompt editor: read/write .rensei/agents/<id>/prompt.md directly.
      // GET returns the text (or null for not-yet-scaffolded agents); PUT
      // writes it — the next Save/rebuild propagates it into compiled agents.
      const promptMatch = url.pathname.match(/^\/api\/prompt\/([a-z0-9-]+)$/);
      if (promptMatch) {
        const agentId = promptMatch[1];
        const promptFile = path.join(coreDir, 'agents', agentId, 'prompt.md');
        if (!exists(promptFile)) {
          if (req.method === 'GET') return send(res, 200, { ok: true, prompt: null, scaffolded: false });
          return send(res, 404, { ok: false, errors: [`agent "${agentId}" is not scaffolded yet — Save the graph first`] });
        }
        if (req.method === 'GET') {
          return send(res, 200, { ok: true, prompt: read(promptFile), scaffolded: true });
        }
        if (req.method === 'PUT') {
          const { prompt } = JSON.parse(await readBody(req));
          if (typeof prompt !== 'string') return send(res, 422, { ok: false, errors: ['missing "prompt" string'] });
          write(promptFile, prompt.endsWith('\n') ? prompt : prompt + '\n');
          return send(res, 200, { ok: true, saved: true });
        }
      }
      // Parse + validate raw YAML without saving (YAML pane → visual preview).
      if (req.method === 'POST' && url.pathname === '/api/parse-yaml') {
        const { text } = JSON.parse(await readBody(req));
        let graph;
        try {
          graph = YAML.parse(text);
        } catch (e) {
          return send(res, 422, { ok: false, errors: [`YAML parse error: ${e.message}`], warnings: [], issues: { errors: [], warnings: [] } });
        }
        if (!graph || typeof graph !== 'object' || !graph.nodes) {
          return send(res, 422, { ok: false, errors: ['Valid YAML, but not a rensei graph (missing "nodes")'], warnings: [], issues: { errors: [], warnings: [] } });
        }
        const core = loadCore(coreDir);
        const v = validate({ ...core, graph });
        // preview-only: "agent will be scaffolded on save" never blocks applying
        // the text to the canvas — the scaffold happens on save
        const SCAFFOLD_MSG = /will be scaffolded automatically/;
        const errors = v.errors.filter(e => !SCAFFOLD_MSG.test(e));
        const warnings = [...v.warnings, ...v.errors.filter(e => SCAFFOLD_MSG.test(e))];
        const issues = {
          errors: (v.issues.errors || []).filter(i => !SCAFFOLD_MSG.test(i.message)),
          warnings: [...(v.issues.warnings || []), ...(v.issues.errors || []).filter(i => SCAFFOLD_MSG.test(i.message))],
        };
        return send(res, errors.length ? 422 : 200, { ok: !errors.length, graph, errors, warnings, issues });
      }

      // standalone SVG of the current graph on disk (export → .svg / rasterize → .png)
      // The root MUST carry class="rk-graph" — the token block targets that
      // selector; without it every var(--rk-*) is undefined and the export
      // renders as a black blob.
      if (req.method === 'GET' && url.pathname === '/api/export.svg') {
        const theme = url.searchParams.get('theme');
        const tokens = theme === 'light' ? exportCss.LIGHT : theme === 'dark' ? exportCss.DARK : exportCss.AUTO;
        const core = loadCore(coreDir);
        const { markup, width, height } = renderSvg(core.graph, core.config, {});
        const viewBox = markup.match(/viewBox="([^"]+)"/)[1];
        const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" class="rk-graph" width="${width}" height="${height}" viewBox="${viewBox}">\n<style>${tokens}\n${graphCss}</style>\n${markup.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`;
        return send(res, 200, svg, 'image/svg+xml');
      }
      // Save raw YAML text (YAML pane → disk + recompile).
      if (req.method === 'POST' && url.pathname === '/api/save-yaml') {
        const { text } = JSON.parse(await readBody(req));
        let graph;
        try {
          graph = YAML.parse(text);
        } catch (e) {
          return send(res, 422, { ok: false, errors: [`YAML parse error: ${e.message}`], warnings: [] });
        }
        const r = trySave(graph, text);
        return send(res, r.status, r.body);
      }

      send(res, 404, { error: 'not found' });
    } catch (e) {
      send(res, 500, { ok: false, errors: [String(e.message || e)] });
    }
  });

  server.on('error', err => {
    if (err.code === 'EADDRINUSE' && port < 4809) {
      log.warn(`puerto ${port} ocupado — probando ${port + 1}`);
      startStudio(targetDir, { port: port + 1, open });
    } else {
      throw err;
    }
  });

  server.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${port}`;
    log.info(`\nrensei studio — editing ${toPosix(graphFile)}`);
    log.info(`→ ${url}\n`);
    log.info('Saving from the editor validates the graph, writes the YAML and recompiles the agents.');
    log.info('Ctrl+C to exit.\n');
    if (open) openBrowser(url);
  });

  return server;
}

module.exports = { startStudio };
