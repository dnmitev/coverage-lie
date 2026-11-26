# Speaker guide

Generated from `slides.md` speaker notes by `node speaker-guide.mjs`. Do not edit by hand.

**Planned talk time:** 61:35 (63 slides, of which 17:15 on the 7 demo slides, video + intro)

## Overview

| Section | Slides | Time | Ends at |
|---|---|---|---|
| Intro | 1–3 | 2:15 | 2:15 |
| 1 · The green-report illusion | 4–5 | 1:05 | 3:20 |
| 2 · Coverage measures execution | 6–9 | 3:20 | 6:40 |
| 3 · Mutation testing in a nutshell | 10–14 | 4:50 | 11:30 |
| 4 · StrykerJS: how it works + demo | 15–25 | 12:55 | 24:25 |
| 5 · Making it practical | 26–33 | 8:20 | 32:45 |
| 5 · The fine print | 34–43 | 8:15 | 41:00 |
| 6 · Adopting it in your team | 44–51 | 10:00 | 51:00 |
| AI agents write the tests now | 52–59 | 7:50 | 58:50 |
| 7 · Takeaways & Q&A | 60–63 | 2:45 | 61:35 |

## Intro

### 1. The 100% Code Coverage Lie

⏱ 0:30 · at 0:30

Camera on. One sentence: "100% coverage tells you your code ran, not that it's tested. Today: how to find out what your tests really check." Tell them: questions in the Zoom chat any time, I'll take them at the end.

### 2. Dimitar Mitev

⏱ 0:45 · at 1:15

30 seconds max. Who I am, why I care: I've shipped bugs on 100% covered lines too.

### 3. What's your coverage gate in CI?

⏱ 1:00 · at 2:15

Hook, Zoom version: ask them to type their coverage gate in the chat. Wait 15-20 seconds (chat lags), then read 3-4 answers out loud, by name. Anyone with 100? "Great, this talk is about you." Someone with "none"? "I envy your honesty."

## 1 · The green-report illusion

### 4. Meme: this-is-fine (coverage: 100% / prod: on fire)

⏱ 0:20 · at 2:35

Agenda point 1: the green-report illusion.
Everyone has seen it: the badge is green, the dashboard is green, the sprint review screenshot is green. And on Friday evening something with a perfectly covered line breaks in prod.

### 5. Green CI ≠ working code

⏱ 0:45 · at 3:20

The whole talk in one sentence. Coverage answers "did this line execute during the tests?" It never answers "would any test fail if this line were wrong?"

## 2 · Coverage measures execution

### 6. Coverage measures execution

⏱ 1:00 · at 4:20

Agenda point 2. This is a real test from the demo repo. It executes every line of checkout. Coverage tool is happy. It would pass if checkout returned the wrong total, a negative total, or a pizza emoji.

### 7. Meme: is-this-a-pigeon (coverage tool / checkout(items) / Is this a test?)

⏱ 0:20 · at 4:40

Calling code is not testing code. A test is an assertion about behaviour.

### 8. The usual suspects

⏱ 1:15 · at 5:55

Four patterns everyone has written (me too). All of them push coverage up, none of them pin down behaviour. Point at the typeof boolean one, wait for laughs.
Then: "Ask a coding agent to get coverage to 100% and this is exactly what you get back. Fast." Plant the seed, we come back to agents after the demo.

### 9. "When a measure becomes a target, it ceases to be a good measure."

⏱ 0:45 · at 6:40

Set a coverage target and people will hit it, with the cheapest tests possible. Nobody is evil, the metric just rewards running code, not checking it.

## 3 · Mutation testing in a nutshell

### 10. Who tests the tests?

⏱ 0:20 · at 7:00

Transition to agenda point 3. We review code, we lint code, we type-check code. Tests are code. Who checks that they actually catch anything?

### 11. Mutation testing in one slide

⏱ 1:15 · at 8:15

The idea is from 1971, Richard Lipton. It was just too slow for 40 years. Now it isn't.
If you can change the code and no test notices, that code isn't really tested.

### 12. What a mutant looks like

⏱ 1:00 · at 9:15

Mutators simulate real mistakes: off-by-one, wrong boolean operator, removed block, wrong string, flipped condition. Stryker has ~30 of them for JS/TS.

### 13. Quiz: spot the survivor 🧟

⏱ 1:30 · at 10:45

Give them 20-30 seconds, Zoom chat is slow. Read a few answers. Then reveal: B fails for 30, C fails for 5, D fails for 30. A survives because no test uses exactly 18. 100% coverage, and an 18-year-old can't buy a beer.
This is the whole talk in one slide; the demo is the same bug with free shipping.

### 14. Mutant statuses

⏱ 0:45 · at 11:30

Keep this short. The ones that matter: survived and no coverage.

