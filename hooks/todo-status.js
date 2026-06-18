#!/usr/bin/env node
// smart-todo-flow UserPromptSubmit hook (Node.js)
// Intercepts "todo-status" command, shows progress locally, zero token cost.
// Uses JSON output with decision:"block" + reason for user-visible display.

const fs = require('fs');
const path = require('path');

let raw = '';
try {
  raw = fs.readFileSync(0, 'utf8');
} catch {
  process.exit(0);
}

let prompt = '';
try {
  prompt = JSON.parse(raw).prompt || '';
} catch {
  process.exit(0);
}

if (!/todo-status/i.test(prompt)) {
  process.exit(0);
}

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const todoFile = path.join(projectDir, 'TODO.md');

if (!fs.existsSync(todoFile)) {
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: 'No active TODO.'
  }));
  process.exit(0);
}

const content = fs.readFileSync(todoFile, 'utf8');
const lines = content.split('\n');

let done = 0, pending = 0, blocked = 0, skipped = 0;
let tempDone = 0, tempPending = 0;
const pendingItems = [];
const blockedItems = [];
const skippedItems = [];
const doneItems = [];
const tempPendingItems = [];
const tempDoneItems = [];

for (const line of lines) {
  const trimmed = line.trimStart();
  const isSubItem = /^\s{2,}-\s\[/.test(line);
  const label = trimmed.replace(/^- \[.\] /, '').replace(/\[temp\]\s*/i, '');

  if (/^- \[x\] /.test(trimmed)) {
    done++;
    if (isSubItem) { tempDone++; tempDoneItems.push(label); }
    else doneItems.push(label);
  } else if (/^- \[ \] /.test(trimmed)) {
    pending++;
    if (isSubItem) { tempPending++; tempPendingItems.push(label); }
    else pendingItems.push(label);
  } else if (/^- \[-\] /.test(trimmed)) {
    blocked++;
    blockedItems.push(label);
  } else if (/^- \[~\] /.test(trimmed)) {
    skipped++;
    skippedItems.push(label);
  }
}

const total = done + pending + blocked + skipped;
if (total === 0) {
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: 'TODO.md exists but has no items.'
  }));
  process.exit(0);
}

const phaseMatch = content.match(/<!--\s*phase:\s*(\S+)\s*-->/);
const phase = phaseMatch ? phaseMatch[1] : null;

const pct = Math.round(done * 100 / total);
const barW = 20;
const filled = Math.round(pct * barW / 100);
const bar = '█'.repeat(filled) + '░'.repeat(barW - filled);

function shorten(text) {
  const i1 = text.indexOf('：');
  const i2 = text.indexOf(':');
  if (i1 >= 0 && (i2 < 0 || i1 < i2)) return text.slice(0, i1);
  if (i2 >= 0) return text.slice(0, i2);
  return text;
}

const out = [];

const title = phase ? `TODO Progress (Phase ${phase})` : 'TODO Progress';
out.push(`── ${title} ──`);
out.push('');
out.push(`${bar}  ${pct}%  (${done}/${total})`);
out.push('');

const statParts = [];
if (done > 0) statParts.push(`✓ ${done} done`);
if (pending > 0) statParts.push(`○ ${pending} pending`);
if (blocked > 0) statParts.push(`✕ ${blocked} blocked`);
if (skipped > 0) statParts.push(`⊘ ${skipped} skipped`);
out.push(statParts.join('  '));

if (pendingItems.length > 0) {
  out.push('');
  out.push('Pending:');
  for (const item of pendingItems) {
    out.push(`  ○ ${shorten(item)}`);
  }
}

if (tempPendingItems.length > 0) {
  out.push('');
  out.push('Temp:');
  for (const item of tempPendingItems) {
    out.push(`  ⤷ ${shorten(item)}`);
  }
}

if (blocked > 0) {
  out.push('');
  out.push('Blocked:');
  for (const item of blockedItems) {
    const nameEnd = item.search(/[(（]/);
    const name = nameEnd >= 0 ? item.slice(0, nameEnd).trim() : shorten(item);
    const reasonMatch = item.match(/\(blocked:\s*(.*?)\)/) || item.match(/（blocked:\s*(.*?)）/);
    out.push(`  ✕ ${name}`);
    if (reasonMatch) out.push(`    (blocked: ${reasonMatch[1]})`);
  }
}

if (skipped > 0) {
  out.push('');
  out.push('Skipped:');
  for (const item of skippedItems) {
    out.push(`  ⊘ ${shorten(item)}`);
  }
}

if (doneItems.length > 0 || tempDoneItems.length > 0) {
  out.push('');
  out.push('Done:');
  for (const item of doneItems) {
    out.push(`  ✓ ${shorten(item)}`);
  }
  for (const item of tempDoneItems) {
    out.push(`  ✓ ⤷ ${shorten(item)}`);
  }
}

if (tempPendingItems.length > 0) {
  out.push('');
  out.push(`Next → ⤷ ${shorten(tempPendingItems[0])}`);
} else if (pendingItems.length > 0) {
  out.push('');
  out.push(`Next → ${shorten(pendingItems[0])}`);
}

out.push('');
out.push('──────────────────────────────');

process.stdout.write(JSON.stringify({
  decision: 'block',
  reason: out.join('\n')
}));
