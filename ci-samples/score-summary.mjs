// Prints a markdown mutation score summary from Stryker's JSON report.
// Usage: node score-summary.mjs reports/mutation/mutation.json >> "$GITHUB_STEP_SUMMARY"
import { readFileSync } from 'node:fs';

const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const counts = {};
for (const file of Object.values(report.files)) {
  for (const mutant of file.mutants) counts[mutant.status] = (counts[mutant.status] ?? 0) + 1;
}
const n = (status) => counts[status] ?? 0;
const detected = n('Killed') + n('Timeout');
const valid = detected + n('Survived') + n('NoCoverage');
const score = valid === 0 ? 100 : (detected / valid) * 100;

console.log(`## Mutation score: ${score.toFixed(2)}%\n`);
console.log('| Status | Count |\n|---|---|');
for (const [status, count] of Object.entries(counts).sort()) console.log(`| ${status} | ${count} |`);
