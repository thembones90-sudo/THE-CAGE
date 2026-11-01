// Single source of truth for tests that check the CURRENT game, not a historical decision.
// Update here when the roster grows or the live engine changes. Historical-decision tests
// load the roster as it was at the decision (see historicalScripts) instead.
'use strict';
module.exports = Object.freeze({
  CURRENT_ROSTER_SIZE: 194,
  CURRENT_ENGINE: 'cage-t3-13',
  REPLAY_ENGINES: ['cage-0.4.0', 'cage-t3-6', 'cage-t3-7', 'cage-t3-8', 'cage-t3-9', 'cage-t3-10', 'cage-t3-11', 'cage-t3-12', 'cage-t3-13'],
  // Recruitment overlays loaded after these files produced the 190- and 194-player rosters.
  SNAPSHOT_184_STOP: 'src/ace-recruitment-v1.js',
  SNAPSHOT_190_STOP: 'src/recruitment-four-v1.js',
  // Overlays that grew the roster beyond 184; skip them to rebuild the 184-player state with everything else loaded.
  RECRUITMENTS_AFTER_184: ['src/ace-recruitment-v1.js', 'src/di-canio-recruitment-v1.js', 'src/recruitment-four-v1.js'],
});
