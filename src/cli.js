const os = require('os');
const path = require('path');
const { copyDir, exists, log } = require('./lib/util');
const { findCoreDir, loadCore } = require('./lib/load');
const { validate } = require('./lib/validate');
const { compile, checkDrift, driftWarnings } = require('./lib/compile');
const { renderDiagram } = require('./lib/diagram');
const { startStudio } = require('./lib/studio-server');
const { loadState, saveState, renderStatus, setPhase, logEvent, defaultState } = require('./lib/state');
const { diffCore, updateCore } = require('./lib/diff');
const { route, routeTable } = require('./lib/route');
const { write } = require('./lib/util');

const VERSION = require('../package.json').version;

const HELP = `rensei-kata v${VERSION} — graph-driven AI engineering loop

Usage:
  npx rensei-kata init [dir] [--global] [--force] [--target claude|opencode|all]
                                                Install the loop into a project
  npx rensei-kata build [--dir <path>] [--target …]   Recompile agents/commands/docs
  npx rensei-kata validate [--dir <path>] [--json]    Check graph + artifact drift
  npx rensei-kata doctor [--dir <path>]               Alias for validate
  npx rensei-kata graph [--dir <path>]                Regenerate only the HTML diagram
  npx rensei-kata studio [--dir <path>] [--port N]    Visual ⇄ YAML bidirectional editor
  npx rensei-kata status [--dir <path>]               Where the loop is right now
      status --start "task"      start a loop (enters at the graph entry)
      status --set <phase>       record entering a phase (agents do this)
      status --note "…"          append a gate decision / finding
      status --reset             clear the loop state
  npx rensei-kata route "request text" [--list]       Test kata routing (no tokens spent)
  npx rensei-kata diff [--dir <path>]                 Your .rensei/ vs the packaged core
  npx rensei-kata update [--dir <path>] [--force]     Pull core updates (local edits win)
  npx rensei-kata --version

How it works:
  .rensei/rensei.graph.yaml is the single source of truth.
  Edit it (or any agent.yaml / prompt.md / fragment), then run \`build\` —
  every generated artifact (agents, commands, RENSEI.md, graph.html)
  reflects the change. Targets: .claude/ (default) or .opencode/ or both.

Workflow:
  1. init     → copies the core into <dir>/.rensei/ and compiles
  2. edit     → .rensei/ is yours; the packaged core is only the default
  3. build    → regenerates agents, commands, RENSEI.md, graph.html
  4. status   → the agents keep .rensei/state.json current as they run the loop
`;

function parseFlags(args) {
  const flags = { dir: null, global: false, force: false, port: null, json: false, target: null, start: null, set: null, note: null, reset: false, list: false };
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--global') flags.global = true;
    else if (a === '--force') flags.force = true;
    else if (a === '--json') flags.json = true;
    else if (a === '--list') flags.list = true;
    else if (a === '--reset') flags.reset = true;
    else if (a === '--dir') flags.dir = args[++i];
    else if (a.startsWith('--dir=')) flags.dir = a.slice(6);
    else if (a === '--port') flags.port = args[++i];
    else if (a.startsWith('--port=')) flags.port = a.slice(7);
    else if (a === '--target') flags.target = args[++i];
    else if (a.startsWith('--target=')) flags.target = a.slice(9);
    else if (a === '--start') flags.start = args[++i] !== undefined ? args[i] : '';
    else if (a.startsWith('--start=')) flags.start = a.slice(8);
    else if (a === '--set') flags.set = args[++i];
    else if (a.startsWith('--set=')) flags.set = a.slice(6);
    else if (a === '--note') flags.note = args[++i];
    else if (a.startsWith('--note=')) flags.note = a.slice(7);
    else if (!a.startsWith('-')) positional.push(a);
    else { log.err(`unknown flag: ${a}`); process.exit(2); }
  }
  if (flags.target && !['claude', 'opencode', 'all'].includes(flags.target)) {
    log.err(`unknown target "${flags.target}" — use claude, opencode or all`);
    process.exit(2);
  }
  return { flags, positional };
}

function targetDirOf(flags, positional) {
  if (flags.global) return os.homedir();
  return path.resolve(flags.dir || positional[0] || process.cwd());
}

