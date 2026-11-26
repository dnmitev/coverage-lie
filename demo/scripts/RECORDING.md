# Recording script

Seven clips. Save as `slides/public/videos/<file>` (1080p, H.264 MP4). The deck shows a placeholder until a file exists.

## Time budget

| # | File | Source | Target | Slide |
|---|---|---|---|---|
| 1 | `demo-1-green.mp4` | tag `step-1-green` | **1:00** | Demo 1: all green |
| 2 | `demo-2-reveal.mp4` | tag `step-2-reveal` | **2:30** | Demo 2: Stryker enters the chat |
| 3 | `demo-3-kill.mp4` | tag `step-2-reveal` → `step-3-kill` | **3:00** | Demo 3: kill them all |
| 4 | `demo-4-fast.mp4` | tag `step-4-fast` | **2:00** | Demo 4: go fast |
| 5 | `demo-5-ci.mp4` | GitHub, PRs #1–#2 | **2:30** | Demo 5: in CI |
| 6 | `demo-6-zod.mp4` | GitHub, PRs #5–#6 | **2:00** | Demo 6: Zod in a PR |
| 7 | `demo-7-agents.mp4` | GitHub, PRs #2–#4 | **2:30** | Demo 7: agents in the loop |
| | | | **15:30** | |

The speaker guide (`slides/SPEAKER_GUIDE.md`) plans each demo slide as clip length + ~15 s to set it up. If a clip runs long, cut the "Cut first" items, then speed up waits; don't speed up typing or explanations.

## Recording for Zoom

Zoom re-encodes your screen share, and small text turns to mush first.

- **Bigger than you think:** terminal font ≥ 22, VS Code zoom +3, browser zoom 150% on GitHub and the HTML report.
- **Record silent, narrate live.** You keep control of the pacing, can react to chat, and a re-recording never needs a re-take of your voice. (If you prefer narrated clips, record the voice separately and keep it short.)
- **Cut dead time** (npm ci, page loads, CI waiting) in editing. Stryker runs here take 2–6 s, keep those real.
- **One action per moment:** move the mouse to what you talk about, then stop moving it. Zoom drops frames on fast mouse movement.
- **Play the clips from the deck** (Slidev presenter mode on your second screen). In Zoom: Share screen → the deck window, tick **"Share sound"** (only matters for narrated clips) and **"Optimize for video clip"**.
- Do a test share with a colleague: can they read `stryker.config.json` and the PR comment table on a laptop screen?

## Setup (once)

- Terminal: dark theme, `PS1='$ '`, window ~1600×900.
- Editor: VS Code, minimap off, only `demo/` open.
- `cd demo` for every terminal command below.
- Between clips: `git checkout <tag> && npm ci` (off camera).

Expected numbers come from real runs (Node 26, macOS). Timings differ a bit, counts should not.

---

## Clip 1: `demo-1-green.mp4` · tag `step-1-green` · target 1:00

**Message:** everything is green, we are proud.

