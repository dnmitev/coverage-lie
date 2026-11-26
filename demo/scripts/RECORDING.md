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

## Clip 5: `step-5-ci.mp4` (tag `step-5-ci`, on GitHub)

**Message:** in CI, on PRs, incremental, with a breaking threshold.

1. Show `stryker.config.json` thresholds `{ high: 80, low: 60, break: 50 }`.
2. Show `.github/workflows/mutation-pr.yml`: cache restore of `stryker-incremental.json`, `npx stryker run`, job summary, artifact.
3. On GitHub, open the demo PR **"Demo: weak tests"** (it brings back the step 2 tests):
   - `Tests` workflow: ✅ green, 100% coverage.
   - `Mutation testing (PR)`: ❌ red, `Final mutation score 45.71 under breaking threshold 50`.
   - Open the job summary table and download the `mutation-report` artifact.
4. Punchline: "Same PR. Coverage says ship it. Stryker says no."
