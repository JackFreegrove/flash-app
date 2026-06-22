#!/usr/bin/env node
'use strict';

// Stop hook — appends a timestamped session record to memory/sessions.log
// so future sessions can see when the last session occurred and its ID.
// Non-blocking: always exits 0.

const fs = require('fs');
const path = require('path');
const os = require('os');

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) raw += chunk;

  let data = {};
  try { data = JSON.parse(raw); } catch {}

  const memoryDir = path.join(
    os.homedir(),
    '.claude',
    'projects',
    'C--Users-Jack-flash-app',
    'memory'
  );

  const logPath = path.join(memoryDir, 'sessions.log');
  const ts = new Date().toISOString();
  const sid = String(data.session_id || 'unknown').slice(0, 12);

  // Check whether any memory files were modified this session (within last 2 hours)
  let memoryUpdated = false;
  try {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
    memoryUpdated = files.some(f => {
      try { return fs.statSync(path.join(memoryDir, f)).mtimeMs > cutoff; } catch { return false; }
    });
  } catch {}

  const entry = `${ts} | sid=${sid} | memory_updated=${memoryUpdated}\n`;

  try {
    fs.appendFileSync(logPath, entry, 'utf8');
  } catch (err) {
    process.stderr.write(`[memory-persist] could not write sessions.log: ${err.message}\n`);
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
