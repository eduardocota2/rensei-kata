// diff/update — compare the project's .rensei/ against the packaged core.
// `diff` is read-only reporting; `update` reseeds (user-modified files win
// unless --force), so an installed project can follow core improvements
// without losing its customization.

const path = require('path');
const { read, exists } = require('./util');
const { PACKAGE_CORE } = require('./load');

function walkFiles(dir, base) {
  const fs = require('fs');
  const out = [];
  if (!exists(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(p, base));
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

// ignore generated + volatile files when comparing against the core
const IGNORE = new Set([
  'state.json',
  'build-manifest.json',
  'graph.html',
  'RENSEI.md',
]);

function diffCore(targetDir) {
  const renseiDir = path.join(targetDir, '.rensei');
  const coreFiles = walkFiles(PACKAGE_CORE, PACKAGE_CORE).filter(f => !IGNORE.has(f));
  const localFiles = walkFiles(renseiDir, renseiDir).filter(f => !IGNORE.has(f));

  const rows = [];
  const all = [...new Set([...coreFiles, ...localFiles])].sort();
  for (const rel of all) {
    const inCore = coreFiles.includes(rel);
    const inLocal = localFiles.includes(rel);
    if (inCore && !inLocal) rows.push({ file: rel, status: 'missing' });
    else if (!inCore && inLocal) rows.push({ file: rel, status: 'local-only' });
    else {
      const a = read(path.join(PACKAGE_CORE, rel));
      const b = read(path.join(renseiDir, rel));
      if (a !== b) rows.push({ file: rel, status: 'changed' });
    }
  }
  return rows;
}

function copyFileSafe(rel, targetDir) {
  const fs = require('fs');
  const dest = path.join(targetDir, '.rensei', rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(PACKAGE_CORE, rel), dest);
}

// Policy: missing files arrive, identical files are no-ops, user-changed files
// are KEPT unless --force (their customization outranks the core update).
function updateCore(targetDir, { force = false } = {}) {
  const rows = diffCore(targetDir);
  const toWrite = [];
  const kept = [];
  for (const row of rows) {
    if (row.status === 'missing') toWrite.push(row.file);
    else if (row.status === 'changed') (force ? toWrite : kept).push(row.file);
  }
  for (const rel of toWrite) copyFileSafe(rel, targetDir);
  return { toWrite, kept, rows };
}

module.exports = { diffCore, updateCore, IGNORE };
