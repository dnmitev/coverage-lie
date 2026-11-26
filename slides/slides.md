---
title: The 100% Code Coverage Lie
info: Finding hidden bugs with mutation testing. DEV.BG JavaScript, 28.01.2027.
author: Dimitar Mitev
theme: default
colorSchema: dark
fonts:
  sans: Montserrat
  mono: Fira Code
transition: fade
layout: cover
class: cover
---

# The 100% Code Coverage Lie

## Finding hidden bugs with mutation testing

<div class="muted mt-10">Dimitar Mitev · <!-- TODO: position / company --></div>

<!--
Hook: ask the room. "Hands up if your project has a coverage gate in CI." Keep hands up if it's above 80. Above 90. Anyone at 100? Great, this talk is about you.
-->

---
layout: center
---

<div class="big">Who has a coverage gate in CI?</div>

<div class="muted mt-6">keep your hand up if it's ≥ 80%</div>

<!--
Count hands. Joke: "The rest of you, I envy your honesty."
-->

---
layout: center
---

<Meme src="this-is-fine.jpg" top="coverage: 100%" bottom="prod: 🔥" width="26rem" />

<!--
Agenda point 1: the green-report illusion.
Everyone has seen it: the badge is green, the dashboard is green, the sprint review screenshot is green. And on Friday evening something with a perfectly covered line breaks in prod.
-->

---
layout: center
---

<div class="big">Green CI ≠ working code</div>

<div class="muted mt-6">it means your code <strong>ran</strong>. that's it.</div>

<!--
The whole talk in one sentence. Coverage answers "did this line execute during the tests?" It never answers "would any test fail if this line were wrong?"
-->

---
layout: center
---

# Coverage measures execution

```ts {all|3|all}
it('checks out', () => {
  // Look ma, no assertions!
  checkout(items);
});
```

<div class="muted mt-4">100% line coverage. 0% verification.</div>

<!--
Agenda point 2. This is a real test from the demo repo. It executes every line of checkout. Coverage tool is happy. It would pass if checkout returned the wrong total, a negative total, or a pizza emoji.
-->

---
layout: center
---

<Meme src="is-this-a-pigeon.jpg" top="calling a function" bottom="is this a test?" width="26rem" />

<!--
Calling code is not testing code. A test is an assertion about behaviour.
-->

---
layout: center
---

# The usual suspects

```ts
expect(subtotal(items)).toBeDefined();           // 0 is defined. so is NaN.
expect(applyCoupon(100, c)).toBeLessThan(100);   // 99.99? sure.
expect(() => checkout([])).toThrow();            // any error. even a typo.
expect(typeof isCouponValid(c, 100, now)).toBe('boolean'); // 🤡
```

<!--
Four patterns everyone has written (me too). All of them push coverage up, none of them pin down behaviour. Point at the typeof boolean one, wait for laughs.
-->

---
layout: center
---

<div class="big">"When a measure becomes a target, it ceases to be a good measure."</div>

<div class="muted mt-6">Goodhart's law</div>

<!--
Set a coverage target and people will hit it, with the cheapest tests possible. Nobody is evil, the metric just rewards running code, not checking it.
-->

---
layout: center
---

<div class="big">Who tests the tests?</div>

<!--
Transition to agenda point 3. We review code, we lint code, we type-check code. Tests are code. Who checks that they actually catch anything?
-->

---
layout: center
---

# Mutation testing in one slide

<v-clicks>

1. Take your code, break it on purpose (a **mutant**)
2. Run your tests
3. Tests fail → mutant **killed** ✅
4. Tests pass → mutant **survived** 🧟

</v-clicks>

<div v-click class="mt-8 big">score = killed / all</div>

<!--
The idea is from 1971, Richard Lipton. It was just too slow for 40 years. Now it isn't.
If you can change the code and no test notices, that code isn't really tested.
-->

---
layout: center
---

# What a mutant looks like

```diff
- return amount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
+ return amount > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
```

```diff
- return coupon.expiresAt > now && orderAmount >= coupon.minOrder;
+ return coupon.expiresAt > now || orderAmount >= coupon.minOrder;
```

```diff
- throw new Error('Cart is empty');
+ throw new Error("");
```

<div class="muted mt-4">the bugs you would write on a Friday afternoon</div>

<!--
Mutators simulate real mistakes: off-by-one, wrong boolean operator, removed block, wrong string, flipped condition. Stryker has ~30 of them for JS/TS.
-->