function runValidate(core, targetDir, { quiet = false, json = false } = {}) {
  const { errors, warnings, issues } = validate(core);
  const drift = checkDrift(targetDir);
  const driftMsgs = driftWarnings(drift);
  if (json) {
    console.log(JSON.stringify({
      ok: errors.length === 0,
      errors: issues.errors,
      warnings: issues.warnings,
      drift: drift.map(d => ({ file: d.file, kind: d.kind })),
    }, null, 2));
    return errors.length === 0;
  }
  if (!quiet || errors.length || warnings.length || drift.length) {
    log.info(`\nValidating ${core.coreDir}`);
    for (const e of errors) log.err(e);
    for (const w of warnings) log.warn(w);
    for (const d of driftMsgs) log.warn(d);
  }
  if (!errors.length && !warnings.length && !drift.length) log.ok('graph is valid — no errors, no warnings, no drift');
  else if (!errors.length) log.ok(`valid with ${warnings.length + driftMsgs.length} warning(s)`);
  return errors.length === 0;
}

function cmdInit(flags, positional) {
  const target = targetDirOf(flags, positional);
  if (!exists(target)) {
    log.err(`directory does not exist: ${target}`);
    process.exit(1);
  }
  log.info(`Installing rensei-kata into ${target}${flags.global ? ' (global)' : ''}\n`);

  // 1. seed .rensei/ from the packaged core (user edits win unless --force)
  const renseiDir = path.join(target, '.rensei');
  const { written, skipped } = copyDir(require('./lib/load').PACKAGE_CORE, renseiDir, { force: flags.force });
  log.ok(`.rensei/ seeded (${written.length} files${skipped.length ? `, ${skipped.length} kept — use --force to overwrite` : ''})`);

  // 2. compile from the freshly seeded .rensei/
  const core = loadCore(findCoreDir(target));
  if (!runValidate(core, target, { quiet: true })) {
    log.err('graph validation failed — fix .rensei/rensei.graph.yaml and run `npx rensei-kata build`');
    process.exit(1);
  }
  const { written: compiled, claudeMdAction } = compile(core, target, { global: flags.global, target: flags.target || 'claude' });
  for (const f of compiled) log.ok(path.relative(target, f));
  log.ok(claudeMdAction);

  log.info(`
Done. Next steps:
  1. Open the project in Claude Code (or your editor of choice)
  2. Try: /kata evalúa este requerimiento — or /rensei for the full loop
  3. Watch the loop: npx rensei-kata status
  4. Edit .rensei/rensei.graph.yaml (or npx rensei-kata studio), then: npx rensei-kata build
`);
}

function cmdBuild(flags, positional) {
  const target = targetDirOf(flags, positional);
  const core = loadCore(findCoreDir(target));
  log.info(`Building from ${core.coreDir}\n`);
  if (!runValidate(core, target)) process.exit(1);
  const { written, claudeMdAction } = compile(core, target, { global: flags.global, target: flags.target || 'claude' });
  log.info('');
  for (const f of written) log.ok(path.relative(target, f));
  log.ok(claudeMdAction);
}

function cmdValidate(flags, positional) {
  const target = targetDirOf(flags, positional);
  const core = loadCore(findCoreDir(target));
  const ok = runValidate(core, target, { json: flags.json });
  process.exit(ok ? 0 : 1);
}

function cmdGraph(flags, positional) {
  const target = targetDirOf(flags, positional);
  const core = loadCore(findCoreDir(target));
  const file = path.join(target, '.rensei', 'graph.html');
  write(file, renderDiagram(core));
  log.ok(path.relative(target, file));
}

function cmdStatus(flags, positional) {
  const target = targetDirOf(flags, positional);
  const core = loadCore(findCoreDir(target));
  const stateFile = path.join(target, '.rensei', 'state.json');
  const any = flags.start !== null || flags.set || flags.note || flags.reset;

  if (!any) {
    const { active, text } = renderStatus(target, core);
    console.log(text);
    if (active) console.log('\nupdate: npx rensei-kata status --set <phase> · --note "…" · --reset');
    return;
  }

  if (flags.reset) {
    if (exists(stateFile)) require('fs').rmSync(stateFile);
    log.ok('loop state cleared');
    return;
  }

  let state = loadState(target);
  if (!state) {
    if (flags.set && !flags.start) {
      log.err('no active loop — start one first: npx rensei-kata status --start "task"');
      process.exit(1);
    }
    state = defaultState();
    state.created_at = new Date().toISOString();
    state.task = flags.start || '(unnamed)';
    state.phase = null;
    logEvent(state, 'start', { note: state.task });
    log.ok(`loop started: ${state.task}`);
  } else if (flags.start !== null && flags.start !== '') {
    state.task = flags.start;
    logEvent(state, 'task', { note: flags.start });
    log.ok(`task set: ${flags.start}`);
  }

  if (flags.set) {
    const r = setPhase(state, core.graph, flags.set, flags.note);
    if (!r.ok) { log.err(r.error); process.exit(1); }
    log.ok(`phase: ${flags.set}`);
  } else if (flags.note) {
    logEvent(state, 'note', { note: flags.note });
    log.ok('note recorded');
  }
  if (!flags.set && flags.note && flags.start === null && !loadState(target)) {
    // unreachable: handled above
  }
  saveState(target, state);
}