## 4 · StrykerJS: how it works + demo

### 15. StrykerJS

⏱ 0:30 · at 12:00

Agenda point 4. StrykerJS, open source, v10 today. Works with every popular runner. We use Vitest 5 and TypeScript 7.
Demo: a small shopping cart pricing module. Subtotal, coupons, free shipping over 100.

### 16. How Stryker runs (TypeScript)

⏱ 1:30 · at 13:30

1. Stryker parses your TypeScript with Babel (not tsc) and generates every mutant up front.
2. It writes ONE instrumented version of each file with all mutants inside (next slide) into a sandbox copy of the project. Your files are never touched.
3. The TypeScript checker type-checks mutants separately and throws out the ones that don't compile. That's the step where TS 7 native comes in.
4. Dry run: all tests once, recording which test reaches which mutant.
5. Then for each mutant: switch it on with a global flag, run only the tests that cover it. Test fails = killed, all pass = survived, hangs = timeout, no test reached it = no coverage.
No rebuild between mutants, the test runner workers stay warm. That's why it's feasible at all.

### 17. All mutants, one build

⏱ 1:15 · at 14:45

Real output from the demo sandbox (cleanTempDir: false), trimmed a little. Mutants 5-8 are all variants of the >= comparison; at most one is active per run, chosen by a global (__stryker__.activeMutant).
@ts-nocheck: the instrumented code isn't type-safe, that's why type checking is a separate step on the original code.
stryCov records coverage per test. Code that runs at import time, when no test is running, lands in a "static" bucket: that's exactly why static mutants (our Zod schema) must run the whole suite.
Types stay in the file: Vitest strips them at runtime.

### 18. Meme: always-has-been (your code / Wait, all 50 mutants are in one build? / Always has been)

⏱ 0:20 · at 15:05

