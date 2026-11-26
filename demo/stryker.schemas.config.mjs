// Strict run for validation schemas (Zod): their rules are module-level code, so every mutant is
// "static". The main config keeps ignoreStatic: true for speed and excludes these files; this one
// mutates only the schemas, with static mutants on and a higher bar.
//   npx stryker run stryker.schemas.config.mjs
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
