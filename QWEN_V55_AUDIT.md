# Qwen V5.5 Source Audit
**Tactical Intelligence Defects in Cage v5.5 (T3)**

1. **Pressing Chance Independence from Opponent Tactic**
   - **Issue**: `engage` calculation uses only local variables, ignoring opponent's tactical policy (`dpol`) for pressing chance.
   - **Evidence**: Line 12 shows `engage` depends on `dpol.blockHeight` but not `dpol.pressTrigger` or other press-related parameters.
   - **Fix**: Add `+dpol.pressTrigger*(x===1?.15:0)` to engage calculation.

2. **Outlet Guarantee Violation**
   - **Issue**: `U.outlet=Q.outlet*pol.directness` doesn't ensure receiver exists.
   - **Evidence**: Line 38-39 allows outlet without checking if runner exists (`runner`).
   - **Fix**: Add conditional: `if(runner) U.outlet=Q.outlet*pol.directness;`

3. **Turn/Positional Decision Incoherence**
   - **Issue**: Positional decisions don't consider spatial constraints.
   - **Evidence**: Lines 45-47 use hardcoded `x` values without checking if positions are available.
   - **Fix**: Add spatial validation: `if(availablePositions.includes(target)) move(q,target);`

4. **No Goal Prevention Mechanism**
   - **Issue**: No explicit goal prevention in T3 mode.
   - **Evidence**: Lines 50-52 lack goal safety checks.
   - **Fix**: Add goal check: `if(score[0]===score[1] && t>P.timedSeconds/2) pol.riskAppetite*=0.8;`

5. **Inconsistent Ball Possession Tracking**
   - **Issue**: Possession tracking doesn't account for transition phases.
   - **Evidence**: Lines 54-56 don't consider transition state in possession calculation.
   - **Fix**: Add transition check: `if(transition) s[poss].team.poss+=e.t-prev*0.5;`

**Tests**:
- Pressing chance should vary with opponent's pressTrigger
- Outlet should only occur when runner exists
- Ball position should be validated before movement
- Goal safety should activate at tie games
- Possession tracking should adjust for transitions

**Balance Gates**:
- Pressing chance must be bounded (0.95 max)
- Outlet probability must be ≤ 1.0
- Possession tracking must remain within [0,100] range