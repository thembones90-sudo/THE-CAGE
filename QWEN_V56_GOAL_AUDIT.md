### **P0 Risk: Replay scoring twice (duplicate goal events)**

#### **Source-based risk**
In `goal-experience.js`, the function `goalData()` does not validate that a replayed goal event is not already scored in the timeline. If `replay=true` and the same goal index (`goal.i`) exists in both the original timeline and the replay, there's no mechanism to prevent duplicate scoring or presentation.

#### **Test gap**
No test ensures that replayed goals do not cause double-scoring logic (e.g., in UI or audio) — even though the system is supposed to be deterministic and only present actual events.

#### **Smallest fix**
Add a check inside `goalData()` to ensure that if `replay === true`, then `goal.i` must not already exist in `timeline.goals` with a matching `tau`. This prevents replayed goals from being treated as new scoring events.

```js
if (replay && timeline.goals.some(g => g.i === goal.i && g.tau === goal.tau)) {
  throw Error('Replay goal must not duplicate existing timeline goal');
}
```

---

### **P1 Risk: Unescaped names in markup**

#### **Source-based risk**
In `markup()` function, the `scorer` and `assist` fields are escaped using `escapeText()`, but `cue.teamName` is passed directly into HTML without escaping.

#### **Test gap**
No test validates that team names containing special characters like `<script>` or `&` do not break DOM rendering or XSS.

#### **Smallest fix**
Escape `cue.teamName` in the markup function:

```js
const names = escapeText(cue.teamName);
```

---

### **P1 Risk: Audio enabled by default (violates opt-in requirement)**

#### **Source-based risk**
In `goal-audio.js`, the `create()` function returns an API where `setEnabled(true)` is not called by default. However, if any part of the codebase calls `play()` without first calling `setEnabled(true)`, audio may play unintentionally.

#### **Test gap**
No test ensures that `play()` fails unless `setEnabled(true)` has been explicitly invoked.

#### **Smallest fix**
Ensure `play()` checks `enabled` before proceeding and throws or returns early if not enabled:

```js
function play(replay=false){
  if(!enabled||disposed||!ctx||ctx.state==='closed')return false;
  ...
}
```

This is already present, but we should add a test to assert that `play()` returns `false` when not explicitly enabled.

---

### **P2 Risk: Missing reduced-motion support in FX rendering**

#### **Source-based risk**
In `fx.js`, the `paintNet()` and `paintGolden()` functions accept `reducedMotion` as a parameter, but they do not fully respect it in all visual effects. For example, `goldenParticles()` still generates particles even when `reducedMotion=true`.

#### **Test gap**
No test ensures that particle generation or animation is skipped when `reducedMotion=true`.

#### **Smallest fix**
Modify `goldenParticles()` to return an empty array when `reducedMotion` is true:

```js
function goldenParticles(cue,tau){
 if(!cue||cue.type!=='goal'||reducedMotion)return [];
 ...
}
```

Also ensure `paintGolden()` skips rendering entirely if `reducedMotion` is true.

---

### **P2 Risk: Stage overlay handoff reliability on real browsers**

#### **Source-based risk**
The code does not include any explicit handling for browser-specific quirks or timing issues during overlay transitions (e.g., canvas resize, animation frame sync). While the module itself is pure, it relies on external systems like `requestAnimationFrame`, which may behave inconsistently across browsers.

#### **Test gap**
No test simulates browser behavior under various conditions such as slow rendering or multiple tabs.

#### **Smallest fix**
Add a comment in documentation or inline to warn developers about potential timing issues and suggest using `requestIdleCallback` or similar fallbacks for stage overlays. Alternatively, add a minimal test that mocks `requestAnimationFrame` and asserts correct behavior.

---

### Summary Table

| Priority | Risk Description | Source File | Fix |
|---------|------------------|-------------|-----|
| P0 | Replay scoring twice (duplicate goal events) | `goal-experience.js` | Add validation in `goalData()` to prevent replayed goals from duplicating timeline entries |
| P1 | Unescaped names in markup | `goal-experience.js` | Escape `cue.teamName` in