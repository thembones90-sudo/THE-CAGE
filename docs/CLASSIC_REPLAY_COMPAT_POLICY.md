# THE CAGE — Classic Replay Compatibility Policy

The Classic v0.4.0 simulation ignores player traits. Nevertheless, older replay records included full player objects, and historical traits contributed to the roster fingerprint.

**No engine may silently invent an old player profile.** When traits, ratings or roster fields are updated, the following is required:

1. Preserve an exact read-only snapshot of the old values, with the old source commit and version recorded.
2. Permit a historical fingerprint only for the engine and roster version it actually represents.
3. Accept a save only after verifying complete match-event records and reproducing them byte-for-byte under that exact engine.
4. If the engine is unavailable or the fingerprint differs from all explicitly supported snapshots, preserve the original save, block re-simulation, and offer JSON export.
5. Never reuse an engine version for behavior-changing code. Experimental T3 versions do not substitute for one another.
6. Require the portable Classic parity test, the historical three-round saved-showdown test, malformed-save tests, and the real browser restore check before every release.

**Currently supported:** current Classic fingerprint plus frozen V5.3 182-player Classic trait fingerprint captured in `proposals/trait-v15-classic-compat.json`. This specific compatibility is implemented in `src/replay/records.js`.

**Not supported:** arbitrary earlier roster revisions, or T3-v3/v4 replays under T3-v5. Those must fail closed and preserve exportable data.

Fingerprints are unkeyed FNV hashes, not cryptographic digital signatures. They are metadata checks for consistency; the full deterministic resimulation is the actual gameplay integrity check. Do not claim resistance to a malicious local user deliberately editing their own game files.
