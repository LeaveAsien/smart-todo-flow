#!/usr/bin/env node
// smart-todo-flow SessionStart hook (Node.js)
// Injects workflow rules into context via additionalContext,
// and shows TODO status to user via systemMessage.

const fs = require('fs');
const path = require('path');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const todoFile = path.join(projectDir, 'TODO.md');
const planFile = path.join(projectDir, 'PLAN.md');

const hasTodo = fs.existsSync(todoFile);
const hasPlan = fs.existsSync(planFile);

if (!hasTodo && !hasPlan) {
  process.exit(0);
}

const rules = [
  '[smart-todo-flow] Project management rules:',
  '- Planning/directional content → write to PLAN.md first, then generate TODO',
  '- After completing a TODO item → immediately append to CHANGELOG.md',
  '- CHANGELOG format: ## YYYY-MM-DD (batch summary) + - <verb> <description>',
  '- Use /todo for task management (generate, resume, phase flow)'
].join('\n');

let statusLine = '';

if (hasTodo) {
  const content = fs.readFileSync(todoFile, 'utf8');
  const lines = content.split('\n');

  let done = 0, pending = 0, blocked = 0, skipped = 0;
  for (const line of lines) {
    const t = line.trimStart();
    if (/^- \[x\] /.test(t)) done++;
    else if (/^- \[ \] /.test(t)) pending++;
    else if (/^- \[-\] /.test(t)) blocked++;
    else if (/^- \[~\] /.test(t)) skipped++;
  }

  const total = done + pending + blocked + skipped;
  if (total > 0) {
    const phaseMatch = content.match(/<!--\s*phase:\s*(\S+)\s*-->/);
    const pct = Math.round(done * 100 / total);
    const barW = 15;
    const filled = Math.round(pct * barW / 100);
    const bar = '█'.repeat(filled) + '░'.repeat(barW - filled);

    const msgLines = [];
    const header = phaseMatch ? `Phase ${phaseMatch[1]}` : 'TODO';
    msgLines.push('\n─── smart-todo-flow ───');
    msgLines.push(`📋 ${header}  ${bar} ${pct}%  (${done}/${total})`);

    const statParts = [];
    if (done > 0) statParts.push(`✓ ${done} done`);
    if (pending > 0) statParts.push(`○ ${pending} pending`);
    if (blocked > 0) statParts.push(`✕ ${blocked} blocked`);
    if (skipped > 0) statParts.push(`⊘ ${skipped} skipped`);
    msgLines.push(statParts.join('  '));

    const nextLine = lines.find(l => /^\s*- \[ \]/.test(l));
    if (nextLine) {
      let next = nextLine.trimStart().replace(/^- \[ \] /, '').replace(/\[temp\]\s*/i, '');
      const ci = next.indexOf('：');
      const ce = next.indexOf(':');
      if (ci >= 0 && (ce < 0 || ci < ce)) next = next.slice(0, ci);
      else if (ce >= 0) next = next.slice(0, ce);
      const isTemp = /^\s{2,}/.test(nextLine);
      msgLines.push(`Next → ${isTemp ? '⤷ ' : ''}${next}`);
    }

    statusLine = msgLines.join('\n');
  }
}

const output = {
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: statusLine ? `${rules}\n${statusLine}` : rules
  }
};

if (statusLine) {
  output.systemMessage = statusLine;
}

process.stdout.write(JSON.stringify(output));