---
layout: center
---

# Mutant statuses

| | |
|---|---|
| **Killed** | a test failed. good. |
| **Survived** | all tests passed. bad. |
| **No coverage** | no test even ran it. worse. |
| **Timeout** | infinite loop. counts as killed. |
| **Compile error** | TypeScript said no. not counted. |
| **Ignored** | you said no. with a reason, hopefully. |

<!--
Keep this short. The ones that matter: survived and no coverage.
-->

---
layout: center
---

<img src="https://stryker-mutator.io/images/stryker.svg" class="w-40 mx-auto" />

# StrykerJS

<div class="muted">JS · TS · Vitest · Jest · Mocha · Karma · Cucumber</div>

<!--
Agenda point 4. StrykerJS, open source, v10 today. Works with every popular runner. We use Vitest 5 and TypeScript 7.
Demo: a small shopping cart pricing module. Subtotal, coupons, free shipping over 100.
-->

---
layout: center
---

# Demo 1: all green

<Clip src="step-1-green.mp4" tag="step-1-green" />

<!--
Video: tests pass, coverage 100% across statements, branches, functions, lines. Celebrate ironically.
-->

---
layout: center
---

# Demo 2: Stryker enters the chat

<Clip src="step-2-reveal.mp4" tag="step-2-reveal" />

<!--
Video: npx stryker run, 50 mutants, 21 survived. Open the HTML report, click through a few survivors.
-->

---
layout: center
---

<div class="huge">100% → 58%</div>

<div class="muted mt-6">same tests. same code. different question.</div>

<!--
Coverage: 100%. Mutation score: 58.00%. 21 of 50 mutants survived. Let that sink in.
-->

---
layout: center
---

<Meme src="surprised-pikachu.jpg" top="writes tests to hit 100% coverage" bottom="mutation score: 58%" width="24rem" />

---
layout: center
---

# Demo 3: kill them all

<Clip src="step-3-kill.mp4" tag="step-3-kill" />

<!--
Video: replace weak assertions with exact values, add boundary tests (99.99 / 100 / 100.01).
The boundary test at exactly 100 FAILS. Spec says "100 or more ships free", code says ">". That's the real bug.
-->

---
layout: center
---

# The surviving mutant was a bug report

```diff
  /** Spec: orders of 100 or more ship for free. */
- return amount > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
+ return amount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
```

<div class="muted mt-6">the bug lived on a 100% covered line</div>

<!--
This is the punchline of the demo. Stryker didn't find the bug directly. It showed that no test cared about the boundary. The moment we wrote one, the bug fell out. Customers with exactly 100 in the cart paid 5.99 shipping.
-->

---
layout: center
---

<div class="huge">58% → 98%</div>

<div class="muted mt-6">one survivor left. and it's unkillable.</div>

---
layout: center
---

# Making it practical

<div class="muted">reading results · equivalent mutants · run times</div>

<!--
Agenda point 5. The usual objections: "too noisy", "too slow". Let's talk about both.
-->

---
layout: center
---

# Equivalent mutants

```ts
if (coupon.value >= amount) {   // mutant: coupon.value > amount
  return 0;
}
return roundMoney(amount - coupon.value);  // amount - amount = 0 anyway
```

<Meme src="they-are-the-same.jpg" top="" bottom="" width="14rem" />

<!--
An equivalent mutant changes the code but not the behaviour. No test can ever kill it. When value === amount both paths return 0.
-->

---
layout: center
---

# What to do with them

<v-clicks>

- **Refactor**: often it's redundant code telling you something
- **Ignore with a reason**:

```ts
// Stryker disable next-line EqualityOperator: '>' and '>=' both return 0 when value === amount
```

- ⚠️ that also ignores `<`, which *was* killable. disable as narrow as you can.
- **Accept** 98%. 100% mutation score is the new 100% coverage. don't chase it.

</v-clicks>

---
layout: center
---

<Meme src="one-does-not-simply.jpg" top="one does not simply" bottom="run all mutants on every PR" width="26rem" />

<!--
Cost: every mutant can mean a test run. 5,000 mutants × a 2 minute suite is your weekend.
-->

---
layout: center
---

# Keeping run times sane

