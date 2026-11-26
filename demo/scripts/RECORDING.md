# Recording script

Five clips, one per git tag. Each clip is 1–3 minutes. Save as `slides/public/videos/<name>.mp4` (1080p).

## Setup (once)

- Terminal: dark theme, font size ≥ 20, window ~1600×900, hide the prompt clutter (`PS1='$ '`).
- Editor: VS Code, zoom +2, minimap off, only `demo/` open.
- Browser at 125% zoom for the HTML reports.
- `cd demo` for every command below.
- Between clips: `git checkout <tag> && npm ci` (do it off-camera).

Expected numbers below come from real runs (Node 26, macOS). Your timings will differ a bit, the counts should not.

---

## Clip 1: `step-1-green.mp4` (tag `step-1-green`)

**Message:** everything is green, we are proud.

1. Show `src/cart.ts` briefly. Pause on the comment `Spec: orders of 100 or more ship for free.` (don't point at the bug).
2. Show `test/cart.test.ts`. Scroll slowly past `checkout(items)` with no assertion.
3. Run:
   ```bash
   npm run coverage
   ```
   Expected: `Tests 12 passed (12)`, all four coverage lines at **100%**.
4. Optional: `open coverage/index.html`, show the all-green table.

---

## Clip 2: `step-2-reveal.mp4` (tag `step-2-reveal`)

**Message:** same tests, different question.

1. Show `stryker.config.json` (6 lines, nothing scary).
2. Run:
   ```bash
   npx stryker run
   ```
   Expected: `Instrumented 3 source file(s) with 50 mutant(s)`, finishes in ~2 s.
   Final table: **All files 58.00**, 29 killed, **21 survived**.
3. ```bash
   open reports/mutation/mutation.html
   ```
   Click through survivors, in this order:
   - `cart.ts`: `amount > FREE_SHIPPING_THRESHOLD` → `>=` survived. "Nobody tests the boundary."
   - `cart.ts`: `throw new Error('Cart is empty')` → `""` survived. "`toThrow()` accepts any error."
   - `coupon.ts`: `&&` → `||` survived. "Coupon validation is not tested at all, only its type."
   - `money.ts`: `amount * 100` → `amount / 100` survived. "Rounding is untested."

---

## Clip 3: `step-3-kill.mp4` (start at tag `step-2-reveal`)

**Message:** better tests, and the surviving mutant was a real bug.

1. Bring in the new tests only, keep the old code:
   ```bash
   git checkout step-3-kill -- test
   ```
2. Show the diff in the editor (Source Control view). Highlight exact values (`toBe(88.9)`, `toEqual({...})`) and the boundary tests at `99.99 / 100 / 100.01`.
3. Run:
   ```bash
   npm test
   ```
   Expected: **1 failed**: `ships for free at exactly the threshold`, `expected 5.99 to be +0`.
   Say: "Spec says 100 or more. Code says more than 100. 100% coverage, and this was never caught."
4. Fix it (type it on camera): in `src/cart.ts` change `>` to `>=`. Run `npm test` again: 18 passed.
5. Run `npx stryker run`. Expected: **98.00**, 1 survived: `coupon.value > amount`.
6. Open the report, show that mutant. Explain: equivalent, both return 0 when `value === amount`.
7. Bring in the disable comment:
   ```bash
   git checkout step-3-kill -- src
   ```
   Show the `// Stryker disable next-line ...: reason` line, run `npx stryker run`: **100.00**, 2 ignored.
   Point out: it also ignores the `<` mutant (same mutator, same line).

---

## Clip 4: `step-4-fast.mp4` (tag `step-4-fast`)

**Message:** run times are a config problem.

1. Show `stryker.config.json`: `checkers`, `typescriptChecker.experimentalNativePreview`, `incremental`, `ignoreStatic`, `concurrency`.
2. Show `package.json`: `typescript: 6.0.3` + `@typescript/native: npm:typescript@7.0.2`. One sentence on why (Stryker needs the TS JS API, TS 7 doesn't have it).
3. Fresh run:
   ```bash
   rm -rf reports && npx stryker run
   ```
   Expected log: `Using the experimental native TypeScript compiler preview (TypeScript 7)`.
   Table: 35 killed, **13 errors** (compile errors, never tested).
4. Run again without changes:
   ```bash
   npx stryker run
   ```
   Expected: `48 of 50 mutant result(s) are reused`, done in ~1 s.
5. Optional: show `bench/RESULTS.md` (the slide has the same table).

---

## Clip 5: `step-5-ci.mp4` (GitHub, `main` + PRs #1 and #2)

**Message:** in CI, on PRs, reported where reviewers look, new code held to a higher bar.

1. Show `stryker.config.json` thresholds `{ high: 80, low: 60, break: 50 }`.
2. Show `.github/workflows/mutation-pr.yml` briefly: Stryker, report, sticky comment, gates at the end.
3. Open PR **#1 "Demo: weak tests"**:
   - Checks: `Tests` ✅ (100% coverage), `Mutation testing (PR)` ❌.
   - Sticky comment: **🔴 45.71% (-54.29 vs main)**, survivors as diffs.
   - Punchline: "Same PR. Coverage says ship it. Stryker says no."
4. Open PR **#2 "Demo: bulk discount, agent-written tests"**:
   - Comment: overall **🟢 93.02%**, but **lines changed in this PR 🟡 70.00%**. The 3 survivors are marked 🆕.
   - "Files changed" tab: the yellow annotations on `cart.ts` lines 27–28 ("Surviving mutant (EqualityOperator)...").
   - Checks: failed step `Gates`: `Mutation score on changed lines: 70.00% (minimum 80%)`.
   - Say: "The overall average looked great. The new code wasn't tested."
5. Optional: README badge and https://dnmitev.github.io/coverage-lie/mutation/ (live report from main).

---

## Clip 6: `step-6-agents.mp4` (GitHub, PRs #2–#4)

**Message:** Stryker as the reviewer of agent-written tests.

1. PR #2 → Checks → artifact `mutation-report` → open `agent-prompt.md`: 3 surviving mutants, rules (don't touch `src/`, no disable comments).
2. Open PR **#3 "Demo: bulk discount, silenced"**: the diff adds `// Stryker disable next-line all`.
   - Comment headline: **🟢 100.00% · ⚠️ 8 mutant(s) ignored on lines changed in this PR**.
   - Section "⚠️ 2 new `Stryker disable` comment(s)", both "no reason given".
   - Checks: `Gates` ❌ with error annotations on the two comment lines.
   - Say: "Perfect score. Zero testing. The agent gamed the metric, the gate caught it."
3. Open PR **#4 "Demo: bulk discount"**: tests with exact values and the 2/3 boundary.
   - Comment: 🟢 100% on changed lines, all checks green.

---

## Clip 7: `step-7-zod.mp4` (GitHub, PRs #5–#6)

**Message:** a Zod schema is static code; with `ignoreStatic: true` Stryker doesn't look at it.

1. Open PR **#5 "Demo: Zod schema, agent-written tests"**. Show `src/coupon-schema.ts` in the diff and the two tests (`toBeDefined()`, `toThrow()`).
   - `Tests` ✅, 100% coverage.
   - Comment headline: **🟢 90.70% · ⚠️ 18 mutant(s) ignored on lines changed in this PR (18 static, "ignoreStatic" is on)**.
   - Table: lines changed in this PR **🟠 50.00%** (4 killed, 4 survived, 18 ignored). `Gates` ❌.
   - Say: "Green overall. Most of the schema was never mutated."
2. Open PR **#6 "Demo: Zod schema"**.
   - Diff: `stryker.config.json` keeps `"ignoreStatic": true` and excludes `!src/**/*-schema.ts`; new `stryker.schemas.config.mjs` mutates only the schemas with `ignoreStatic: false` and `break: 90`.
   - The new tests: regex anchors `AB-CDE` / `ABC-DE`, bounds `AB` / 21 chars, `value: 100` vs `101`, exact error messages.
   - Checks: the job has two Stryker steps (main + schemas); the comment merges both.
   - Comment: 🟢 100% on changed lines, 23 killed, 0 ignored. All green.
   - Say: "Stryker now mutates the schema: toUpperCase → toLowerCase, max → min, regex anchors. It still never mutates the numbers or .positive(). Test those anyway."
