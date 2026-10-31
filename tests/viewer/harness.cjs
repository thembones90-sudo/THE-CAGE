// Shared Node harness for viewer tests: loads browser modules into a vm context.
'use strict';
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.resolve(__dirname, '../..');

const ENGINE_FILES = ['players', 'roster-expansion', 'roster-100', 'roster-101', 'roster-103', 'roster-pl-134', 'roster-135', 'roster-136', 'roster-139', 'roster-140', 'roster-141', 'roster-149', 'roster-165', 'roster-178', 'roster-classification', 'roster-refinement', 'tactical-refinement', 'roster-182', 'roster-trait-family-v16', 'natural-positions', 'engine/legacy-v04', 'cage-engine', 'cage-commentary', 'replay/records'];
const VIEWER_PURE = ['coords', 'layout', 'timeline', 'clock'];

function run(ctx, rel) { vm.runInContext(fs.readFileSync(path.join(root, rel), 'utf8'), ctx, { filename: rel }); }

// Engine context: only used by the fixture generator, never by the viewer itself.
function loadEngine() {
  const c = { window: {} }; c.globalThis = c; vm.createContext(c);
  for (const f of ENGINE_FILES) run(c, 'src/' + f + '.js');
  return c.window;
}

// Viewer context: pure viewer modules only. Math.random and Date are booby-trapped
// so any accidental use inside the timeline path throws.
function loadViewer({ trap = true } = {}) {
  const c = { window: {}, console };
  if (trap) {
    const M = Object.create(Math); M.random = () => { throw Error('Math.random used by viewer'); };
    c.Math = M;
    c.Date = function () { throw Error('Date used by viewer'); }; c.Date.now = c.Date;
    c.performance = { now() { throw Error('performance.now used by viewer'); } };
  }
  vm.createContext(c);
  for (const f of VIEWER_PURE) run(c, 'src/viewer/' + f + '.js');
  return c.window;
}

function fixture(name = 't3-schema1-seed42.json') { return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8')); }

function deepFreeze(v) { if (v && typeof v === 'object' && !Object.isFrozen(v)) { Object.values(v).forEach(deepFreeze); Object.freeze(v); } return v; }

module.exports = { root, loadEngine, loadViewer, fixture, deepFreeze };
