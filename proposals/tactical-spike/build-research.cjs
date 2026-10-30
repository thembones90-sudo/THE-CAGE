// Builds research engine variants with flags baked in.
//   node proposals/tactical-spike/build-research.cjs A1,A2,B1  ->  proposals/tactical-spike/variants/engine-research-A1+A2+B1.js
const fs = require('fs'), path = require('path');
const flags = (process.argv[2] || '').split(',').filter(f => f && f !== 'none');
const ratings = fs.readFileSync(path.join(__dirname, '..', 'ratings-v1.json'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, 'engine-research.src.js'), 'utf8');
const name = 'engine-research-' + (flags.join('+') || 'none') + '.js';
fs.mkdirSync(path.join(__dirname, 'variants'), { recursive: true });
const flagObj = Object.fromEntries(flags.map(f => [f, true]));
fs.writeFileSync(path.join(__dirname, 'variants', name), '// GENERATED — edit engine-research.src.js\nconst RATINGS_V1 = ' + ratings + ';\nconst SPIKE_FLAGS = ' + JSON.stringify(flagObj) + ';\n' + src);
console.log(path.join('proposals', 'tactical-spike', 'variants', name));
