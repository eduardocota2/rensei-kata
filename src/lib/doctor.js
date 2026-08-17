// Environment doctor — the checks validate can't do. validate guards the
// GRAPH; doctor guards the WORLD the graph will run in: git, runtime CLIs,
// the configured SDD tool, generated artifacts and loop state. `init` runs it
// silently (advice only); `doctor` runs it as a first-class command.

const { execSync } = require('child_process');
const path = require('path');
const { exists, read } = require('./util');

function tryCmd(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe', timeout: 8000, shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/sh' });
    return true;
  } catch (e) {
    return false;
  }
}

function hasBin(bin) {
  const probe = process.platform === 'win32'
    ? `Get-Command ${bin} -ErrorAction SilentlyContinue`
    : `command -v ${bin}`;
  try {
    execSync(probe, { stdio: 'pipe', timeout: 8000, shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/sh' });
    return true;
  } catch (e) {
    return false;
  }
}

// which runtimes this project has artifacts for
function detectTargets(targetDir) {
  const t = [];
  if (exists(path.join(targetDir, '.claude'))) t.push('claude');
  if (exists(path.join(targetDir, '.opencode'))) t.push('opencode');
  return t.length ? t : ['claude'];
}

function doctor(targetDir, core) {
  const checks = [];
  const add = (id, status, msg, hint) => checks.push({ id, status, msg, hint });

  // 1. git — the loop's commit protocol assumes it
  if (exists(path.join(targetDir, '.git'))) add('git', 'ok', 'git repository present');
  else add('git', 'warn', 'no git repository — the loop\'s commit protocol (one commit per task/fix) will not work', 'run: git init');

  // 2. runtime CLI — artifacts exist, but is the runtime installed?
  const binOf = { claude: 'claude', opencode: 'opencode' };
  for (const t of detectTargets(targetDir)) {
    const bin = binOf[t];
    if (!bin) continue;
    if (hasBin(bin)) add(`runtime:${t}`, 'ok', `${bin} CLI found in PATH`);
    else add(`runtime:${t}`, 'warn', `${t} artifacts compiled but the ${bin} CLI is not in PATH`, `install the ${t} CLI, or rebuild with another --target`);
  }

  // 3. node/npx — the state protocol shells out to rensei-kata
  if (hasBin('node') && hasBin('npx')) add('node', 'ok', 'node + npx available (status protocol will work)');
  else add('node', 'warn', 'node/npx not in PATH — agents will fail to run `npx rensei-kata status`', 'install Node.js >= 18');

  // 4. SDD tool — referenced by config; only required if the gate can reach level full
  const sdd = core.config && core.config.SDD_TOOL;
  if (sdd) {
    if (hasBin(sdd)) add(`sdd:${sdd}`, 'ok', `${sdd} CLI found (SDD_TOOL)`);
    else add(`sdd:${sdd}`, 'warn', `SDD_TOOL is "${sdd}" but its CLI is not in PATH — level-full changes will fail at spec generation`, `install ${sdd}, or set SDD_TOOL to a tool you have, or "none"`);
  }

  // 5. entry point doc — follow the compiled artifacts, not the config flag:
  //    claude artifacts → CLAUDE.md; opencode artifacts → AGENTS.md
  const targets = detectTargets(targetDir);
  const entryChecks = [];
  if (targets.includes('claude')) entryChecks.push(['CLAUDE.md', 'claude']);
  if (targets.includes('opencode')) entryChecks.push(['AGENTS.md', 'opencode']);
  if (!entryChecks.length) entryChecks.push(['CLAUDE.md', 'claude']);
  for (const [md, rt] of entryChecks) {
    const mdFile = path.join(targetDir, md);
    if (exists(mdFile)) {
      const content = read(mdFile);
      if (content.includes('rensei-kata:start')) add('entry', 'ok', `${md} carries the rensei managed block`);
      else add('entry', 'warn', `${md} exists but lacks the rensei managed block`, 'run: npx rensei-kata build');
    } else {
      add('entry', 'warn', `${md} missing (${rt} target) - the runtime won't load the methodology`, 'run: npx rensei-kata build --target ' + rt);
    }
  }

  // 6. graph sanity via the existing validator is done by validate; doctor
  //    only checks its presence so `doctor` alone gives the full picture
  if (exists(path.join(targetDir, '.rensei', 'rensei.graph.yaml'))) add('graph', 'ok', '.rensei/rensei.graph.yaml present (run `validate` for deep checks)');
  else add('graph', 'err', '.rensei/rensei.graph.yaml missing', 'run: npx rensei-kata init');

  return checks;
}

function doctorReport(checks, { json = false } = {}) {
  if (json) return JSON.stringify(checks, null, 2);
  const icon = { ok: '✓', warn: '⚠', err: '✗' };
  const lines = checks.map(c =>
    `  ${icon[c.status]} ${c.msg}${c.hint ? `\n      → ${c.hint}` : ''}`);
  const warns = checks.filter(c => c.status === 'warn').length;
  const errs = checks.filter(c => c.status === 'err').length;
  const summary = errs
    ? `environment: ${errs} error(s), ${warns} warning(s)`
    : warns
      ? `environment: healthy with ${warns} warning(s)`
      : 'environment: all checks passed';
  return lines.join('\n') + '\n\n  ' + summary;
}

module.exports = { doctor, doctorReport };
