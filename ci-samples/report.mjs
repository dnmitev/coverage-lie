// Mutation testing report for CI, built from Stryker's JSON report.
//
//   node report.mjs reports/mutation/mutation.json [more reports...] [options]
//
// Several reports (e.g. a fast main run + a strict run for schema files) are merged by file.
//
//   --config <file>        stryker.config.json, for thresholds (default: ./stryker.config.json)
//   --baseline <file>      mutation.json from main, to show the score change
//   --base <git ref>       e.g. origin/main: score the lines changed since that ref separately
//   --out <file>           write the markdown report (PR comment / job summary) here
//   --annotations          print GitHub ::warning annotations for surviving mutants
//   --badge <file>         write a shields.io endpoint JSON badge
//   --gate-changed <n>     exit 1 if the score on changed lines is below n
//   --gate-disables        exit 1 if a new "Stryker disable" comment (needs --base) has no reason
//
// Env (optional): GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID for links,
// REPORT_PATH_PREFIX to turn report paths into repo paths for annotations (e.g. "demo/").
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    config: { type: 'string', default: 'stryker.config.json' },
    baseline: { type: 'string' },
    base: { type: 'string' },
    out: { type: 'string' },
    annotations: { type: 'boolean', default: false },
    badge: { type: 'string' },
    'gate-changed': { type: 'string' },
    'gate-disables': { type: 'boolean', default: false },
  },
});

// Missing extra reports are skipped, so workflows can pass optional ones unconditionally.
const report = { files: Object.assign({}, ...positionals.filter((f, i) => i === 0 || existsSync(f)).map((f) => readJson(f).files)) };
const baseline = opt.baseline && existsSync(opt.baseline) ? readJson(opt.baseline) : undefined;
const thresholds = { high: 80, low: 60, break: null, ...(existsSync(opt.config) ? readJson(opt.config).thresholds : {}) };
const diff = opt.base ? diffSince(opt.base) : undefined;
const changedLines = diff?.lines;
// New disable comments: agents (and humans) like to silence what they can't fix.
const disables = (diff?.added ?? []).filter((a) => a.text.includes('Stryker disable'));
const hasReason = (text) => /Stryker (disable|restore)[a-z-]* [^:]+: .+/.test(text);

const mutants = allMutants(report);
const changed = changedLines ? mutants.filter((m) => changedLines.get(m.file)?.has(m.location.start.line)) : [];
const total = stats(mutants);
const changedStats = stats(changed);
const baselineStats = baseline ? stats(allMutants(baseline)) : undefined;
const survivors = mutants.filter((m) => m.status === 'Survived' || m.status === 'NoCoverage');
// Changed lines first: that's what the PR author can act on.
survivors.sort((a, b) => Number(isChanged(b)) - Number(isChanged(a)));

if (opt.out) writeFileSync(opt.out, markdown());
if (opt.annotations) annotations();
if (opt.badge) writeFileSync(opt.badge, JSON.stringify(badge()));
let failed = false;
if (opt['gate-changed'] !== undefined) failed = !gateChanged(Number(opt['gate-changed'])) || failed;
if (opt['gate-disables']) failed = !gateDisables() || failed;
if (failed) process.exit(1);

// ---------------------------------------------------------------------------

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function allMutants(r) {
  return Object.entries(r.files).flatMap(([file, f]) => {
    const lines = f.source.split('\n');
    return f.mutants.map((m) => ({ ...m, file, lines }));
  });
}

function isStaticIgnored(m) {
  return m.status === 'Ignored' && /static mutant/i.test(m.statusReason ?? '');
}

// Same formula as Stryker: detected / valid. Compile errors and ignored mutants don't count.
function stats(list) {
  const n = (s) => list.filter((m) => m.status === s).length;
  const detected = n('Killed') + n('Timeout');
  const valid = detected + n('Survived') + n('NoCoverage');
  return { score: valid ? (detected / valid) * 100 : undefined, killed: n('Killed'), timeout: n('Timeout'), survived: n('Survived'), noCoverage: n('NoCoverage'), ignored: n('Ignored'), ignoredStatic: list.filter(isStaticIgnored).length, valid };
}

