// Browser smoke-test checklist for the offline v0.2 build.
// Run manually in DevTools after opening index.html; the pure engine functions
// are intentionally kept in the page for the no-build prototype.
console.assert(typeof search === 'function');
console.assert(search('Djalminha').matches[0].id === 'djalminha');
console.assert(search('R9').matches[0].id === 'ronaldo-nazario');
console.assert(search('Sinisa Mihajlovic').matches[0].id === 'sinisa-mihajlovic');
console.assert(search('').error);
console.assert(search('made up player').error);
