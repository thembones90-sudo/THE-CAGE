# T3-12 Code Audit and Resolutions

## Independent Claude audit and corrective changes

An independent read-only Sonnet code audit of the original T3-12 candidate found one P1 release blocker: a completed midfield link could wrongly contribute shot quality to a subsequent free kick. The fix explicitly clears the link on a foul and excludes `kind==='fk'` from linked chances. Goalkeeper set-piece taking remains **not implemented**.

Replay validation was also strengthened: a shot credit must name the passer from an actual completed forward pass that arrived at x>=2, and the receiver and exact bounded bonus must match. The link is cleared on restarts, turnarounds, rebounds, fouls and shot attempts, and cannot be stacked. A negative test for forged link evidence recomputes the result hash and confirms validation still rejects it.

The dedicated 960-match test after this correction observed 11,163 eligible pass events, 1,672 linked shot attempts, 436 linked goals and 1,489 free kicks, **all without a free-kick link bonus**, with zero simulation failures. The negative forged-evidence test passed.

The version issue discovered during integration was also resolved: global T3-11 parameter definitions are unchanged, T3-12 exposes its own frozen tactical profiles and parameter identity `t3-space-6`, and saved replays use each archived engine's own tactic definitions. Earlier replay hashes and GK30/GK50 catalogs remain preserved.

**Not yet addressed:** defender-only low scoring and high overtime share; creator-heavy high-goal results; full-roster balance across more than the three sampled archetypes. The new link creates a bounded chance-quality reward rather than an automatic goal or a stat multiplier.