Pause a beat (on Zoom you won't hear the laugh). Then: this is why Stryker is fast enough to be usable. Older tools recompiled the project for every mutant.

### 19. Demo 1: all green

⏱ 1:15 · at 16:20 · 🎬 `demo-1-green.mp4`

Video: tests pass, coverage 100% across statements, branches, functions, lines. Celebrate ironically.

### 20. Demo 2: Stryker enters the chat

⏱ 2:45 · at 19:05 · 🎬 `demo-2-reveal.mp4`

Video: npx stryker run, 50 mutants, 21 survived. Open the HTML report, click through a few survivors.

### 21. 100% → 58%

⏱ 0:30 · at 19:35

Coverage: 100%. Mutation score: 58.00%. 21 of 50 mutants survived. Let that sink in.

### 22. Meme: surprised-pikachu (Me: writes tests until coverage hits 100%\nStryker: 58%)

⏱ 0:15 · at 19:50

Let it sit for two seconds. On Zoom you won't hear the laugh, don't rush to fill the silence.

### 23. Demo 3: kill them all

⏱ 3:15 · at 23:05 · 🎬 `demo-3-kill.mp4`

Video: replace weak assertions with exact values, add boundary tests (99.99 / 100 / 100.01).
The boundary test at exactly 100 FAILS. Spec says "100 or more ships free", code says ">". That's the real bug.

### 24. The surviving mutant was a bug report

⏱ 1:00 · at 24:05

This is the punchline of the demo. Stryker didn't find the bug directly. It showed that no test cared about the boundary. The moment we wrote one, the bug fell out. Customers with exactly 100 in the cart paid 5.99 shipping.

### 25. 58% → 98%

⏱ 0:20 · at 24:25

Cliffhanger: one survivor left and no test can kill it. Next section explains why.

## 5 · Making it practical

### 26. Making it practical

⏱ 0:15 · at 24:40

Agenda point 5. The usual objections: "too noisy", "too slow". Let's talk about both.

### 27. Equivalent mutants

⏱ 1:00 · at 25:40

An equivalent mutant changes the code but not the behaviour. No test can ever kill it. When value === amount both paths return 0.

### 28. What to do with them

⏱ 1:00 · at 26:40

Three options. Refactor first: an equivalent mutant often points at redundant code. If you ignore it, the disable comment needs a reason, and it switches off every mutant of that kind on the line (here also the killable "<"). And accept less than 100%: chasing 100% mutation score is the same trap as chasing 100% coverage.

### 29. Meme: one-does-not-simply (one does not simply / run all mutants on every PR)

⏱ 0:20 · at 27:00

Cost: every mutant can mean a test run. 5,000 mutants × a 2 minute suite is your weekend.

### 30. Keeping run times sane

⏱ 1:15 · at 28:15

Biggest wins in order: perTest coverage analysis (default with vitest runner), incremental mode, scoping mutate, then the checker.

### 31. Demo 4: go fast

⏱ 2:15 · at 30:30 · 🎬 `demo-4-fast.mp4`

Video: incremental run reuses 48 of 50 results in ~1 s. TS checker marks 13 mutants as compile errors, they never hit the test runner.

### 32. TypeScript 7 🦫⚡

⏱ 1:15 · at 31:45

Real gotcha we hit while building the demo: Stryker core reads tsconfig via the TS JS API. With only TS 7 installed you get "ts.parseConfigFileTextToJson is not a function". Fix: TS 6 as "typescript" for tools, TS 7 under the @typescript/native alias.

### 33. Checker benchmark

⏱ 1:00 · at 32:45

Synthetic workload: the demo cloned N times. Fast unit tests, so the checker can't save much test time here; with slow tests it saves more. TS 6 checker has startup cost, TS 7 native is close to free. Native checks mutants one by one, no grouping yet, watch it at large mutant counts.

## 5 · The fine print

### 34. The fine print 🧾

⏱ 0:15 · at 33:00

I promised honesty. Here is what it costs.

### 35. It's slow. By design.

⏱ 0:45 · at 33:45

Every mutant is potentially a full test run. Stryker is smart (only tests covering the mutant, incremental reuse), but the cost grows with code size times test time.

### 36. Even slower in CI

⏱ 0:45 · at 34:30

Hosted runners have few cores, so concurrency drops and wall time grows. Plus npm ci and sandbox copy on every run. Options: incremental on PRs, full run nightly, larger runners if you can pay, or scope mutate to what changed.

### 37. Cache the incremental report

⏱ 1:00 · at 35:30

Stryker's incremental mode needs the previous result. On a laptop it's just a file; on GitHub runners every job starts empty, so it goes into actions/cache.
Restore order: this branch's last run, then main's. That's why main must run on every merge (and nightly, to stay inside the 7-day eviction window).
Incremental only diffs your source and tests. Bump vitest or change stryker.config.json and it won't notice: the nightly run uses --force.

### 38. The gotcha: red PRs never save

⏱ 1:00 · at 36:30

Measured on demo PR #2. With plain actions/cache the save step is skipped when the job fails, so every push to a failing PR re-tests all of its changes from main's baseline. The failing PR is exactly the one you iterate on.
On a re-run with the same commit you'll see "Failed to save: Unable to reserve cache": harmless warning, the key already exists.

### 39. Static mutants

⏱ 1:00 · at 37:30

Static code runs at import time, so per-test coverage can't tell which test depends on it. Stryker has to rerun the whole suite per static mutant. ignoreStatic trades that time for a blind spot.
And here's the catch: a Zod schema is exactly that kind of code. All your validation rules live at module level.

### 40. 18 / 28

⏱ 0:30 · at 38:00

Measured on the demo coupon schema: 28 mutants, 18 ignored as static, 8 tested, 2 compile errors. Only the .refine() callback runs at parse time, so only its mutants were tested. Every other rule: regex, enum, limits, messages, ignored. Stryker still showed a nice green overall score.

### 41. What Stryker does to a Zod schema

⏱ 1:00 · at 39:00

Stryker's mutators are syntactic: method names it knows (min/max, toUpperCase/toLowerCase, trim), regexes, arrays, strings, objects. It doesn't know Zod, so numbers, .positive(), .default() and .coerce never get mutated. No surviving mutant there doesn't mean those rules are tested.

### 42. ignoreStatic: the trade-off

⏱ 1:00 · at 40:00

The remaining mutants are compile errors (the TypeScript checker throws them out). Here the cost is 0.3 s. With a 3-minute suite, each static mutant costs 3 minutes, so measure before you flip it in a big repo. What the demo does: the main config keeps ignoreStatic true and excludes "!src/**/*-schema.ts"; stryker.schemas.config.mjs mutates only the schemas with ignoreStatic false and a 90% break. CI runs both and merges them into one PR comment. Fast default, strict where the rules live.

### 43. More fine print

⏱ 1:00 · at 41:00

The "missing code" one is important: mutation testing judges the tests against the code that exists. If the requirement isn't implemented at all, there is nothing to mutate. It complements thinking, it doesn't replace it.

## 6 · Adopting it in your team

### 44. Adopting it in your team

⏱ 0:15 · at 41:15

Agenda point 6.

### 45. What's worth mutating?

⏱ 1:30 · at 42:45

Rule of thumb: code where a small mistake is expensive, and where the logic branches.
Left: an off-by-one in pricing is our free-shipping bug; && → || in an isAllowed check is a security hole that passes the happy-path tests; Zod schemas we just saw; status transitions and expiry dates are boundaries everywhere; a shared lib spreads one survivor to every team; agent code because the tests were written to pass.
Right: UI markup mutants change strings and class names and the tests that kill them are brittle snapshots; glue code has no logic, integration tests cover it; nobody should write tests for log messages; generated code isn't yours; wrappers test your mocks; slow/flaky suites cost more than they tell you, fix them first.
Zod is on the left only at trust boundaries: a schema that just describes a type is mostly noise.

### 46. Where to start

⏱ 1:00 · at 43:45

Concrete starting plan: one module that matters, run it locally, read the report, fix three survivors. Then CI in report-only mode (break: null), raise the bar slowly. Never as a vanity badge on the README... says the guy with a badge on his README.

### 47. Thresholds

⏱ 1:00 · at 44:45

Start with break low or null. The goal is the conversation in code review, not another number to game.
The last row is the one I like most: legacy code can sit at 60%, but new code is held to 80%. The overall average can't hide a badly tested new feature. (Not a Stryker option: ci-samples/report.mjs computes it from the PR diff.)

### 48. Demo 5: in CI

⏱ 2:45 · at 47:30 · 🎬 `demo-5-ci.mp4`

Video: PR #1 (weak tests) red with 45.71%, PR #2 (new feature) green overall 93% but red on changed lines 70%. Sticky comment, inline annotations on the diff, HTML report artifact.

### 49. Reporting people actually read

⏱ 1:00 · at 48:30

Nobody downloads an HTML artifact from a CI run. People read PR comments and look at the diff. Put the survivors where the reviewer already is.
All of this is ~200 lines in ci-samples/report.mjs, no paid service. Stryker Dashboard is the hosted alternative (free for open source).

### 50. Demo 6: Zod in a PR

⏱ 2:15 · at 50:45 · 🎬 `demo-6-zod.mp4`

Video: PR #5, agent tests, "18 mutants ignored (static)", 50% on changed lines. PR #6: tests for every rule + a separate schemas config (ignoreStatic false, break 90), all 23 testable schema mutants killed, main run stays fast.

### 51. Meme: drake (coverage: 100% / mutation score: 80%)

⏱ 0:15 · at 51:00

The whole CI section in one picture. Two seconds, move on.

## AI agents write the tests now

### 52. Agents write the tests now

⏱ 0:30 · at 51:30

Section on AI. My workflow: agents write a lot of code and tests, and I use Stryker to check whether those tests are good enough to give me confidence. (Add your own example: which agent, what kind of project.)

### 53. Agents are

⏱ 0:45 · at 52:15

An agent optimises for the goal you give it. "Tests green, coverage 100%" is a goal it can reach without checking anything: weak assertions, snapshots of whatever the code returns today, mocking the very thing under test.
Goodhart's law, now at 100 tokens per second.

### 54. Typical agent-written test

⏱ 0:45 · at 53:00

The test name is perfect, the reviewer skims it, LGTM. The snapshot freezes current behaviour, including the off-by-one bug we just found.

### 55. Stryker as the agent's reviewer

⏱ 1:00 · at 54:00

The loop I use: agent writes the change and the tests, Stryker runs, surviving mutants go back to the agent as a concrete to-do list. A human still reviews, but now the review starts from "the tests can catch these changes", not from hope.

### 56. Survivors as a prompt

⏱ 0:45 · at 54:45

Far better than "write better tests". Concrete, checkable, small. The "don't touch src" rule matters: otherwise the agent "fixes" the mutant by changing the code until the test passes.

### 57. Demo 7: agents in the loop

⏱ 2:45 · at 57:30 · 🎬 `demo-7-agents.mp4`

Video: PR #2 agent-written tests, gate fails, download agent-prompt.md. PR #3: the agent "fixed" it with Stryker disable comments: score 100%, headline warns 8 ignored mutants, gate fails. PR #4: proper tests, 100% on changed lines, green.

### 58. Agents game metrics too

⏱ 1:00 · at 58:30

Common ways agents game it: adding Stryker disable comments, changing the implementation so their test passes, snapshot-testing a whole object. (Add your own war story here if you have one.) The PR workflow in the repo fails on disable comments without a reason and lists all new ones in the job summary.

### 59. Mutation score = trust signal for code you didn't write.

⏱ 0:20 · at 58:50

One-line summary of the AI section. With agents writing more of the code, "the tests pass" is worth less every month. "The tests catch changes" is what I check.

## 7 · Takeaways & Q&A

### 60. Takeaways

⏱ 1:30 · at 60:20

Agenda point 7.

### 61. Try it on Monday

⏱ 0:30 · at 60:50

One command, answers a few questions (test runner, checker), writes the config. Then npx stryker run.

### 62. Grab the repo

⏱ 0:30 · at 61:20

Leave this up for a few seconds, people need time to scan.

### 63. Questions?

⏱ 0:15 · at 61:35

Read questions from the chat. Repeat each question out loud before answering: it's recorded, and not everyone sees the chat. If the chat is quiet, seed it: "The question I always get: how long does this take on a real project?"