```json
{
  "testRunner": "vitest",          // perTest coverage: only tests that hit the mutant
  "mutate": ["src/**/*.ts"],       // scope it
  "incremental": true,             // only re-test what changed
  "ignoreStatic": true,            // skip mutants in static init code
  "concurrency": 4,
  "checkers": ["typescript"],      // drop mutants that don't compile
  "typescriptChecker": { "experimentalNativePreview": true }  // TS 7 ⚡
}
```

<!--
Biggest wins in order: perTest coverage analysis (default with vitest runner), incremental mode, scoping mutate, then the checker.
-->

---
layout: center
---

# Demo 4: go fast

<Clip src="step-4-fast.mp4" tag="step-4-fast" />

<!--
Video: incremental run reuses 48 of 50 results in ~1 s. TS checker marks 13 mutants as compile errors, they never hit the test runner.
-->

---
layout: center
---

# TypeScript 7 🦫⚡

<v-clicks>

- native compiler (Go), ~10× faster type checks
- Stryker 10: `experimentalNativePreview` → TS 7 checks your mutants
- but TS 7 has **no classic JS API** and Stryker still needs it 🙃

</v-clicks>

<div v-click class="mt-6">

```json
"typescript": "6.0.3",                              // API shim for tooling
"@typescript/native": "npm:typescript@7.0.2"        // the real compiler
```

</div>

<!--
Real gotcha we hit while building the demo: Stryker core reads tsconfig via the TS JS API. With only TS 7 installed you get "ts.parseConfigFileTextToJson is not a function". Fix: TS 6 as "typescript" for tools, TS 7 under the @typescript/native alias.
-->

---
layout: center
---

# Checker benchmark

| Mutants | no checker | TS 6 checker | TS 7 native |
|---|---|---|---|
| 50 | 3.0 s | 15.0 s | **3.0 s** |
| 500 | 11.6 s | 18.1 s | **11.2 s** |
| 2,000 | 40.4 s | **40.9 s** | 55.5 s 🐢 |

<div class="muted mt-4">synthetic: demo × N, M-series Mac, concurrency 4 · <code>demo/bench</code></div>

<div v-click class="big mt-6">it depends™</div>

<!--
Synthetic workload: the demo cloned N times. Fast unit tests, so the checker can't save much test time here; with slow tests it saves more. TS 6 checker has startup cost, TS 7 native is close to free. Native checks mutants one by one, no grouping yet, watch it at large mutant counts.
-->

---
layout: center
---

# Adopting it in your team

<div class="muted">where to start · CI · thresholds</div>

<!--
Agenda point 6.
-->

---
layout: center
---

# Where to start

<v-clicks>

1. one module that **matters** (pricing, auth, permissions)
2. run locally, read the report, fix 3 survivors
3. add to CI as **report only** (`break: null`)
4. raise the bar slowly
5. never as a vanity badge. *we've been here before*

</v-clicks>

---
layout: center
---

# Thresholds

```json
"thresholds": { "high": 80, "low": 60, "break": 50 }
```

| | |
|---|---|
| ≥ high | 🟢 |
| ≥ low | 🟡 |
| < break | ❌ CI fails |

<!--
Start with break low or null. The goal is the conversation in code review, not another number to game.
-->

---
layout: center
---

# Demo 5: in CI

<Clip src="step-5-ci.mp4" tag="step-5-ci" />

<!--
Video: PR workflow, incremental baseline from main via actions/cache, score in job summary, HTML report as artifact. Nightly job does a full --force run.
-->

---
layout: center
---

<Meme src="drake.jpg" top="" bottom="" width="20rem" />

<div class="grid grid-cols-2 gap-4 mt-4 text-xl">
  <div>❌ coverage: 100%</div>
  <div>✅ mutation score: 80%</div>
</div>

---
layout: center
---

# Takeaways

<v-clicks>

1. Coverage = code **ran**. Mutation score = code is **checked**.
2. A surviving mutant is a bug report waiting to happen.
3. Start small, incremental in CI, don't make it a vanity metric.

</v-clicks>

<!--
Agenda point 7.
-->

---
layout: center
---

<div class="big">Try it on Monday</div>

```bash
npm init stryker@latest
```

<div class="mt-8">

**github.com/dnmitev/coverage-lie**

</div>

<!--
TODO: add a QR code to the repo.
-->

---
layout: end
---

# Questions?

<div class="muted mt-6">github.com/dnmitev · <!-- TODO: LinkedIn --></div>
