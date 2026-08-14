// rensei-kata studio — local server for bidirectional graph editing.
// The browser edits a JSON model (or raw YAML); every save is validated
// BEFORE touching disk, and a successful save recompiles all artifacts.
const http = require('http');
const path = require('path');
const { exec } = require('child_process');
const YAML = require('yaml');
const { read, write, log, toPosix } = require('./util');
const { findCoreDir, loadCore } = require('./load');
const { validate } = require('./validate');
const { compile, checkDrift, driftWarnings } = require('./compile');
const { route } = require('./route');
const { renderSvg } = require('./graph-render');
const graphCss = require('./graph-css');
const { studioPage } = require('./studio-page');

const GRAPH_RENDER_JS = path.join(__dirname, 'graph-render.js');

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

  // Shared save path: validate a candidate graph; on success persist + recompile.
  // Returns { status, body }.
  function trySave(graph, rawYamlText) {
    const core = loadCore(coreDir);
    const candidate = { ...core, graph };
    const { errors, warnings, issues } = validate(candidate);
    if (errors.length) {
      return { status: 422, body: { ok: false, errors, warnings, issues } };
    }
    write(graphFile, rawYamlText !== undefined ? rawYamlText : YAML.stringify(graph, { indent: 2 }));
    const fresh = loadCore(coreDir);
    const { written } = compile(fresh, targetDir, {});
    return {
      status: 200,
      body: {
        ok: true,
        warnings,
        yamlText: read(graphFile),
        rebuilt: written.map(f => toPosix(path.relative(targetDir, f))),
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
      return send(res, 200, {
        graph: st.core.graph,
        config: st.core.config,
        agents: [...st.core.agents].map(([name, a]) => ({ name, skills: a.def.skills || [] })),
        yamlText: read(graphFile),
        errors: st.errors,
        warnings: st.warnings,
        issues: st.issues,
        drift: st.driftMessages,
        coreDir: toPosix(coreDir),
      });
    }
      if (req.method === 'POST' && url.pathname === '/api/model') {
        const { graph } = JSON.parse(await readBody(req));
        const r = trySave(graph);
        return send(res, r.status, r.body);
      }
      // Convert JSON model → YAML text without saving (keeps the YAML pane in sync).
      if (req.method === 'POST' && url.pathname === '/api/to-yaml') {
        const { graph } = JSON.parse(await readBody(req));
        return send(res, 200, { text: YAML.stringify(graph, { indent: 2 }) });
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
        const { errors, warnings, issues } = validate({ ...core, graph });
        return send(res, errors.length ? 422 : 200, { ok: !errors.length, graph, errors, warnings, issues });
      }
      // kata routing simulator — deterministic trigger matching, no tokens spent.
      if (req.method === 'POST' && url.pathname === '/api/route') {
        const { text } = JSON.parse(await readBody(req));
        const core = loadCore(coreDir);
        return send(res, 200, route(core, text));
      }
      // standalone SVG of the current graph on disk (export → .svg / rasterize → .png)
      if (req.method === 'GET' && url.pathname === '/api/export.svg') {
        const core = loadCore(coreDir);
        const { markup, width, height } = renderSvg(core.graph, core.config, {});
        const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n<style>${graphCss}</style>\n${markup.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`;
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
