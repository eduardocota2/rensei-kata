const path = require('path');
const YAML = require('yaml');
const { read, exists, listDirs, listFiles } = require('./util');

const PACKAGE_CORE = path.join(__dirname, '..', '..', 'core');

// The project's own .rensei/ wins over the packaged core — that's where
// per-environment customization lives after `init`.
function findCoreDir(targetDir) {
  const local = path.join(targetDir, '.rensei');
  return exists(path.join(local, 'rensei.graph.yaml')) ? local : PACKAGE_CORE;
}

function loadCore(coreDir) {
  const graphFile = path.join(coreDir, 'rensei.graph.yaml');
  const configFile = path.join(coreDir, 'rensei.config.yaml');
  if (!exists(graphFile)) throw new Error(`No rensei.graph.yaml in ${coreDir}`);

  const graph = YAML.parse(read(graphFile));
  const config = exists(configFile) ? YAML.parse(read(configFile)) : {};

  const agents = new Map();
  for (const name of listDirs(path.join(coreDir, 'agents'))) {
    const dir = path.join(coreDir, 'agents', name);
    const defFile = path.join(dir, 'agent.yaml');
    if (!exists(defFile)) continue;
    agents.set(name, {
      def: YAML.parse(read(defFile)),
      prompt: exists(path.join(dir, 'prompt.md')) ? read(path.join(dir, 'prompt.md')) : '',
    });
  }

  const fragments = new Map();
  for (const f of listFiles(path.join(coreDir, 'fragments'), '.md')) {
    fragments.set(f.replace(/\.md$/, ''), read(path.join(coreDir, 'fragments', f)));
  }

  const rules = new Map();
  for (const f of listFiles(path.join(coreDir, 'rules'), '.md')) {
    rules.set(f, read(path.join(coreDir, 'rules', f)));
  }

  const reference = new Map();
  for (const f of listFiles(path.join(coreDir, 'reference'), '.md')) {
    reference.set(f, read(path.join(coreDir, 'reference', f)));
  }

  const prompts = new Map();
  for (const f of listFiles(path.join(coreDir, 'prompts'), '.md')) {
    prompts.set(f, read(path.join(coreDir, 'prompts', f)));
  }

  return { coreDir, graph, config, agents, fragments, rules, reference, prompts };
}

module.exports = { findCoreDir, loadCore, PACKAGE_CORE };
