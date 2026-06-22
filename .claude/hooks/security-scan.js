#!/usr/bin/env node
'use strict';

// PreToolUse hook — blocks hardcoded secrets and dangerous bash patterns.
// Scans Write/Edit/MultiEdit content and Bash commands before Claude executes them.

const SECRET_PATTERNS = [
  { re: /sk_(?:test|live)_[0-9A-Za-z]{20,}/, label: 'Stripe secret key' },
  { re: /whsec_[0-9A-Za-z]{20,}/, label: 'Stripe webhook secret' },
  { re: /re_[A-Za-z0-9_-]{24,}/, label: 'Resend API key' },
  // Supabase service role key is a JWT — three base64url segments, very long
  { re: /eyJ[A-Za-z0-9_-]{60,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}/, label: 'JWT token (possible Supabase service role key)' },
];

// Patterns that should be blocked outright in Bash commands
const BASH_BLOCK_PATTERNS = [
  { re: /curl\b[^#\n]*\|\s*(?:ba)?sh\b/i,                              label: 'curl output piped to shell' },
  { re: /wget\b[^#\n]*\|\s*(?:ba)?sh\b/i,                              label: 'wget output piped to shell' },
  { re: /:\(\)\s*\{\s*:\s*\|/,                                          label: 'fork bomb' },
  { re: /\bdd\b[^#\n]+of=\/dev\/(?:sd[a-z]|nvme\d|hd[a-z])\b/i,       label: 'dd write to block device' },
];

// rm patterns — only flag genuinely dangerous targets (root, home, bare wildcard)
function isDangerousRm(cmd) {
  // Must have a recursive flag (-r, -R, -rf, -fr, etc.)
  if (!/\brm\b[^#\n]*-[a-zA-Z]*[rR]/.test(cmd)) return false;

  return (
    /\brm\b[^#\n]*\s\/\s*(?:$|[|;&\n])/.test(cmd) ||   // rm ... /  (bare root)
    /\brm\b[^#\n]*\s~(?:[\/\s]|$)/.test(cmd) ||           // rm ... ~  or ~/path
    /\brm\b[^#\n]*\s\.\s*(?:$|[|;&\n])/.test(cmd) ||    // rm ... .  (current dir)
    /\brm\b[^#\n]*\s\*(?:\s|$)/.test(cmd)               // rm ... *  (bare wildcard)
  );
}

// Files that legitimately contain secret values — skip scanning
function isEnvFile(filePath) {
  const name = filePath.replace(/\\/g, '/').split('/').pop();
  return /^\.env(?:\.\w+)?$/.test(name) || name === '.envrc';
}

// Skip lines that are comments or reference env vars (not hardcoded values)
function isIgnoredLine(line) {
  const t = line.trim();
  if (!t) return true;
  if (t.startsWith('//') || t.startsWith('*') || t.startsWith('#')) return true;
  if (/process\.env\.[A-Z_]/.test(t)) return true;
  if (/import\.meta\.env\.[A-Z_]/.test(t)) return true;
  return false;
}

function scanContent(content) {
  const hits = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (isIgnoredLine(lines[i])) continue;
    for (const { re, label } of SECRET_PATTERNS) {
      if (re.test(lines[i])) {
        hits.push(`line ${i + 1}: ${label}`);
        break;
      }
    }
  }
  return hits;
}

function scanBash(cmd) {
  const hits = [];
  for (const { re, label } of BASH_BLOCK_PATTERNS) {
    if (re.test(cmd)) hits.push(label);
  }
  if (isDangerousRm(cmd)) hits.push('recursive delete on dangerous target (root / home / bare wildcard)');
  return hits;
}

function block(context, hits) {
  const lines = [
    `[security-scan] BLOCKED — ${context}`,
    '',
    'Issues detected:',
    ...hits.map(h => `  • ${h}`),
    '',
    'Fix: use process.env.VARIABLE or import.meta.env.VARIABLE instead of hardcoding.',
    'To bypass: remove the dangerous pattern or adjust the hook in .claude/hooks/security-scan.js.',
  ];
  process.stderr.write(lines.join('\n') + '\n');
  process.exit(2);
}

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) raw += chunk;

  let data;
  try { data = JSON.parse(raw); } catch { process.exit(0); }

  const tool = data.tool_name || '';
  const input = data.tool_input || {};

  if (tool === 'Bash') {
    const cmd = input.command || '';
    const hits = scanBash(cmd);
    if (hits.length) block(`Bash: ${cmd.slice(0, 120).replace(/\n/g, ' ')}`, hits);
    process.exit(0);
  }

  if (tool === 'Write') {
    const fp = input.file_path || '';
    if (isEnvFile(fp)) process.exit(0);
    const hits = scanContent(input.content || '');
    if (hits.length) block(`Write → ${fp}`, hits);
    process.exit(0);
  }

  if (tool === 'Edit') {
    const fp = input.file_path || '';
    if (isEnvFile(fp)) process.exit(0);
    const hits = scanContent(input.new_string || '');
    if (hits.length) block(`Edit → ${fp}`, hits);
    process.exit(0);
  }

  if (tool === 'MultiEdit') {
    const fp = input.file_path || '';
    if (isEnvFile(fp)) process.exit(0);
    const edits = Array.isArray(input.edits) ? input.edits : [];
    const combined = edits.map(e => e.new_string || '').join('\n');
    const hits = scanContent(combined);
    if (hits.length) block(`MultiEdit → ${fp}`, hits);
    process.exit(0);
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
