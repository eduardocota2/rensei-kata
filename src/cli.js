const os = require('os');
const path = require('path');
const { copyDir, exists, log } = require('./lib/util');
const { findCoreDir, loadCore } = require('./lib/load');
const { validate } = require('./lib/validate');
const { compile, checkDrift, driftWarnings } = require('./lib/compile');
const { renderDiagram } = require('./lib/diagram');
const { startStudio } = require('./lib/studio-server');
const { loadState, saveState, renderStatus, setPhase, logEvent, enterPhase, defaultState } = require('./lib/state');
const { diffCore, updateCore } = require('./lib/diff');
const { route, routeTable } = require('./lib/route');
const { scaffoldAgents } = require('./lib/scaffold');
const { doctor, doctorReport } = require('./lib/doctor');
const { write } = require('./lib/util');

const VERSION = require('../package.json').version;

const HELP = `rensei-kata v${VERSION} — graph-driven AI engineering loop

Usage:
  npx rensei-kata init [dir] [--global] [--force] [--target claude|opencode|codex|all]
                                                Install the loop into a project
  npx rensei-kata build [--dir <path>] [--target …]   Recompile agents/commands/docs
  npx rensei-kata validate [--dir <path>] [--json]    Check graph + artifact drift
  npx rensei-kata doctor [--dir <path>] [--json]      Check environment: git, runtimes, SDD tool, entry blocks
  npx rensei-kata graph [--dir <path>]                Regenerate only the HTML diagram
  npx rensei-kata studio [--dir <path>] [--port N]    Visual ⇄ YAML bidirectional editor
  npx rensei-kata status [--dir <path>]               Where the loop is right now
      status --start "task"      start a loop (also auto-starts on first --set)
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
  reflects the change. Targets: .claude/ (default), .opencode/, .codex/ — or all.

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
  if (flags.target && !['claude', 'opencode', 'codex', 'all'].includes(flags.target)) {
    log.err(`unknown target "${flags.target}" — use claude, opencode, codex or all`);
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

// Detect the runtime this project already uses — artifacts, config files and
// installed CLIs all count. Explicit --target always wins over detection.
// AGENTS.md is shared by opencode and codex: it scores both; the dedicated
// dirs (.opencode/, .codex/) break the tie. Ties keep the historical default.
function detectRuntime(targetDir) {
  const clues = { claude: 0, opencode: 0, codex: 0 };
  if (exists(path.join(targetDir, '.claude'))) clues.claude += 2;
  if (exists(path.join(targetDir, 'CLAUDE.md'))) clues.claude += 1;
  if (exists(path.join(targetDir, '.opencode'))) clues.opencode += 2;
  if (exists(path.join(targetDir, 'opencode.json')) || exists(path.join(targetDir, 'opencode.jsonc'))) clues.opencode += 1;
  if (exists(path.join(targetDir, '.codex'))) clues.codex += 2;
  if (exists(path.join(targetDir, 'AGENTS.md'))) { clues.opencode += 1; clues.codex += 1; }
  const reasons = { claude: 'this project already uses Claude Code', opencode: 'this project already uses OpenCode', codex: 'this project already uses Codex' };
  const [best, score] = Object.entries(clues).sort((a, b) => b[1] - a[1])[0];
  if (score > 0) return { runtime: best, reason: reasons[best] };
  return null; // no signal — stay on the default
}

function cmdInit(flags, positional) {
  const target = targetDirOf(flags, positional);
  if (!exists(target)) {
    log.err(`directory does not exist: ${target}`);
    process.exit(1);
  }
  log.info(`Installing rensei-kata into ${target}${flags.global ? ' (global)' : ''}\n`);

  // 0. target: explicit flag wins; otherwise follow what the project already uses
  let targetFlag = flags.target;
  if (!targetFlag) {
    const detected = detectRuntime(target);
    if (detected) {
      targetFlag = detected.runtime;
      log.info(`detected ${detected.runtime} (${detected.reason}) — compiling for it; override with --target`);
    }
  }

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
  const { written: compiled, claudeMdAction, purged, relocated, relocatedKept } = compile(core, target, { global: flags.global, target: targetFlag || core.config.RUNTIME || 'claude' });
  for (const f of compiled) log.ok(path.relative(target, f));
  log.ok(claudeMdAction);
  for (const f of purged || []) log.ok(`purged ${f} (agent no longer in the graph)`);
  for (const f of relocated || []) log.ok(`removed misplaced ${f} (leftover from a pre-0.5.1 codex build)`);
  for (const f of relocatedKept || []) log.warn(`left ${f} — generated by an old codex build but hand-edited since; delete it yourself if unwanted`);

  // environment advice after install — never blocks, just informs
  const checks = doctor(target, core);
  const warns = checks.filter(c => c.status !== 'ok');
  if (warns.length) {
    log.info('\nEnvironment notes:');
    for (const c of warns) log.warn(`${c.msg}${c.hint ? ` — ${c.hint}` : ''}`);
  }

  const runCmd = (targetFlag || core.config.RUNTIME) === 'codex'
    ? '$rensei login with Google OAuth\n     (or dispatch single requests with $kata)'
    : '/rensei login with Google OAuth\n     (or dispatch single requests with /kata)';
  log.info(`
