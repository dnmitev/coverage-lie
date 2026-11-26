// Turns Stryker's JSON report into a prompt for a coding agent: "write tests that kill these mutants".
// Usage: node survivors-to-prompt.mjs reports/mutation/mutation.json > prompt.md
import { readFileSync } from 'node:fs';

const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const lines = [];

for (const [file, { source, mutants }] of Object.entries(report.files)) {
  const sourceLines = source.split('\n');
  for (const m of mutants) {
    if (m.status !== 'Survived' && m.status !== 'NoCoverage') continue;
    const { start, end } = m.location; // 1-based lines and columns
    const original = sourceLines[start.line - 1];
    const mutated =
      start.line === end.line
        ? original.slice(0, start.column - 1) + m.replacement + original.slice(end.column - 1)
        : m.replacement; // multi-line mutant (e.g. a removed block): show the replacement only
    lines.push(
      `- \`${file}:${start.line}\` ${m.mutatorName} (${m.status})`,
      `  - original: \`${original.trim()}\``,
      `  - mutated:  \`${mutated.trim()}\``,
    );
  }
}

if (lines.length === 0) {
  console.log('No surviving mutants. Nothing to do.');
  process.exit(0);
}

console.log(`The tests below pass, but they also pass when the code is changed in these ways.
Write or improve tests so that each change makes at least one test fail.

Rules:
- Do not change anything under src/. If a test reveals a real bug, stop and report it instead of fixing it.
- Do not add "Stryker disable" comments. If you think a mutant is equivalent (cannot change behaviour), list it with a one-line explanation.
- Assert exact values and boundaries, not toBeDefined/toBeTruthy/typeof.

Surviving mutants (${lines.length / 3}):
${lines.join('\n')}`);
