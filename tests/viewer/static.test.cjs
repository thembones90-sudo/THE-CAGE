// Static guards (T-V3, I5, I6) and offline packaging checks for the standalone viewer.
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { root } = require('./harness.cjs');
const results = [];
const test = (name, fn) => { fn(); results.push(name); };
const dir = path.join(root, 'src', 'viewer');
const src = f => fs.readFileSync(path.join(dir, f), 'utf8');
const code = f => src(f).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''); // comments may mention forbidden words
const viewerFiles = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'fixture-default.js');
const html = fs.readFileSync(path.join(root, 'viewer.html'), 'utf8');

test('T-V3/I6 no Math.random, Date or performance.now in pure modules', () => {
  for (const f of ['coords.js', 'layout.js', 'timeline.js', 'clock.js']) assert.doesNotMatch(code(f), /Math\.random|\bDate\b|performance\.now/, f);
});

test('I5 no simulate( call anywhere in the viewer or its page', () => {
  for (const f of viewerFiles) assert.doesNotMatch(code(f), /\bsimulate\s*\(|\.simulate\b/, f);
  const pageScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  assert.doesNotMatch(pageScripts, /\bsimulate\s*\(|\.simulate\b/);
});

test('viewer never shows probabilities: no reads of p / roll', () => {
  for (const f of viewerFiles) assert.doesNotMatch(code(f), /\b(e|ev|event)\.(p|roll)\b|\.roll\b/, f);
});

test('no generated gameplay: viewer code never pushes into or assigns the event log', () => {
  for (const f of viewerFiles) assert.doesNotMatch(code(f), /events\.(push|splice|unshift)|events\s*\[[^\]]*\]\s*=[^=]|result\.(score|winner|events)\s*=[^=]/, f);
});

test('offline: no remote URLs, every script/link is a local file that exists', () => {
  for (const f of viewerFiles) assert.doesNotMatch(src(f), /https?:\/\//, f);
  assert.doesNotMatch(html, /(src|href)\s*=\s*["']https?:/i, 'viewer.html must not load from a CDN');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  assert(refs.length > 10);
  for (const r of refs) assert(fs.existsSync(path.join(root, r)), 'missing local file ' + r);
  for (const f of ['coords', 'layout', 'timeline', 'clock', 'renderer', 'viewer', 'fixture-default']) assert(refs.includes('src/viewer/' + f + '.js'), f + ' not loaded');
});

test('page supports import, fixture fallback, touch and reduced motion', () => {
  assert.match(html, /type="file"/); assert.match(html, /CAGE_VIEWER_FIXTURE/); assert.match(html, /name="viewport"/);
  assert.match(src('viewer.css'), /prefers-reduced-motion/); assert.match(src('viewer.js'), /prefers-reduced-motion/);
  assert.match(src('viewer.css'), /touch-action:manipulation/); assert.match(src('viewer.css'), /@media \(max-width:640px\)/);
});

console.log('static.test: ' + results.length + ' passed');