Done. Next steps:
  1. Open the project in your AI runtime (Claude Code, OpenCode, Codex)
  2. Run a task end-to-end: ${runCmd}
  3. Watch the loop: npx rensei-kata status
  4. Edit .rensei/rensei.graph.yaml (or npx rensei-kata studio), then: npx rensei-kata build
`);
}

function cmdBuild(flags, positional) {
  const target = targetDirOf(flags, positional);
  let core = loadCore(findCoreDir(target));
  log.info(`Building from ${core.coreDir}\n`);

  // node = agent: scaffold .rensei/agents/<id>/ for every new node first, so
  // validation and compilation see a complete world (consumes based_on copies)
  const sc = scaffoldAgents(core.coreDir, core.graph);
  for (const id of sc.created) {
    const seed = sc.seededFrom[id] ? ` (seeded from @${sc.seededFrom[id]} — unlinked copy)` : '';
    log.ok(`agents/${id}/ scaffolded${seed}`);
  }
  if (sc.created.length) {
    const fs = require('fs');
    fs.writeFileSync(path.join(core.coreDir, 'rensei.graph.yaml'), require('yaml').stringify(core.graph, { indent: 2 }));
    core = loadCore(findCoreDir(target)); // reload with the new agents
  }

  if (!runValidate(core, target)) process.exit(1);
  const { written, claudeMdAction, purged, relocated, relocatedKept } = compile(core, target, { global: flags.global, target: flags.target || core.config.RUNTIME || 'claude' });
  log.info('');
  for (const f of written) log.ok(path.relative(target, f));
  log.ok(claudeMdAction);
  for (const f of purged || []) log.ok(`purged ${f} (agent no longer in the graph)`);
  for (const f of relocated || []) log.ok(`removed misplaced ${f} (leftover from a pre-0.5.1 codex build)`);
  for (const f of relocatedKept || []) log.warn(`left ${f} — generated by an old codex build but hand-edited since; delete it yourself if unwanted`);
}

function cmdDoctor(flags, positional) {
  const target = targetDirOf(flags, positional);
  const core = loadCore(findCoreDir(target));
  const checks = doctor(target, core);
  if (flags.json) return console.log(doctorReport(checks, { json: true }));
  log.info(`\nEnvironment check — ${target}`);
  console.log(doctorReport(checks));
  process.exit(checks.some(c => c.status === 'err') ? 1 : 0);
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
    // auto-start: recording a phase or a note is enough to open the loop —
    // an explicit --start is welcome but never a gate the user must pass
    state = defaultState();
    state.created_at = new Date().toISOString();
    if (flags.start) {
      state.task = flags.start;
    } else {
      state.task = flags.set ? `loop (entered at ${flags.set})` : '(unnamed)';
    }
    logEvent(state, 'start', { note: flags.start || 'auto-started on first phase record' });
    log.ok(flags.start ? `loop started: ${state.task}` : `loop auto-started: ${state.task}`);
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
  const primary = matches.filter(m => !m.on_demand);
  const alt = matches.filter(m => m.on_demand);
  if (!primary.length) {
    log.warn(`no loop agent matched — closest is ${alt.map(m => '@' + m.agent).join(', ')} (on-demand, outside your graph)`);
    return;
  }
  const top = primary[0];
  log.ok(`→ @${top.agent}  (score ${top.score})`);
  for (const h of top.hits) log.info(`    matched (${h.lang}): "${h.trigger}" ×${h.count} — ${h.where}`);
  for (const m of primary.slice(1)) {
    log.info(`  also @${m.agent} (score ${m.score}): ${m.hits.slice(0, 3).map(h => `"${h.trigger}"`).join(', ')}`);
  }
  for (const m of alt) {
    log.info(`  suggestion @${m.agent} (score ${m.score}) — on-demand, not in your graph`);
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
      const { written } = compile(core, target, { target: flags.target || core.config.RUNTIME || 'claude' });
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
    case 'validate': return cmdValidate(flags, positional);
    case 'doctor': return cmdDoctor(flags, positional);
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
