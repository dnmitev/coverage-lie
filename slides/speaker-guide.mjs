// Builds SPEAKER_GUIDE.md from slides.md: one row per slide with time, cumulative time and the speaker notes.
// Notes start with "⏱ m:ss" (the planned time for that slide); "§ Section" in the notes starts a new section.
//   node speaker-guide.mjs            -> writes SPEAKER_GUIDE.md
//   node speaker-guide.mjs --list     -> prints slide number, time and title (quick overview)
import { readFileSync, writeFileSync } from 'node:fs';

const dir = import.meta.dirname;
const lines = readFileSync(`${dir}/slides.md`, 'utf8').split('\n');

// Slidev format here: headmatter, then "---" separators; a slide may start with a yaml front-matter block.
const chunks = [];
let current = [];
for (const line of lines) {
  if (line === '---') {
    chunks.push(current.join('\n'));
    current = [];
  } else current.push(line);
}
chunks.push(current.join('\n'));
const isYaml = (c) => c.trim() !== '' && /^(\s*[\w-]+:.*\n?)+$/.test(c.trim() + '\n');
const slides = [];
for (let i = 2; i < chunks.length; i++) {
  if (isYaml(chunks[i]) && i + 1 < chunks.length) continue; // front-matter of the next chunk
  slides.push(chunks[i]);
}

const parsed = slides.map((body, i) => {
  const notesMatch = [...body.matchAll(/<!--([\s\S]*?)-->/g)].at(-1);
  let notes = notesMatch ? notesMatch[1].trim() : '';
  const time = /⏱\s*(\d+):(\d{2})/.exec(notes);
  const seconds = time ? Number(time[1]) * 60 + Number(time[2]) : 0;
  const section = /§\s*(.+)/.exec(notes)?.[1].trim();
  notes = notes.replace(/⏱\s*\d+:\d{2}\s*·?\s*/, '').replace(/§\s*.+\n?/, '').trim();
  const clip = /<Clip src="([^"]+)"/.exec(body)?.[1];
  return { n: i + 1, title: title(body), seconds, section, notes, clip };
});

function title(body) {
  const heading = /^#{1,2} (.+)$/m.exec(body)?.[1];
  if (heading) return heading.trim();
  const big = /class="(?:big|huge)[^"]*">([^<]+)</.exec(body)?.[1];
  if (big) return big.trim();
  const meme = /<Meme src="([^".]+)/.exec(body)?.[1];
  if (meme) {
    const text = [...body.matchAll(/text: '([^']+)'|(?:top|bottom)="([^"]+)"/g)].map((m) => m[1] ?? m[2]).join(' / ');
    return `Meme: ${meme}${text ? ` (${text})` : ''}`;
  }
  return body.trim().split('\n')[0].slice(0, 60);
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

if (process.argv.includes('--list')) {
  let total = 0;
  for (const s of parsed) {
    total += s.seconds;
    console.log(`${String(s.n).padStart(2)} ${fmt(s.seconds).padStart(5)} ${fmt(total).padStart(6)}  ${s.section ? `[${s.section}] ` : ''}${s.title}${s.notes ? '' : '  (NO NOTES)'}`);
  }
  process.exit(0);
}

const total = parsed.reduce((t, s) => t + s.seconds, 0);
const clips = parsed.filter((s) => s.clip);
const out = [
  '# Speaker guide',
  '',
  `Generated from \`slides.md\` speaker notes by \`node speaker-guide.mjs\`. Do not edit by hand.`,
  '',
  `**Planned talk time:** ${fmt(total)} (${parsed.length} slides, of which ${fmt(clips.reduce((t, s) => t + s.seconds, 0))} on the ${clips.length} demo slides, video + intro)`,
  '',
];
const sections = [];
for (const s of parsed) {
  if (s.section || sections.length === 0) sections.push({ name: s.section ?? 'Intro', slides: [] });
  sections.at(-1).slides.push(s);
}
out.push('## Overview', '', '| Section | Slides | Time | Ends at |', '|---|---|---|---|');
let clock = 0;
for (const sec of sections) {
  const t = sec.slides.reduce((a, s) => a + s.seconds, 0);
  clock += t;
  out.push(`| ${sec.name} | ${sec.slides[0].n}–${sec.slides.at(-1).n} | ${fmt(t)} | ${fmt(clock)} |`);
}
out.push('');
clock = 0;
for (const sec of sections) {
  out.push(`## ${sec.name}`, '');
  for (const s of sec.slides) {
    clock += s.seconds;
    out.push(`### ${s.n}. ${s.title}`, '', `⏱ ${fmt(s.seconds)} · at ${fmt(clock)}${s.clip ? ` · 🎬 \`${s.clip}\`` : ''}`, '');
    if (s.notes) out.push(s.notes, '');
  }
}
writeFileSync(`${dir}/SPEAKER_GUIDE.md`, out.join('\n'));
console.log(`SPEAKER_GUIDE.md: ${parsed.length} slides, ${fmt(total)}`);