// Lines added/changed since `base` (paths relative to cwd, like the report): file -> Set(line), plus the added text.
function diffSince(base) {
  const text = execFileSync('git', ['diff', '--unified=0', '--relative', `${base}...HEAD`, '--', '.'], { encoding: 'utf8' });
  const lines = new Map();
  const added = [];
  let file;
  let lineNo = 0;
  for (const line of text.split('\n')) {
    if (line.startsWith('+++ ')) {
      file = line === '+++ /dev/null' ? undefined : line.slice(6);
      continue;
    }
    const hunk = /^@@ -\S+ \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (hunk) {
      lineNo = Number(hunk[1]);
      continue;
    }
    if (file && line.startsWith('+')) {
      if (!lines.has(file)) lines.set(file, new Set());
      lines.get(file).add(lineNo);
      added.push({ file, line: lineNo, text: line.slice(1).trim() });
      lineNo++;
    }
  }
  return { lines, added };
}

function isChanged(m) {
  return changedLines?.get(m.file)?.has(m.location.start.line) ?? false;
}

function fmt(score) {
  return score === undefined ? '–' : `${score.toFixed(2)}%`;
}

function icon(score) {
  if (score === undefined) return '⚪';
  if (score >= thresholds.high) return '🟢';
  if (score >= thresholds.low) return '🟡';
  if (thresholds.break !== null && score < thresholds.break) return '🔴';
  return '🟠';
}

function mutatedLine(m) {
  const { start, end } = m.location;
  const original = m.lines[start.line - 1];
  if (start.line !== end.line) return { original: original.trim(), mutated: m.replacement.split('\n')[0].trim() + (m.replacement.includes('\n') ? ' …' : '') };
  return { original: original.trim(), mutated: (original.slice(0, start.column - 1) + m.replacement + original.slice(end.column - 1)).trim() };
}

