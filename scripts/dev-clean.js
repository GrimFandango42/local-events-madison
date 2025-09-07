#!/usr/bin/env node
// Clean dev caches: .next, prisma engines/client, and any temp leftovers
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const targets = [
  '.next',
  '.turbo',
  path.join('node_modules', '.cache'),
  path.join('node_modules', '.prisma'),
  path.join('node_modules', '@prisma', 'engines'),
];

function rm(p) {
  const fp = path.join(root, p);
  if (fs.existsSync(fp)) {
    try { fs.chmodSync(fp, 0o700); } catch {}
    fs.rmSync(fp, { recursive: true, force: true });
    console.log(`🧹 removed ${p}`);
  }
}

for (const t of targets) rm(t);
console.log('✅ dev caches cleaned');

