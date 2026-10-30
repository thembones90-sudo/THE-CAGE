// THE CAGE launcher: serves the bundled game on localhost and opens the default browser.
const http = require('node:http');
const { exec } = require('node:child_process');
const sea = require('node:sea');

// Must match the "assets" list in sea-config.json.
const ASSETS = ['index.html', 'src/players.js', 'src/cage-engine.js', 'src/cage-commentary.js', 'src/showdown.js', 'src/cage-ui.css'];
const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8' };
const FILES = Object.fromEntries(ASSETS.map(a => ['/' + a, [a, TYPES[a.split('.').pop()]]]));
FILES['/'] = FILES['/index.html'];

const server = http.createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const entry = FILES[path];
  if (!entry) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': entry[1], 'Cache-Control': 'no-store' });
  res.end(sea.getAsset(entry[0], 'utf8'));
});

server.listen(0, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  console.log('THE CAGE is running at ' + url);
  console.log('Close this window to quit.');
  if (!process.env.CAGE_NO_BROWSER) exec(`start "" "${url}"`);
});
