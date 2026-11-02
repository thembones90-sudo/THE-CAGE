'use strict';
// Coin toss presentation: shows the toss the draft already drew (crypto RNG), never decides it; the CPU waits for it;
// automated runs skip it; the front page loads it before the draft; reduced motion is respected.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const ct = read('src/coin-toss.js'), rd = read('src/random-draft.js'), page = read('draft.html'), css = read('design/coin-toss.css');
assert(!/Math\.random|getRandomValues/.test(ct), 'the coin toss module draws no randomness');
assert(/game\.winner=randomInt\(2\)\?'A':'B'/.test(rd), 'the draft still draws the toss with its crypto RNG');
assert(/showToss\(\);handoff\(\)/.test(rd), 'the toss is shown before the handoff so the CPU can wait for it');
assert(/CageCoinToss\.after\(go\)/.test(rd), 'the CPU first pick waits until the toss is dismissed');
assert(page.indexOf('src/coin-toss.js') > 0 && page.indexOf('src/coin-toss.js') < page.indexOf('src/random-draft.js'), 'draft.html loads the toss before the draft');
assert(page.includes('design/coin-toss.css') && page.includes('class="intro-steps"') && page.includes('class="fp-coin"'), 'front page v2 markup and styles');
assert(/prefers-reduced-motion:reduce/.test(css) && /prefers-reduced-motion: reduce/.test(ct), 'reduced motion respected');
// Behaviour in a minimal DOM-less host: automated runs resolve instantly and after() runs immediately.
const ran = [], c = { window: { CAGE_INSTANT_TOSS: true }, navigator: {}, location: { pathname: '/draft.html' }, setTimeout, clearTimeout, Promise };
vm.createContext(c); vm.runInContext(ct, c);
const T = c.window.CageCoinToss; let resolved = false;
T.show({ winner: 'B', round: 2, order: ['B', 'A', 'B', 'A', 'B', 'A'] }).then(() => { resolved = true; });
assert.equal(T.active, false, 'automated runs never block'); T.after(() => ran.push(1)); assert.deepEqual(ran, [1], 'after() runs immediately when no toss is showing');
setTimeout(() => { assert(resolved, 'show() resolves'); console.log('COIN_TOSS_PASS presentation only (no RNG), CPU waits for the toss, automated runs skip it, front page v2 assets wired, reduced motion respected'); }, 0);
