# The 100% Code Coverage Lie

[![Mutation score](https://img.shields.io/endpoint?url=https://dnmitev.github.io/coverage-lie/mutation/badge.json)](https://dnmitev.github.io/coverage-lie/mutation/)

Finding hidden bugs with mutation testing. Talk + demo for [DEV.BG JavaScript](https://dev.bg/groups/javascript/), 28.01.2027.

**Slides:** https://dnmitev.github.io/coverage-lie/ · **Live mutation report (main):** https://dnmitev.github.io/coverage-lie/mutation/

> Coverage tells you which code **ran**. Mutation testing tells you which code is **checked**.

## Try it on your project (≈ 5 minutes)

```bash
npm init stryker@latest   # answers: your test runner, TypeScript checker if you use TS
npx stryker run
open reports/mutation/mutation.html
```

Start with one module that matters, read the survivors, fix three of them. Then put it in CI (see below).

## The demo

`demo/` is a tiny shopping-cart pricing module (TypeScript 7, Vitest 5, StrykerJS 10).
Every step of the talk is a git tag:

| Tag | What happens | Coverage | Mutation score |
|---|---|---|---|
| `step-1-green` | weak tests, everything green | 100% | – |
| `step-2-reveal` | add Stryker | 100% | **58.00%** (21 survivors) |
| `step-3-kill` | real assertions + boundary tests; finds an off-by-one bug; one equivalent mutant ignored with a reason | 100% | **100.00%** |
| `step-4-fast` | incremental mode, TypeScript 7 native checker, `ignoreStatic` | 100% | 100.00% |
| `step-5-ci` | thresholds + GitHub Actions | 100% | 100.00% |

```bash
git checkout step-2-reveal
cd demo && npm ci
npm run coverage      # 100%
npx stryker run       # 58%
```

`demo/scripts/RECORDING.md` has the step-by-step script used for the demo videos.

### TypeScript 7 note

TypeScript 7 (the native compiler) ships no classic JS API, but Stryker core and `@stryker-mutator/typescript-checker` still import it.
Without a workaround you get `ts.parseConfigFileTextToJson is not a function`. The demo uses:

```json
"typescript": "6.0.3",
"@typescript/native": "npm:typescript@7.0.2"
```

`typescript` (6) is only the API for tooling; `@typescript/native` (7) does the real type checking,
both in `npm run typecheck` and in Stryker via `"typescriptChecker": { "experimentalNativePreview": true }`.

Is the native checker faster? Depends on mutant count, see `demo/bench/RESULTS.md`.

## CI samples

| Workflow | What |
|---|---|
| `.github/workflows/tests.yml` | typecheck + tests + 100% coverage gate |
| `.github/workflows/mutation-pr.yml` | incremental Stryker run on PRs, sticky PR comment, inline annotations, gates (see below) |
| `.github/workflows/mutation-main.yml` | full run on `main` + nightly (`--force`), refreshes the incremental cache and the baseline JSON for PRs |
| `.github/workflows/pages.yml` | slides + live HTML mutation report + badge on GitHub Pages |
| `.github/workflows/bench.yml` | manual: checker benchmark on a GitHub-hosted runner |
| `ci-samples/report.mjs` | Markdown report, annotations, badge and gates from Stryker's JSON report |
| `ci-samples/survivors-to-prompt.mjs` | surviving mutants as a prompt for a coding agent |

### What a PR gets

- **Sticky comment** (updated on every push): mutation score, change vs `main`, score on **the lines this PR changed**, per-file table, every surviving mutant as a diff.
- **Inline annotations** on the "Files changed" tab, on the exact line of each surviving mutant.
- **Artifact** with the HTML report and a ready-made agent prompt.
- **Gates**, all evaluated after the report is posted:
  - overall score below `thresholds.break` (Stryker itself)
  - score on changed lines below 80% (new code gets a higher bar than the legacy average)
  - a new `Stryker disable` comment without a reason

### Demo pull requests (do not merge)

| PR | Story | Result |
|---|---|---|
| Demo: weak tests | the step-2 tests come back | ✅ tests, 100% coverage · ❌ mutation score 45.71% < break |
| Demo: bulk discount, agent-written tests | new feature, tests that only check "less than" / "greater than" | ✅ overall 93% · ❌ changed lines 70% < 80% |
| Demo: bulk discount, silenced | the agent "fixes" the gate with `Stryker disable` comments | "100%" · ❌ disable comments without a reason |
| Demo: bulk discount | same feature, exact values and boundaries | ✅ 100% on changed lines |
| Demo: Zod schema, agent-written tests | Zod schema + `toBeDefined()` / `toThrow()` tests | ✅ overall 91% · ⚠️ 18 schema mutants ignored as static · ❌ changed lines 50% |
| Demo: Zod schema | tests for every rule + a strict schemas config | ✅ all 23 testable schema mutants killed |

### Zod (and other schema libraries)

A Zod schema is module-level code, so its mutants are **static**. With `ignoreStatic: true` (a common speed setting) Stryker skips them: on the demo schema, 18 of 28 mutants were ignored and only the `.refine()` callback was tested.
With `ignoreStatic: false` Stryker mutates the chain (`toUpperCase` → `toLowerCase`, `.max()` → `.min()`, regex anchors and quantifiers, enum values, messages). It never mutates numbers, `.positive()`, `.default()` or `.coerce`, so test those anyway.
Cost on the demo: 4.3 s → 4.6 s. On a big suite every static mutant reruns the whole suite, so the demo (PR "Demo: Zod schema") keeps the default fast and gives schemas their own run:

```js
// demo/stryker.schemas.config.mjs (main config: ignoreStatic: true, mutate excludes "!src/**/*-schema.ts")
import base from './stryker.config.json' with { type: 'json' };
export default {
  ...base,
  mutate: ['src/**/*-schema.ts'],
  ignoreStatic: false,
  thresholds: { high: 100, low: 90, break: 90 },
  incrementalFile: 'reports/stryker-incremental-schemas.json',
  htmlReporter: { fileName: 'reports/mutation/schemas.html' },
  jsonReporter: { fileName: 'reports/mutation/schemas.json' },
};
```

The workflows run it when the file exists and `report.mjs` merges both JSON reports into one PR comment.

## What's worth mutation testing?

| Worth it | Usually skip |
|---|---|
| money: pricing, discounts, tax, rounding | UI markup and styling |
| authorization and permissions | glue code, controllers that only delegate, DI wiring |
| validation at trust boundaries (Zod and friends) | logging, metrics, error message wording |
| state machines, workflows, dates and expiry | generated code, migrations, config |
| parsers, mappers, shared libraries | thin wrappers around third-party APIs |
| code written by agents | anything with slow or flaky tests (fix those first) |

Rule of thumb: mutate where a flipped `>` costs money or a flipped `&&` lets someone in.

## Mutation testing for agent-written tests

When an agent writes the tests, "they pass" and "100% coverage" say very little: agents are good at reaching exactly those goals.
Stryker answers the question that matters: would these tests notice if the code were wrong?

```bash
npx stryker run
node ../ci-samples/survivors-to-prompt.mjs reports/mutation/mutation.json > prompt.md
# hand prompt.md to the agent, run Stryker again, repeat
```

The prompt tells the agent not to touch `src/` and not to add `Stryker disable` comments; the PR workflow enforces the second rule.

## Drawbacks (honestly)

- Slow: cost is roughly mutants × test time. Even slower on hosted CI runners (see `demo/bench/RESULTS.md`: 500 mutants 11.6 s on a laptop, 21.1 s on `ubuntu-latest`).
- Static mutants (module-level code, e.g. Zod schemas) need the whole suite per mutant; `ignoreStatic` skips them but then they are never checked.
- Equivalent mutants need a human decision.
- Flaky tests make scores noisy.
- It only judges tests against code that exists: a missing check has no mutant.
- The score can be gamed (snapshots, disable comments), by people and by agents.

## Slides

```bash
cd slides && npm ci && npm run dev
```

Slidev, DEV.BG branding. Meme templates go in `slides/public/memes/` (list in the README there), demo videos in `slides/public/videos/`.

## License

MIT