function markdown() {
  const delta = baselineStats?.score !== undefined && total.score !== undefined ? total.score - baselineStats.score : undefined;
  const deltaText = delta === undefined ? '' : ` (${delta >= 0 ? '+' : ''}${delta.toFixed(2)} vs main)`;
  const out = [];
  out.push('<!-- stryker-report -->');
  const disabled = changedStats.ignored - changedStats.ignoredStatic;
  const why = [disabled && `${disabled} by disable comments`, changedStats.ignoredStatic && `${changedStats.ignoredStatic} static, "ignoreStatic" is on`].filter(Boolean).join(', ');
  const silenced = changedStats.ignored ? ` · ⚠️ ${changedStats.ignored} mutant(s) ignored on lines changed in this PR (${why})` : '';
  out.push(`## ${icon(total.score)} Mutation score: ${fmt(total.score)}${deltaText}${silenced}`, '');

  out.push('| | Score | Killed | Survived | No coverage | Ignored |', '|---|---|---|---|---|---|');
  if (changedLines) {
    out.push(
      changedStats.valid
        ? `| **Lines changed in this PR** | ${icon(changedStats.score)} **${fmt(changedStats.score)}** | ${changedStats.killed + changedStats.timeout} | ${changedStats.survived} | ${changedStats.noCoverage} | ${changedStats.ignored} |`
        : `| **Lines changed in this PR** | no mutants on changed lines | | | | ${changedStats.ignored || ''} |`,
    );
  }
  out.push(`| All files | ${icon(total.score)} ${fmt(total.score)} | ${total.killed + total.timeout} | ${total.survived} | ${total.noCoverage} | ${total.ignored} |`);
  if (baselineStats) out.push(`| main (baseline) | ${fmt(baselineStats.score)} | ${baselineStats.killed + baselineStats.timeout} | ${baselineStats.survived} | ${baselineStats.noCoverage} | ${baselineStats.ignored} |`);
  if (disables.length) {
    out.push('', `### ⚠️ ${disables.length} new \`Stryker disable\` comment(s)`, '');
    for (const d of disables) out.push(`- \`${d.file}:${d.line}\` ${hasReason(d.text) ? '' : '**no reason given** '}\`${d.text}\``);
  }
  out.push('', `<sub>thresholds: 🟢 ≥ ${thresholds.high} · 🟡 ≥ ${thresholds.low} · 🔴 < ${thresholds.break ?? '–'} (fails the build)</sub>`, '');

  out.push('<details><summary>Per file</summary>', '', '| File | Score | Killed | Survived | No coverage |', '|---|---|---|---|---|');
  for (const file of Object.keys(report.files)) {
    const s = stats(mutants.filter((m) => m.file === file));
    out.push(`| \`${file}\` | ${icon(s.score)} ${fmt(s.score)} | ${s.killed + s.timeout} | ${s.survived} | ${s.noCoverage} |`);
  }
  out.push('', '</details>', '');

  if (survivors.length) {
    const shown = survivors.slice(0, 25);
    out.push(`<details${survivors.length <= 10 ? ' open' : ''}><summary>${survivors.length} surviving mutant(s)</summary>`, '');
    for (const m of shown) {
      const { original, mutated } = mutatedLine(m);
      out.push(`**\`${m.file}:${m.location.start.line}\`** ${m.mutatorName}${isChanged(m) ? ' · 🆕 changed in this PR' : ''}${m.status === 'NoCoverage' ? ' · no test covers it' : ''}`, '```diff', `- ${original}`, `+ ${mutated}`, '```');
    }
    if (survivors.length > shown.length) out.push(`…and ${survivors.length - shown.length} more in the HTML report.`);
    out.push('</details>', '');
  } else {
    out.push('No surviving mutants. 🎉', '');
  }

  const { GITHUB_SERVER_URL: server, GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: run } = process.env;
  if (server && repo && run) out.push(`📄 [HTML report and agent prompt](${server}/${repo}/actions/runs/${run}#artifacts) (artifact \`mutation-report\`)`);
  return out.join('\n') + '\n';
}

function annotations() {
  const prefix = process.env.REPORT_PATH_PREFIX ?? '';
  for (const m of survivors) {
    const { original, mutated } = mutatedLine(m);
    const title = `${m.status === 'NoCoverage' ? 'Uncovered' : 'Surviving'} mutant (${m.mutatorName})`;
    const message = `No test fails when this line is changed to:\n${mutated}\n(original: ${original})`;
    console.log(`::warning file=${prefix}${m.file},line=${m.location.start.line},endLine=${m.location.end.line},title=${escProp(title)}::${escData(message)}`);
  }
}

// GitHub workflow command escaping.
function escData(v) {
  return v.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}
function escProp(v) {
  return escData(v).replaceAll(':', '%3A').replaceAll(',', '%2C');
}

function badge() {
  const s = total.score;
  const color = s === undefined ? 'lightgrey' : s >= thresholds.high ? 'brightgreen' : s >= thresholds.low ? 'yellow' : 'red';
  return { schemaVersion: 1, label: 'mutation score', message: fmt(s), color };
}

function gateChanged(min) {
  if (changedStats.valid === 0) {
    console.log('No mutants on changed lines, nothing to gate.');
    return true;
  }
  const msg = `Mutation score on changed lines: ${fmt(changedStats.score)} (minimum ${min}%)`;
  if (changedStats.score < min) {
    console.log(`::error title=Mutation score on new code too low::${msg}`);
    return false;
  }
  console.log(msg);
  return true;
}

function gateDisables() {
  const prefix = process.env.REPORT_PATH_PREFIX ?? '';
  const bad = disables.filter((d) => !hasReason(d.text));
  for (const d of bad) console.log(`::error file=${prefix}${d.file},line=${d.line},title=Stryker disable without a reason::${escData(d.text)}`);
  if (disables.length) console.log(`${disables.length} new Stryker disable comment(s), ${bad.length} without a reason.`);
  return bad.length === 0;
}