1. Show `src/cart.ts` briefly. Pause on the comment `Spec: orders of 100 or more ship for free.` (don't point at the bug).
2. Show `test/cart.test.ts`. Scroll slowly past `checkout(items)` with no assertion.
3. `npm run coverage` → `Tests 12 passed (12)`, all four coverage lines at **100%**.

Cut first: step 1.

---

## Clip 2: `demo-2-reveal.mp4` · tag `step-2-reveal` · target 2:30

**Message:** same tests, different question.

1. Show `stryker.config.json` (6 lines, nothing scary).
2. `npx stryker run` → `Instrumented 3 source file(s) with 50 mutant(s)`, ~2 s.
   Table: **All files 58.00**, 29 killed, **21 survived**.
3. `open reports/mutation/mutation.html`, click through survivors in this order:
   - `cart.ts`: `amount > FREE_SHIPPING_THRESHOLD` → `>=` survived. "Nobody tests the boundary."
   - `cart.ts`: `throw new Error('Cart is empty')` → `""` survived. "`toThrow()` accepts any error."
   - `coupon.ts`: `&&` → `||` survived. "Coupon validation is not tested at all, only its type."
   - `money.ts`: `amount * 100` → `amount / 100` survived. "Rounding is untested."

Cut first: the `money.ts` and `coupon.ts` survivors (keep the shipping one, it's the setup for clip 3).

---

## Clip 3: `demo-3-kill.mp4` · tag `step-2-reveal` → `step-3-kill` · target 3:00

**Message:** better tests, and the surviving mutant was a real bug.

1. Bring in the new tests only, keep the old code: `git checkout step-3-kill -- test`
2. Source Control view: highlight exact values (`toBe(88.9)`, `toEqual({...})`) and the boundary tests at `99.99 / 100 / 100.01`.
3. `npm test` → **1 failed**: `ships for free at exactly the threshold`, `expected 5.99 to be +0`.
4. Fix it on camera: in `src/cart.ts` change `>` to `>=`. `npm test` → 18 passed.
5. `npx stryker run` → **98.00**, 1 survived: `coupon.value > amount`. Show it in the report (equivalent mutant).
6. `git checkout step-3-kill -- src`, show the `// Stryker disable next-line ...: reason` line, `npx stryker run` → **100.00**, 2 ignored.

Cut first: step 6 (the slides after the demo explain the disable comment).

---

## Clip 4: `demo-4-fast.mp4` · tag `step-4-fast` · target 2:00

**Message:** run times are a config problem.

1. Show `stryker.config.json`: `checkers`, `typescriptChecker.experimentalNativePreview`, `incremental`, `ignoreStatic`, `concurrency`.
2. Show `package.json`: `typescript: 6.0.3` + `@typescript/native: npm:typescript@7.0.2`.
3. `rm -rf reports && npx stryker run` → `Using the experimental native TypeScript compiler preview (TypeScript 7)`; 35 killed, **13 errors** (compile errors, never tested).
4. `npx stryker run` again → `48 of 50 mutant result(s) are reused`, ~1 s.

Cut first: step 2 (the TS 7 slide right after covers it).

---

## Clip 5: `demo-5-ci.mp4` · GitHub, PRs #1–#2 · target 2:30

**Message:** in CI, on PRs, reported where reviewers look, new code held to a higher bar.

1. PR **#1 "Demo: weak tests"**:
   - Checks: `Tests` ✅ (100% coverage), `Mutation testing (PR)` ❌.
   - Sticky comment: **🔴 45.71% (-54.29 vs main)**, survivors as diffs.
   - "Same PR. Coverage says ship it. Stryker says no."
2. PR **#2 "Demo: bulk discount, agent-written tests"**:
   - Comment: overall **🟢 93.02%**, but **lines changed in this PR 🟡 70.00%**; the 3 survivors are marked 🆕.
   - "Files changed" tab: the annotations on `cart.ts` lines 27–28.
   - Checks: failed step `Gates`: `Mutation score on changed lines: 70.00% (minimum 80%)`.
   - "The overall average looked great. The new code wasn't tested."

Cut first: the Checks tab on PR #2 (the comment already says it).

---

## Clip 6: `demo-6-zod.mp4` · GitHub, PRs #5–#6 · target 2:00

**Message:** a Zod schema is static code; with `ignoreStatic: true` Stryker doesn't look at it.

1. PR **#5 "Demo: Zod schema, agent-written tests"**: `src/coupon-schema.ts` and the two tests (`toBeDefined()`, `toThrow()`) in the diff.
   - Comment headline: **🟢 90.70% · ⚠️ 18 mutant(s) ignored on lines changed in this PR (18 static, "ignoreStatic" is on)**.
   - Table: lines changed **🟠 50.00%** (4 killed, 4 survived, 18 ignored). `Gates` ❌.
   - "Green overall. Most of the schema was never mutated."
2. PR **#6 "Demo: Zod schema"**:
   - Diff: `stryker.config.json` excludes `!src/**/*-schema.ts`; `stryker.schemas.config.mjs` mutates only schemas, `ignoreStatic: false`, `break: 90`.
   - Checks: two Stryker steps (main + schemas); the comment merges both: 🟢 100% on changed lines, 23 killed, 0 ignored.

Cut first: scrolling through the new tests in PR #6.

---

## Clip 7: `demo-7-agents.mp4` · GitHub, PRs #2–#4 · target 2:30

**Message:** Stryker as the reviewer of agent-written tests.

1. PR #2 → Checks → artifact `mutation-report` → open `agent-prompt.md`: 3 surviving mutants and the rules (don't touch `src/`, no disable comments).
2. PR **#3 "Demo: bulk discount, silenced"**: the diff adds `// Stryker disable next-line all`.
   - Comment headline: **🟢 100.00% · ⚠️ 8 mutant(s) ignored on lines changed in this PR (8 by disable comments)**.
   - Section "⚠️ 2 new `Stryker disable` comment(s)", both "no reason given". `Gates` ❌.
   - "Perfect score. Zero testing. The agent gamed the metric, the gate caught it."
3. PR **#4 "Demo: bulk discount"**: exact values and the 2/3 boundary → 🟢 100% on changed lines, all green.

Cut first: downloading the artifact (show `agent-prompt.md` from a local copy instead).