function cmdRoute(flags, positional) {
  const target = targetDirOf(flags, positional);
  const core = loadCore(findCoreDir(target));
  if (flags.list) {
    const rows = routeTable(core);
    for (const r of rows) console.log(`${r.lang}  ${r.agent.padEnd(10)} ${String(r.where).padEnd(22)} "${r.trigger}"`);
    return;
  }
  const text = positional.join(' ');
  if (!text) { log.err('usage: npx rensei-kata route "corrige este bug en el login" (or --list)'); process.exit(2); }
  const { matches } = route(core, text);
  if (!matches.length) {
    log.warn('no trigger matched — kata would fall back to @gate (evaluate first)');
    return;
  }
  const top = matches[0];
  log.ok(`→ @${top.agent}  (score ${top.score})`);
  for (const h of top.hits) log.info(`    matched (${h.lang}): "${h.trigger}" ×${h.count} — ${h.where}`);
  for (const m of matches.slice(1)) {
    log.info(`  also @${m.agent} (score ${m.score}): ${m.hits.slice(0, 3).map(h => `"${h.trigger}"`).join(', ')}`);
  }
  log.info('\n(tie-break rules live in the compiled /kata command — this is the deterministic pre-view)');
}

function cmdDiff(flags, positional) {
  const target = targetDirOf(flags, positional);
  if (!exists(path.join(target, '.rensei', 'rensei.graph.yaml'))) {
    log.err(`no .rensei/ in ${target} — run: npx rensei-kata init`);
    process.exit(1);
  }
  const rows = diffCore(target);
  if (!rows.length) { log.ok('.rensei/ matches the packaged core exactly'); return; }
  log.info(`.rensei/ vs packaged core (v${VERSION}):\n`);
  for (const r of rows) {
    const label = { changed: 'changed', missing: 'missing (core has it, you do not)', 'local-only': 'local-only (not in core)' }[r.status];
    (r.status === 'changed' ? log.warn : log.info)(`${label.padEnd(34)} ${r.file}`);
  }
  log.info('\npull core updates: npx rensei-kata update   (your changes are kept; --force overwrites)');
}

function cmdUpdate(flags, positional) {
  const target = targetDirOf(flags, positional);
  if (!exists(path.join(target, '.rensei', 'rensei.graph.yaml'))) {
    log.err(`no .rensei/ in ${target} — run: npx rensei-kata init`);
    process.exit(1);
  }
  const { toWrite, kept } = updateCore(target, { force: flags.force });
  for (const f of toWrite) log.ok(`updated  ${f}`);
  for (const f of kept) log.warn(`kept your version of ${f} (core changed — diff: npx rensei-kata diff · force with --force)`);
  if (!toWrite.length && !kept.length) log.ok('nothing to update — .rensei/ already matches the core');
  if (toWrite.length) {
    log.info('\nrecompiling…');
    const core = loadCore(findCoreDir(target));
    if (runValidate(core, target, { quiet: true })) {
      const { written } = compile(core, target, { target: flags.target || 'claude' });
      log.ok(`recompiled ${written.length} artifacts`);
    } else {
      log.err('validation failed after update — fix .rensei/rensei.graph.yaml, then: npx rensei-kata build');
    }
  }
}

function cmdStudio(flags, positional) {
  const target = targetDirOf(flags, positional);
  const port = Number(flags.port) || 4789;
  startStudio(target, { port });
  // Keep the process alive — the server is the command.
}

function main(argv) {
  const [cmd, ...rest] = argv;
  const { flags, positional } = parseFlags(rest);

  switch (cmd) {
    case 'init': return cmdInit(flags, positional);
    case 'build': return cmdBuild(flags, positional);
    case 'validate':
    case 'doctor': return cmdValidate(flags, positional);
    case 'graph': return cmdGraph(flags, positional);
    case 'status': return cmdStatus(flags, positional);
    case 'route': return cmdRoute(flags, positional);
    case 'diff': return cmdDiff(flags, positional);
    case 'update': return cmdUpdate(flags, positional);
    case 'studio': return cmdStudio(flags, positional);
    case '--version':
    case '-v': return console.log(VERSION);
    case '--help':
    case '-h':
    case undefined: return console.log(HELP);
    default:
      log.err(`unknown command: ${cmd}\n`);
      console.log(HELP);
      process.exit(2);
  }
}

module.exports = { main };
