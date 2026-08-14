const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
}

function exists(p) {
  return fs.existsSync(p);
}

function listDirs(dir) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

function listFiles(dir, ext) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => !ext || f.endsWith(ext));
}

// Copy src dir into dest. If force=false, existing files are kept (user edits win).
// Returns { written: [], skipped: [] } with paths relative to dest.
function copyDir(src, dest, { force = false } = {}) {
  const written = [];
  const skipped = [];
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      const sub = copyDir(s, d, { force });
      written.push(...sub.written.map(f => path.join(entry.name, f)));
      skipped.push(...sub.skipped.map(f => path.join(entry.name, f)));
    } else if (force || !exists(d)) {
      ensureDir(dest);
      fs.copyFileSync(s, d);
      written.push(entry.name);
    } else {
      skipped.push(entry.name);
    }
  }
  return { written, skipped };
}

// {{PATH.TO.VALUE}} interpolation against a plain object.
function interpolate(text, scope) {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, key) => {
    let v = scope;
    for (const part of key.split('.')) {
      v = v == null ? undefined : v[part];
    }
    return v === undefined ? m : String(v);
  });
}

// $PATH.TO.VALUE resolution (used in graph edge `max` fields).
function resolveVar(value, scope) {
  if (typeof value !== 'string' || !value.startsWith('$')) return value;
  let v = scope;
  for (const part of value.slice(1).split('.')) {
    v = v == null ? undefined : v[part];
  }
  return v === undefined ? value : v;
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

const log = {
  ok: msg => console.log(`  ✓ ${msg}`),
  warn: msg => console.log(`  ⚠ ${msg}`),
  err: msg => console.error(`  ✗ ${msg}`),
  info: msg => console.log(msg),
};

module.exports = { ensureDir, read, write, exists, listDirs, listFiles, copyDir, interpolate, resolveVar, toPosix, log };
